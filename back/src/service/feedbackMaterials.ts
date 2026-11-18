import { z } from "zod";
import archiveData from "../learning/feedback/materials.json";

const id = z.string().min(1);
const answer = z.discriminatedUnion("kind", [
  z.object({kind:z.literal("node"),nodeId:id}), z.object({kind:z.literal("none")}),
  z.object({kind:z.literal("choice"),choiceId:id}), z.object({kind:z.literal("order"),lineIds:z.array(id)}),
]);
const questionSchema = z.object({id,prompt:id,stepId:id,correctAnswer:answer,
  choices:z.array(z.object({id,text:id})).optional(),nodeIds:z.array(id).optional(),allowNone:z.boolean().optional(),
  lineIds:z.array(id).optional(),fixedLineIds:z.array(id).optional(),interchangeableLineGroups:z.array(z.array(id)).optional(),
  scene:z.unknown(),code:z.unknown(),reviewSteps:z.array(z.unknown()),explanation:z.unknown(),
}).passthrough();
const unitSchema=z.object({courseId:id,title:id,intro:id,
  phases:z.array(z.object({id,phase:z.number(),name:id,goal:id,bridge:z.string().nullable(),focusQuestions:z.array(id).default([])})),
  assessments:z.array(z.object({id,phaseKey:id,phase:z.number(),questions:z.array(questionSchema)})),
});
const archive=z.object({schemaVersion:z.literal(1),current:z.record(id),revisions:z.record(unitSchema)}).parse(archiveData);
export type MaterialQuestion=z.infer<typeof questionSchema>;
export const currentMaterialVersion=(assessmentId:string)=>archive.current[assessmentId] ?? null;
export function materialUnit(version:string) { return archive.revisions[version] ?? null; }
export function currentMaterialUnit(courseId:string) {
  return [...new Set(Object.values(archive.current))].map(v=>archive.revisions[v]).find(u=>u?.courseId===courseId) ?? null;
}
export function phaseLearningDescription(courseId:string,phaseKey:string) {
  const unit=currentMaterialUnit(courseId),phase=unit?.phases.find(p=>p.id===phaseKey);
  return phase?`${unit!.title}：${phase.goal}${phase.focusQuestions.length?" 扱う内容："+phase.focusQuestions.join("／"):" "+unit!.intro}`:null;
}
export function materialQuestion(version:string,courseId:string,phaseKey:string,questionId:string) {
  const unit=materialUnit(version);
  return unit?.courseId===courseId ? unit.assessments.find(a=>a.phaseKey===phaseKey)?.questions.find(q=>q.id===questionId) ?? null : null;
}
export function validateMaterialAnswer(question:MaterialQuestion,value:unknown,correct:boolean) {
  const actual=answer.parse(value), expected=question.correctAnswer;
  let valid=false, equal=false;
  if(actual.kind==="choice") { valid=!!question.choices?.some(c=>c.id===actual.choiceId); equal=expected.kind==="choice"&&actual.choiceId===expected.choiceId; }
  if(actual.kind==="node") { valid=!!question.nodeIds?.includes(actual.nodeId); equal=expected.kind==="node"&&actual.nodeId===expected.nodeId; }
  if(actual.kind==="none") { valid=question.allowNone===true; equal=expected.kind==="none"; }
  if(actual.kind==="order") {
    valid=actual.lineIds.length===question.lineIds?.length && new Set(actual.lineIds).size===actual.lineIds.length && actual.lineIds.every(x=>question.lineIds?.includes(x));
    const canonical=(lines:string[])=>lines.map(x=>question.interchangeableLineGroups?.find(g=>g.includes(x))?.slice().sort().join("|")??x);
    equal=expected.kind==="order"&&JSON.stringify(canonical(actual.lineIds))===JSON.stringify(canonical(expected.lineIds));
    if(question.fixedLineIds?.some(x=>expected.kind!=="order"||actual.lineIds.indexOf(x)!==expected.lineIds.indexOf(x)))valid=false;
  }
  if(!valid||equal!==correct)throw new Error("INVALID_MATERIAL_ANSWER");
}
export const record=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const list=(v:unknown):unknown[]=>Array.isArray(v)?v:[];

