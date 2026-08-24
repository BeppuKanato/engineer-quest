"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import {
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Link,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";
import { PageTransitionOverlay } from "@/app/component/pageTransitionOverlay";
import { useNavigationFeedback } from "@/hooks/useNavigationFeedback";
import { type AuthUser } from "@/api/auth.api";
import { useUserSession } from "@/app/component/userSession";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { isNavigating, showOverlay, startNavigation } =
    useNavigationFeedback();
  const apiBaseUrl = getApiBaseUrl();
  const { setAppUser } = useUserSession();

  console.log("API Base URL:", apiBaseUrl);
  const handleLogin = async () => {
    if (isSubmitting || isNavigating) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setMessage("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const credential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      const token = await credential.user.getIdToken();

      const res = await fetch(`${apiBaseUrl}/auth/ensure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: credential.user.displayName ?? null,
        }),
      });

      if (!res.ok) {
        throw new Error("ユーザー情報の確認に失敗しました");
      }

      const data = (await res.json()) as {
        user: AuthUser;
      };

      setAppUser(data.user);
      setMessage("ログイン成功");
      startNavigation(() => {
        router.push(data.user.hasHexadResponse ? "/home" : "/hexad");
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("予期しないエラーが発生しました");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: "100%",
          p: 3,
          boxShadow: 6,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Stack spacing={3}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", textAlign: "center" }}
            >
              ログイン
            </Typography>

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              disabled={isSubmitting || isNavigating}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              disabled={isSubmitting || isNavigating}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              disabled={isSubmitting || isNavigating}
              startIcon={
                isSubmitting ? <CircularProgress size={18} /> : undefined
              }
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </Button>

            {message && (
              <Typography
                color={
                  message.startsWith("ログイン成功")
                    ? "success.main"
                    : "error"
                }
                sx={{ textAlign: "center" }}
              >
                {message}
              </Typography>
            )}

            <Typography variant="body2" mt={2} textAlign="center">
              アカウントをお持ちでない方{" "}
              <Link href="/auth/signup">新規登録</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <PageTransitionOverlay open={showOverlay} />
    </Box>
  );
}
