import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { Box, Card, Stack, Typography } from "@mui/material";
import { MissionExamResultLog } from "../type";
import { MissionExamDifficulty } from "../../play/type";

type ResultSummaryProps = {
  result: MissionExamResultLog;
};

const difficultyLabel: Record<MissionExamDifficulty, string> = {
  easy: "Easy",
  normal: "Normal",
  hard: "Hard",
};

const difficultyColor: Record<MissionExamDifficulty, string> = {
  easy: "#22c55e",
  normal: "#2563eb",
  hard: "#ef4444",
};

const difficultyOrder: MissionExamDifficulty[] = ["easy", "normal", "hard"];

const formatCompletedAt = (completedAt: string) => {
  const date = new Date(completedAt);

  if (Number.isNaN(date.getTime())) {
    return completedAt;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const ResultSummary = ({ result }: ResultSummaryProps) => {
  return (
    <Card
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: 4,
        border: "1px solid #dbeafe",
        bgcolor: "#f8fafc",
      }}
    >
      <Typography
        sx={{
          fontWeight: 900,
          color: "#0f172a",
          mb: 1.5,
        }}
      >
        今回の結果
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, 1fr)",
          },
          gap: 1.2,
        }}
      >
        <RecordCard
          icon={<WorkspacePremiumIcon />}
          label="クリア難易度"
          value={difficultyLabel[result.difficulty]}
          color={difficultyColor[result.difficulty]}
        />

        <RecordCard
          icon={<CalendarMonthIcon />}
          label="クリア日時"
          value={formatCompletedAt(result.completedAt)}
          color="#2563eb"
        />

        <DifficultyStatusCard
          clearedDifficulties={result.clearedDifficulties}
        />
      </Box>
    </Card>
  );
};

type RecordCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
};

const RecordCard = ({ icon, label, value, color }: RecordCardProps) => {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 3,
        bgcolor: "#fff",
        border: "1px solid #e2e8f0",
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            color,
            display: "flex",
            alignItems: "center",
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              color,
              fontWeight: 900,
              fontSize: 18,
              lineHeight: 1.2,
              overflowWrap: "anywhere",
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};

type DifficultyStatusCardProps = {
  clearedDifficulties: MissionExamResultLog["clearedDifficulties"];
};

const DifficultyStatusCard = ({
  clearedDifficulties,
}: DifficultyStatusCardProps) => {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 3,
        bgcolor: "#fff",
        border: "1px solid #e2e8f0",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CheckCircleIcon />
          </Box>

          <Typography
            sx={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            クリア状況
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          {difficultyOrder.map((difficulty) => {
            const cleared = clearedDifficulties[difficulty];

            return (
              <Box
                key={difficulty}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: cleared
                    ? difficultyColor[difficulty]
                    : "#cbd5e1",
                  bgcolor: cleared ? `${difficultyColor[difficulty]}14` : "#f8fafc",
                  color: cleared ? difficultyColor[difficulty] : "#94a3b8",
                  fontSize: 12,
                  fontWeight: 900,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {difficultyLabel[difficulty]}
                {cleared ? " CLEAR" : " -"}
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
};
