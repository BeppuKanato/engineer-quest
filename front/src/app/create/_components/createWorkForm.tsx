"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import type { CreateTheme, CreateWork, CreateWorkPayload, CreateWorkStatus } from "@/api/create.api";

const splitTags = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const CreateWorkForm = ({
  theme,
  initialWork,
  isSaving,
  submitLabel,
  onSubmit,
}: {
  theme: CreateTheme;
  initialWork?: CreateWork | null;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (payload: CreateWorkPayload) => Promise<void>;
}) => {
  const [title, setTitle] = useState(initialWork?.title ?? "");
  const [description, setDescription] = useState(initialWork?.description ?? "");
  const [learnedNote, setLearnedNote] = useState(initialWork?.learnedNote ?? "");
  const [techStack, setTechStack] = useState(initialWork?.techStack.join(", ") ?? theme.tags.join(", "));
  const [publicUrl, setPublicUrl] = useState(initialWork?.publicUrl ?? "");
  const [repositoryUrl, setRepositoryUrl] = useState(initialWork?.repositoryUrl ?? "");
  const [imageUrl, setImageUrl] = useState(initialWork?.imageUrl ?? "");
  const [status, setStatus] = useState<CreateWorkStatus>(initialWork?.status ?? "DRAFT");
  const [requirementIds, setRequirementIds] = useState<string[]>(initialWork?.checkedRequirementIds ?? []);
  const [challengeIds, setChallengeIds] = useState<string[]>(initialWork?.checkedChallengeIds ?? []);

  const canSubmit = useMemo(() => title.trim().length > 0 && description.trim().length > 0, [title, description]);

  const toggle = (id: string, values: string[], setValues: (next: string[]) => void) => {
    setValues(values.includes(id) ? values.filter((item) => item !== id) : [...values, id]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      learnedNote: learnedNote.trim(),
      techStack: splitTags(techStack),
      publicUrl: publicUrl.trim(),
      repositoryUrl: repositoryUrl.trim(),
      imageUrl: imageUrl.trim(),
      status,
      requirementIds,
      challengeIds,
    });
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, border: "1px solid #dbe3ef" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            制作記録
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            ローカルで作った内容を、自分の学習記録として保存します。
          </Typography>
        </Box>

        <TextField label="作品名" value={title} onChange={(event) => setTitle(event.target.value)} fullWidth required />
        <TextField
          label="作品の説明"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          fullWidth
          multiline
          minRows={3}
          required
        />
        <TextField
          label="学んだこと・工夫したこと"
          value={learnedNote}
          onChange={(event) => setLearnedNote(event.target.value)}
          fullWidth
          multiline
          minRows={3}
        />
        <TextField
          label="使った技術（カンマ区切り）"
          value={techStack}
          onChange={(event) => setTechStack(event.target.value)}
          fullWidth
        />

        <Alert severity="warning" icon={<WarningAmberIcon />}>
          公開URLを入力すると、他の人が見られるリンクとして扱われます。個人情報や秘密のキーを含めないでください。
        </Alert>
        <TextField label="公開URL（任意）" value={publicUrl} onChange={(event) => setPublicUrl(event.target.value)} fullWidth />
        <TextField label="リポジトリURL（任意）" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} fullWidth />
        <TextField
          label="画像URL（任意・アップロードは今後対応）"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          fullWidth
          helperText="画像がない場合はテーマのサムネイルを使います。"
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Box>
            <Typography fontWeight={900} sx={{ mb: 1 }}>条件チェック</Typography>
            <Stack spacing={0.5}>
              {theme.requirements.map((item) => (
                <FormControlLabel
                  key={item.id}
                  control={
                    <Checkbox
                      checked={requirementIds.includes(item.id)}
                      onChange={() => toggle(item.id, requirementIds, setRequirementIds)}
                    />
                  }
                  label={item.label}
                />
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography fontWeight={900} sx={{ mb: 1 }}>挑戦チェック</Typography>
            <Stack spacing={0.5}>
              {theme.challenges.map((item) => (
                <FormControlLabel
                  key={item.id}
                  control={
                    <Checkbox
                      checked={challengeIds.includes(item.id)}
                      onChange={() => toggle(item.id, challengeIds, setChallengeIds)}
                    />
                  }
                  label={item.label}
                />
              ))}
            </Stack>
          </Box>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
          <Button
            variant={status === "DRAFT" ? "contained" : "outlined"}
            onClick={() => setStatus("DRAFT")}
            sx={{ fontWeight: 900 }}
          >
            下書き
          </Button>
          <Button
            variant={status === "COMPLETED" ? "contained" : "outlined"}
            color="success"
            onClick={() => setStatus("COMPLETED")}
            startIcon={<CheckCircleIcon />}
            sx={{ fontWeight: 900 }}
          >
            完成
          </Button>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {splitTags(techStack).map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Stack>
        </Stack>

        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          disabled={!canSubmit || isSaving}
          onClick={handleSubmit}
          sx={{ minHeight: 52, borderRadius: 2, fontWeight: 900 }}
        >
          {isSaving ? "保存中..." : submitLabel}
        </Button>
      </Stack>
    </Paper>
  );
};
