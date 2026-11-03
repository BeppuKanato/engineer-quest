"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import QuizIcon from "@mui/icons-material/Quiz";
import RouteIcon from "@mui/icons-material/Route";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { onAuthStateChanged, type User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getMascotImagePath } from "@/app/component/mascot";
import { auth } from "@/lib/firebase";

const brandGradient = "linear-gradient(90deg, #0047c7 0%, #0053df 48%, #0041b8 100%)";
const pageBackground = "#f5f8fc";
const cardBorder = "1px solid #dbeafe";
const headingColor = "#0b2a5b";
const bodyColor = "#40506b";

const steps = [
  {
    icon: QuizIcon,
    title: "1. 特性を知る",
    text: "最初に質問紙（HEXAD）へ答えると、あなたの学び方の特性が分かります。フィードバックの出し分けにも使われます。",
  },
  {
    icon: RouteIcon,
    title: "2. ミッションで学ぶ",
    text: "コースごとに用意されたミッションを順に進めます。図解とステップ実行で、アルゴリズムの動きを目で追いながら理解できます。",
  },
  {
    icon: AutoAwesomeIcon,
    title: "3. フィードバックで振り返る",
    text: "課題に挑戦するとAIフィードバックが返ってきます。知識カードや実績を集めながら、次の学びへつなげましょう。",
  },
];

const features = [
  {
    icon: EmojiEventsIcon,
    title: "ミッション形式で進む",
    text: "学習は1つずつのミッションで構成されています。クリアすると経験値や報酬が得られ、進み具合が目に見えます。",
  },
  {
    icon: VisibilityIcon,
    title: "図解とステップ実行",
    text: "配列やグラフの変化を1ステップずつ表示します。「なんとなく分かった」で終わらせず、手順を追って確かめられます。",
  },
  {
    icon: AutoAwesomeIcon,
    title: "AIフィードバック",
    text: "提出したコードに対して、現在の状態・次の目標・次の一歩が提示されます。自分に合った進め方のヒントになります。",
  },
  {
    icon: CollectionsBookmarkIcon,
    title: "集めて続ける仕掛け",
    text: "知識カード、実績、連続学習の記録など、続けるための仕掛けを用意しています。復習にもそのまま使えます。",
  },
];

const courses = [
  { name: "バブルソート", description: "隣同士の交換から始める、並べ替えの基本" },
  { name: "選択ソート", description: "最小値を選んで前に置く、もう1つの基本" },
  { name: "二分探索", description: "範囲を半分に絞る、速い探し方" },
  { name: "KMP法", description: "文字列探索を賢く速くする工夫" },
  { name: "幅優先探索（BFS）", description: "近い順に広げるグラフ探索と最短距離" },
  { name: "深さ優先探索（DFS）", description: "行けるところまで進むグラフ探索" },
  { name: "マージソート", description: "分けて、並べて、まとめる並べ替え" },
  { name: "作る", description: "学んだ考え方でプログラムを自作する課題" },
];

