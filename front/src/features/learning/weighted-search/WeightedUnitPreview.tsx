"use client";
import { Alert, Box, Button, Typography, Stack, TextField } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { LearningUnitPreview, type LearningUnitDefinition, type LearningUnitPreviewProps, type UnitPhaseView } from "../unit/LearningUnitPreview";
import { weightedMaterials } from "./content";
import { WeightedCanvas, WeightedCode, WeightedExecutionPreview, WeightedMappingCanvas, weightedContents } from "./WeightedExecutionPreview";
import { activeQuestion, advanceAssessment, answerQuestion, assessmentComplete, assessmentEvidence, createAssessmentState, type AssessmentAnswer, type AssessmentContent, type ParsonsQuestion } from "../assessment/assessment";
import { useAssessmentObservation } from "../instrumentation/useAssessmentObservation";
import { AnswerFeedbackNotice, useAssessmentFeedback } from "../assessment/AnswerFeedback";
import { LearningReviewDialog } from "../review/LearningReviewDialog";
import { ParsonsBoard } from "../bfs/consolidation/ParsonsBoard";
import { ImplementationLevelSelector } from "../implementation/ImplementationLevelSelector";
import { useImplementationInputLevel } from "../implementation/useImplementationInputLevel";
import { preparePyodide, runCourseMissionTests } from "../../../lib/pyodideRunner";
import { analyzeExecutionError } from "../../../lib/executionError";
import { weightedTests, weightedTemplates, validWeightedResult } from "./implementation";
import type { WeightedSearchMode } from "../graphs/weightedSearch";
import { playerTokens } from "../player/player.tokens";
type PhaseProps=Parameters<UnitPhaseView>[0];
type Stage="check"|"codeCheck"|"consolidation";
const baseStyle={height:"100%",minHeight:0,overflow:"auto",p:2,color:playerTokens.text,display:"flex",flexDirection:"column",gap:1.5,alignItems:"center"} as const;
function TransferFigure() {
  return <svg viewBox="0 0 440 170" width="100%" style={{maxHeight:170}} role="img" aria-label="別のグラフ：S-X 8、S-Y 2、Y-X 2、X-T 3、Y-T 10">
    {[[40,85,200,32,8],[40,85,200,138,2],[200,138,200,32,2],[200,32,400,85,3],[200,138,400,85,10]].map(([x1,y1,x2,y2,w],i)=><g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="2"/><rect x={(x1+x2)/2-12} y={(y1+y2)/2-11} width="24" height="22" fill="white"/><text x={(x1+x2)/2} y={(y1+y2)/2+5} fontSize="14" textAnchor="middle">{w}</text></g>)}
    {[["S",40,85],["X",200,32],["Y",200,138],["T",400,85]].map(([id,x,y])=><g key={id}><circle cx={x} cy={y} r="19" fill="#fff" stroke="#64748b" strokeWidth="2"/><text x={x} y={Number(y)+5} textAnchor="middle" fontWeight="bold">{id}</text></g>)}
  </svg>;
}
function Assessment({mode,stage,active=true,onLearningEvent,onComplete,advancePending}:PhaseProps & {mode:WeightedSearchMode;stage:Stage}) {
  const raw=weightedMaterials[mode][stage],content:AssessmentContent=raw;
  const [session,setSession]=useState(()=>createAssessmentState(content));
  const [review,setReview]=useState(false);
  const reported=useRef(false);
  const question=activeQuestion(content,session), complete=assessmentComplete(content,session);
  const record=question?session.records.find(row=>row.questionId===question.id):undefined;
  const current=record?.attempts.at(-1);
  useAssessmentObservation(content,session,onLearningEvent,active,review?question?.id:undefined);
  useAssessmentFeedback(content,session,active);
  useEffect(()=>{if(complete&&!reported.current&&active){reported.current=true;onComplete({firstAttemptCorrect:session.records.filter(r=>r.firstCorrect).length,totalQuestions:content.questions.length,assessmentEvidence:assessmentEvidence(content,session)});}if(!complete)reported.current=false;},[complete,active,content,session,onComplete]);
  const source=weightedContents[mode][stage==="check"?"execution":"mapping"];
  const scene=source.steps.find(s=>s.id===question?.stepId)?.canvas;
  const answer=(answer:AssessmentAnswer)=>{if(question&&active&&!advancePending&&!record?.solved)setSession(s=>answerQuestion(content,s,question.id,answer));};
  if(!question)return <Box sx={baseStyle}><Typography variant="h6">確認問題が終わりました</Typography><Typography>初回正解：{session.records.filter(r=>r.firstCorrect).length} / {content.questions.length}</Typography><Button onClick={()=>setSession(createAssessmentState(content))} disabled={advancePending}>もう一度解く</Button></Box>;
  const qKind="kind" in question?question.kind:"node";
  return <Box sx={baseStyle}>
    <Typography color="text.secondary">{(session.position??0)+1} / {content.questions.length}</Typography>
    <Typography component="h2" fontSize={20} fontWeight={700} textAlign="center">{question.prompt}</Typography>
    {stage==="check"&&scene&&<Box sx={{width:"100%",height:300,flexShrink:0}}><WeightedCanvas canvas={scene} onNode={qKind==="node"&&"nodeIds" in question&&!record?.solved?id=>answer({kind:"node",nodeId:id}):undefined} selectable={"nodeIds" in question?question.nodeIds:[]}/></Box>}
    {stage==="consolidation"&&question.id.startsWith("transfer-")&&<Box sx={{width:"100%",maxWidth:540}}><TransferFigure/></Box>}
    {qKind==="code-blank"&&"lineId" in question&&<Box sx={{width:"100%",maxWidth:760}}><WeightedCode mode={mode} focused={[question.lineId]} blank={{lineId:question.lineId,...question.blank}}/></Box>}
    {qKind==="parsons"&&"kind" in question&&question.kind==="parsons"&&<Box sx={{width:"100%",maxWidth:780}}><ParsonsBoard key={question.id} question={{...question,lineIds:question.correctAnswer.lineIds.flatMap((id,i,ids)=>{if(i===0)return ids.slice(0,3).reverse();if(i<3)return [];if(i===7)return ids.slice(7).reverse();if(i>7)return [];return [id];})}} code={weightedMaterials[mode].code} disabled={!!record?.solved||advancePending} onAnswer={answer}/></Box>}
    {"choices" in question&&<Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>{question.choices.map(c=><Button key={c.id} variant="outlined" disabled={!!record?.solved||advancePending} onClick={()=>answer({kind:"choice",choiceId:c.id})}>{c.text}</Button>)}</Stack>}
    {"nodeIds" in question&&<Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1}>{question.nodeIds.map(id=><Button key={id} variant="outlined" disabled={!!record?.solved||advancePending} onClick={()=>answer({kind:"node",nodeId:id})}>{id}</Button>)}</Stack>}
    <AnswerFeedbackNotice assessmentId={content.id}/>
    {current&&<Alert severity={current.correct?"success":"info"}>{current.correct?"正解です。":"もう一度考えるか、復習してから次に進めます。"}</Alert>}
    <Stack direction="row" gap={1} alignItems="center"><Button disabled={advancePending} onClick={()=>setReview(true)}>該当箇所を復習する</Button><Button variant="contained" disabled={!record?.attemptCount||advancePending} onClick={()=>setSession(s=>advanceAssessment(content,s,question.id))}>{(session.position??0)===content.questions.length-1?"結果を見る":"次の問題へ"}</Button></Stack>
    {review&&<LearningReviewDialog content={source} stepIds={question.reviewStepIds} renderCanvas={canvas=>stage==="check"?<WeightedCanvas canvas={canvas}/>:<WeightedMappingCanvas canvas={canvas}/>} onClose={()=>setReview(false)} onLearningEvent={onLearningEvent} active={active}/>}
  </Box>;
}
const hintTexts=["距離表g、前の場所parent、未選択の候補frontierを使います。","最小の候補を選び、ゴールであれば経路を復元し、そうでなければ隣のコストを比較します。","while frontier と if candidate < g.get(v, float('inf')) を使い、条件を満たすときだけ更新します。"];
function Implementation({mode,active=true,onLearningEvent,onComplete,onShowFinalResult,codeDraftBaseKey,onCodeDraftError,advancePending}:PhaseProps&{mode:WeightedSearchMode}){
  const templates=useMemo(()=>weightedTemplates(mode),[mode]),tests=useMemo(()=>weightedTests(mode),[mode]);
  const {level,code,setCode,selectLevel}=useImplementationInputLevel({draftBaseKey:codeDraftBaseKey??"preview:"+mode,templates,onDraftError:onCodeDraftError});
  const [running,setRunning]=useState(false),[ready,setReady]=useState<"loading"|"ready"|"error">("loading"),[outcomes,setOutcomes]=useState<{id:string;passed:boolean;actual?:unknown;error?:string}[]>([]),[runs,setRuns]=useState(0),[hints,setHints]=useState<number[]>([0,0,0,0]),[openHint,setOpenHint]=useState<number|null>(null),[passedCode,setPassedCode]=useState<string|null>(null);
  const busy=useRef(false), mounted=useRef(true);
  const [loadRevision,setLoadRevision]=useState(0);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{if(!active)return;let current=true;preparePyodide().then(()=>{if(current)setReady("ready");}).catch(()=>{if(current)setReady("error");});return()=>{current=false;};},[active,loadRevision]);
  const completed=passedCode===code;
  const run=async()=>{if(busy.current||!active||advancePending)return;busy.current=true;setRunning(true);setOutcomes([]);setPassedCode(null);const next=runs+1;setRuns(next);onLearningEvent?.({eventType:"implementation_run",payload:{kind:"test",count:next,code,level}});
    const rows:typeof outcomes=[];
    for(const test of tests){try{const response=await runCourseMissionTests(code,[test]);const result=response.results[0];rows.push({id:test.id,passed:!!result&&validWeightedResult(test,result.actual),...(test.visibility==="display"&&result?{actual:result.actual}:{})});}catch(error){rows.push({id:test.id,passed:false,error:analyzeExecutionError(error).kind});}if(!mounted.current)return;setOutcomes([...rows]);}
    const passed=rows.length===tests.length&&rows.every(r=>r.passed);
    onLearningEvent?.({eventType:"implementation_test_result",payload:{count:next,code,level,results:rows.map(r=>({id:r.id,passed:r.passed,error:r.error??(r.passed?null:"mismatch")}))}});
    setRunning(false);busy.current=false;
    if(passed){setPassedCode(code);onLearningEvent?.({eventType:"implementation_complete",payload:{testRuns:next,hintUsage:hints,code,level}});onComplete({code,testRuns:next,hintUsage:hints,inputLevel:level});}
  };
  const hint=(n:number)=>{const next=hints.map((v,i)=>i===n?v+1:v);setHints(next);setOpenHint(n);onLearningEvent?.({eventType:"hint_open",payload:{level:n+1,count:next[n]}});};
  const p=weightedMaterials[mode].consolidation.questions.find(q=>q.kind==="parsons") as ParsonsQuestion|undefined;
  return <Box sx={baseStyle}>
    <Typography fontSize={20} fontWeight={700}>最小コストと経路を返すPython関数を完成させよう</Typography>
    <Typography>戻り値は (最小コスト, 経路リスト)、到達不能は (None, [])。</Typography>
    <ImplementationLevelSelector level={level} disabled={running||completed||advancePending} onChange={next=>{onLearningEvent?.({eventType:"implementation_level_select",payload:{level:next,previousLevel:level}});selectLevel(next);setOutcomes([]);}}/>
    <Box sx={{width:"100%",maxWidth:1000,display:"grid",gridTemplateColumns:{xs:"1fr",md:"1fr 1fr"},gap:2}}>
      <TextField multiline minRows={13} fullWidth label="Pythonコード" value={code} disabled={running||completed||advancePending} onChange={e=>{setCode(e.target.value);setOutcomes([]);}} slotProps={{input:{sx:{fontFamily:"monospace",fontSize:14}}}}/>
      <Stack gap={1}>
        {tests.map(test=>{const row=outcomes.find(r=>r.id===test.id);return <Box key={test.id} sx={{border:"1px solid #e5e7eb",borderRadius:1,p:1}}><Typography fontWeight={700}>{test.visibility==="judgement"?"判定用ケース "+test.id:test.label}：{row?row.passed?"通過":"未通過":"未実行"}</Typography>{test.visibility==="display"&&<Typography sx={{fontSize:13,overflowWrap:"anywhere"}}>入力：{JSON.stringify(test.args)}<br/>期待：{JSON.stringify(test.expected)}{row&&<><br/>実際：{JSON.stringify(row.actual)??"—"}</>}</Typography>}{row?.error&&<Typography color="error">実行エラー：{row.error==="timeout"?"タイムアウト":row.error==="syntax"?"文法":"実行時"}</Typography>}</Box>})}
      </Stack>
    </Box>
    {ready==="error"&&<Alert severity="error" action={<Button onClick={()=>{setReady("loading");setLoadRevision(x=>x+1);}}>再読込</Button>}>Python実行環境の読み込みに失敗しました。</Alert>}
    <Button variant="contained" disabled={ready!=="ready"||running||completed||advancePending} onClick={()=>void run()}>{running?"テストを実行中":ready==="loading"?"Pythonを読み込み中":"テストを実行する"}</Button>
    <Stack direction="row" flexWrap="wrap" gap={1}>{[0,1,2,3].map(n=><Button key={n} disabled={running||completed||(n>0&&hints[n-1]===0)} onClick={()=>hint(n)}>ヒント{n+1}</Button>)}</Stack>
    {openHint!==null&&<Box sx={{width:"100%",maxWidth:800,p:1,border:"1px solid #e5e7eb"}}>{openHint<3?<Typography>{hintTexts[openHint]}{mode==="astar"&&openHint===1?" 優先値はg+hです。":""}</Typography>:p&&<ParsonsBoard question={{...p,fixedLineIds:undefined}} code={weightedMaterials[mode].code} onAnswer={answer=>{setOpenHint(null);onLearningEvent?.({eventType:"hint_parsons_answer",payload:{correct:answer.lineIds.join()===p.correctAnswer.lineIds.join()}});}}/>}<Button onClick={()=>setOpenHint(null)}>閉じる</Button></Box>}
    {completed&&<Alert severity="success">すべてのテストを通過しました。</Alert>}
    {completed&&<Button variant="contained" disabled={advancePending} onClick={onShowFinalResult}>単元の結果を見る</Button>}
  </Box>;
}
function makeUnit(mode:WeightedSearchMode):LearningUnitDefinition {
  const data=weightedMaterials[mode];
  const player=(stage:"motivation"|"execution"|"mapping"):UnitPhaseView=>function PlayerView(props){return <WeightedExecutionPreview {...props} mode={mode} stage={stage}/>;};
  const assessment=(stage:Stage):UnitPhaseView=>function AssessmentView(props){return <Assessment {...props} mode={mode} stage={stage}/>;};
  const implementation:UnitPhaseView=props=><Implementation {...props} mode={mode}/>;
  return {title:data.title,phases:data.phases,views:{[data.phases[0].id]:player("motivation"),[data.phases[1].id]:player("execution"),[data.phases[2].id]:assessment("check"),[data.phases[3].id]:player("mapping"),[data.phases[4].id]:assessment("codeCheck"),[data.phases[5].id]:assessment("consolidation"),[data.phases[6].id]:implementation},resultFigure:<Box sx={{height:240,width:"100%"}}><WeightedCanvas canvas={weightedContents[mode].execution.steps.at(-1)!.canvas}/></Box>,finalResult:{title:data.title+"を修得！",closing:"最短経路探索のコードを完成させ、すべてのテストを通過しました。"}};
}
const definitions={dijkstra:makeUnit("dijkstra"),astar:makeUnit("astar")};
export function WeightedUnitPreview({mode,...props}:LearningUnitPreviewProps&{mode:WeightedSearchMode}) {return <LearningUnitPreview {...props} unit={definitions[mode]}/>;}
