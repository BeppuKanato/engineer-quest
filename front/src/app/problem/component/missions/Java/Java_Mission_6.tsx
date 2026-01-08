"use client";

import { Box, Typography, Card, Button } from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Java_Mission_6 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
            <>
             <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
            ミッションプレビュー
            </Typography>

            <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                このミッションのゴール
                </Typography>

                <Typography sx={{ mb: 2 }}>
                条件によって、実行する処理を切り替えられるようになります。
                </Typography>

                <ul>
                <li>条件が <b>true</b> のときだけ処理を実行できる</li>
                <li><b>if / else</b> を使って処理を分けられる</li>
                <li>数値の比較結果で、表示内容を変えられる</li>
                </ul>

                <Typography variant="h6" sx={{ mt: 3, mb: 1, fontWeight: "bold" }}>
                できるようになること（例）
                </Typography>

                <Box
                sx={{
                    backgroundColor: "#111",
                    color: "#fff",
                    p: 2,
                    borderRadius: 1,
                    fontFamily: "monospace",
                    fontSize: 14
                }}
                >
                Score: 72
                <br />
                合格
                </Box>

                <Typography sx={{ mt: 2 }}>
                点数などの条件によって、<br />
                「合格 / 不合格」のような分岐が書けるようになります。
                </Typography>
            </Card>
            </>
        )}
        {isComponentType("step-1", componentType) && (
          <>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              if は「条件付きスイッチ」
            </Typography>

            <Typography sx={{ mb: 2 }}>
              if は「条件が true のときだけ、中の処理を実行する」仕組みです。
              <br />
              false の場合は、中は <b>一切実行されません</b>。
            </Typography>

            <Typography sx={{ fontWeight: "bold", mb: 1 }}>
              イメージ
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                mb: 3
              }}
            >
              <Button variant="contained" color="success">
                条件 = true
              </Button>
              <Typography>→ 中の処理が実行される</Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                mb: 3
              }}
            >
              <Button variant="contained" color="error">
                条件 = false
              </Button>
              <Typography>→ 中の処理は実行されない</Typography>
            </Box>

            <Typography sx={{ fontWeight: "bold", mb: 1 }}>
              コードの形
            </Typography>

            <Box
              sx={{
                backgroundColor: "#111",
                color: "#fff",
                p: 2,
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: 14
              }}
            >
              if (条件) {"{"}
              <br />
              &nbsp;&nbsp;処理を書く
              <br />
              {"}"}
            </Box>

            <Typography sx={{ mt: 2 }}>
              まずは「条件が true のときだけ実行される」という感覚を掴めばOK。
              <br />
              条件の書き方は、このあと少しずつ増やしていきます。
            </Typography>
          </>
        )}
        {isComponentType("step-2", componentType) && (
          <>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
              else は「条件が false のときの処理」
            </Typography>

            <Typography sx={{ mb: 2 }}>
              if だけだと「true のとき」しか処理を書けません。
              <br />
              else を使うと「false のときの処理」も指定できます。
            </Typography>

            <Typography sx={{ fontWeight: "bold", mb: 1 }}>
              イメージ
            </Typography>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
              <Button variant="contained" color="success">
                条件 = true
              </Button>
              <Typography>→ if の中が実行される</Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
              <Button variant="contained" color="error">
                条件 = false
              </Button>
              <Typography>→ else の中が実行される</Typography>
            </Box>

            <Typography sx={{ fontWeight: "bold", mb: 1 }}>
              コードの形
            </Typography>

            <Box
              sx={{
                backgroundColor: "#111",
                color: "#fff",
                p: 2,
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: 14
              }}
            >
              if (条件) {"{"}
              <br />
              &nbsp;&nbsp;条件が true のときの処理
              <br />
              {"}"} else {"{"}
              <br />
              &nbsp;&nbsp;条件が false のときの処理
              <br />
              {"}"}
            </Box>

            <Typography sx={{ mt: 2 }}>
              if / else を使うと、
              <br />
              <b>「どちらか一方だけが必ず実行される」</b>構造になります。
            </Typography>

            <Typography sx={{ mt: 1 }}>
              これで「合格 / 不合格」「OK / NG」など、
              <br />
              状態によって結果を切り替えられるようになります。
            </Typography>
          </>
        )}
    </Box>
  );
};
