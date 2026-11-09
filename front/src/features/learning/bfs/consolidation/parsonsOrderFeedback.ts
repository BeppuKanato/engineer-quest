/**
 * Parsons 問題で「動かさなくてよい行」を判定する純粋関数群（Issue #327）。
 *
 * 判定は絶対位置ではなく相対順序で行う。絶対位置で照合すると、1行を先頭へ
 * 動かしただけで後続の全行が「間違い」になってしまう。実際にはずれたのは
 * 動かした1行だけなので、正解の順序と照らして「すでに正しい相対順序で
 * 並んでいる最大の列（最長部分列）」に含まれる行を、動かさなくてよい行とする。
 *
 * 同点の最長部分列が複数ある場合（隣接交換など）は、学習者の現在の並びで
 * 前にある行を優先して残す（残す行の位置列が辞書順に最小の最長部分列を選ぶ）。
 * これにより、隣り合う2行の入れ替わりでは後ろにある行だけが「動かす行」になる。
 *
 * 入れ替え可能グループ（interchangeableLineGroups）は assessment の判定
 * （normalizeParsonsOrder）とまったく同じ方法で先に正規化する。グループの
 * 行が連続したブロックを占めている場合だけ、そのブロック内を正解順に直す。
 * 正解に含まれない行（ディストラクタ）は決して「動かさなくてよい行」にしない。
 */
export type ParsonsInterchangeableGroups = readonly (readonly string[])[];

/** 入れ替え可能グループを assessment の判定と同じ方法で正規化した並びを返す。 */
export function canonicalizeParsonsOrder(
  learnerOrder: readonly string[],
  solutionOrder: readonly string[],
  interchangeableGroups: ParsonsInterchangeableGroups = [],
): string[] {
  const lineIds = [...learnerOrder];
  for (const group of interchangeableGroups) {
    const canonical = solutionOrder.filter(id => group.includes(id));
    const positions = lineIds.flatMap((id, index) => group.includes(id) ? [index] : []);
    // 離れた行や他の行を飛び越えた移動は許容しない（assessment の判定と同じ）。
    if (positions.length === canonical.length && positions.every((position, index) => position === positions[0] + index)) {
      positions.forEach((position, index) => { lineIds[position] = canonical[index]; });
    }
  }
  return lineIds;
}

/** 学習者の並びが、入れ替え可能グループを考慮したうえで正解と一致するか。 */
export function isParsonsOrderCorrect(
  learnerOrder: readonly string[],
  solutionOrder: readonly string[],
  interchangeableGroups: ParsonsInterchangeableGroups = [],
): boolean {
  const canonical = canonicalizeParsonsOrder(learnerOrder, solutionOrder, interchangeableGroups);
  return canonical.length === solutionOrder.length && canonical.every((id, index) => id === solutionOrder[index]);
}

/** 動かさなくてよい行（正しい相対順序の最長部分列に含まれる行）の集合を返す。 */
export function parsonsKeepLineIds(
  learnerOrder: readonly string[],
  solutionOrder: readonly string[],
  interchangeableGroups: ParsonsInterchangeableGroups = [],
): ReadonlySet<string> {
  const canonical = canonicalizeParsonsOrder(learnerOrder, solutionOrder, interchangeableGroups);
  const solutionIndex = new Map(solutionOrder.map((id, index) => [id, index] as const));
  // 正解に含まれない行は判定対象から外す（残す対象にもならない）。
  const entries = canonical.flatMap(id => {
    const index = solutionIndex.get(id);
    return index === undefined ? [] : [{ id, index }];
  });
  // lenFrom[i] = entries[i] から始まる、solution index が狭義増加する最長部分列の長さ。
  const lenFrom = entries.map(() => 1);
  for (let i = entries.length - 1; i >= 0; i--) {
    for (let j = i + 1; j < entries.length; j++) {
      if (entries[j].index > entries[i].index) lenFrom[i] = Math.max(lenFrom[i], lenFrom[j] + 1);
    }
  }
  const longest = entries.length ? Math.max(...lenFrom) : 0;
  // 前にある行を優先して残すため、完成可能性を保てる最も前の要素から貪欲に取る。
  const keep = new Set<string>();
  let lastIndex = -1;
  let needed = longest;
  for (let i = 0; i < entries.length && needed > 0; i++) {
    if (entries[i].index > lastIndex && lenFrom[i] >= needed) {
      keep.add(entries[i].id);
      lastIndex = entries[i].index;
      needed--;
    }
  }
  return keep;
}
