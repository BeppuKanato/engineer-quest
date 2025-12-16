import { Box, Button, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useState } from "react";
import { isComponentType, MissionComponentProps } from "../common/common";

export const Mission_5 = ({ componentType }: MissionComponentProps) => {

    const [step4_1Clicked, setSetp4_1Clicked] = useState<boolean>(false);
    const [step4ExamClicked, setStep4ExamClicked] = useState<boolean>(false);
    return(
        <Box
            sx={{
                p: 3,
                maxWidth: 700,
                mx: "auto",
            }}
        >
            {isComponentType("", componentType) && (
                <>
                    <Typography sx={{ mb: 2 }}>
                        このレッスンでは、<strong>JavaScript</strong>を使って
                        HTMLの要素を操作し、ページに動きを加えます。  
                        ボタンを押したら文字が変わる、色が変わるなど、
                        「動的な処理」を体験していきましょう。
                    </Typography>

                    <Typography variant="h6" sx={{ mb: 1 }}>
                        💡 今回扱う内容
                    </Typography>

                    <List dense>
                        <ListItem>
                        <ListItemText primary="・DOMの基本構造と要素の取得（getElementById / querySelector）" />
                        </ListItem>
                        <ListItem>
                        <ListItemText primary="・テキストやスタイルの変更（innerText / style）" />
                        </ListItem>
                        <ListItem>
                        <ListItemText primary="・クリックや入力などのイベント処理（addEventListener）" />
                        </ListItem>
                        <ListItem>
                        <ListItemText primary="・要素操作とイベントを組み合わせた動きのあるページ作成" />
                        </ListItem>
                        <ListItem>
                        <ListItemText primary="・動的なUIの基礎（ボタンで色変更・テキスト変更など）" />
                        </ListItem>
                    </List>
                </>
            )}
            {isComponentType("step-2-1", componentType) && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    🧩 変更前
                </Typography>
                <Box
                    sx={{
                    p: 2,
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    width: 200,
                    textAlign: "center",
                    }}
                >
                    <Typography id="title-before">タイトル</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                    ➡️ innerTextで変更後
                </Typography>
                <Box
                    sx={{
                    p: 2,
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    width: 200,
                    textAlign: "center",
                    bgcolor: "rgba(25,118,210,0.05)",
                    }}
                >
                    <Typography id="title-after">
                    こんにちは！
                    </Typography>
                </Box>
            </Box>
            )}
            {isComponentType("step-2-2", componentType) && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    🎨 変更前
                </Typography>
                <Box
                    sx={{
                    p: 2,
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    width: 200,
                    textAlign: "center",
                    }}
                >
                    <Typography id="title-before">タイトル</Typography>
                </Box>

                <Typography variant="body2" color="text.secondary">
                    ➡️ style.color で変更後
                </Typography>
                <Box
                    sx={{
                    p: 2,
                    border: "1px solid #ccc",
                    borderRadius: 1,
                    width: 200,
                    textAlign: "center",
                    bgcolor: "rgba(25,118,210,0.05)",
                    }}
                >
                    <Typography id="title-after" sx={{ color: "blue" }}>タイトル</Typography>
                </Box>
                </Box>
            )}
            {isComponentType("step-3-exam", componentType) &&
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    🖱 ボタンをクリックしてみましょう
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => alert("ボタンがクリックされました!")}
                >
                    クリックしてね
                </Button>
            </Box> 
            }
            {isComponentType("step-4-1", componentType) && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    🖱 ボタンをクリックして色を変えてみましょう
                </Typography>

                <Button
                    variant="contained"
                    color={step4_1Clicked ? "error" : "primary"}
                    onClick={() => setSetp4_1Clicked(true)}
                >
                    クリックしてね
                </Button>
            </Box>
            )}
            {isComponentType("step-4-exam", componentType) && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Typography 
                        variant="body2" 
                        color={step4ExamClicked ? "error" : "textScondary"}>
                        🖱 ボタンをクリックして色を変えてみましょう
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={() => setStep4ExamClicked(true)}
                    >
                        クリックしてね
                    </Button>
                </Box>
            )}
    </Box>
    )
}