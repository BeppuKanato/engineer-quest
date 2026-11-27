"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { playerTokens } from "./player.tokens";

export type CodeVariableRow = { name: string; value: string; changed: boolean };

/**
 * フェーズ4（動きとコードの対応）の共通土台。UI 定義 §5.4 の対象外として従来の構成を維持するが、
 * その構成自体は全単元で1実装に寄せる。
 * 宿主の実寸計測、図とコードの割り付け（コード幅 48%・下限 620px、図幅の上限 480px）、
 * 変数パネルの表示はここだけが決める。単元側は図・コード・変数行だけを渡す。
 */
export function CodeMappingStage({ label, frameId, graph, code, variables }: {
  /** 図とコードの対応グループの名前（単元名つき）。 */
  label: string;
  frameId: string;
  /** 左側に置く実行キャンバス（フェーズ2と同じ描画）。 */
  graph: ReactNode;
  /** 右側に置くコード表示。 */
  code: ReactNode;
  /** コード下の変数行（直前フレームとの差分つき）。 */
  variables: readonly CodeVariableRow[];
}) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1200, height: 450 });
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // 単元コンテナが過去フェーズを非表示にしても、最後の割り付けを維持する。
      if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  // 文字の可読性を優先してコード幅を確保し、図は共通SVGの比率を保って縮小する。
  // 390px級では図＋コード領域内だけの横スクロールを維持する。
  const codeWidth = Math.max(620, size.width * 0.48);
  const graphWidth = Math.max(Math.min(size.width, 480), size.width - codeWidth);
  return (
    <Box ref={host} role="group" aria-label={label} data-frame-id={frameId}
      sx={{ width: "100%", height: "100%", overflowX: "auto", overflowY: "hidden" }}>
      <Box sx={{ width: graphWidth + codeWidth, height: "100%", display: "flex" }}>
        <Box data-code-graph sx={{ width: graphWidth, height: "100%", flexShrink: 0 }}>
          {graph}
        </Box>
        <Box data-code-panel sx={{ width: codeWidth, px: 1, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "safe center", minHeight: 0, overflowY: "auto" }}>
          {/* コードだけを横スクロールさせる（フェーズ5と同じ割り付け）。max-content でコード本来の幅を
              スクロール量へ反映し、列幅に切り取られて末尾へ辿れない状態を防ぐ（#301）。 */}
          <Box sx={{ width: "100%", overflowX: "auto", flexShrink: 0 }}>
            <Box sx={{ width: "max-content", minWidth: "100%" }}>
              {code}
            </Box>
          </Box>
          <Box component="dl" aria-label="コードの変数" sx={{ mt: 1.5, mb: 0, display: "grid", gridTemplateColumns: "max-content minmax(0, 1fr)",
            columnGap: 1, rowGap: 0.25, fontFamily: "monospace", fontSize: 16, lineHeight: 1.3, color: playerTokens.text, flexShrink: 0 }}>
            {variables.map(({ name, value, changed }) => <Box key={name} sx={{ display: "contents" }}>
              <Box component="dt">{name} =</Box>
              <Box component="dd" data-variable={name} data-variable-changed={changed}
                sx={{ m: 0, px: 0.75, borderRadius: 1, justifySelf: "start", overflowWrap: "anywhere",
                  bgcolor: changed ? playerTokens.focus : "transparent",
                  color: changed ? playerTokens.surface : playerTokens.text, fontWeight: changed ? 700 : 400,
                  transition: "background-color 600ms, color 600ms",
                  "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>{value}</Box>
            </Box>)}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
