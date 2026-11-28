import type { Input } from "./feedbackV1.engine";
import { buildEvidenceSources } from "./feedbackV1.evidence";
import { currentMaterialUnit, currentMaterialVersion, enrichLearningMaterials, materialQuestion,phaseLearningDescription, record, validateMaterialAnswer } from "./feedbackMaterials";

/** Explicit offline conversion only; never mutate historical FeedbackV1 rows. */
export function prepareSavedFeedbackInput(input:Input,assumeCurrentMaterials=false):Input {
  const original=record(input.learning),courseId=String(record(original.unit).id??"");
  const unit=currentMaterialUnit(courseId);
  if(!unit)throw new Error("INPUT_UNIT_MATERIALS_NOT_FOUND");
  const evidence=Array.isArray(record(original.conceptSnapshot).concepts)
    ? (record(original.conceptSnapshot).concepts as unknown[]).flatMap(c=>Array.isArray(record(c).evidence)?record(c).evidence as unknown[]:[]).map(record):[];
  const legacyVersion=currentMaterialVersion(unit.assessments[0].id)??undefined;
  if(assumeCurrentMaterials) for(const q of evidence) {
    const question=legacyVersion?materialQuestion(legacyVersion,courseId,String(q.phaseKey),String(q.questionId)):null;
    if(!question || question.prompt!==q.questionLabel)throw new Error("LEGACY_MATERIAL_QUESTION_MISMATCH");
    for(const raw of Array.isArray(q.attempts)?q.attempts:[]) {
      const a=record(raw);
      if(a.answer!==undefined)validateMaterialAnswer(question,a.answer,a.correct===true);
    }
  }
  const state=record(input.state);
  const quests=(Array.isArray(state.quests)?state.quests:[]).map(record);
  const achievements=(Array.isArray(state.achievements)?state.achievements:[]).map(record);
  const targets=Object.fromEntries(Object.entries(input.targets).map(([key,values])=>[key,values.map(t=>{
    const [targetCourse,phase]=t.id.includes(":")?t.id.split(":"):[courseId,t.id];
    const targetUnit=currentMaterialUnit(targetCourse),targetPhase=targetUnit?.phases.find(p=>p.id===phase);
    const quest=quests.find(q=>q.id===t.id),achievement=achievements.find(q=>q.id===t.id);
    const targetCourseUnit=currentMaterialUnit(t.id);
    const action=input.actions.find(a=>String(a.id)===key);
    return {...t,name:targetPhase?.name??targetCourseUnit?.title??quest?.title as string??achievement?.title as string??t.name??action?.label,
      learningContent:phaseLearningDescription(targetCourse,phase)??targetCourseUnit?.intro??quest?.description as string??achievement?.description as string??t.learningContent??action?.purpose};
  })]));
  const learning={...record(enrichLearningMaterials(original,assumeCurrentMaterials?legacyVersion:undefined)),
    // AI 相談ログ（ステージ3）: enrichLearningMaterials のスプレッドでも残るが、
    // 保存済み入力の変換で落ちないよう明示的に引き継ぐ。保存時に無かった
    // 入力へは付けない（従来入力の形を変えない）。
    ...(original.aiConsultations!==undefined?{aiConsultations:original.aiConsultations}:{}),
    inputPreparation:{assumedCurrentMaterials:assumeCurrentMaterials,
      warning:assumeCurrentMaterials?"教材版が記録されていない回答について、操作者の指定により現在の教材を補った。当時の教材との一致を証明するものではない。":null},
    relatedHistoryStatus:original.relatedHistoryStatus??"not-collected-in-saved-input",
    referencePostsStatus:original.referencePostsStatus??"not-collected-in-saved-input"};
  const updated={...input,learning,targets};
  return {...updated,evidenceSources:buildEvidenceSources(updated)};
}
