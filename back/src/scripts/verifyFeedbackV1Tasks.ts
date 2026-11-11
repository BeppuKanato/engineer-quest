// In-memory contract test: queueing, atomic claims, bounded retry and duplicate dispatch.
// Does not contact Cloud Tasks, OpenAI, or a live database.
import assert from "node:assert/strict";
import { prisma } from "../lib/prisma";
import { feedbackV1, processFeedbackV1Task } from "../service/feedbackV1.service";
import type { Input } from "../service/feedbackV1.engine";
import type { generate } from "../service/feedbackV1.engine";
import * as contextModule from "../service/feedbackV1.context";
import * as taskModule from "../service/feedbackV1.tasks";

async function main() {
  process.env.FEEDBACK_TASKS_ENABLED = "true";
  const db = prisma as unknown as Record<string, Record<string, unknown>>;
  const enqueued: {feedbackId:string;kind:string;eventId:string;recoveryAttempt?:number}[] = [];
  (taskModule as {enqueueFeedbackTask:unknown}).enqueueFeedbackTask = async (payload: {feedbackId:string;kind:string;eventId:string}, recoveryAttempt?:number) => { enqueued.push({...payload,recoveryAttempt}); };
  const input: Input = {
    learning: { id: "answer-1" }, state: {},
    actions: [{ id: 15, label: "XPを見る", purpose: "振り返り", condition: "表示可能", targetIds: ["profile"] }],
    targets: {15:[{id:"profile",href:"/profile"}]},
    hexad: null, bigGoal: null,
  };
  (contextModule as {buildFeedbackV1Context:unknown}).buildFeedbackV1Context = async () => ({ userId: "user-1", condition: "STANDARD", input });
  type Row = {
    id:string;userId:string;eventKey:string;condition:string;status:string;input:Input;result:unknown;
    createdAt:Date;generatedAt:Date|null;runToken:string|null;runExpiresAt:Date|null;runAttempts:number;failureCode:string|null;
    user:{firebaseUid:string};
  };
  const rows = new Map<string,Row>();
  db.user.findUnique = async () => ({id:"user-1"});
  db.createQuestFeedback.findFirst = async () => null;
  db.feedbackV1.findUnique = async ({where}:{where:{id?:string;eventKey?:string}}) => [...rows.values()].find(r => where.id ? r.id===where.id : r.eventKey===where.eventKey) ?? null;
  db.feedbackV1.findUniqueOrThrow = db.feedbackV1.findUnique;
  db.feedbackV1.create = async ({data}:{data:Partial<Row> & {eventKey:string}}) => {
    if([...rows.values()].some(r=>r.eventKey===data.eventKey)) throw new Error("duplicate");
    const row:Row = {
      id: "f-" + rows.size, userId:"user-1", eventKey:data.eventKey, condition:"STANDARD",
      status:"GENERATING", input:data.input!, result:null, createdAt:new Date(), generatedAt:null,
      runToken:null, runExpiresAt:null, runAttempts:0, failureCode:null, user:{firebaseUid:"uid"},
    };
    rows.set(row.id,row);
    return row;
  };
  db.feedbackV1.updateMany = async ({where,data}:{where:{id:string;status?:string;runToken?:string;OR?:unknown};data:Partial<Omit<Row,"runAttempts">> & {runAttempts?:{increment:number}}}) => {
    const row=rows.get(where.id);
    if(!row || (where.status && row.status!==where.status) || (where.runToken && row.runToken!==where.runToken)) return {count:0};
    if(where.OR && row.runExpiresAt && row.runExpiresAt.getTime()>Date.now()) return {count:0};
    if(typeof data.runAttempts==="object") row.runAttempts+=data.runAttempts.increment;
    Object.assign(row,{...data,runAttempts:row.runAttempts});
    return {count:1};
  };
  db.feedbackV1Interaction.create = async () => ({});
  const logs:unknown[]=[];
  db.feedbackV1Call.create = async ({data}:{data:{data:unknown}}) => {logs.push(data.data);return data;};

  let llmCalls=0;
  const good:typeof generate = async (_input,_call,log) => {
    llmCalls++; await log?.({stage:"analysis",model:"fixture"});
    const selection={nextGoal:"次の目標",nextStep:"XPを見る",actionLabel:"プロフィール",actionId:15,targetId:"profile",capabilityId:null,purpose:"振り返り",reason:"学習を確認",personalizationAdjustment:null};
    return {
      analysis:{currentState:"確認した",understood:[],needsImprovement:[],uncertain:[],conceptClaims:[],evidence:[{sourceId:"answer-1",fact:"記録",inference:false}]},
      selection,validation:{valid:true,actionHref:"/profile",candidates:[{candidateId:"candidate-1",actionHref:"/profile"}]},
    };
  };
  const payload={feedbackId:"f-0",kind:"mission" as const,eventId:"event-1"};
  const first=await feedbackV1("uid","mission","event-1",true);
  assert.equal(first.status,"GENERATING");
  assert.equal(enqueued.length,1);
  assert.equal(llmCalls,0,"POST only enqueues, no in-request LLM call");
  assert.equal(await processFeedbackV1Task(payload,good),"done");
  assert.equal(rows.get("f-0")?.status,"COMPLETED");
  assert.equal(rows.get("f-0")?.runAttempts,1);
  assert.equal(llmCalls,1);
  assert.equal(await processFeedbackV1Task(payload,good),"done");
  assert.equal(llmCalls,1,"duplicate Cloud Tasks delivery must not rerun the model");

  const second=await feedbackV1("uid","mission","event-2",true);
  assert.equal(second.status,"GENERATING");
  const failed={feedbackId:"f-1",kind:"mission" as const,eventId:"event-2"};
  const timeout:typeof generate = async () => {llmCalls++; throw new Error("Request timed out.");};
  assert.equal(await processFeedbackV1Task(failed,timeout),"retry");
  assert.equal(rows.get("f-1")?.status,"GENERATING");
  assert.equal(rows.get("f-1")?.runAttempts,1);
  assert.equal(rows.get("f-1")?.runToken,null);
  assert.equal(await processFeedbackV1Task(failed,good),"done");
  assert.equal(rows.get("f-1")?.status,"COMPLETED");

  await feedbackV1("uid","mission","event-3",true);
  const permanent={feedbackId:"f-2",kind:"mission" as const,eventId:"event-3"};
  const invalid:typeof generate = async () => {llmCalls++; throw new Error("UNSUPPORTED_NUMERIC_CLAIM");};
  assert.equal(await processFeedbackV1Task(permanent,invalid),"done");
  assert.equal(rows.get("f-2")?.status,"FAILED");
  assert.equal(rows.get("f-2")?.runAttempts,1,"validation failures must not trigger paid API retries");
  assert.equal(logs.length,2);
  console.log("PASS: Cloud Tasks enqueue-only request, duplicate delivery, transient retry and terminal validation errors");
}
void main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>prisma.$disconnect());
