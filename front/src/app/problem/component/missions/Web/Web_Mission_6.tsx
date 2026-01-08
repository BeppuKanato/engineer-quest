import { Box, Button, Input, List, ListItem, Paper, Typography } from "@mui/material";
import { isComponentType, MissionComponentProps } from "../../common/common";
import { useState } from "react";
import { Web_Mission_6_Exam } from "./Web_Mission_6_exam";

export const Web_Mission_6 = ({ componentType }: MissionComponentProps) => {
    const step2_1Taks = ["掃除", "買い物", "勉強"];
    const [step2_2Items, setStep2_2Items] = useState<string[]>(["掃除"])     
    
    const [step_2Examtasks, setStep_2ExamTasks] = useState<string[]>([]);
    const step_2ExamSampleTasks = ["掃除", "買い物", "勉強"];

    const [step3_3Tasks, setStep3_3Tasks] = useState<string[]>([]);
    const [step3_3Input, setStep3_3Input] = useState<string>("");

    const [step4_1Tasks, setStep4_1Tasks] = useState<string[]>(["掃除", "買い物", "勉強"]);
    const step2_2Onclick = () => {
        setStep2_2Items([...step2_2Items, `タスク${step2_2Items.length + 1}`]);
    }

    const handleRender = () => {
        // forEachでリストを生成するイメージ
        setStep_2ExamTasks(step_2ExamSampleTasks);
    };

    const handleStep3_3OnClick = () => {
        setStep3_3Tasks([...step3_3Tasks, step3_3Input]);
        setStep3_3Input("");
    }

    const handleStep3_3OnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStep3_3Input(e.target.value);
    }

    const handleStep4_1OnClick = (index: number) => {
        setStep4_1Tasks(step4_1Tasks.filter((_, i) => i !== index));
    }

    return(
        <Box
            sx={{
                p: 3,
                maxWidth: 700,
                mx: "auto"
            }}
        >
            {
                isComponentType("", componentType) && (
                    <Web_Mission_6_Exam />
                )
            }
            {isComponentType("step-2-1", componentType) && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        🧩 forEachで生成されたタスクリスト
                    </Typography>
                    <Paper elevation={1} sx={{ p: 2, width: 240, mx: "auto" }}>
                        <List dense>
                        {step2_1Taks.map((task, i) => (
                            <ListItem key={i} sx={{ justifyContent: "center" }}>
                            <Typography>{task}</Typography>
                            </ListItem>
                        ))}
                        </List>
                    </Paper>
                </Box>
            )}
            {isComponentType("step-2-2", componentType) && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        🧩 createElement / appendChild のイメージ
                    </Typography>

                    <Paper elevation={1} sx={{ p: 2, width: 240, mx: "auto" }}>
                        <List dense>
                        {step2_2Items.map((item, i) => (
                            <ListItem key={i} sx={{ justifyContent: "center" }}>
                            <Typography>{item}</Typography>
                            </ListItem>
                        ))}
                        </List>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={step2_2Onclick}
                            >
                            ➕ 要素を追加
                        </Button>
                    </Paper>
                </Box>
            )}
            {isComponentType("step-2-exam", componentType) && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        🧩 forEach + createElement / appendChild のイメージ
                    </Typography>

                    <Paper elevation={1} sx={{ p: 2, width: 260, mx: "auto" }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                        タスク一覧
                        </Typography>
                        <List dense>
                        {step_2Examtasks.map((task, i) => (
                            <ListItem key={i} sx={{ justifyContent: "center" }}>
                            <Typography>{task}</Typography>
                            </ListItem>
                        ))}
                        </List>

                        <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={handleRender}
                        >
                        ➕ リストを表示
                        </Button>
                    </Paper>
                </Box>
            )}
            {isComponentType("step-3-2", componentType) && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        🧩 addEventListenerのイメージ
                    </Typography>

                    <Paper elevation={1} sx={{ p: 2, width: 280, mx: "auto" }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                            ボタンを押すとメッセージが表示されます
                        </Typography>

                        {/* 簡単なボタンの動作デモ */}
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => alert("クリックされました！")}
                        >
                            🔘 クリック
                        </Button>
                    </Paper>
                </Box>
            )}
            {(isComponentType("step-3-3", componentType) || isComponentType("step-3-exam", componentType)) && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                🧩 ボタン押下でタスクを追加するイメージ
                </Typography>

                <Paper elevation={1} sx={{ p: 2, width: 300, mx: "auto" }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                        入力した値が配列に追加され、リストに表示されます
                    </Typography>

                    {/* 簡易UIのデモ */}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <Input 
                            id="inputId" 
                            type="text" 
                            placeholder="タスクを入力" 
                            value={step3_3Input}
                            style={{ padding: "4px", width: "180px" }} 
                            onChange={handleStep3_3OnChange}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleStep3_3OnClick}
                        >
                        ➕ タスク追加
                        </Button>
                    </Box>
                    {/* 追加されたタスク一覧を表示 */}
                    <List dense sx={{ mt: 1 }}>
                        {step3_3Tasks.map((task, i) => (
                        <ListItem key={i} sx={{ justifyContent: "center" }}>
                            <Typography>{task}</Typography>
                        </ListItem>
                        ))}
                    </List>
                </Paper>
            </Box>
            )}
            {(isComponentType("step-4", componentType) || isComponentType("step-4-2", componentType) || isComponentType("step-4-exam", componentType)) && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    🧩 タスク削除のイメージ
                </Typography>

                <Paper elevation={1} sx={{ p: 2, width: 300, mx: "auto" }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                    削除ボタンを押すとタスクが消えます
                    </Typography>

                    <List dense>
                    {step4_1Tasks.map((task, i) => (
                        <ListItem
                        key={i}
                        sx={{ justifyContent: "space-between", display: "flex", alignItems: "center" }}
                        >
                        <Typography>{task}</Typography>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleStep4_1OnClick(i)}
                        >
                            ✖ 削除
                        </Button>
                        </ListItem>
                    ))}
                    </List>
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => setStep4_1Tasks(["掃除", "買い物", "勉強"])}
                    >
                        🔧タスクを元に戻す
                    </Button>
                </Paper>
            </Box>
            )} 
        </Box>
    )
}