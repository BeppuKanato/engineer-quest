"use client";
import { Box, Button, Input, List, ListItem, Paper, Typography } from "@mui/material";
import { useState } from "react";

export const Mission_6_Exam = () => {
  const [tasks, setTasks] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>("");

  const handleAddTask = () => {
    if (!inputValue.trim()) return;
    setTasks([...tasks, inputValue]);
    setInputValue("");
  };

  const handleDeleteTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 340, mx: "auto", textAlign: "center" }}>
      <Typography variant="h6" color="primary" gutterBottom>
        🧩 完成イメージ（ToDoリスト）
      </Typography>

      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <Input
            placeholder="タスクを入力"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            sx={{ flex: 1, px: 1, py: 0.5 }}
          />
          <Button variant="contained" color="primary" size="small" onClick={handleAddTask}>
            ➕ 追加
          </Button>
        </Box>

        <List dense>
          {tasks.map((task, i) => (
            <ListItem
              key={i}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 0.5,
              }}
            >
              <Typography>{task}</Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => handleDeleteTask(i)}
              >
                ✖ 削除
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};
