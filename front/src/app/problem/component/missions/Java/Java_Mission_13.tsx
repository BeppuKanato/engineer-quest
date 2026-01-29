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

export const Java_Mission_13 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
            <Typography variant="h6" gutterBottom>
            このミッションでやること
            </Typography>

            <List>
            <ListItem>
                <ListItemText primary="① メソッドに値（引数）を渡す" />
            </ListItem>
            <ListItem>
                <ListItemText primary="② メソッド内で計算する" />
            </ListItem>
            <ListItem>
                <ListItemText primary="③ 計算結果（戻り値）を受け取る" />
            </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
            動作イメージ（例①）
            </Typography>

            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="body2">
                入力：
            </Typography>
            <List dense>
                <ListItem>
                <ListItemText primary="price = 120" />
                </ListItem>
                <ListItem>
                <ListItemText primary="count = 3" />
                </ListItem>
            </List>

            <Typography variant="body2">
                処理：
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
                total(price, count) → 120 × 3
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
                出力：
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
                360
            </Typography>
            </Card>

            <Typography variant="subtitle1" gutterBottom>
            動作イメージ（例②）
            </Typography>

            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="body2">
                入力：
            </Typography>
            <List dense>
                <ListItem>
                <ListItemText primary="price = 500" />
                </ListItem>
                <ListItem>
                <ListItemText primary="count = 2" />
                </ListItem>
            </List>

            <Typography variant="body2">
                処理：
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
                total(price, count) → 500 × 2
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
                出力：
            </Typography>
            <Typography variant="body2" sx={{ ml: 2 }}>
                1000
            </Typography>
            </Card>
        </>
        )}
        {isComponentType("step-1", componentType) && (
        <>
            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
                引数って何？
            </Typography>

            <Typography variant="body2" sx={{ mb: 1 }}>
                引数（ひきすう）は、<b>メソッドの中でだけ使える専用の変数</b>です。
                メソッドを呼び出すときに、外から値を渡します。
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
                main の中で作った変数とは別物で、<br />
                <b>引数はそのメソッドの中でしか使えません。</b>
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
                例：名前を受け取るメソッド
            </Typography>

            <Card
                variant="outlined"
                sx={{ p: 1.5, mb: 2, backgroundColor: "#fafafa" }}
            >
                <Typography
                variant="body2"
                component="pre"
                sx={{ fontFamily: "monospace", m: 0 }}
                >
{`static void greet(String name) {
  System.out.println("Hello " + name);
}`}
                </Typography>
            </Card>

            <List dense>
                <ListItem>
                <ListItemText primary="name は greet メソッド専用の変数" />
                </ListItem>
                <ListItem>
                <ListItemText primary="main から値を渡すと、その値が name に入る" />
                </ListItem>
                <ListItem>
                <ListItemText primary="greet の外では name は使えない" />
                </ListItem>
            </List>

            <Typography variant="body2" sx={{ mt: 1 }}>
                👉 引数は「メソッドに渡すための入口」と考えると分かりやすい。
            </Typography>
            </Card>
        </>
        )}
        {isComponentType("step-2", componentType) && (
        <>
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            戻り値って何？
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            戻り値は、<b>メソッドの処理結果を呼び出し元に返す仕組み</b>です。
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            これまでの <b>void</b> メソッドは「実行するだけ」で、
            値を返しませんでした。
            <br />
            値を返したい場合は、<b>戻り値の型</b>を指定します。
          </Typography>

          <Typography variant="subtitle2" gutterBottom>
            例：計算結果を返すメソッド
          </Typography>

          <Card
            variant="outlined"
            sx={{ p: 1.5, mb: 2, backgroundColor: "#fafafa" }}
          >
            <Typography
              variant="body2"
              component="pre"
              sx={{ fontFamily: "monospace", m: 0 }}
            >
{`static int add(int a, int b) {
  return a + b;
}`}
            </Typography>
          </Card>

          <List dense>
            <ListItem>
              <ListItemText primary="int は『このメソッドは整数を返す』という宣言" />
            </ListItem>
            <ListItem>
              <ListItemText primary="return の後ろの値が、呼び出し元に返される" />
            </ListItem>
            <ListItem>
              <ListItemText primary="return が実行された時点でメソッドは終了する" />
            </ListItem>
          </List>

          <Typography variant="body2" sx={{ mt: 1 }}>
            👉 戻り値は「計算結果を外に渡す出口」と考えると分かりやすい。
          </Typography>
        </Card>
        </>
        )}
        {isComponentType("step-3", componentType) && (
        <>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              引数と戻り値を組み合わせると？
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
              引数と戻り値を組み合わせることで、メソッドは
              <b>「値を受け取って、結果を返す部品」</b>になります。
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              処理の流れ
            </Typography>

            <List dense>
              <ListItem>
                <ListItemText primary="① main から値を渡す（引数）" />
              </ListItem>
              <ListItem>
                <ListItemText primary="② メソッド内で計算する" />
              </ListItem>
              <ListItem>
                <ListItemText primary="③ 結果を戻り値として返す" />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              例：計算メソッドを使う
            </Typography>

            <Card
              variant="outlined"
              sx={{ p: 1.5, mb: 2, backgroundColor: "#fafafa" }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{ fontFamily: "monospace", m: 0 }}
              >
{`static int add(int a, int b) {
  return a + b;
}

public static void main(String[] args) {
  int result = add(3, 5);
  System.out.println(result);
}`}
              </Typography>
            </Card>

            <List dense>
              <ListItem>
                <ListItemText primary="add(3, 5) で a=3, b=5 が渡される" />
              </ListItem>
              <ListItem>
                <ListItemText primary="return a + b の結果（8）が返される" />
              </ListItem>
              <ListItem>
                <ListItemText primary="戻り値は result に代入され、普通の値として使える" />
              </ListItem>
            </List>

            <Typography variant="body2" sx={{ mt: 1 }}>
              👉 これで「値を渡す → 処理する → 結果を受け取る」が
              <b>1 本の流れ</b>として完成します。
            </Typography>
          </Card>
        </>
      )}
    </Box>
  );
};
