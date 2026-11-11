"use client";
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { ConceptSnapshot } from "@/api/feedbackV1.api";
import { implementationInputLevelText, type ImplementationInputLevel } from "../../implementation/inputLevel";
import { playerTokens } from "../../player/player.tokens";

const states = {
  unobserved: { label: "未確認", icon: "−", color: "default" },
  confirmed: { label: "確認できた", icon: "✓", color: "success" },
  needs_check: { label: "追加確認が必要", icon: "!", color: "warning" },
} as const;
export function ConceptMap({ snapshot }: { snapshot: ConceptSnapshot }) {
  return <Box component="section" aria-label="単元の構成要素と確認状況" sx={{ width: "100%" }}>
    <Typography component="h3" fontWeight={800} textAlign="center">{snapshot.title}の構成要素</Typography>
    <Typography variant="body2" color="text.secondary" textAlign="center">単元の構成要素をまとめています。確認問題の結果を示しています。</Typography>
    <Box sx={{ borderTop: 2, borderColor: "divider", mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
      {snapshot.concepts.map(concept => {
        const state = states[concept.state];
        const implementation = concept.implementation;
        return <Box key={concept.conceptId} sx={{ borderLeft: 2, borderColor: "divider", pl: 1.5, pt: 1, minWidth: 0 }}>
          <Box component="details" sx={{ "& summary": { cursor: "pointer", borderRadius: 1, "&:focus-visible": { outline: `2px solid ${playerTokens.focus}`, outlineOffset: 3 } } }}>
            <Box component="summary" aria-label={`${concept.label}、${implementation ? implementation.completed === true ? "テスト通過・完了" : "実装の記録は未確認" : `${state.label}、${concept.attemptedQuestions}/${concept.totalQuestions}問回答済み`}。根拠を開く`}>
              <Typography component="span" fontWeight={700}>{concept.label}</Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, display: "inline-flex", ml: 1, flexWrap: "wrap" }}>
                <Chip size="small" variant="outlined" color={implementation ? implementation.completed === true ? "success" : "default" : state.color}
                  label={implementation ? implementation.completed === true ? "✓ テスト通過・完了" : "− 記録は未確認" : `${state.icon} ${state.label}`} />
                {!implementation && <Typography variant="caption">{concept.attemptedQuestions}/{concept.totalQuestions}問回答済み</Typography>}
              </Stack>
            </Box>
            {implementation ? <Typography variant="body2" sx={{ mt: 1 }}>
              テスト実行: {implementation.testRuns === "unknown" ? "記録なし" : `${implementation.testRuns}回`}。入力量: {implementation.inputLevel in implementationInputLevelText.levels ? implementationInputLevelText.levels[implementation.inputLevel as ImplementationInputLevel].label : "記録なし"}。
              ヒント利用: {Array.isArray(implementation.hintUsage) ? `${implementation.hintUsage.reduce((sum: number, count: number)=>sum+count,0)}回` : "記録なし"}。個々の概念の理解を認定する結果ではありません。
            </Typography> : <Stack component="ul" spacing={1} sx={{ pl: 2, mt: 1 }}>
              {concept.evidence.map(q=><Typography component="li" variant="body2" key={`${q.phaseKey}/${q.assessmentId}/${q.questionId}`} sx={{ overflowWrap: "anywhere" }}>
                {q.stageLabel ?? (q.phaseKey.endsWith("-consolidation") ? "応用問題" : q.phaseKey.endsWith("-code-check") ? "コードの確認問題" : "動きの確認問題")}：{q.questionLabel ?? `${concept.label}の設問`}<br />
                {q.latest ? `初回 ${q.first ? q.first.correct ? "正答" : "誤答" : "記録なし"} → 直近 ${q.latest.correct ? "正答" : "誤答"}。${q.retried ? "再挑戦あり" : "再挑戦なし"}${q.sessions > 1 ? `、再学習を含む${q.sessions}回の記録` : ""}` : "回答の記録は未確認"}
              </Typography>)}
            </Stack>}
          </Box>
        </Box>;
      })}
    </Box>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>正答は完全な理解を示すものではありません。未回答の内容は判断していません。</Typography>
  </Box>;
}
