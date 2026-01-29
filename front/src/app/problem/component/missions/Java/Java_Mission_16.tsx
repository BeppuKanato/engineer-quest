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

export const Java_Mission_16 = ({ componentType }: MissionComponentProps) => {
  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
        {isComponentType("", componentType) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
            実行イメージ
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            クラスのインスタンスを配列に入れて、for 文でまとめて処理します。
            new されていない要素（null）は表示されません。
            </Typography>

            {/* ===== ケース1：2人分いる場合 ===== */}
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース①：2人分のユーザがいる場合
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                配列の状態
            </Typography>
            <List dense>
                <ListItem>
                <ListItemText primary="users[0]：User(name = &quot;A&quot;)" />
                </ListItem>
                <ListItem>
                <ListItemText primary="users[1]：User(name = &quot;B&quot;)" />
                </ListItem>
                <ListItem>
                <ListItemText primary="users[2]：null" />
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
{`A
B`}
            </Box>
            </Card>

            {/* ===== ケース2：1人だけの場合 ===== */}
            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                ケース②：1人分だけ new した場合
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>
                配列の状態
            </Typography>
            <List dense>
                <ListItem>
                <ListItemText primary="users[0]：User(name = &quot;Solo&quot;)" />
                </ListItem>
                <ListItem>
                <ListItemText primary="users[1]：null" />
                </ListItem>
                <ListItem>
                <ListItemText primary="users[2]：null" />
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
{`Solo`}
            </Box>
            </Card>
        </>
        )}
        {isComponentType("step-1", componentType) && (
        <>
            <Typography variant="h6" sx={{ mb: 2 }}>
            クラスの配列って、何ができている？
            </Typography>

            <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
            クラスの配列を作っても、<b>インスタンスはまだ1つもできていません。</b>
            <br />
            ここは多くの人が勘違いしやすいポイントです。
            </Typography>

            {/* ===== 配列宣言 ===== */}
            <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                配列を作るコード
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
{`Character[] party = new Character[3];`}
            </Box>

            <List dense sx={{ mt: 1 }}>
                <ListItem>
                <ListItemText primary="Character 型の箱を3つ分、並べただけ" />
                </ListItem>
                <ListItem>
                <ListItemText primary="この時点では、Character はまだ作られていない" />
                </ListItem>
            </List>
            </Card>

            {/* ===== null の説明 ===== */}
            <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                中身はどうなっている？
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
                配列を作った直後の中身は、すべて <b>null</b> です。
                <br />
                null は「何も入っていない」という意味。
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
{`party[0] = null
party[1] = null
party[2] = null`}
            </Box>

            <List dense sx={{ mt: 1 }}>
                <ListItem>
                <ListItemText primary="配列のサイズ ＝ インスタンスの数 ではない" />
                </ListItem>
                <ListItem>
                <ListItemText primary="使う前に、それぞれ new する必要がある" />
                </ListItem>
            </List>
            </Card>

            <Typography variant="body2" sx={{ mt: 2 }}>
            👉 次のステップで、<b>new して本当に中身を入れる</b>やり方を見ていこう。
            </Typography>
        </>
        )}
        {isComponentType("step-2", componentType) && (
            <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                new して、配列に中身を入れる
                </Typography>

                <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
                配列は「置き場所」でした。
                <br />
                <b>new したインスタンスを代入して、初めて使える状態</b>になります。
                </Typography>

                {/* ===== インスタンス代入 ===== */}
                <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    インスタンスを配列に入れる
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
{`party[0] = new Character();
party[1] = new Character();`}
                </Box>

                <List dense sx={{ mt: 1 }}>
                    <ListItem>
                    <ListItemText primary="new Character() で実体（インスタンス）を作る" />
                    </ListItem>
                    <ListItem>
                    <ListItemText primary="それを party[0], party[1] に入れている" />
                    </ListItem>
                    <ListItem>
                    <ListItemText primary="この要素は、もう null ではない" />
                    </ListItem>
                </List>
                </Card>

                {/* ===== before / after の対比 ===== */}
                <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    new 前と後の違い
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
{`// new 前
party[0] = null

// new 後
party[0] = Character インスタンス`}
                </Box>

                <List dense sx={{ mt: 1 }}>
                    <ListItem>
                    <ListItemText primary="new 前は、触ろうとするとエラーになる" />
                    </ListItem>
                    <ListItem>
                    <ListItemText primary="new 後は、フィールドやメソッドを使える" />
                    </ListItem>
                </List>
                </Card>

                {/* ===== 超重要ポイント ===== */}
                <Card
                variant="outlined"
                sx={{ p: 2, borderColor: "warning.main", bgcolor: "#fffaf0" }}
                >
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    ⚠ 超重要ポイント
                </Typography>

                <List dense>
                    <ListItem>
                    <ListItemText primary="配列を作っただけでは、インスタンスは存在しない" />
                    </ListItem>
                    <ListItem>
                    <ListItemText primary="使う前に、必ず new されているか確認する" />
                    </ListItem>
                    <ListItem>
                    <ListItemText primary="ここを忘れると null エラーが出る" />
                    </ListItem>
                </List>
                </Card>

                <Typography variant="body2" sx={{ mt: 2 }}>
                👉 次は、<b>for 文で全員に同じ処理をする</b>やり方を見ていこう。
                </Typography>
            </>
        )}
    </Box>
  );
};
