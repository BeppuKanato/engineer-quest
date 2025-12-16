// Mission_7.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

export const Mission_7: React.FC = () => {
  const [memoList, setMemoList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // localStorage から読み込み
  useEffect(() => {
    const saved = localStorage.getItem("memos");
    if (saved) setMemoList(JSON.parse(saved));
  }, []);

  // localStorage に保存
  useEffect(() => {
    localStorage.setItem("memos", JSON.stringify(memoList));
  }, [memoList]);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    setMemoList([...memoList, inputValue.trim()]);
    setInputValue("");
  };

  const handleDelete = (index: number) => {
    const updated = memoList.filter((_, i) => i !== index);
    setMemoList(updated);
  };

  const handleEdit = (index: number) => {
    setInputValue(memoList[index]);
    setEditIndex(index);
  };

  const handleSave = () => {
    if (editIndex === null || !inputValue.trim()) return;
    const updated = [...memoList];
    updated[editIndex] = inputValue.trim();
    setMemoList(updated);
    setInputValue("");
    setEditIndex(null);
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 3,
        maxWidth: 500,
        margin: "auto",
        bgcolor: "background.paper",
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
          メモアプリ
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="メモを入力"
            variant="outlined"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={editIndex !== null ? handleSave : handleAdd}
          >
            {editIndex !== null ? <SaveIcon /> : "追加"}
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {memoList.length === 0 ? (
          <Typography color="text.secondary" align="center">
            まだメモがありません
          </Typography>
        ) : (
          <List>
            {memoList.map((memo, i) => (
              <ListItem
                key={i}
                secondaryAction={
                  <>
                    <IconButton edge="end" onClick={() => handleEdit(i)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(i)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </>
                }
              >
                <ListItemText primary={memo} />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
