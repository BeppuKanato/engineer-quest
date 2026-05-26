"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
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

export default function Signup() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const apiBaseUrl = getApiBaseUrl();

  const handleSignup = async () => {
    if (isSubmitting) return;

    const trimmedDisplayName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedDisplayName || !trimmedEmail || !password || !confirmPassword) {
      setMessage("ユーザー名、メールアドレス、パスワードを入力してください");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("パスワードが一致しません");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");

      const credential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      await updateProfile(credential.user, {
        displayName: trimmedDisplayName,
      });

      const token = await credential.user.getIdToken();

      const res = await fetch(`${apiBaseUrl}/auth/ensure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: trimmedDisplayName,
        }),
      });

      if (!res.ok) {
        throw new Error("ユーザー情報の作成に失敗しました");
      }

      setMessage("サインアップ成功");
      router.push("/home");
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
              サインアップ
            </Typography>

            <TextField
              label="ユーザー名"
              type="text"
              fullWidth
              value={displayName}
              disabled={isSubmitting}
              onChange={(e) => setDisplayName(e.target.value)}
            />

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              disabled={isSubmitting}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              disabled={isSubmitting}
              onChange={(e) => setPassword(e.target.value)}
            />

            <TextField
              label="パスワード確認"
              type="password"
              fullWidth
              value={confirmPassword}
              disabled={isSubmitting}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleSignup}
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? <CircularProgress size={18} /> : undefined
              }
            >
              {isSubmitting ? "作成中..." : "サインアップ"}
            </Button>

            {message && (
              <Typography
                color={
                  message.startsWith("サインアップ成功")
                    ? "success.main"
                    : "error"
                }
                sx={{ textAlign: "center" }}
              >
                {message}
              </Typography>
            )}

            <Typography variant="body2" mt={2} textAlign="center">
              すでにアカウントをお持ちですか?{" "}
              <Link href="/auth/login">ログイン</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}