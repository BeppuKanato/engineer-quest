import type { ReactNode } from "react";

import { bubbleSortConsolidationContent } from "../consolidation/consolidation.content";
import { LogScene } from "./CorrectedScene";
import type { BubbleSortUnitPhaseSummary } from "./unit.types";

/**
 * フェーズ6（応用問題）版の「あの場面」（2026-11-24、段階3/5の形の移植）。
 *
 * 段階6の設問は場面の盤面を設問自身が持っている（scene）ため、図は
 * それをそのまま使う。マスを選ぶ設問では段階3と同じリプレイ
 * （✗バッジの移動）が付き、選択肢の設問では盤面＋回答の記録だけを出す。
 * Parsons（並べ替え）には盤面がないため場面は作らない。
 * 対象の決め方（直せた問題がちょうど1問）・記録のみで組む原則は共通。
 */
export function buildConsolidationScene(summary: BubbleSortUnitPhaseSummary | undefined): ReactNode | null {
  const records = summary?.assessmentEvidence?.records;
  if (!records) return null;
  const corrected = records.filter(r => r.attempts.length > 1 && !r.attempts[0].correct && r.attempts[r.attempts.length - 1].correct);
  if (corrected.length !== 1) return null;
  const record = corrected[0];
  const questionIndex = bubbleSortConsolidationContent.questions.findIndex(q => q.id === record.questionId);
  const question = bubbleSortConsolidationContent.questions[questionIndex];
  if (!question || question.kind === "parsons" || !("scene" in question)) return null;
  const firstAnswer = record.attempts[0].answer;
  const lastAnswer = record.attempts[record.attempts.length - 1].answer;
  const labelOf = (answer: typeof firstAnswer): string | null => {
    if (answer.kind === "node") return `左から${Number(answer.nodeId) + 1}番目のマス`;
    if (answer.kind === "choice" && "choices" in question) return question.choices.find(c => c.id === answer.choiceId)?.text ?? null;
    return null;
  };
  const firstLabel = labelOf(firstAnswer);
  const lastLabel = labelOf(lastAnswer);
  if (!firstLabel || !lastLabel) return null;
  const replay = firstAnswer.kind === "node" && lastAnswer.kind === "node" && firstAnswer.nodeId !== lastAnswer.nodeId
    ? { first: Number(firstAnswer.nodeId), last: Number(lastAnswer.nodeId) }
    : null;
  return <LogScene position={questionIndex + 1} prompt={question.prompt} canvas={question.scene}
    firstLabel={firstLabel} lastLabel={lastLabel} replay={replay} />;
}
