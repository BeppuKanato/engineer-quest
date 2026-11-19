"use client";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Button, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import type { HomeResponse } from "@/api/home.api";
import { isMascotId } from "@/app/component/mascot";
import { MascotFigure } from "@/app/component/mascotFigure";
import type { ReactNode } from "react";

function Section({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return <Paper component="section" aria-labelledby={`home-${id}`} data-home-section={id} elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid #dbe3ef", borderRadius: 3, minWidth: 0 }}>
    <Typography id={`home-${id}`} component="h2" variant="h5" fontWeight={900} sx={{ mb: 2 }}>{title}</Typography>{children}
  </Paper>;
}
const unitStatus = { NOT_STARTED: "未開始", IN_PROGRESS: "学習中", COMPLETED: "完了" };
const achievementTitle = (title: string) => title.replace(/Lv\.(\d+)/g, "第$1段階");

export function HomeDashboard({ data, review, currentGoal }: { data: HomeResponse; review?: ReactNode; currentGoal?: ReactNode }) {
  const { overview, today, resume, week, questions } = data;
  const groups = [...new Set(overview.units.map(unit => unit.group))];
  const hasAim = today.recommended || today.nearAchievements.length || today.nearCards.length;
  return <Stack spacing={3}>
    <Section id="location" title="現在地">
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }}>
        <MascotFigure mascotId={isMascotId(data.user.selectedMascotId) ? data.user.selectedMascotId : "red-panda"} state="normal" alt="ユーザーの相棒" size="L" grounding="disc" />
        <Box sx={{ flex: 1 }}>
          <Typography color="text.secondary">{data.user.displayName?.trim() || "エンジニア"}さんの進み具合</Typography>
          <Stack direction="row" gap={3} flexWrap="wrap" sx={{ mt: 1 }}><Typography fontSize={24} fontWeight={900}>単元 {overview.completedUnits}/{overview.totalUnits}</Typography><Typography fontSize={24} fontWeight={900}>カード {overview.collectedCards}/{overview.totalCards}</Typography></Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>好きな単元から取り組めます。</Typography>
        </Box>
        <Button component={Link} href="/courses" variant="outlined">単元一覧へ</Button>
      </Stack>
      {groups.length > 0 && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 2, mt: 2.5 }}>{groups.map(group => <Box key={group}>
        <Typography fontWeight={900} color="text.secondary" sx={{ mb: 1 }}>{group}</Typography>
        <Stack spacing={1}>{overview.units.filter(unit => unit.group === group).map(unit => <Box key={unit.id} component={Link} href={unit.href} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: 1.25, minHeight: 44, border: "1px solid #dbe3ef", borderRadius: 2, textDecoration: "none", color: "inherit", bgcolor: unit.status === "COMPLETED" ? "#eff6ff" : "#fff" }}>
          <Typography fontSize={14} fontWeight={800} sx={{ overflowWrap: "anywhere" }}>{unit.title}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{unitStatus[unit.status]}</Typography>
        </Box>)}</Stack>
      </Box>)}</Box>}
    </Section>

    {!!hasAim && <Section id="aim" title="今日の狙い">
      {today.recommended && <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} alignItems={{ sm: "center" }}>
        <Box><Typography color="text.secondary">{today.recommended.status === "IN_PROGRESS" ? "学習中の単元を進めよう" : "次におすすめの単元"}</Typography><Typography variant="h6" fontWeight={900}>{today.recommended.title}</Typography>{today.recommended.nextPhase && <Typography>次は「{today.recommended.nextPhase}」</Typography>}</Box>
        <Button component={Link} href={today.recommended.status === "IN_PROGRESS" ? today.recommended.resumeHref : today.recommended.href} variant="contained">{today.recommended.status === "IN_PROGRESS" ? "続きから学ぶ" : "単元を見る"}</Button>
      </Stack>}
      {(today.nearAchievements.length > 0 || today.nearCards.length > 0) && <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2, mt: today.recommended ? 2.5 : 0 }}>
        {today.nearAchievements.map(achievement => <Box key={achievement.id} sx={{ p: 2, borderRadius: 2, bgcolor: "#f4f7fc" }}>
          <Typography variant="caption" fontWeight={800}>あと少しで届く実績</Typography><Typography fontWeight={900} sx={{ mt: 0.5 }}>{achievementTitle(achievement.title)}</Typography>
          <Typography variant="body2" sx={{ my: 1 }}>{achievement.progress} / {achievement.goal}</Typography>
          <LinearProgress aria-label={`${achievementTitle(achievement.title)}の進捗`} variant="determinate" value={Math.min(100, achievement.progress / achievement.goal * 100)} sx={{ height: 8, borderRadius: 9 }} />
          <Button component={Link} href={achievement.href} size="small" sx={{ mt: 1 }}>実績に向けて進める</Button>
        </Box>)}
        {today.nearCards.map(unit => <Box key={unit.id} sx={{ p: 2, borderRadius: 2, bgcolor: "#f4f7fc" }}><Typography variant="caption" fontWeight={800}>あと1枚でカードが揃う</Typography><Typography fontWeight={900} sx={{ mt: 0.5 }}>{unit.title}</Typography><Typography variant="body2" sx={{ mt: 1 }}>{unit.collectedCards} / {unit.totalCards}枚</Typography><Button component={Link} href={unit.href} size="small">単元の進み具合を見る</Button></Box>)}
      </Box>}
      {data.hasInProgressUnit && currentGoal && <Box sx={{ mt: 2 }}>{currentGoal}</Box>}
    </Section>}

    {resume && <Section id="resume" title="前回の続き">
      <Typography variant="h6" fontWeight={900}>{resume.title}</Typography><Typography sx={{ mt: 1 }}>再開するフェーズ：{resume.nextPhase ?? "単元の最終結果"}</Typography>
      {resume.nextStep && <Typography data-home-next-step noWrap title={resume.nextStep} sx={{ mt: 1.5, maxWidth: "100%", color: "#475569" }}>前回のフィードバックの次の一歩：{resume.nextStep}</Typography>}
      <Button component={Link} href={resume.resumeHref} variant="contained" sx={{ mt: 2 }}>前回の続きに戻る</Button>
    </Section>}

    {review}

    <Section id="streak" title="学習ストリーク">
      <Stack direction={{ xs: "column", sm: "row" }} gap={3} justifyContent="space-between" alignItems={{ sm: "center" }}>
        <Box><Typography fontWeight={900} fontSize={28}>{week.streakDays}日連続</Typography><Typography variant="body2" color="text.secondary">今週の学習日</Typography></Box>
        <Stack direction="row" gap={{ xs: 1, sm: 2 }}>{week.days.map(day => <Stack key={day.date} alignItems="center" spacing={0.75}>
          <Typography variant="caption" fontWeight={800}>{day.label}</Typography><Box aria-label={`${day.date} ${day.learned ? "学習済み" : "学習記録なし"}${day.isToday ? " 今日" : ""}`} data-learning-day={day.learned ? day.date : undefined} sx={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: day.learned ? "#0057e7" : "#f1f5f9", color: day.learned ? "#fff" : "#475569", border: day.isToday ? "2px solid #0057e7" : "2px solid transparent" }}>{day.learned ? <CheckCircleIcon sx={{ fontSize: 20 }} /> : Number(day.date.slice(8))}</Box>
          {day.isToday && <Chip label="今日" size="small" sx={{ height: 20, fontSize: 10 }} />}
        </Stack>)}</Stack>
      </Stack>
    </Section>

    {questions.length > 0 && <Section id="questions" title="掲示板の新着質問"><Stack spacing={1.5}>{questions.map(question => <Box key={question.id} component={Link} href={question.href} sx={{ display: "block", textDecoration: "none", color: "inherit", p: 1.5, border: "1px solid #dbe3ef", borderRadius: 2 }}><Typography fontWeight={800}>{question.title}</Typography><Typography variant="caption" color="text.secondary">{new Date(question.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}</Typography></Box>)}</Stack></Section>}
  </Stack>;
}
