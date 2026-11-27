"use client";

// ホームの確定形（2026-11-25 決定群＋2026-11-27 の目標帯の確定）。
// 上から：目標（学習者が自分で設定した単元ミッション。page がスロットで渡す）→
// 今日の行動（左＝今日の狙い、右＝今日の復習）→ 前回の続き（再開単元が今日の狙いと
// 違うときだけ）→ 最近の状況（左＝ストリーク／次の実績／知識カード、右＝学んだ知識を
// 活かそう）。単元一覧はコース一覧の仕事なのでホームには置かない。
// 色の意味：青＝行動と現在地、緑＝完了した量、グレー＝操作できない状態だけ。
import { Box, Button, Chip, Link as MuiLink, Paper, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import StyleOutlinedIcon from "@mui/icons-material/StyleOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import Link from "next/link";
import type { ReactNode } from "react";

import type { HomeResponse } from "@/api/home.api";
import { RobotBust } from "@/app/component/robotBust";
import { knowledgeCardTones } from "@/components/rewards/rarity.tokens";

const TEXT = "#111827";
const PRIMARY = "#2563eb";
const GREEN = "#16a34a";
const STREAK_ORANGE = "#ea580c";
const HAIRLINE = "#e3e9f4";

const S1 = { borderRadius: "18px", border: `1px solid ${HAIRLINE}`, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 28px rgba(15, 23, 42, 0.06)" } as const;

/** 実績の段階表記は「第N段階」で統一する（Lv.表記は出さない）。 */
const achievementTitle = (title: string) => title.replace(/\s*Lv\.?\s*(\d+)/gi, " 第$1段階").replace(/\s+/g, " ").trim();

/** 前回のフィードバックの「次の一歩」の引用。マスコットのバストアップと並べる。 */
const FeedbackQuote: React.FC<{ nextStep: string }> = ({ nextStep }) => (
  <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
    <RobotBust state="normal" width={148} height={102} />
    <Box sx={{ flex: 1, minWidth: 0, border: `1px solid ${HAIRLINE}`, borderRadius: "14px", px: 2, py: 1.5, bgcolor: "#fbfcfe", position: "relative", "&::before": { content: "\"\"", position: "absolute", left: -7, bottom: 26, width: 12, height: 12, bgcolor: "#fbfcfe", borderLeft: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}`, transform: "rotate(45deg)" } }}>
      <Typography sx={{ fontSize: 14, fontWeight: 900, color: PRIMARY }}>次の一歩</Typography>
      <Typography sx={{ fontSize: 16, fontWeight: 700, lineHeight: 1.7 }}>{nextStep}</Typography>
    </Box>
  </Box>
);

export function HomeDashboard({ data, review, goalBand }: { data: HomeResponse; review?: ReactNode; goalBand?: ReactNode }) {
  const { overview, today, resume, week, questions, latestCard } = data;
  const current = today.recommended;
  const achievement = today.nearAchievements[0];
  const sameUnit = !!(resume && current && resume.id === current.id);
  const boardQuestions = questions.slice(0, 2);
  const latestTone = latestCard ? knowledgeCardTones[latestCard.rarity as keyof typeof knowledgeCardTones] : undefined;

  return (
    <Stack spacing={3}>
      {goalBand}

      {/* 今日の行動：左＝今日の狙い、右＝今日の復習 */}
      {(current || review) && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 7fr) minmax(0, 5fr)" }, gap: 3, alignItems: "stretch" }}>
          {current ? (
            <Paper component="section" data-home-section="aim" aria-label="今日の狙い" elevation={0} sx={{ ...S1, border: `2px solid ${PRIMARY}`, p: { xs: 2.5, md: 3.5 }, display: "flex", flexDirection: "column" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em", color: PRIMARY }}>今日の狙い</Typography>
              <Typography component="h2" sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 900, lineHeight: 1.3, mt: 0.5 }}>{current.title}</Typography>
              {sameUnit && resume?.nextStep ? (
                <Box sx={{ mt: 2 }}>
                  <FeedbackQuote nextStep={resume.nextStep} />
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "flex-end", mt: 1 }}>
                  <RobotBust state="point" width={190} height={140} />
                </Box>
              )}
              <Box sx={{ flex: 1 }} />
              {current.nextPhase && <Typography sx={{ fontSize: 16, mt: 2 }}>次は『{current.nextPhase}』です</Typography>}
              <Button component={Link} href={current.resumeHref} variant="contained" endIcon={<ArrowForwardIcon />} sx={{ mt: 1.5, alignSelf: "flex-start", bgcolor: PRIMARY, fontSize: 16, fontWeight: 900, px: 3, py: 1.25, borderRadius: "12px", boxShadow: "none", "&:hover": { bgcolor: PRIMARY, boxShadow: "none" } }}>
                {current.status === "IN_PROGRESS" ? "学習を再開する" : current.status === "COMPLETED" ? "復習する" : "学習をはじめる"}
              </Button>
            </Paper>
          ) : <Box />}
          <Box data-home-section="review" sx={{ "& > *": { height: "100%", mb: "0 !important" } }}>{review}</Box>
        </Box>
      )}

      {/* 前回の続き：再開単元が今日の狙いと違うときだけ */}
      {resume && !sameUnit && (
        <Paper component="section" data-home-section="resume" aria-label="前回の続き" elevation={0} sx={{ ...S1, p: { xs: 2.5, md: 3.5 } }}>
          <Typography sx={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em" }}>前回の続き</Typography>
          <Typography component="h2" sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.35, mt: 0.5 }}>{resume.title}</Typography>
          {resume.nextStep && <Box sx={{ mt: 2 }}><FeedbackQuote nextStep={resume.nextStep} /></Box>}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mt: 2 }}>
            {resume.nextPhase && <Typography sx={{ fontSize: 16 }}>次は『{resume.nextPhase}』から</Typography>}
            <Button component={Link} href={resume.resumeHref} variant="outlined" endIcon={<ArrowRightAltIcon />} sx={{ fontSize: 16, fontWeight: 900, px: 2.5, py: 1, borderRadius: "12px", color: PRIMARY, borderColor: PRIMARY }}>
              この単元を再開する
            </Button>
          </Box>
        </Paper>
      )}

      {/* 最近の状況：左＝ストリーク／次の実績／知識カード、右＝学んだ知識を活かそう */}
      <Paper component="section" data-home-section="status" aria-label="最近の状況" elevation={0} sx={{ ...S1, p: { xs: 2.5, md: 3.5 } }}>
        <Typography sx={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.08em" }}>最近の状況</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: boardQuestions.length ? "minmax(0, 7fr) minmax(0, 5fr)" : "1fr" }, gap: { xs: 3, lg: 5 }, mt: 1 }}>
          <Stack spacing={3.5}>
            <Box component="section" aria-label="学習ストリーク">
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
                <LocalFireDepartmentIcon sx={{ color: STREAK_ORANGE, fontSize: 22, alignSelf: "center" }} />
                <Typography sx={{ fontSize: 18, fontWeight: 900 }}>学習ストリーク</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 900, color: STREAK_ORANGE }}>{week.streakDays}日連続</Typography>
                <Box sx={{ flex: 1 }} />
                <MuiLink component={Link} href="/history" underline="hover" sx={{ fontSize: 14, fontWeight: 700, color: PRIMARY, display: "inline-flex", alignItems: "center", gap: 0.25 }}>履歴を見る<ArrowOutwardIcon sx={{ fontSize: 15 }} /></MuiLink>
              </Box>
              <Box sx={{ display: "flex", gap: 1, mt: 1.5 }} role="list" aria-label="今週の学習">
                {week.days.map(day => (
                  <Box key={day.date} role="listitem" data-learning-day={day.date} sx={{ flex: 1, textAlign: "center" }}>
                    <Box sx={{ height: 44, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: day.learned ? "#fff7ed" : "#f1f5f9", border: day.isToday ? `2px solid ${PRIMARY}` : `1px solid ${HAIRLINE}` }}>
                      {day.learned
                        ? <LocalFireDepartmentIcon sx={{ color: STREAK_ORANGE, fontSize: 24 }} />
                        : <Typography sx={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{Number(day.date.slice(8))}</Typography>}
                    </Box>
                    <Typography sx={{ fontSize: 14, fontWeight: day.isToday ? 900 : 700, mt: 0.5 }}>{day.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {achievement && (
              <Box component="section" aria-label="次の実績">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <WorkspacePremiumOutlinedIcon sx={{ color: TEXT, fontSize: 22 }} />
                  <Typography sx={{ fontSize: 18, fontWeight: 900 }}>次の実績</Typography>
                  <Box sx={{ flex: 1 }} />
                  <MuiLink component={Link} href="/achievements" underline="hover" sx={{ fontSize: 14, fontWeight: 700, color: PRIMARY, display: "inline-flex", alignItems: "center", gap: 0.25 }}>実績一覧へ<ArrowOutwardIcon sx={{ fontSize: 15 }} /></MuiLink>
                </Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, mt: 1.25 }}>{achievementTitle(achievement.title)}</Typography>
                {achievement.conditionLabel && <Typography sx={{ fontSize: 14, fontWeight: 700, color: PRIMARY, mt: 0.25 }}>{achievement.conditionLabel}</Typography>}
                <Box sx={{ display: "flex", gap: 0.75, mt: 1 }} role="img" aria-label={`${achievement.goal}のうち${achievement.progress}まで進んでいます`}>
                  {Array.from({ length: achievement.goal }, (_, index) => (
                    <Box key={index} sx={{ flex: 1, height: 10, borderRadius: "999px", bgcolor: index < achievement.progress ? GREEN : "#e5eaf3" }} />
                  ))}
                </Box>
                <Typography sx={{ fontSize: 14, mt: 0.75 }}>あと{achievement.goal - achievement.progress}で達成</Typography>
              </Box>
            )}

            <Box component="section" aria-label="知識カード">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <StyleOutlinedIcon sx={{ color: TEXT, fontSize: 22 }} />
                <Typography sx={{ fontSize: 18, fontWeight: 900 }}>知識カード</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 900 }}>{overview.collectedCards} / {overview.totalCards}枚</Typography>
                <Box sx={{ flex: 1 }} />
                <MuiLink component={Link} href="/collection" underline="hover" sx={{ fontSize: 14, fontWeight: 700, color: PRIMARY, display: "inline-flex", alignItems: "center", gap: 0.25 }}>コレクションへ<ArrowOutwardIcon sx={{ fontSize: 15 }} /></MuiLink>
              </Box>
              {latestCard && latestTone && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 1.5, border: `1px solid ${latestTone.border}`, bgcolor: latestTone.bgcolor, borderRadius: "12px", px: 1.75, py: 1.25 }}>
                  <Chip label={latestTone.label} size="small" sx={{ bgcolor: "#ffffff", color: latestTone.color, border: `1px solid ${latestTone.border}`, fontWeight: 900, fontSize: 14, height: 26 }} />
                  <Typography sx={{ fontSize: 16, fontWeight: 900 }}>{latestCard.title}</Typography>
                  <Typography sx={{ fontSize: 14 }}>{latestCard.label}{latestCard.courseTitle ? `（${latestCard.courseTitle}で獲得）` : ""}</Typography>
                </Box>
              )}
            </Box>
          </Stack>

          {boardQuestions.length > 0 && (
            <Box component="section" aria-label="学んだ知識を活かそう">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ForumOutlinedIcon sx={{ color: TEXT, fontSize: 22 }} />
                <Typography sx={{ fontSize: 18, fontWeight: 900 }}>学んだ知識を活かそう</Typography>
              </Box>
              <Typography sx={{ fontSize: 14, mt: 0.75 }}>あなたが修了した単元で、仲間が質問しています</Typography>
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                {boardQuestions.map(question => (
                  <Box key={question.id} sx={{ border: `1px solid ${HAIRLINE}`, borderRadius: "14px", p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      {question.courseTitle && <Chip label={question.courseTitle} size="small" sx={{ fontSize: 14, fontWeight: 800, height: 26, bgcolor: "#eef4ff", color: PRIMARY }} />}
                      <Typography sx={{ fontSize: 14, fontWeight: 800, color: question.commentCount === 0 ? PRIMARY : TEXT }}>
                        {question.commentCount === 0 ? "まだ回答がありません" : `回答 ${question.commentCount}件・まだ解決していません`}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 900, lineHeight: 1.5, mt: 0.75 }}>{question.title}</Typography>
                    <Typography sx={{ fontSize: 14, lineHeight: 1.7, mt: 0.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{question.excerpt}</Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.25 }}>
                      {question.authorName && <Typography sx={{ fontSize: 14 }}>{question.authorName} さん</Typography>}
                      <Box sx={{ flex: 1 }} />
                      <Button component={Link} href={question.href} variant="outlined" sx={{ fontSize: 14, fontWeight: 900, px: 2, py: 0.75, borderRadius: "10px", color: PRIMARY, borderColor: PRIMARY }}>回答してみる</Button>
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                <MuiLink component={Link} href="/quest-board" underline="hover" sx={{ fontSize: 14, fontWeight: 700, color: PRIMARY, display: "inline-flex", alignItems: "center", gap: 0.25 }}>掲示板へ<ArrowOutwardIcon sx={{ fontSize: 15 }} /></MuiLink>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
