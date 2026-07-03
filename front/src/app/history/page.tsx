"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ReviewsIcon from "@mui/icons-material/Reviews";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { getHistory, type HistoryEvent, type HistoryEventType } from "@/api/history.api";
import { AppHeader } from "@/app/component/appHeader";
import { auth } from "@/lib/firebase";

const eventMeta: Record<
  HistoryEventType,
  { label: string; color: string; bgcolor: string; icon: ReactNode }
> = {
  activity_completed: {
    label: "Activity",
    color: "#16a34a",
    bgcolor: "#dcfce7",
    icon: <CheckCircleIcon fontSize="small" />,
  },
  mission_completed: {
    label: "Mission",
    color: "#0b63e5",
    bgcolor: "#dbeafe",
    icon: <TrackChangesIcon fontSize="small" />,
  },
  course_completed: {
    label: "Course",
    color: "#7e22ce",
    bgcolor: "#f3e8ff",
    icon: <EmojiEventsIcon fontSize="small" />,
  },
  exp_gained: {
    label: "EXP",
    color: "#d97706",
    bgcolor: "#fffbeb",
    icon: <BoltIcon fontSize="small" />,
  },
  badge_ticket: {
    label: "Ticket",
    color: "#f59e0b",
    bgcolor: "#fff7ed",
    icon: <ConfirmationNumberIcon fontSize="small" />,
  },
  badge_acquired: {
    label: "Badge",
    color: "#0891b2",
    bgcolor: "#ecfeff",
    icon: <WorkspacePremiumIcon fontSize="small" />,
  },
  knowledge_tip_acquired: {
    label: "Card",
    color: "#7c3aed",
    bgcolor: "#f5f3ff",
    icon: <AutoAwesomeIcon fontSize="small" />,
  },
  achievement_unlocked: {
    label: "Achievement",
    color: "#2563eb",
    bgcolor: "#eff6ff",
    icon: <EmojiEventsIcon fontSize="small" />,
  },
  work_saved: {
    label: "Work",
    color: "#475569",
    bgcolor: "#f1f5f9",
    icon: <WorkspacePremiumIcon fontSize="small" />,
  },
  ai_review: {
    label: "AI Review",
    color: "#be123c",
    bgcolor: "#fff1f2",
    icon: <ReviewsIcon fontSize="small" />,
  },
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
const learningTypes: HistoryEventType[] = ["activity_completed", "mission_completed"];

const isSameMonth = (date: Date, month: Date) =>
  date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();

const addMonths = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);

const formatMonth = (date: Date) =>
  date.toLocaleDateString("ja-JP", { year: "numeric", month: "long" });

const formatDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

const sumExp = (events: HistoryEvent[]) =>
  events
    .filter((event) => event.type === "exp_gained")
    .reduce((total, event) => total + (event.amount ?? Number(event.title.match(/\d+/)?.[0] ?? 0)), 0);

const createRecentDays = (baseDate: Date) =>
  Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - (6 - index));
    return date;
  });

const getCalendarDays = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

const getLearningCount = (events: HistoryEvent[]) =>
  events.filter((event) => learningTypes.includes(event.type)).length;