export default function TopPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const isLoggedIn = isAuthReady && user !== null;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBackground }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          background: brandGradient,
          borderBottom: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 10px 28px rgba(0, 47, 140, 0.18)",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
          <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 78 }, gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flex: 1, minWidth: 0 }}>
              <Box
                component="img"
                src="/fit-logo.png"
                alt="FIT"
                sx={{ width: { xs: 40, md: 50 }, height: { xs: 40, md: 50 }, objectFit: "contain" }}
              />
              <Box sx={{ lineHeight: 1 }}>
                <Typography component="div" sx={{ fontSize: { xs: 20, md: 30 }, fontWeight: 900, fontStyle: "italic", lineHeight: 1 }}>
                  FIT
                </Typography>
                <Typography component="div" sx={{ mt: 0.4, fontSize: { xs: 12, md: 16 }, fontWeight: 700 }}>
                  Engineer Quest
                </Typography>
              </Box>
            </Box>
            {isAuthReady &&
              (isLoggedIn ? (
                <Button
                  component={Link}
                  href="/home"
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  sx={{ bgcolor: "#fff", color: "#0047c7", fontWeight: 800, "&:hover": { bgcolor: "#e3ecff" } }}
                >
                  ホームへ進む
                </Button>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    component={Link}
                    href="/auth/login"
                    variant="outlined"
                    startIcon={<LoginIcon />}
                    sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.7)", fontWeight: 700, "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.12)" } }}
                  >
                    ログイン
                  </Button>
                  <Button
                    component={Link}
                    href="/auth/signup"
                    variant="contained"
                    startIcon={<PersonAddAltIcon />}
                    sx={{ bgcolor: "#fff", color: "#0047c7", fontWeight: 800, "&:hover": { bgcolor: "#e3ecff" } }}
                  >
                    新規登録
                  </Button>
                </Stack>
              ))}
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Stack spacing={{ xs: 6, md: 9 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
              gap: { xs: 4, md: 6 },
              alignItems: "center",
            }}
          >
            <Stack spacing={3}>
              <Chip
                icon={<SchoolRoundedIcon />}
                label="プログラミング学習 × ゲーム"
                sx={{ alignSelf: "flex-start", bgcolor: "#e3ecff", color: "#0047c7", fontWeight: 700 }}
              />
              <Typography variant="h3" component="h1" sx={{ fontWeight: 900, color: headingColor, lineHeight: 1.3, fontSize: { xs: 30, md: 44 } }}>
                遊びながら学ぶ、
                <br />
                プログラミングとアルゴリズム
              </Typography>
              <Typography sx={{ color: bodyColor, fontSize: { xs: 15, md: 17 }, lineHeight: 1.9 }}>
                Engineer Quest は、ミッションを攻略しながらアルゴリズムを学べる学習アプリです。
                図解とステップ実行で動きを確かめ、AIフィードバックで振り返りながら、自分のペースで進められます。
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                {isLoggedIn ? (
                  <Button component={Link} href="/home" variant="contained" size="large" startIcon={<PlayArrowIcon />} sx={{ fontWeight: 800, px: 4 }}>
                    学習を続ける
                  </Button>
                ) : (
                  <>
                    <Button component={Link} href="/auth/signup" variant="contained" size="large" startIcon={<PersonAddAltIcon />} sx={{ fontWeight: 800, px: 4 }}>
                      新規登録して始める
                    </Button>
                    <Button component={Link} href="/auth/login" variant="outlined" size="large" startIcon={<LoginIcon />} sx={{ fontWeight: 700, px: 4 }}>
                      ログイン
                    </Button>
                  </>
                )}
              </Stack>
              <Typography sx={{ color: bodyColor, fontSize: 13 }}>
                登録は無料です。ブラウザだけですぐに始められます。
              </Typography>
            </Stack>

            <Card elevation={0} sx={{ border: cardBorder, borderRadius: 4, bgcolor: "#fff" }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Stack spacing={2} alignItems="center">
                  <Box
                    component="img"
                    src={getMascotImagePath("red-panda", "cheer")}
                    alt="Engineer Quest の相棒キャラクター"
                    sx={{ width: { xs: 150, md: 190 }, height: "auto" }}
                  />
                  <Box sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 3, px: 2.5, py: 1.75, width: "100%" }}>
                    <Typography sx={{ color: headingColor, fontWeight: 700, lineHeight: 1.8, textAlign: "center" }}>
                      相棒と一緒に少しずつ進めよう。
                      <br />
                      ミッションをクリアして、知識カードを集める冒険が始まります。
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                    <Chip label="7つのコース" sx={{ fontWeight: 700 }} />
                    <Chip label="ミッション形式" sx={{ fontWeight: 700 }} />
                    <Chip label="AIフィードバック" sx={{ fontWeight: 700 }} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          <Stack spacing={3}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 900, color: headingColor }}>
              学び方
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {steps.map((step) => (
                <Card key={step.title} elevation={0} sx={{ border: cardBorder, borderRadius: 3, bgcolor: "#fff", height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={1.5}>
                      <step.icon sx={{ color: "#0053df", fontSize: 32 }} />
                      <Typography sx={{ fontWeight: 800, color: headingColor }}>{step.title}</Typography>
                      <Typography sx={{ color: bodyColor, lineHeight: 1.8, fontSize: 14 }}>{step.text}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Stack>

          <Stack spacing={3}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 900, color: headingColor }}>
              Engineer Quest の特徴
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {features.map((feature) => (
                <Card key={feature.title} elevation={0} sx={{ border: cardBorder, borderRadius: 3, bgcolor: "#fff", height: "100%" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={1.5}>
                      <feature.icon sx={{ color: "#0053df", fontSize: 32 }} />
                      <Typography sx={{ fontWeight: 800, color: headingColor }}>{feature.title}</Typography>
                      <Typography sx={{ color: bodyColor, lineHeight: 1.8, fontSize: 14 }}>{feature.text}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Stack>

          <Stack spacing={3}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 900, color: headingColor }}>
              学べるコース
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              {courses.map((course) => (
                <Card key={course.name} elevation={0} sx={{ border: cardBorder, borderRadius: 3, bgcolor: "#fff", height: "100%" }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack spacing={0.75}>
                      <Typography sx={{ fontWeight: 800, color: headingColor, fontSize: 15 }}>{course.name}</Typography>
                      <Typography sx={{ color: bodyColor, lineHeight: 1.7, fontSize: 13 }}>{course.description}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Stack>

          <Box sx={{ background: brandGradient, borderRadius: 4, px: { xs: 3, md: 6 }, py: { xs: 4, md: 5 } }}>
            <Stack spacing={2.5} alignItems="center" textAlign="center">
              <Typography variant="h5" component="h2" sx={{ fontWeight: 900, color: "#fff" }}>
                さあ、冒険を始めよう
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.9, maxWidth: 560 }}>
                最初のミッションは数分で終わります。まずは1つクリアして、Engineer Quest の学び方を体験してみてください。
              </Typography>
              {isLoggedIn ? (
                <Button component={Link} href="/home" variant="contained" size="large" startIcon={<PlayArrowIcon />} sx={{ bgcolor: "#fff", color: "#0047c7", fontWeight: 800, px: 4, "&:hover": { bgcolor: "#e3ecff" } }}>
                  ホームへ進む
                </Button>
              ) : (
                <Button component={Link} href="/auth/signup" variant="contained" size="large" startIcon={<PersonAddAltIcon />} sx={{ bgcolor: "#fff", color: "#0047c7", fontWeight: 800, px: 4, "&:hover": { bgcolor: "#e3ecff" } }}>
                  新規登録して始める
                </Button>
              )}
            </Stack>
          </Box>

          <Typography sx={{ color: bodyColor, fontSize: 12, textAlign: "center" }}>
            © Engineer Quest / Fukuoka Institute of Technology
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
