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

export const Java_Mission_14 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {(isComponentType("", componentType)) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
                実行イメージ
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
                このミッションでは、クラスを使って値をまとめて扱います。
                以下は、実際にコードを動かしたときの一例です。
            </Typography>

            {/* ===== ケース①：1つのインスタンス ===== */}
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース①：1つのキャラクターを作る
                </Typography>

                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                設定内容（コード上）
                </Typography>
                <List dense>
                <ListItem>
                    <ListItemText primary="Character クラスを定義" />
                </ListItem>
                <ListItem>
                    <ListItemText primary={`name = \"Alice\"`} />
                </ListItem>
                <ListItem>
                    <ListItemText primary="level = 5" />
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
{`Alice
5`}
                </Box>
            </Card>

            {/* ===== ケース②：複数インスタンス ===== */}
            <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース②：同じクラスから2つ作る
                </Typography>

                <Typography variant="subtitle2" sx={{ mt: 1 }}>
                設定内容（コード上）
                </Typography>
                <List dense>
                <ListItem>
                    <ListItemText primary={`Character a：name = \"Alice\", level = 5`} />
                </ListItem>
                <ListItem>
                    <ListItemText primary={`Character b：name = \"Bob\", level = 8`} />
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
{`Alice
5
Bob
8`}
                </Box>
            </Card>
        </>
        )}
        {isComponentType("step-1", componentType) && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            クラスとフィールドのイメージ
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            クラスは「データをまとめて持つための箱」です。
            この段階では、<b>まだ値は入っていません</b>。
          </Typography>

          {/* ===== クラスの構造 ===== */}
          <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              クラス定義の例
            </Typography>

            <Box
              component="pre"
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
              }}
            >
{`class Character {
  String name;
  int level;
}`}
            </Box>
          </Card>

          {/* ===== フィールド説明 ===== */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              フィールドとは？
            </Typography>

            <List dense>
              <ListItem>
                <ListItemText
                  primary="name / level は「このクラスが持てる情報」を表す"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="この時点では、まだ具体的な値は入っていない"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="値を入れるのは、次のステップで new したあと"
                />
              </ListItem>
            </List>
          </Card>
        </>
        )}
        {(isComponentType("step-2", componentType) || isComponentType("step-3", componentType)) && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            new して、箱に値を入れる
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            クラスは「設計図」でした。
            <b>new を使うと、その設計図から実際の箱（インスタンス）</b>を作れます。
          </Typography>

          {/* ===== new の説明 ===== */}
          <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              インスタンスを作る
            </Typography>

            <Box
              component="pre"
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
              }}
            >
{`Character c = new Character();`}
            </Box>

            <List dense sx={{ mt: 1 }}>
              <ListItem>
                <ListItemText primary="new Character() で箱を1つ作る" />
              </ListItem>
              <ListItem>
                <ListItemText primary="c は、その箱につけた名前（変数）" />
              </ListItem>
            </List>
          </Card>

          {/* ===== フィールド代入 ===== */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              フィールドに値を入れる
            </Typography>

            <Box
              component="pre"
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
              }}
            >
{`c.name = "Alice";
c.level = 5;`}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <List dense>
              <ListItem>
                <ListItemText primary="c.name は「c の中の name」を意味する" />
              </ListItem>
              <ListItem>
                <ListItemText primary=".（ドット）は箱の中にアクセスする記号" />
              </ListItem>
              <ListItem>
                <ListItemText primary="それぞれのフィールドに、別々の値を入れられる" />
              </ListItem>
            </List>
          </Card>
        </>
        )}
        {isComponentType("step-4", componentType) && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            インスタンスはそれぞれ別の箱
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            同じクラスから作っても、new した箱は<strong>全部別物</strong>です。
          </Typography>

          <Card variant="outlined" sx={{ p: 2 }}>
            <Box
              component="pre"
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
              }}
            >
{`Character a = new Character();
a.name = "Alice";

Character b = new Character();
b.name = "Bob";`}
            </Box>

            <List dense sx={{ mt: 1 }}>
              <ListItem>
                <ListItemText primary="a と b は別のインスタンス" />
              </ListItem>
              <ListItem>
                <ListItemText primary="a.name を変えても b.name には影響しない" />
              </ListItem>
              <ListItem>
                <ListItemText primary="同じ設計図でも、中身は独立している" />
              </ListItem>
            </List>
          </Card>
        </>
        )}
        {isComponentType("step-5", componentType) && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            実行用クラスと、データ用クラス
          </Typography>

          <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            Java プログラムは <b>main メソッドから実行</b>されます。
            <br />
            でも、<b>すべてのクラスが main を持つ必要はありません。</b>
          </Typography>

          {/* ===== 役割の分離イメージ ===== */}
          <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              役割の分け方
            </Typography>

            <List dense>
              <ListItem>
                <ListItemText
                  primary="実行用クラス：main を持ち、処理の流れを書く"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="データ用クラス：値（フィールド）をまとめる箱"
                />
              </ListItem>
            </List>
          </Card>

          {/* ===== コード例 ===== */}
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              コード例
            </Typography>

            <Box
              component="pre"
              sx={{
                fontSize: 13,
                lineHeight: 1.6,
                m: 0,
                bgcolor: "#fafafa",
                p: 1.5,
                borderRadius: 1
              }}
            >
{`class Item {
  String name;
  int price;
}

public class Shop {
  public static void main(String[] args) {
    Item item = new Item();
    item.name = "Potion";
    item.price = 50;

    System.out.println(item.name + ": " + item.price);
  }
}`}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <List dense>
              <ListItem>
                <ListItemText
                  primary="Shop クラス：プログラムの実行を担当（main を持つ）"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Item クラス：データをまとめるだけの箱"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="役割を分けることで、構造が分かりやすくなる"
                />
              </ListItem>
            </List>
          </Card>

          <Typography variant="body2" sx={{ mt: 2 }}>
            👉 これが「クラスで役割を分ける」最初の形です。
            <br />
            次のミッションでは、この箱に<b>処理</b>も持たせていきます。
          </Typography>
        </>
      )}
    </Box>
  );
};
