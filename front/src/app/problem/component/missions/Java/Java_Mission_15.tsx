"use client";

import {
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Java_Mission_15 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
            <>
            <Typography variant="h6" sx={{ mb: 2 }}>
                このミッションでできるようになること
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
                クラスの中に「処理（メソッド）」を書き、main では
                処理の流れだけを組み立てる書き方を学びます。
            </Typography>

            {/* ===== クラス側の役割 ===== */}
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                クラスが担当すること
                </Typography>

                <List dense>
                <ListItem>
                    <ListItemText primary="データ（フィールド）を持つ" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="そのデータを使った処理を書く" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="表示や計算の詳細を隠す" />
                </ListItem>
                </List>
            </Card>

            {/* ===== main の役割 ===== */}
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                main メソッドが担当すること
                </Typography>

                <List dense>
                <ListItem>
                    <ListItemText primary="インスタンスを作る（new）" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="値を設定する" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="メソッドを呼び出す" />
                </ListItem>
                </List>
            </Card>
            </>
        )}
        {isComponentType("step-1", componentType) && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            クラスの中のメソッドとは？
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            クラスの中に書いたメソッドは、そのクラスが持つフィールドを
            そのまま使うことができます。
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="フィールド = クラスの持ち物" />
            </ListItem>
            <ListItem>
              <ListItemText primary="メソッド = その持ち物を使った処理" />
            </ListItem>
            <ListItem>
              <ListItemText primary="同じクラスの中なので、引数で渡す必要がない" />
            </ListItem>
          </List>

          <Box
            component="pre"
            sx={{
              mt: 2,
              fontSize: 13,
              bgcolor: "#fafafa",
              p: 1.5,
              borderRadius: 1
            }}
          >
{`class Player {
  String name;
  int hp;

  void showStatus() {
    // 同じクラスのフィールドなので、そのまま使える
    System.out.println(name + " : " + hp);
  }
}`}
          </Box>

          <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
            ※ name や hp は showStatus の引数ではありませんが、同じクラス内なので参照できます
          </Typography>
        </Card>
        )}
        {isComponentType("step-2", componentType) && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            インスタンスからメソッドを呼ぶ
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            クラスに書いたメソッドは、new で作ったインスタンスに対して
            呼び出します。
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="new ＝ クラスの箱を1つ作る" />
            </ListItem>
            <ListItem>
              <ListItemText primary=".メソッド名() ＝ その箱に命令する" />
            </ListItem>
            <ListItem>
              <ListItemText primary="インスタンスが違えば、結果も変わる" />
            </ListItem>
          </List>

          <Box
            component="pre"
            sx={{
              mt: 2,
              fontSize: 13,
              bgcolor: "#fafafa",
              p: 1.5,
              borderRadius: 1
            }}
          >
{`Player p = new Player();
p.name = "Hero";
p.hp = 30;

// この箱 p に対して命令している
p.showStatus();`}
          </Box>

          <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
            ※ showStatus() は Player クラスの中に定義されたメソッドです
          </Typography>
        </Card>
        )}
        {isComponentType("step-3", componentType) && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            this は「このインスタンス自身」
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            メソッドの引数とフィールドの名前が同じとき、
            this を使って区別します。
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="this.フィールド名 → この箱の中の変数" />
            </ListItem>
            <ListItem>
              <ListItemText primary="引数名 → メソッドに渡された値" />
            </ListItem>
            <ListItem>
              <ListItemText primary="this を付けないと区別できない" />
            </ListItem>
          </List>

          <Box
            component="pre"
            sx={{
              mt: 2,
              fontSize: 13,
              bgcolor: "#fafafa",
              p: 1.5,
              borderRadius: 1
            }}
          >
{`class Character {
  int level;

  void setLevel(int level) {
    // 左：フィールド（箱の中）
    // 右：引数（受け取った値）
    this.level = level;
  }
}`}
          </Box>

          <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
            ※ this を付けないと「どちらの level か」が分からなくなります
          </Typography>
        </Card>
        )}
        {isComponentType("step-4", componentType) && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            main は「流れ」だけを書く
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            main メソッドでは、細かい処理を書かず、
            「何をするかの順番」だけを書くようにします。
          </Typography>

          <List dense>
            <ListItem>
              <ListItemText primary="① new する（箱を用意）" />
            </ListItem>
            <ListItem>
              <ListItemText primary="② 値を設定する（メソッドに任せる）" />
            </ListItem>
            <ListItem>
              <ListItemText primary="③ 表示・実行する（メソッドを呼ぶ）" />
            </ListItem>
          </List>

          <Box
            component="pre"
            sx={{
              mt: 2,
              fontSize: 13,
              bgcolor: "#fafafa",
              p: 1.5,
              borderRadius: 1
            }}
          >
{`public class Main {
  public static void main(String[] args) {
    Character c = new Character();
    c.setLevel(10);
    c.showName();
  }
}`}
          </Box>

          <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
            ※ main に println や計算処理が増え始めたら、設計を見直そう
          </Typography>
        </Card>
        )}
    </Box>
  );
};
