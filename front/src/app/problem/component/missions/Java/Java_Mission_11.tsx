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

export const Java_Mission_11 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
            <>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                このミッションでやること
            </Typography>

            <Card sx={{ p: 2, mb: 3 }}>
                <Typography sx={{ mb: 1 }}>
                ここでは <b>配列</b> と <b>for文</b> を組み合わせて、
                <br />
                データをまとめて処理する方法を学びます。
                </Typography>

                <Typography variant="body2" color="text.secondary">
                配列の中身を1つずつ取り出して処理するのが、このミッションのテーマです。
                </Typography>
            </Card>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
                なぜ for と配列を組み合わせるの？
            </Typography>

            <Card sx={{ p: 2, mb: 3 }}>
                <List>
                <ListItem>
                    <ListItemText
                    primary="配列の要素数が分からなくても処理できる"
                    secondary="length を使えば、何個あっても同じ書き方でOK"
                    />
                </ListItem>

                <ListItem>
                    <ListItemText
                    primary="同じ処理を何度も書かなくていい"
                    secondary="println を何行も書く必要がなくなる"
                    />
                </ListItem>

                <ListItem>
                    <ListItemText
                    primary="後から要素が増えてもコードを直さなくていい"
                    secondary="配列の中身が変わっても安全に動く"
                    />
                </ListItem>
                </List>
            </Card>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>
                このミッションを終えると
            </Typography>

            <Card sx={{ p: 2 }}>
                <List>
                <ListItem>
                    <ListItemText primary="配列の全要素を for で順番に処理できる" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="合計や平均を計算できるようになる" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="データをまとめて扱う感覚が身につく" />
                </ListItem>
                </List>
            </Card>
            </>
        )}
        {isComponentType("step-1", componentType) && (
        <>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            配列を for で回すとは？
          </Typography>

          <Card sx={{ p: 2, mb: 3 }}>
            <Typography sx={{ mb: 1 }}>
              配列の中身は <b>0 番目から順番</b> に並んでいます。
            </Typography>
            <Typography variant="body2" color="text.secondary">
              for文を使うと、先頭から最後までを自動で順番に処理できます。
            </Typography>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            for文と length の関係
          </Typography>

          <Card sx={{ p: 2, mb: 3 }}>
            <List>
              <ListItem>
                <ListItemText
                  primary="i = 0"
                  secondary="配列の最初の要素（scores[0]）から始める"
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="i < scores.length"
                  secondary="配列の最後の要素まで自動で繰り返す"
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="i++"
                  secondary="次の要素へ1つずつ進む"
                />
              </ListItem>
            </List>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            なぜ length を使うと安心？
          </Typography>

          <Card sx={{ p: 2 }}>
            <List>
              <ListItem>
                <ListItemText
                  primary="配列の要素数が変わってもコードを直さなくていい"
                  secondary="要素が増えても減っても、for文が自動で対応する"
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="範囲外アクセスを防げる"
                  secondary="存在しない番号を参照してエラーになるのを防ぐ"
                />
              </ListItem>
            </List>
          </Card>
        </>
        )}
        {isComponentType("step-2", componentType) && (
        <>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            配列の合計と平均はどうやって作る？
            </Typography>

            <Card sx={{ p: 2, mb: 3 }}>
            <Typography sx={{ mb: 1 }}>
                合計を出すときは、<b>入れ物（変数）を先に用意</b>しておく。
            </Typography>
            <Typography variant="body2" color="text.secondary">
                for文の中では「足す」だけ。計算の準備は外で行う。
            </Typography>
            </Card>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
            sum += scores[i] の意味
            </Typography>

            <Card sx={{ p: 2, mb: 3 }}>
            <List>
                <ListItem>
                <ListItemText
                    primary="sum = sum + scores[i]"
                    secondary="今までの合計に、今回の点数を足す"
                />
                </ListItem>

                <ListItem>
                <ListItemText
                    primary="+= は省略記法"
                    secondary="同じ意味を、短く・読みやすく書ける"
                />
                </ListItem>
            </List>
            </Card>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
            なぜ平均は for の外で計算する？
            </Typography>

            <Card sx={{ p: 2 }}>
            <List>
                <ListItem>
                <ListItemText
                    primary="for の中では合計を作るだけ"
                    secondary="途中の値で平均を出しても意味がない"
                />
                </ListItem>

                <ListItem>
                <ListItemText
                    primary="全部足し終わってから割る"
                    secondary="sum ÷ scores.length で正しい平均になる"
                />
                </ListItem>
            </List>
            </Card>
        </>
        )}
    </Box>
  );
};
