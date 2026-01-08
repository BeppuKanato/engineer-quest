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

export const Java_Mission_12 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
            このミッションでやること
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography sx={{ mb: 2 }}>
              これまで main メソッドの中に全部書いてきた処理を、
              <b>「メソッド」</b>として切り出してみよう。
            </Typography>

            <Typography variant="body2" color="text.secondary">
              同じ処理を何度も書かなくてよくなり、コードが読みやすくなる。
              これが「設計」の第一歩。
            </Typography>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>
            できるようになること
          </Typography>

          <Card sx={{ p: 2 }}>
            <List>
              <ListItem>
                <ListItemText
                  primary="処理をメソッドとして定義できる"
                  secondary="println などの処理に名前を付けてまとめる"
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="main からメソッドを呼び出せる"
                  secondary="main には処理の流れだけを書く"
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="static メソッドの役割が分かる"
                  secondary="main と同じクラス内で使うための基本ルールを理解する"
                />
              </ListItem>

              <ListItem>
                <ListItemText
                  primary="main が短く・読みやすくなる"
                  secondary="長くなりがちな main を整理できる"
                />
              </ListItem>
            </List>
          </Card>
        </>
        )}
        {isComponentType("step-1", componentType) && (
        <>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            メソッドは「処理に名前をつけたもの」
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography sx={{ mb: 2 }}>
              メソッドとは、<b>よく使う処理をひとまとめにした部品</b>です。
              同じ処理を何度も書かずに、名前で呼び出せるようになります。
            </Typography>

            <Typography variant="body2" color="text.secondary">
              println を毎回書く代わりに、「表示する処理」としてまとめるイメージです。
            </Typography>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            メソッドの形を分解してみよう
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                backgroundColor: "#f5f5f5",
                p: 2,
                borderRadius: 1,
                mb: 2
              }}
            >
{`static void hello() {
  System.out.println("Hello");
}`}
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="static"
                  secondary="main メソッドから直接呼び出すために必要"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="void"
                  secondary="戻り値がない（何も返さない）"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="hello"
                  secondary="メソッドの名前（好きな名前を付けられる）"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="{ } の中"
                  secondary="実際に実行される処理を書く場所"
                />
              </ListItem>
            </List>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            なぜ static が必要？
          </Typography>

          <Card sx={{ p: 3 }}>
            <Typography sx={{ mb: 2 }}>
              main メソッドは <b>static</b> として定義されています。
              そのため、同じクラス内で main から呼び出すメソッドも
              <b>static</b> である必要があります。
            </Typography>

            <Typography variant="body2" color="text.secondary">
              ※ クラス設計の詳しい話は後で出てきます。  
              今は「main から呼ぶなら static を付ける」と覚えればOKです。
            </Typography>
          </Card>
        </>
        )}
        {isComponentType("step-2", componentType) && (
        <>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            メソッドは「呼び出して」使う
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography sx={{ mb: 2 }}>
              メソッドは、<b>定義しただけでは実行されません</b>。
              main メソッドの中から <b>名前を書いて呼び出す</b>ことで実行されます。
            </Typography>

            <Typography variant="body2" color="text.secondary">
              println と同じで、「書いた場所から順番に実行」されます。
            </Typography>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            呼び出しの書き方
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                backgroundColor: "#f5f5f5",
                p: 2,
                borderRadius: 1,
                mb: 2
              }}
            >
{`public static void main(String[] args) {
  hello();
}`}
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="hello();"
                  secondary="hello メソッドを実行する命令"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="()"
                  secondary="引数なしで呼び出している（今回は中身なし）"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary=";"
                  secondary="1つの命令の終わりを表す"
                />
              </ListItem>
            </List>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            実行の流れをイメージしよう
          </Typography>

          <Card sx={{ p: 3 }}>
            <Typography sx={{ mb: 2 }}>
              プログラムは、まず <b>main</b> からスタートします。
              途中で <b>hello();</b> に来たら、
              その瞬間に hello メソッドの中身が実行されます。
            </Typography>

            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                backgroundColor: "#f5f5f5",
                p: 2,
                borderRadius: 1
              }}
            >
{`main 開始
↓
hello(); に到達
↓
hello メソッドの中身を実行
↓
main に戻る`}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              ※ main → メソッド → main に戻る、という流れは今後ずっと使います。
            </Typography>
          </Card>
        </>
        )}
              {isComponentType("step-3", componentType) && (
        <>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
            main がスッキリする理由
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography sx={{ mb: 2 }}>
              main メソッドは、<b>プログラムの入口</b>です。
              本来は「何をするプログラムか」が
              <b>上から読んで分かる</b>状態が理想です。
            </Typography>

            <Typography variant="body2" color="text.secondary">
              でも、処理を全部 main に書くと、どんどん読みにくくなります。
            </Typography>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            悪い例：main が長い
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                backgroundColor: "#f5f5f5",
                p: 2,
                borderRadius: 1
              }}
            >
{`public static void main(String[] args) {
  System.out.println("1. Start");
  System.out.println("2. Option");
  System.out.println("3. Exit");
}`}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              出力が増えるほど、main がどんどん膨らみます。
            </Typography>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            良い例：処理をメソッドに分ける
          </Typography>

          <Card sx={{ p: 3, mb: 3 }}>
            <Typography
              component="pre"
              sx={{
                fontFamily: "monospace",
                backgroundColor: "#f5f5f5",
                p: 2,
                borderRadius: 1,
                mb: 2
              }}
            >
{`static void showMenu() {
  System.out.println("1. Start");
  System.out.println("2. Option");
  System.out.println("3. Exit");
}

public static void main(String[] args) {
  showMenu();
}`}
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="main は流れだけを書く"
                  secondary="何をするかが一目で分かる"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="処理の中身はメソッドへ"
                  secondary="後から修正・追加しやすい"
                />
              </ListItem>
            </List>
          </Card>

          <Divider sx={{ my: 3 }} />

          <Card sx={{ p: 3 }}>
            <Typography sx={{ mb: 1 }}>
              この考え方は、今後ずっと使います。
            </Typography>

            <Typography variant="body2" color="text.secondary">
              「main が長くなってきたら、分けられないか？」
              と考える癖を付けよう。
            </Typography>
          </Card>
        </>
      )}
    </Box>
  );
};
