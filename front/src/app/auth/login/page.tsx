"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { TextField, Button, Box, Typography, Card, CardContent, Stack, Link } from "@mui/material";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const apiBaseUrl = getApiBaseUrl();

  const handleLogin = async () => {
    try {
      const signInUser = await signInWithEmailAndPassword(auth, email, password);
      const token = await signInUser.user.getIdToken();

      setMessage("ユーザ情報確認中");
      console.log(apiBaseUrl);
      const res = await fetch(`${apiBaseUrl}/auth/ensure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("APIエラー");
      router.push("/home");
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
              ログイン
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
            <Button variant="contained" fullWidth onClick={handleLogin}>
              ログイン
            </Button>
            {message && (
              <Typography color={message.startsWith("ログイン成功") ? "success.main" : "error"} sx={{ textAlign: "center" }}>
                {message}
              </Typography>
            )}
            <Typography variant="body2" mt={2} textAlign="center">
              アカウントをお持ちでない方
              <Link href="/auth/signup">新規登録</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
