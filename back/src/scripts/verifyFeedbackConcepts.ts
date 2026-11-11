import assert from "node:assert/strict";
import { aggregateConcepts, conceptDefinitions, validateEvidence, validateConceptDefinitions } from "../service/feedbackConcepts";
const unit = conceptDefinitions[0], phaseKey = "bfs-check";
const make = (sessionId: string, startedAt: number, answers: boolean[][]) => ({ version: 1, assessmentId: phaseKey, sessionId, startedAt,
  records: ["take-next", "after-c"].map((questionId, i) => ({ questionId, attempts: (answers[i] ?? []).map((correct, j)=>({number:j+1,correct})) })) });
const event = (id: string, payload: unknown) => ({ id, phaseKey, eventType: "assessment_snapshot", targetId: phaseKey, sessionId: "tab", payload, clientTimestamp: new Date(), serverTimestamp: new Date() });
const snapshot = (events: ReturnType<typeof event>[]) => aggregateConcepts(unit.courseId, events, [], "snapshot")!;
const state = (events: ReturnType<typeof event>[]) => snapshot(events).concepts[0];
assert.equal(state([]).state, "unobserved");
assert.equal(state([event("a", make("one", 1, [[true],[true]]))]).state, "confirmed");
const retry = [event("a", make("one", 1, [[false,true], [false]]))];
assert.equal(state(retry).evidence[0].first?.correct, false);
assert.equal(state(retry).evidence[0].latest?.correct, true);
assert.equal(state(retry).evidence[0].retried, true);
assert.equal(snapshot(retry).concepts[2].state, "needs_check");
assert.equal(state(retry).attemptedQuestions, 1);
assert.equal(state(retry).totalQuestions, 2);
const partial = [event("a", make("one", 1, [[true], []]))];
assert.equal(snapshot(partial).concepts[2].state, "unobserved");
const relearn = [...retry, event("b", make("two", 2, [[false], []]))];
assert.equal(state(relearn).state, "needs_check");
assert.equal(snapshot(relearn).concepts[2].state, "needs_check", "unanswered question retains previous result");
assert.deepEqual(snapshot(relearn), snapshot([...relearn].reverse()));
assert.deepEqual(snapshot(relearn), snapshot([...relearn,...relearn]));
assert.equal(state(relearn).evidence[0].sessions, 2);
assert.throws(()=>validateEvidence(unit.courseId,phaseKey,make("one",1,[[true],[]]),true));
assert.throws(()=>validateEvidence(unit.courseId,phaseKey,{...make("one",1,[[true],[true]]),assessmentId:"wrong"},true));
const onlyRetry = aggregateConcepts(unit.courseId,[{...event("partial-retry",{}),eventType:"answer_attempt",targetId:"take-next",payload:{assessmentId:phaseKey,assessmentSessionId:"retry",assessmentStartedAt:3,attempt:2,correct:true}}],[],"snapshot")!;
assert.equal(onlyRetry.concepts[0].evidence[0].first,null,"missing first attempt is unknown, not inferred from retry");
assert.equal(onlyRetry.concepts[0].evidence[0].latest?.correct,true);
const implementation = aggregateConcepts(unit.courseId, [], [{phaseKey:"bfs-implementation",status:"COMPLETED",summary:{testRuns:3}}],"snapshot")!.concepts.at(-1)!;
assert.equal(implementation.state, "unobserved");
assert.equal(implementation.implementation?.testsPassed, true);
assert.equal(implementation.implementation?.inputLevel, "unknown");
const failedImplementation = aggregateConcepts(unit.courseId,[{...event("test-failed",{count:2,level:"skeleton",results:[{id:"test-1",passed:false}]}),phaseKey:"bfs-implementation",eventType:"implementation_test_result"}],[],"snapshot")!.concepts.at(-1)!;
assert.equal(failedImplementation.state,"unobserved");
assert.equal(failedImplementation.implementation?.testsPassed,false);
assert.equal(failedImplementation.implementation?.inputLevel,"skeleton");
assert.equal(failedImplementation.implementation?.lastTest?.sourceId,"test-failed");

const raw = (id:string,sessionId:string,number:number,correct:boolean,received:number,clock=1000) => ({...event(id,{}),eventType:"answer_attempt",targetId:"take-next",serverTimestamp:new Date(received),clientTimestamp:new Date(clock),
  payload:{assessmentId:phaseKey,assessmentSessionId:sessionId,assessmentStartedAt:clock,attempt:number,correct}});
