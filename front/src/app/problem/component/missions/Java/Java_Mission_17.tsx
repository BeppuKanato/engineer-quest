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

export const Java_Mission_17 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
            実行イメージ
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            このミッションでは、コンストラクタを使って
            <strong>「最初から正しい状態のオブジェクト」</strong>
            を作ります。以下はその動作例です。
            </Typography>

            {/* ===== ケース1：コンストラクタを使わない場合 ===== */}
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース①：初期化を後回しにした場合
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                コード例
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
// name や score を代入し忘れる可能性がある`}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" color="text.secondary">
                → 値の代入忘れによるバグが起きやすい
            </Typography>
            </Card>

            {/* ===== ケース2：コンストラクタを使う場合 ===== */}
            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース②：コンストラクタを使った場合
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                入力例（new 時）
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="name：Kana" />
                </ListItem>
                <ListItem>
                <ListItemText primary="score：80" />
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
{`Kana : 80`}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" color="text.secondary">
                → new した瞬間に、必ず正しい状態で使える
            </Typography>
            </Card>
        </>
        )}
        {/* ================= step-1 説明UI ================= */}
        {isComponentType("step-1", componentType) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
            なぜ初期化が問題になるのか？
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            new した直後のオブジェクトは、まだ中身が揃っていないことがあります。
            この状態で使うと、バグの原因になります。
            </Typography>

            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ❌ 危険な例：初期化を後回しにする
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
        // name や score がまだ入っていない

        u.showInfo(); // 想定外の表示やエラーの原因`}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                → 値を入れ忘れたまま使ってしまう可能性がある
            </Typography>
            </Card>

            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ポイント
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="new しただけでは、オブジェクトは未完成のことがある" />
                </ListItem>
                <ListItem>
                <ListItemText primary="代入忘れは、人間が必ずやるミス" />
                </ListItem>
                <ListItem>
                <ListItemText primary="これを防ぐ仕組みが『コンストラクタ』" />
                </ListItem>
            </List>
            </Card>
        </>
        )}
        {/* ================= step-2 説明UI ================= */}
        {isComponentType("step-2", componentType) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
            コンストラクタとは？
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            コンストラクタは <strong>new した瞬間に自動で呼ばれる特別なメソッド</strong> です。
            オブジェクトを「最初から正しい状態」にするために使います。
            </Typography>

            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                コンストラクタの特徴
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="クラス名と同じ名前を持つ" />
                </ListItem>
                <ListItem>
                <ListItemText primary="戻り値（void など）は書かない" />
                </ListItem>
                <ListItem>
                <ListItemText primary="new した瞬間に必ず1回呼ばれる" />
                </ListItem>
            </List>
            </Card>

            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                例：User クラスのコンストラクタ
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
        String name;
        int score;

        User(String name, int score) {
            this.name = name;
            this.score = score;
        }
        }`}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                → new User(...) したときに、この処理が自動で実行される
            </Typography>
            </Card>

            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ここが重要
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="コンストラクタがあると、初期化忘れが起きない" />
                </ListItem>
                <ListItem>
                <ListItemText primary="「正しい状態のオブジェクト」しか作れなくなる" />
                </ListItem>
                <ListItem>
                <ListItemText primary="設計として安全になる" />
                </ListItem>
            </List>
            </Card>
        </>
        )}
        {/* ================= step-3 説明UI ================= */}
        {isComponentType("step-3", componentType) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
            コンストラクタを使う設計のメリット
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            コンストラクタは「楽に書くため」ではなく、
            <strong>安全な状態しか作れないようにするため</strong>の仕組みです。
            </Typography>

            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                代入方式の問題点
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
u.name = "Kana";
// score を代入し忘れた…`}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                → 「途中までしか設定されていない状態」が簡単に作れてしまう
            </Typography>
            </Card>

            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                コンストラクタ方式の安心感
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
{`User u = new User("Kana", 80);`}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                → 必要な情報を渡さない限り、new できない
            </Typography>
            </Card>

            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                設計として何が嬉しい？
            </Typography>

            <List dense>
                <ListItem>
                <ListItemText primary="不完全なオブジェクトを作れない" />
                </ListItem>
                <ListItem>
                <ListItemText primary="クラスの使い方が自然に決まる" />
                </ListItem>
                <ListItem>
                <ListItemText primary="バグの原因を設計段階で潰せる" />
                </ListItem>
            </List>
            </Card>

            <Typography variant="body2" sx={{ mt: 3, color: "text.secondary" }}>
            この考え方は、次のミッションで扱う
            <strong>「private にして守る設計」</strong>につながります。
            </Typography>
        </>
        )}
    </Box>
  );
};
