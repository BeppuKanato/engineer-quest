"use client";

import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Divider
} from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Java_Mission_18 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {(isComponentType("", componentType)) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
            実行イメージ
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            このミッションでは、
            <strong>「外から直接触っていいもの」と「守るもの」</strong>
            を分けて、安全なクラスを作ります。
            </Typography>

            {/* ===== ケース1：フィールドを直接触れる場合 ===== */}
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース①：フィールドを直接触れる場合（危険）
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                main からの操作例
            </Typography>

            <Box
                component="pre"
                sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                mt: 1,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
                }}
            >
{`User u = new User();
u.score = -999;`}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" color="text.secondary">
                → 想定外の値を入れられ、不正な状態になる
            </Typography>
            </Card>

            {/* ===== ケース2：private + メソッド経由 ===== */}
            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース②：メソッド経由で操作する場合（安全）
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                main からの操作例
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="new Account(1000)" />
                </ListItem>
                <ListItem>
                <ListItemText primary="addBalance(500)" />
                </ListItem>
            </List>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="subtitle2">出力結果</Typography>

            <Box
                component="pre"
                sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                mt: 1,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
                }}
            >
{`1500`}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" color="text.secondary">
                → ルールを守った操作だけができる、安全なクラス
            </Typography>
            </Card>
        </>
        )}
        {isComponentType("step-1", componentType) && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            今までのクラスの問題点
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            これまでのクラスでは、フィールドを
            <strong>外から直接書き換えられる</strong>
            状態でした。
          </Typography>

          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              例：外から直接フィールドを書き換えている
            </Typography>

            <Box
              component="pre"
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                mt: 1,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
              }}
            >
{`User u = new User();
u.score = -999;`}
            </Box>

            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
              本来ありえない値でも、外から自由に代入できてしまいます。
              これは<strong>バグや不正な状態</strong>の原因になります。
            </Typography>
          </Card>
        </>
        )}
        {isComponentType("step-2", componentType) && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            private でフィールドを隠そう
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            フィールドに <strong>private</strong> を付けると、
            <strong>クラスの外から直接触れなく</strong>なります。
          </Typography>

          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              例：フィールドを private にする
            </Typography>

            <Box
              component="pre"
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                mt: 1,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
              }}
            >
{`class User {
  private int score;
}`}
            </Box>

            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
              この状態では、main など<strong>クラスの外</strong>から
              <code>score</code> を直接書き換えることはできません。
              <br />
              つまり、「勝手に触られない箱」を作れます。
            </Typography>
          </Card>
        </>
        )}
        {isComponentType("step-3", componentType) && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            メソッド経由で操作する
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            <strong>private なフィールド</strong>は、
            <strong>public なメソッド</strong>を通して操作します。
            <br />
            これにより「許可した操作だけ」を外から使わせられます。
          </Typography>

          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              例：score を増やす操作だけを公開する
            </Typography>

            <Box
              component="pre"
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                mt: 1,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
              }}
            >
{`class User {
  private int score;

  public void addScore(int value) {
    score += value;
  }
}`}
            </Box>

            <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
              外からは <code>score</code> を直接触れませんが、
              <br />
              <code>addScore</code> を使えば「正しい増やし方」だけができます。
            </Typography>
          </Card>
        </>
        )}
        {isComponentType("step-4", componentType) && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            設計としての意味
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            <strong>public / private</strong> は、
            文法というより<strong>設計の考え方</strong>です。
          </Typography>

          <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              private の役割
            </Typography>

            <Typography variant="body2">
              private は<strong>「守るため」</strong>のもの。
              <br />
              クラスの中身を、外から勝手に壊されないようにします。
            </Typography>
          </Card>

          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              public の役割
            </Typography>

            <Typography variant="body2">
              public は<strong>「使わせるため」</strong>のもの。
              <br />
              クラスの外に対して、「この使い方ならOK」という入口を用意します。
            </Typography>
          </Card>

          <Typography
            variant="body2"
            sx={{ mt: 3, color: "text.secondary" }}
          >
            👉 「全部見せる」のではなく、
            <br />
            <strong>「必要なものだけ見せる」</strong>のが良いクラス設計です。
          </Typography>
        </>
        )}
    </Box>
  );
};
