"use client";

import { CodeDisplay } from "../../code/CodeDisplay";
import { bfsCode, type BfsCodeLineId } from "./bfsCode";

export type BfsCodeBlank = { readonly lineId: BfsCodeLineId; readonly start: number; readonly length: number };

/** フェーズ4・5のコード表示。本文・行構成は共有契約そのものを使う。 */
export function BfsCodeDisplay({ code, activeLineId, blank }: {
  code: typeof bfsCode; activeLineId?: BfsCodeLineId; blank?: BfsCodeBlank;
}) {
  return <CodeDisplay code={code} label="bfs_distancesのコード" activeLineId={activeLineId} blank={blank} />;
}
