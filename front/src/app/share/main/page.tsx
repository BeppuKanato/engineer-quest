"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Collapse,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  Star,
  Whatshot,
  TrackChanges
} from "@mui/icons-material";
import { NavBar } from "@/app/component/common/navBar";
import { BackHeader } from "@/app/component/common/backHeader";
import { fetchWithUserId } from "@/utils/fetchers";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { SharedMissionMainResponse } from "@/type";
import { Target } from "lucide-react";

export default function ShareMainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");

  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<SharedMissionMainResponse | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  /* auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/auth/login");
        return;
      }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  /* fetch */
  useEffect(() => {
    if (!user || !examId) return;

    const fetchData = async () => {
      const res = await fetchWithUserId(user, "/share/main", {
        method: "POST",
        body: JSON.stringify({ examId }),
      });
      const json: SharedMissionMainResponse = await res.json();
      setData(json);
    };

    fetchData();
  }, [user, examId]);

  if (!data) return null;

  const { sharedMissions, stats } = data;

  /* 上位3名 */
  const topUsers = [...sharedMissions]
    .sort((a, b) => b.examProgress.point - a.examProgress.point)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-indigo-50 pb-20">
      <NavBar />
      <BackHeader title="問題選択へ戻る" onClick={() => router.back()} />

      <Box sx={{ maxWidth: 1100, mx: "auto", p: 4 }}>
        {/* トップユーザー */}
        <Card
        sx={{
            mb: 4,
            p: 3,
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            color: "#fff",
        }}
        >
        <Typography variant="h5" fontWeight="bold" mb={3}>
            🏆 トップユーザー
        </Typography>

        <Box
            sx={{
            display: "flex",
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
            }}
        >
            {topUsers.map((u, i) => (
            <Box
                key={i}
                sx={{
                flex: 1,
                textAlign: "center",
                bgcolor: "rgba(255,255,255,0.15)",
                borderRadius: 2,
                p: 2,
                }}
            >
                <Avatar sx={{ mx: "auto", mb: 1 }}>
                {u.user.name.charAt(0)}
                </Avatar>

                <Typography fontWeight="bold">{u.user.name}</Typography>

                <Typography variant="h4" fontWeight="bold">
                {u.examProgress.point}
                </Typography>
            </Box>
            ))}
        </Box>
        </Card>

        <Box
        sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            mb: 4,
        }}
        >
        {[
            { icon: <TrackChanges color="primary" />, label: "総提出数", value: stats.count },
            { icon: <CheckCircle color="success" />, label: "合格数", value: stats.count },
            { icon: <Star sx={{ color: "#fbc02d" }} />, label: "平均点", value: stats.average },
            { icon: <Whatshot sx={{ color: "#9c27b0" }} />, label: "満点数", value: stats.max },
        ].map((s, i) => (
            <Card key={i} sx={{ flex: "1 1 200px" }}>
            <CardContent
                sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                }}
            >
                {s.icon}

                <Box>
                {/* 数値：強調 */}
                <Typography
                    variant="h5"
                    fontWeight="bold"
                    lineHeight={1.1}
                >
                    {s.value}
                </Typography>

                {/* ラベル：サイズUP */}
                <Typography
                    variant="body1"
                    fontWeight={500}
                    color="text.secondary"
                >
                    {s.label}
                </Typography>
                </Box>
            </CardContent>
            </Card>
        ))}
        </Box>


        {/* ランキング */}
        <Typography variant="h6" fontWeight="bold" mb={2}>
        📈 スコアランキング
        </Typography>

        {sharedMissions.map((m, idx) => {
        const isOpen = openIndex === idx;

        const good = m.examProgress.good ?? [];
        const bad = m.examProgress.bad ?? [];
        const userCodes = m.examProgress.userCodes ?? [];

        return (
            <Card key={`${m.user?.name ?? "user"}-${idx}`} sx={{ mb: 2 }}>
            <CardContent>
                {/* 上段（概要） */}
                <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                }}
                >
                {/* ユーザ情報 */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight="bold" noWrap>
                    {m.user?.name ?? "名無し"}
                    </Typography>

                    {m.examProgress.feedback ? (
                    <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                        {m.examProgress.feedback}
                    </Typography>
                    ) : (
                    <Typography color="text.secondary">（フィードバックなし）</Typography>
                    )}
                </Box>

                {/* スコア */}
                <Box sx={{ textAlign: "right", minWidth: 110 }}>
                    <Typography
                    variant="h3"
                    fontWeight="bold"
                    color="primary"
                    sx={{ lineHeight: 1 }}
                    >
                    {m.examProgress.point}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                    SCORE
                    </Typography>
                </Box>

                {/* ボタン */}
                <Button
                    variant="contained"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    sx={{ whiteSpace: "nowrap" }}
                >
                    {isOpen ? "閉じる" : "詳細を見る"}
                </Button>
                </Box>

                {/* 詳細 */}
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Divider sx={{ my: 2 }} />

                {/* good/bad を横並びにしたいならここも flex に */}
                <Box
                    sx={{
                    display: "flex",
                    gap: 2,
                    flexDirection: { xs: "column", md: "row" },
                    mb: 2,
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: "success.main", mb: 1 }}>
                        ✅ 良かった点
                    </Typography>

                    {good.length === 0 ? (
                        <Typography color="text.secondary">（なし）</Typography>
                    ) : (
                        good.map((g, i) => (
                        <Box
                            key={`good-${i}`}
                            sx={{
                            bgcolor: "success.50",
                            border: "1px solid",
                            borderColor: "success.100",
                            borderRadius: 1,
                            px: 1.5,
                            py: 1,
                            mb: 1,
                            fontSize: 16,
                            }}
                        >
                            ✓ {g}
                        </Box>
                        ))
                    )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: "warning.main", mb: 1 }}>
                        💡 改善点
                    </Typography>

                    {bad.length === 0 ? (
                        <Typography color="text.secondary">（なし）</Typography>
                    ) : (
                        bad.map((b, i) => (
                        <Box
                            key={`bad-${i}`}
                            sx={{
                            bgcolor: "warning.50",
                            border: "1px solid",
                            borderColor: "warning.100",
                            borderRadius: 1,
                            px: 1.5,
                            py: 1,
                            mb: 1,
                            fontSize: 16,
                            }}
                        >
                            ! {b}
                        </Box>
                        ))
                    )}
                    </Box>
                </Box>

                {/* code */}
                {userCodes.length === 0 ? (
                    <Typography color="text.secondary">（コードなし）</Typography>
                ) : (
                    userCodes.map((c, i) => (
                    <Box key={`code-${i}`} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                        {c.fileName ? `${c.fileName} ` : ""}
                        [{c.language}]
                        </Typography>

                        <Box
                        component="pre"
                        sx={{
                            mt: 1,
                            bgcolor: "#0f172a",
                            color: "#e5e7eb",
                            p: 2,
                            borderRadius: 2,
                            overflowX: "auto",
                            fontSize: 12,
                            lineHeight: 1.6,
                        }}
                        >
                        <code>{c.code}</code>
                        </Box>
                    </Box>
                    ))
                )}
                </Collapse>
            </CardContent>
            </Card>
        );
        })}

      </Box>
    </div>
  );
}
