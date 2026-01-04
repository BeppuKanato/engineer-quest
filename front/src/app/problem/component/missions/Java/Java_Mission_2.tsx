"use client";

import { Box, Typography, Card } from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";

export const Java_Mission_2 = ({ componentType }: MissionComponentProps) => {
    return (
        <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
            {/* === プレビューUI（ミッション開始前） === */}
            {isComponentType("", componentType) && (
                <>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                    このミッションのゴール
                </Typography>

                <Typography sx={{ mb: 2 }}>
                    print と println を使い分けて、
                    <b>出力の形を自分で整えられる</b>ようになることが目標です。
                </Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    出力される完成イメージ
                </Typography>

                <Card
                    sx={{
                    p: 2,
                    backgroundColor: "#111",
                    color: "#0f0",
                    fontFamily: "monospace",
                    whiteSpace: "pre-line",
                    }}
                >
                    {`=== STATUS ===
                        HP: 30
                        MP: 12`
                    }
                </Card>
                </>
            )}
            {isComponentType("step-1-1", componentType) && (
            <>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                print と println の出力結果の違い
                </Typography>

                <Typography sx={{ mb: 2 }}>
                同じ文字を出力しても、<b>改行があるかどうか</b>で結果が変わります。
                </Typography>

                <Box sx={{ display: "flex", gap: 2 }}>
                {/* print + println */}
                <Card sx={{ flex: 1, p: 2 }}>
                    <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                    print → println
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                    使用するコード
                    </Typography>

                    <Card
                    sx={{
                        p: 1,
                        mb: 2,
                        backgroundColor: "#f5f5f5",
                        fontFamily: "monospace",
                        fontSize: 14,
                    }}
                    >
                        {`System.out.print("A");
                        System.out.println("B");`}
                    </Card>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                    出力結果
                    </Typography>

                    <Card
                    sx={{
                        p: 1,
                        backgroundColor: "#111",
                        color: "#0f0",
                        fontFamily: "monospace",
                        whiteSpace: "pre-line",
                    }}
                    >
                        AB
                    </Card>
                </Card>

                {/* println + println */}
                <Card sx={{ flex: 1, p: 2 }}>
                    <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                    println → println
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                    使用するコード
                    </Typography>

                    <Card
                    sx={{
                        p: 1,
                        mb: 2,
                        backgroundColor: "#f5f5f5",
                        fontFamily: "monospace",
                        fontSize: 14,
                    }}
                    >
                        {`System.out.println("A");
                        System.out.println("B");`}
                    </Card>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        出力結果
                    </Typography>

                    <Card
                    sx={{
                        p: 1,
                        backgroundColor: "#111",
                        color: "#0f0",
                        fontFamily: "monospace",
                        whiteSpace: "pre-line",
                    }}
                    >
                        {`A
                        B`}
                    </Card>
                </Card>
                </Box>

                <Typography sx={{ mt: 2 }}>
                    <b>println は出力後に改行</b>、<b>print は改行しない</b>。
                    これを使い分けることで、出力の形をコントロールできます。
                </Typography>
            </>
            )}
            {isComponentType("step-2-1", componentType) && (
            <>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                ラベルを付けると、出力は「情報」になる
                </Typography>

                <Typography sx={{ mb: 2 }}>
                数値だけを出力すると意味が分かりづらいですが、
                <b>ラベルを付けるだけ</b>で一気に読みやすくなります。
                </Typography>

                <Box sx={{ display: "flex", gap: 2 }}>
                {/* ラベルなし */}
                <Card sx={{ flex: 1, p: 2 }}>
                    <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                    ラベルなし出力
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                    使用するコード
                    </Typography>

                    <Card
                    sx={{
                        p: 1,
                        mb: 2,
                        backgroundColor: "#f5f5f5",
                        fontFamily: "monospace",
                        fontSize: 14,
                    }}
                    >
                        {`System.out.println(30);
                        System.out.println(12);`}
                    </Card>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                    出力結果
                    </Typography>

                    <Card
                    sx={{
                        p: 1,
                        backgroundColor: "#111",
                        color: "#0f0",
                        fontFamily: "monospace",
                        whiteSpace: "pre-line",
                    }}
                    >
                        {`30
                        12`}
                    </Card>
                </Card>

                {/* ラベル付き */}
                <Card sx={{ flex: 1, p: 2 }}>
                    <Typography sx={{ fontWeight: "bold", mb: 1 }}>
                    ラベル付き出力
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                    使用するコード
                    </Typography>

                    <Card
                    sx={{
                        p: 1,
                        mb: 2,
                        backgroundColor: "#f5f5f5",
                        fontFamily: "monospace",
                        fontSize: 14,
                    }}
                    >
                        {`System.out.print("HP: ");
                        System.out.println(30);
                        System.out.print("MP: ");
                        System.out.println(12);`}
                    </Card>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                    出力結果
                    </Typography>

                    <Card
                    sx={{
                        p: 1,
                        backgroundColor: "#111",
                        color: "#0f0",
                        fontFamily: "monospace",
                        whiteSpace: "pre-line",
                    }}
                    >
                        {`HP: 30
                        MP: 12`}
                    </Card>
                </Card>
                </Box>

                <Typography sx={{ mt: 2 }}>
                このように、<b>「何の値か」を文字で補足する</b>だけで、
                出力はデバッグや確認に使えるログになります。
                </Typography>
            </>
            )}

            {/* === ここから下に step 用の説明UIを追加していく === */}
        </Box>
    );
};
