/**
 * フィードバック入力への AI 相談ログの組み込み（ステージ3）。
 *
 * Kanato の 2026-11-28 の明示指示による入力仕様の変更。変更は「入力の
 * 組み立て」に限る: Stage 1 / Stage 2 の生成ロジック・プロンプト文には
 * 一切触らない。相談ログは learning の追加フィールドとして渡し、解析段が
 * 既に learning 全体を JSON として読む構造を利用する。
 *
 * 位置づけ: AI 相談は全実験条件で常駐する第1層の理解支援であり、ログの
 * 有無は学習者の行動による。条件によって入力の形が変わるものではない。
 * 相談が無い単元・ユーザーでは本フィールド自体を付けず、入力は従来と
 * 完全に同一になる（buildFeedbackAiConsultations が undefined を返す）。
 *
 * 打ち切り規則（入力サイズの上限）:
 * - 件数上限 FEEDBACK_AI_CONSULTATION_MAX_ENTRIES = 20 件。
 *   相談機能側で文脈として渡す履歴上限（10往復）の2倍とし、単元全体の
 *   相談の大半をカバーしつつ、解析段の入力が相談だけで膨らまない値。
 * - 合計文字数上限 FEEDBACK_AI_CONSULTATION_MAX_TOTAL_CHARS = 12,000 文字
 *   （各件の userMessage + assistantMessage の文字数の合計で数える）。
 *   学習者の発言上限が1件2,000文字であり、短い相談なら件数上限が先に効き、
 *   長い相談では文字数上限が解析入力の肥大を防ぐ。
 * - 超過時は新しい方を優先する。古い方から落とし、残した分は時系列順
 *   （古い順）に並べる。ただし最新の1件は、それだけで文字数上限を超えても
 *   必ず残す（直近の相談が常に対象から消える事態を避ける）。
 * - 打ち切りが起きたことは totalCount（cutoff 以前の総件数）と
 *   includedCount（実際に含めた件数）と truncated フラグで入力側に残す。
 */

export const FEEDBACK_AI_CONSULTATION_MAX_ENTRIES = 20;
export const FEEDBACK_AI_CONSULTATION_MAX_TOTAL_CHARS = 12_000;

/** AiConsultation テーブルの1行（フィードバック入力に必要な列だけ）。 */
export type AiConsultationRow = {
  phaseKey: string | null;
  userMessage: string;
  assistantMessage: string;
  blocked: boolean;
  createdAt: Date;
};

export type FeedbackAiConsultationEntry = {
  phaseKey: string | null;
  createdAt: string;
  userMessage: string;
  assistantMessage: string;
  blocked: boolean;
};

export type FeedbackAiConsultations = {
  totalCount: number;
  includedCount: number;
  truncated: boolean;
  entries: FeedbackAiConsultationEntry[];
};

const entryChars = (row: AiConsultationRow): number =>
  row.userMessage.length + row.assistantMessage.length;

/**
 * 時系列順（古い順）の相談ログを、打ち切り規則を適用した入力フィールドへ
 * 変換する。相談が1件も無い場合は undefined を返し、呼び出し側は
 * フィールド自体を付けないこと。
 */
export function buildFeedbackAiConsultations(
  rowsChronological: readonly AiConsultationRow[]
): FeedbackAiConsultations | undefined {
  if (rowsChronological.length === 0) return undefined;
  const keptNewestFirst: AiConsultationRow[] = [];
  let totalChars = 0;
  for (let i = rowsChronological.length - 1; i >= 0; i--) {
    const row = rowsChronological[i];
    if (keptNewestFirst.length >= FEEDBACK_AI_CONSULTATION_MAX_ENTRIES) break;
    // 最新の1件だけは文字数上限を超えても残す。それ以外は上限を超える
    // 時点で打ち切り、古い相談を丸ごと落とす（発言の途中では切らない）。
    if (
      keptNewestFirst.length > 0 &&
      totalChars + entryChars(row) > FEEDBACK_AI_CONSULTATION_MAX_TOTAL_CHARS
    ) {
      break;
    }
    keptNewestFirst.push(row);
    totalChars += entryChars(row);
  }
  const entries = keptNewestFirst.reverse().map((row) => ({
    phaseKey: row.phaseKey,
    createdAt: row.createdAt.toISOString(),
    userMessage: row.userMessage,
    assistantMessage: row.assistantMessage,
    blocked: row.blocked,
  }));
  return {
    totalCount: rowsChronological.length,
    includedCount: entries.length,
    truncated: entries.length < rowsChronological.length,
    entries,
  };
}
