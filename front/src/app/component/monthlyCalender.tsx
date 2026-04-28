import React from "react";
import { Box, Card, Typography } from "@mui/material";

type MonthlyCalenderProps = {
  year: number;
  month: number; // 0始まり
  date?: number;
};

const createMonthArray = (firstDayOfWeek: number, daysInMonth: number) => {
  const days: (number | null)[] = [];
  const result: (number | null)[][] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  for (let i = 0; i < days.length; i += 7) {
    result.push(days.slice(i, i + 7));
  }

  return result;
};

export const MonthlyCalender: React.FC<MonthlyCalenderProps> = ({
  year,
  month,
  date,
}) => {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthArray = createMonthArray(firstDayOfWeek, daysInMonth);

  const weekLabels = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <Card sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        {year}年 {month + 1}月
      </Typography>

      {/* 曜日 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          mb: 1,
        }}
      >
        {weekLabels.map((label, index) => (
          <Box key={label} sx={{ textAlign: "center", py: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color:
                  index === 0
                    ? "error.main"
                    : index === 6
                    ? "primary.main"
                    : "text.secondary",
              }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* 日付 */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {monthArray.map((week, weekIndex) => (
          <Box
            key={weekIndex}
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 1,
            }}
          >
            {week.map((day, dayIndex) => {
              const isToday = day === date;

              return (
                <Box
                  key={`${weekIndex}-${dayIndex}`}
                  sx={{
                    aspectRatio: "1 / 1",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: day
                      ? isToday
                        ? "primary.main"
                        : "grey.100"
                      : "transparent",
                    color: day
                      ? isToday
                        ? "common.white"
                        : dayIndex === 0
                        ? "error.main"
                        : dayIndex === 6
                        ? "primary.main"
                        : "text.primary"
                      : "transparent",
                    border: day ? "1px solid" : "none",
                    borderColor: day ? "grey.300" : "transparent",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {day ?? ""}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Card>
  );
};