const completed = (id:string,sessionId:string,received:number,answers:boolean[][],clock=1) => ({...event(id,make(sessionId,clock,answers)),serverTimestamp:new Date(received),clientTimestamp:new Date(clock)});
const aFirst=raw("a-first","a",1,false,10,999999), b=completed("b","b",20,[[false],[true]],1), aRetry=raw("a-retry","a",2,true,30,999999);
assert.equal(state([aFirst,b,aRetry]).state,"confirmed","an early-started tab's later answer is latest");
assert.equal(state([aFirst,b,aRetry]).evidence[0].latest?.sessionId,"a");
const aCompleted=completed("a-complete","a",40,[[false,true],[true]],999999);
const c=completed("c","c",50,[[false],[true]],2);
const late=raw("late-a","a",2,true,80,999999);
const duplicateSnapshot={...aCompleted,id:"duplicate-a",serverTimestamp:new Date(90)};
const ordered=[aFirst,b,aRetry,aCompleted,c,late,duplicateSnapshot];
assert.equal(state(ordered).evidence[0].latest?.sessionId,"c","late raw/duplicate completion cannot refresh a sealed session");
assert.equal(state(ordered).evidence[0].first?.sessionId,"a","first answer remains tied to earliest observed session");
assert.deepEqual(snapshot(ordered),snapshot([...ordered].reverse()));
assert.equal(state([aFirst,aRetry,c,{...aRetry,id:"retry-delivery",serverTimestamp:new Date(100)}]).evidence[0].latest?.sessionId,"c","duplicate attempt receipt does not change recency");
assert.equal(state([aRetry,c,raw("late-first","a",1,false,100)]).evidence[0].latest?.sessionId,"c","late lower attempt cannot make its session newer");
const tied=[completed("tie-a","a",100,[[true],[true]],99999),completed("tie-b","b",100,[[false],[true]],1)];
assert.deepEqual(snapshot(tied),snapshot([...tied].reverse()),"ties use stable session IDs, not client clocks or array order");
// 仕様§2.3の具体例: 初回正答＋再挑戦正答＋未回答を同じ概念へ合成する。
const evidenceFor=(id:string,phase:string,sessionId:string,received:number,questionId:string,answers:boolean[])=>({...event(id,{}),phaseKey:phase,serverTimestamp:new Date(received),payload:{version:1,assessmentId:phase,sessionId,startedAt:1,records:[{questionId,attempts:answers.map((correct,i)=>({number:i+1,correct}))}]}});
const example=[evidenceFor("p3","bfs-check","p3",10,"after-c",[true]),evidenceFor("p5","bfs-code-check","p5",20,"undiscovered-condition",[false,true]),evidenceFor("p6","bfs-consolidation","p6",30,"start-already-discovered",[])];
const discovered=snapshot(example).concepts.find(c=>c.conceptId==="bfs:discovered")!;
assert.equal(discovered.state,"confirmed");assert.equal(discovered.attemptedQuestions,2);assert.equal(discovered.totalQuestions,3);
const p5=discovered.evidence.find(q=>q.phaseKey==="bfs-code-check")!;
assert.equal(p5.first?.correct,false);assert.equal(p5.latest?.correct,true);assert.equal(p5.retried,true);
assert.equal(snapshot([...example,evidenceFor("p5-new","bfs-code-check","p5-new",40,"undiscovered-condition",[false])]).concepts.find(c=>c.conceptId==="bfs:discovered")!.state,"needs_check");
for(const other of conceptDefinitions) {
  const q=other.concepts.flatMap(c=>c.questions)[0];
  const proof=evidenceFor(`proof-${other.kind}`,q.phaseKey,"one",10,q.questionId,[false,true]);
  const result=aggregateConcepts(other.courseId,[proof],[],"shared")!;
  const concept=result.concepts.find(c=>c.evidence.some(e=>e.questionId===q.questionId && e.phaseKey===q.phaseKey))!;
  assert.equal(concept.state,"confirmed");assert.equal(concept.evidence.find(e=>e.questionId===q.questionId && e.phaseKey===q.phaseKey)!.retried,true);
  const impl=other.concepts.find(c=>c.kind==="implementation")!;
  const completed=aggregateConcepts(other.courseId,[],[{phaseKey:impl.phaseKey!,status:"COMPLETED",summary:{testRuns:2}}],"shared")!.concepts.find(c=>c.conceptId===impl.conceptId)!;
  assert.equal(completed.implementation?.testsPassed,true);assert.equal(completed.implementation?.testRuns,2);assert.equal(completed.state,"unobserved");
}
const p7Events=[{...event("p7-old-clock",{count:1,results:[{id:"test",passed:false}]}),eventType:"implementation_test_result",phaseKey:"bfs-implementation",serverTimestamp:new Date(10),clientTimestamp:new Date(99999)},
  {...event("p7-new-clock",{count:2,results:[{id:"test",passed:true}]}),eventType:"implementation_test_result",phaseKey:"bfs-implementation",serverTimestamp:new Date(20),clientTimestamp:new Date(1)}];
assert.equal(aggregateConcepts(unit.courseId,p7Events,[],"p7")!.concepts.at(-1)!.implementation?.lastTest?.sourceId,"p7-new-clock");
for(const mutation of ["empty-assessment","wrong-kind","missing-implementation-phase","duplicate-question"]) {
  const changed=structuredClone(conceptDefinitions);
  if(mutation==="empty-assessment")changed[0].concepts[0].questions=[];
  if(mutation==="wrong-kind")changed[0].concepts[0].kind="implementation";
  if(mutation==="missing-implementation-phase")changed[0].concepts.at(-1)!.phaseKey="missing";
  if(mutation==="duplicate-question")changed[0].concepts[0].questions.push(changed[0].concepts[0].questions[0]);
  assert.throws(()=>validateConceptDefinitions(changed),mutation);
}
console.log("PASS: deterministic concepts, first/latest, retry, partial, relearn, reordered/duplicate events, P7 separate evidence");
