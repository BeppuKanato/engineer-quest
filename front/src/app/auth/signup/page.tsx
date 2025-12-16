"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { TextField, Button, Box, Typography, Card, CardContent, Stack, Link } from "@mui/material";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setMessage("パスワードが一致しません");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);

      setMessage(`サインアップ成功`);
      router.push("/auth/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("予期しないエラーが発生しました");
      }
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
      <Card sx={{ maxWidth: 400, width: "100%", p: 3, boxShadow: 6, borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h4" sx={{ fontWeight: "bold", textAlign: "center" }}>
              サインアップ
            </Typography>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="パスワード確認"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button variant="contained" fullWidth onClick={handleSignup}>
              サインアップ
            </Button>
            {message && (
              <Typography
                color={message.startsWith("サインアップ成功") ? "success.main" : "error"}
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