/** New snapshots only. Never silently reinterpret an old saved input using today's materials. */
export function enrichLearningMaterials(learning:unknown, explicitLegacyVersion?:string) {
  const l=record(learning), courseId=String(record(l.unit).id??""), unit=currentMaterialUnit(courseId);
  if(!unit)return learning;
  const snapshot=record(l.conceptSnapshot);
  const concepts=list(snapshot.concepts).map(value=>{
    const c=record(value);
    return {...c,localConceptId:c.conceptId,globalConceptId:globalConceptId(String(c.conceptId)),
      evidence:list(c.evidence).map(value=>{
        const q=record(value), attempts=list(q.attempts).map(record);
        const versions=[...new Set(attempts.map(a=>typeof a.materialVersion==="string"?a.materialVersion:explicitLegacyVersion).filter((v):v is string=>!!v))];
        const materials=versions.map(version=>{
          const material=materialQuestion(version,courseId,String(q.phaseKey),String(q.questionId));
          if(!material)throw new Error("MATERIAL_REFERENCE_NOT_FOUND");
          const assumed=attempts.some(a=>typeof a.materialVersion!=="string"&&explicitLegacyVersion===version);
          return {version,verification:assumed?"explicit-legacy-assumption":"recorded-with-answer",material};
        });
        const unresolved=attempts.some(a=>typeof a.materialVersion!=="string"&&!explicitLegacyVersion);
        return {...q,materials,materialStatus:attempts.length===0?"not-attempted":!materials.length?"unversioned-answer":unresolved?"partially-resolved":"resolved"};
      })};
  });
  return {...l,materialContext:{courseId:unit.courseId,title:unit.title,intro:unit.intro,phases:unit.phases},
    conceptSnapshot:{...snapshot,concepts}};
}

/** Explicit semantic equivalence, not matching labels/suffixes. No mapping means no cross-unit inference. */
const sharedConcepts:Record<string,string>={
  "bfs:discovered":"graph:avoid-repeated-discovery","dfs:discovered":"graph:avoid-repeated-discovery",
  "bfs:unreachable":"graph:unreachable-from-start","dfs:unreachable":"graph:unreachable-from-start",
};
export function globalConceptId(localId:string) { return sharedConcepts[localId]??null; }
export function relatedCourseIds(courseId:string,definitions:{courseId:string;concepts:{conceptId:string}[]}[]) {
  const globals=new Set(definitions.find(u=>u.courseId===courseId)?.concepts.map(c=>globalConceptId(c.conceptId)).filter(Boolean));
  return definitions.filter(u=>u.courseId!==courseId&&u.concepts.some(c=>globals.has(globalConceptId(c.conceptId))&&globalConceptId(c.conceptId)!==null)).map(u=>u.courseId);
}
export function selectRelatedEvidence(current:unknown,other:unknown) {
  const currentConcepts=list(record(record(current).conceptSnapshot).concepts).map(record);
  const globals=new Set(currentConcepts.map(c=>globalConceptId(String(c.conceptId))).filter(Boolean));
  const snapshot=record(record(other).conceptSnapshot);
  return list(snapshot.concepts).map(record).filter(c=>globals.has(globalConceptId(String(c.conceptId)))&&globalConceptId(String(c.conceptId))!==null)
    .flatMap(c=>list(c.evidence).map(record).filter(q=>list(q.attempts).length).map(q=>({
      courseId:snapshot.courseId,localConceptId:c.conceptId,globalConceptId:globalConceptId(String(c.conceptId)),
      interpretation:"共通の規則に関する別課題の回答。探索順序・難易度や習得を同一視しない。",question:q,
    })));
}
