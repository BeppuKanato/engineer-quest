import { useState } from "react";
import { Box, Typography, Button } from "@mui/material";

export const Web_Mission_5_Exam = () => {
  const [color, setColor] = useState("black");
  const [text, setText] = useState("最初のタイトル");
  const [colorIndex, setColorIndex] = useState(0);

  const handleClick = () => {
    const colors = ["red", "blue", "green", "yellow"];
    setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
    setColor(colors[colorIndex]);
    setText("クリックされました！");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <Typography id="title" variant="h6" sx={{ color, transition: "color 0.3s" }}>
        {text}
      </Typography>
      <Button id="btn" variant="contained" color="primary" onClick={handleClick}>
        クリックしてみよう
      </Button>
    </Box>
  );
};