export default function HistoryPage() {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!isMounted) return;
        setEvents([]);
        setErrorMessage("ログインが必要です。");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const token = await user.getIdToken();
        const data = await getHistory(token);

        if (!isMounted) return;
        setEvents(data.events);
      } catch (error) {
        console.error(error);
        if (!isMounted) return;
        setErrorMessage("履歴を取得できませんでした。");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const dashboard = useMemo(() => {
    const currentMonthEvents = events.filter((event) => isSameMonth(new Date(event.occurredAt), selectedMonth));
    const previousMonth = addMonths(selectedMonth, -1);
    const previousMonthEvents = events.filter((event) => isSameMonth(new Date(event.occurredAt), previousMonth));
    const latestDate = events[0]?.occurredAt ? new Date(events[0].occurredAt) : new Date();
    const recentDays = createRecentDays(latestDate);

    const dailyActivity = recentDays.map((date) => {
      const key = formatDayKey(date);
      return {
        key,
        label: weekdays[date.getDay()],
        value: events.filter((event) => formatDayKey(new Date(event.occurredAt)) === key && learningTypes.includes(event.type)).length,
      };
    });

    let cumulativeExp = 0;
    const dailyExp = recentDays.map((date) => {
      const key = formatDayKey(date);
      cumulativeExp += sumExp(events.filter((event) => formatDayKey(new Date(event.occurredAt)) === key));
      return {
        key,
        label: weekdays[date.getDay()],
        value: cumulativeExp,
      };
    });

    const monthlyCounts = {
      activity: getLearningCount(currentMonthEvents),
      missions: currentMonthEvents.filter((event) => event.type === "mission_completed").length,
      cards: currentMonthEvents.filter((event) => event.type === "knowledge_tip_acquired").length,
      exp: sumExp(currentMonthEvents),
    };

    const previousCounts = {
      activity: getLearningCount(previousMonthEvents),
      missions: previousMonthEvents.filter((event) => event.type === "mission_completed").length,
      cards: previousMonthEvents.filter((event) => event.type === "knowledge_tip_acquired").length,
      exp: sumExp(previousMonthEvents),
    };

    const dayMap = new Map<string, number>();
    currentMonthEvents.forEach((event) => {
      if (!learningTypes.includes(event.type)) return;
      const key = formatDayKey(new Date(event.occurredAt));
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    });

    return {
      currentMonthEvents,
      previousMonth,
      dailyActivity,
      dailyExp,
      monthlyCounts,
      previousCounts,
      calendarDays: getCalendarDays(selectedMonth).map((date) => ({
        date,
        count: dayMap.get(formatDayKey(date)) ?? 0,
        inMonth: isSameMonth(date, selectedMonth),
      })),
    };
  }, [events, selectedMonth]);

  const recentEvents = events.slice(0, visibleCount);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f8fc" }}>
      <AppHeader />
      <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 3, md: 4 } }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 58, height: 58, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "#0b63e5", color: "#fff", boxShadow: "0 14px 34px rgba(11, 99, 229, 0.28)" }}>
                <HistoryIcon sx={{ fontSize: 34 }} />
              </Box>
              <Box>
                <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: 38, md: 46 } }}>
                  履歴
                </Typography>
                <Typography color="text.secondary">
                  あなたの学習の積み重ねと成長を確認しましょう。
                </Typography>
              </Box>
            </Stack>
            <MonthSwitcher
              month={selectedMonth}
              onPrev={() => setSelectedMonth((current) => addMonths(current, -1))}
              onNext={() => setSelectedMonth((current) => addMonths(current, 1))}
            />
          </Stack>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          {isLoading ? (
            <HistorySkeleton />
          ) : events.length === 0 ? (
            <Alert severity="info">まだ表示できる履歴がありません。</Alert>
          ) : (
            <>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 2.5 }}>
                <SummaryCard
                  icon={<CheckCircleIcon />}
                  label="今月の完了アクティビティ"
                  value={`${dashboard.monthlyCounts.activity}件`}
                  delta={dashboard.monthlyCounts.activity - dashboard.previousCounts.activity}
                  tone="#0b63e5"
                />
                <SummaryCard
                  icon={<TrackChangesIcon />}
                  label="今月の完了ミッション"
                  value={`${dashboard.monthlyCounts.missions}件`}
                  delta={dashboard.monthlyCounts.missions - dashboard.previousCounts.missions}
                  tone="#16a34a"
                />
                <SummaryCard
                  icon={<AutoAwesomeIcon />}
                  label="今月の獲得カード"
                  value={`${dashboard.monthlyCounts.cards}枚`}
                  delta={dashboard.monthlyCounts.cards - dashboard.previousCounts.cards}
                  tone="#7c3aed"
                />
                <SummaryCard
                  icon={<BoltIcon />}
                  label="今月の獲得EXP"
                  value={`${dashboard.monthlyCounts.exp.toLocaleString()} EXP`}
                  delta={dashboard.monthlyCounts.exp - dashboard.previousCounts.exp}
                  tone="#f59e0b"
                  suffix=" EXP"
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 0.76fr" }, gap: 2.5 }}>
                <BarChartCard title="直近7日間の完了アクティビティ数" unit="件" data={dashboard.dailyActivity} />
                <LineChartCard title="直近7日間の獲得EXP推移" unit="EXP" data={dashboard.dailyExp} />
                <CalendarCard month={selectedMonth} days={dashboard.calendarDays} />
              </Box>

              <RecentHistoryCard
                events={recentEvents}
                total={events.length}
                canShowMore={visibleCount < events.length}
                onShowMore={() => setVisibleCount((current) => Math.min(current + 6, events.length))}
              />
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
}

