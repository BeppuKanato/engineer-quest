"use client";
import React from "react";
import { Typography, List, ListItem, ListItemIcon, ListItemText, Card, CardContent } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export const InstructionList = ({
  instructions,
  title = "以下の条件を満たしてください：",
}: {
  instructions: string[];
  title?: string;
}) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 3,
        bgcolor: "background.paper",
        p: 2,
      }}
    >
      <CardContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {title}
        </Typography>

        <List>
          {instructions.map((instruction, i) => (
            <ListItem key={i} sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <CheckCircleOutlineIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={instruction}
                primaryTypographyProps={{
                  sx: { fontSize: "1rem", color: "text.primary" },
                }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};
