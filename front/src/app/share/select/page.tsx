"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  Button,
  Box,
  Chip,
  Skeleton,
} from "@mui/material";
import { NavBar } from "@/app/component/common/navBar";
import { BackHeader } from "@/app/component/common/backHeader";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { fetchWithUserId } from "@/utils/fetchers";
import { MISSION_EXAM_LANGUAGE, MISSION_TYPE, SharedMissionSelectItem } from "@/type";
import { MissionDifficultyBadge } from "@/app/component/common/missionDifficultyConfig";
import { MissionTypeBadge } from "@/app/component/common/missionTypeConfig";

export default function ShareSelectPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // フィルター
  const [difficulty, setDifficulty] = useState<string>("");
  const [star, setStar] = useState<number | "">("");
  const [language, setLanguage] = useState<MISSION_EXAM_LANGUAGE | "">("");
  const [type, setType] = useState<MISSION_TYPE | "">("");

  // データ
  const [missions, setMissions] = useState<SharedMissionSelectItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- auth ---------- */
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

  /* ---------- fetch ---------- */
  const fetchMissions = async () => {
    if (!user) return;
    setLoading(true);

    const res = await fetchWithUserId(user, "/share/selectFiltedMissinExam", {
      method: "POST",
      body: JSON.stringify({
        difficulty: difficulty || undefined,
        star: star || undefined,
        language: language || undefined,
        type: type || undefined,
      }),
    });

    // console.log(res.json());
    const json: SharedMissionSelectItem[] = await res.json();
    setMissions(json);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-indigo-50 pb-20">
      <NavBar />
      <BackHeader title="戻る" onClick={() => router.back()} />

      <Box sx={{ maxWidth: 1000, mx: "auto", p: 4 }}>
        <Typography variant="h4" fontWeight="bold" mb={3}>
          共有する問題を選択
        </Typography>

        {/* フィルター */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 2 }}>
            <Select
              value={difficulty}
              displayEmpty
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <MenuItem value="">難易度すべて</MenuItem>
              <MenuItem value="shokyu">初級</MenuItem>
              <MenuItem value="chukyu">中級</MenuItem>
              <MenuItem value="jokyu">上級</MenuItem>
            </Select>

            <Select value={star} displayEmpty onChange={(e) => setStar(e.target.value)}>
              <MenuItem value="">★ すべて</MenuItem>
              {[1, 2, 3, 4, 5].map((s) => (
                <MenuItem key={s} value={s}>{`${s}★`}</MenuItem>
              ))}
            </Select>

            <Select
              value={language}
              displayEmpty
              onChange={(e) => setLanguage(e.target.value)}
            >
              <MenuItem value="">言語すべて</MenuItem>
              {Object.values(MISSION_EXAM_LANGUAGE).map((l) => (
                <MenuItem key={l} value={l}>{l}</MenuItem>
              ))}
            </Select>

            <Select value={type} displayEmpty onChange={(e) => setType(e.target.value)}>
              <MenuItem value="">タイプすべて</MenuItem>
              {Object.values(MISSION_TYPE).map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>

            <Button
              variant="contained"
              sx={{ gridColumn: "span 4" }}
              onClick={fetchMissions}
            >
              検索
            </Button>
          </CardContent>
        </Card>

        {/* 一覧 */}
        <Box display="flex" flexDirection="column" gap={2}>
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={120} />
            ))}

          {!loading &&
            missions.map((m) => (
              <Card key={m.exam?.id}>
                <CardContent>
                  <Typography variant="h6">{m.title}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {m.detail}
                  </Typography>

                  <Box display="flex" gap={1} mb={2}>
                    <MissionDifficultyBadge
                      difficulty={m.difficulty.name}
                      star={m.star} 
                    />
                    <MissionTypeBadge
                      type={m.type} 
                    />
                    {m.exam?.language.map((l) => (
                      <Chip key={l} label={l} variant="outlined" />
                    ))}
                  </Box>

                  <Button
                    variant="contained"
                    onClick={() =>
                      router.push(`/share/main/${m.exam?.id}`)
                    }
                  >
                    共有コードを見る
                  </Button>
                </CardContent>
              </Card>
            ))}
        </Box>
      </Box>
    </div>
  );
}