const MonthSwitcher = ({ month, onPrev, onNext }: { month: Date; onPrev: () => void; onNext: () => void }) => (
  <Paper elevation={0} sx={{ px: 1.5, py: 1, borderRadius: 2, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
    <Stack direction="row" spacing={1} alignItems="center">
      <IconButton size="small" onClick={onPrev} aria-label="前の月">
        <ChevronLeftIcon />
      </IconButton>
      <CalendarMonthIcon sx={{ color: "#334155" }} />
      <Typography fontWeight={900} sx={{ minWidth: 116, textAlign: "center" }}>
        {formatMonth(month)}
      </Typography>
      <IconButton size="small" onClick={onNext} aria-label="次の月">
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  </Paper>
);

const SummaryCard = ({ icon, label, value, delta, tone, suffix = "" }: { icon: ReactNode; label: string; value: string; delta: number; tone: string; suffix?: string }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff", boxShadow: "0 12px 34px rgba(15, 23, 42, 0.04)" }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{ width: 58, height: 58, borderRadius: 3, display: "grid", placeItems: "center", color: tone, bgcolor: `${tone}16`, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography color="text.secondary" fontWeight={800}>{label}</Typography>
        <Typography variant="h4" fontWeight={900} sx={{ mt: 0.25 }}>{value}</Typography>
        <Typography color={delta >= 0 ? "#0b63e5" : "#64748b"} fontWeight={900} sx={{ mt: 0.75, fontSize: 14 }}>
          先月より {delta >= 0 ? "+" : ""}{delta.toLocaleString()}{suffix}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const ChartPaper = ({ title, unit, children }: { title: string; unit: string; children: ReactNode }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="h6" fontWeight={900}>{title}</Typography>
      <Chip label="直近7日間" size="small" sx={{ fontWeight: 900, color: "#0b63e5", bgcolor: "#eff6ff" }} />
    </Stack>
    <Typography color="text.secondary" fontWeight={800} sx={{ fontSize: 13, mb: 1 }}>{unit}</Typography>
    {children}
  </Paper>
);

const BarChartCard = ({ title, unit, data }: { title: string; unit: string; data: { label: string; value: number }[] }) => {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <ChartPaper title={title} unit={unit}>
      <Box sx={{ height: 230, display: "grid", gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`, gap: 2, alignItems: "end", borderBottom: "1px solid #dbe3ef", backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "100% 46px" }}>
        {data.map((item) => (
          <Stack key={item.label} spacing={1} alignItems="center" justifyContent="flex-end" sx={{ height: "100%" }}>
            <Typography color="#0b63e5" fontWeight={900} sx={{ fontSize: 13 }}>{item.value}</Typography>
            <Box sx={{ width: 18, height: `${Math.max(8, (item.value / max) * 170)}px`, borderRadius: "8px 8px 0 0", bgcolor: "#0b63e5", boxShadow: "0 8px 18px rgba(11, 99, 229, 0.22)" }} />
            <Typography fontWeight={800}>{item.label}</Typography>
          </Stack>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        ※ 直近7日間の学習完了データです
      </Typography>
    </ChartPaper>
  );
};

const LineChartCard = ({ title, unit, data }: { title: string; unit: string; data: { label: string; value: number }[] }) => {
  const max = Math.max(1, ...data.map((item) => item.value));
  const points = data.map((item, index) => {
    const x = 24 + index * 64;
    const y = 190 - (item.value / max) * 150;
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <ChartPaper title={title} unit={unit}>
      <Box sx={{ width: "100%", overflow: "hidden" }}>
        <Box component="svg" viewBox="0 0 430 230" sx={{ width: "100%", height: 230, display: "block" }}>
          {[40, 80, 120, 160, 200].map((y) => (
            <line key={y} x1="18" y1={y} x2="414" y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
          ))}
          <path d={path} fill="none" stroke="#0b63e5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="6" fill="#0b63e5" stroke="#fff" strokeWidth="3" />
              <text x={point.x} y={Math.max(16, point.y - 14)} textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">
                {point.value.toLocaleString()}
              </text>
              <text x={point.x} y="222" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f172a">
                {point.label}
              </text>
            </g>
          ))}
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        ※ 直近7日間の累計EXP推移です
      </Typography>
    </ChartPaper>
  );
};

const CalendarCard = ({ month, days }: { month: Date; days: { date: Date; count: number; inMonth: boolean }[] }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="h6" fontWeight={900}>学習カレンダー</Typography>
      <Typography color="text.secondary" fontWeight={800}>{formatMonth(month)}</Typography>
    </Stack>
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
      {weekdays.map((day) => (
        <Typography key={day} textAlign="center" color="text.secondary" fontWeight={900} sx={{ fontSize: 13 }}>{day}</Typography>
      ))}
      {days.map((day) => (
        <Box key={day.date.toISOString()} sx={{ height: 40, borderRadius: 1, display: "grid", placeItems: "center", fontWeight: 900, color: day.inMonth ? "#0f172a" : "#94a3b8", bgcolor: calendarColor(day.count), border: "1px solid #eef2f7" }}>
          {day.date.getDate()}
        </Box>
      ))}
    </Box>
    <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center" sx={{ mt: 2, flexWrap: "wrap" }}>
      <Legend color="#f8fafc" label="未学習" />
      <Legend color="#dcfce7" label="1件" />
      <Legend color="#86efac" label="2〜3件" />
      <Legend color="#22c55e" label="4件以上" />
    </Stack>
  </Paper>
);

const calendarColor = (count: number) => {
  if (count >= 4) return "#22c55e";
  if (count >= 2) return "#86efac";
  if (count >= 1) return "#dcfce7";
  return "#f8fafc";
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <Stack direction="row" spacing={0.75} alignItems="center">
    <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: color, border: "1px solid #e2e8f0" }} />
    <Typography variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>
  </Stack>
);

const RecentHistoryCard = ({ events, total, canShowMore, onShowMore }: { events: HistoryEvent[]; total: number; canShowMore: boolean; onShowMore: () => void }) => (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #dbe3ef", bgcolor: "#fff" }}>
    <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>最近の履歴</Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, columnGap: 3, rowGap: 1 }}>
      {events.map((event) => (
        <HistoryRow key={event.id} event={event} />
      ))}
    </Box>
    {canShowMore && (
      <Button fullWidth onClick={onShowMore} sx={{ mt: 2, minHeight: 44, borderRadius: 2, fontWeight: 900 }}>
        もっと見る ({events.length} / {total})
      </Button>
    )}
  </Paper>
);

const HistoryRow = ({ event }: { event: HistoryEvent }) => {
  const meta = eventMeta[event.type];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "64px 48px minmax(0, 1fr) auto 32px", gap: 1.5, alignItems: "center", py: 1.25, borderBottom: "1px solid #edf2f7" }}>
      <Typography color="text.secondary" fontWeight={800}>{formatTime(event.occurredAt)}</Typography>
      <Box sx={{ width: 38, height: 38, borderRadius: 2, display: "grid", placeItems: "center", color: meta.color, bgcolor: meta.bgcolor }}>
        {meta.icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography component={event.href ? Link : "span"} href={event.href ?? undefined} fontWeight={900} sx={{ display: "block", color: "#0f172a", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.description}
        </Typography>
      </Box>
      <Chip label={meta.label} size="small" sx={{ color: meta.color, bgcolor: meta.bgcolor, fontWeight: 900 }} />
      <MoreVertIcon sx={{ color: "#94a3b8" }} />
    </Box>
  );
};

const HistorySkeleton = () => (
  <Stack spacing={3}>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2.5 }}>
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} variant="rounded" height={112} sx={{ borderRadius: 3 }} />
      ))}
    </Box>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 0.76fr" }, gap: 2.5 }}>
      <Skeleton variant="rounded" height={330} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={330} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={330} sx={{ borderRadius: 3 }} />
    </Box>
    <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
  </Stack>
);
