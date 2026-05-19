import DifferenceIcon from "@mui/icons-material/Difference";
import SendIcon from "@mui/icons-material/Send";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import { Box, Card, Stack, Typography } from "@mui/material";
import { MissionExamResultLog } from "../type";
import { MissionExamDifficulty } from "../../exam/type";

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

export const ResultSummary = ({
  result,
}: ResultSummaryProps) => {
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
        今回の取り組み
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
          icon={<SendIcon />}
          label="提出"
          value={`${result.submitCount}回`}
          color="#2563eb"
        />

        <RecordCard
          icon={<DifferenceIcon />}
          label="違いを確認"
          value={`${result.diffCheckCount}回`}
          color="#b7791f"
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

        <Box>
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
            }}
          >
            {value}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
};