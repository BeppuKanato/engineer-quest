"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CodeIcon from "@mui/icons-material/Code";
import DescriptionIcon from "@mui/icons-material/Description";
import GitHubIcon from "@mui/icons-material/GitHub";
import ImageIcon from "@mui/icons-material/Image";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import LinkIcon from "@mui/icons-material/Link";
import SaveIcon from "@mui/icons-material/Save";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TitleIcon from "@mui/icons-material/Title";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

import type {
  CreateTheme,
  CreateWork,
  CreateWorkPayload,
  CreateWorkStatus,
  CreateWorkVisibility,
} from "@/api/create.api";
import { ActionButton } from "@/app/component/actionButton";

const splitTags = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const iconAdornment = (icon: React.ReactNode) => <InputAdornment position="start">{icon}</InputAdornment>;

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
  const [visibility] = useState<CreateWorkVisibility>(initialWork?.visibility ?? "PRIVATE");
  const [requirementIds, setRequirementIds] = useState<string[]>(initialWork?.checkedRequirementIds ?? []);
  const [challengeIds, setChallengeIds] = useState<string[]>(initialWork?.checkedChallengeIds ?? []);

  const tags = useMemo(() => splitTags(techStack), [techStack]);
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
      techStack: tags,
      publicUrl: publicUrl.trim(),
      repositoryUrl: repositoryUrl.trim(),
      imageUrl: imageUrl.trim(),
      status,
      visibility,
      requirementIds,
      challengeIds,
    });
  };

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 2, border: "1px solid #dbe3ef" }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" fontWeight={900}>
            制作記録の入力
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            ローカルで作った内容を、学習記録として残します。あとからMy Worksで編集できます。
          </Typography>
        </Box>

        <TextField
          label="作品名"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          fullWidth
          required
          InputProps={{ startAdornment: iconAdornment(<TitleIcon color="primary" />) }}
        />
        <TextField
          label="作品の説明"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          fullWidth
          multiline
          minRows={3}
          required
          InputProps={{ startAdornment: iconAdornment(<DescriptionIcon color="primary" />) }}
        />
        <TextField
          label="学んだこと・工夫したこと"
          value={learnedNote}
          onChange={(event) => setLearnedNote(event.target.value)}
          fullWidth
          multiline
          minRows={3}
          InputProps={{ startAdornment: iconAdornment(<LightbulbIcon color="warning" />) }}
        />
        <TextField
          label="使った技術（カンマ区切り）"
          value={techStack}
          onChange={(event) => setTechStack(event.target.value)}
          fullWidth
          InputProps={{ startAdornment: iconAdornment(<CodeIcon color="primary" />) }}
          helperText="例: HTML, CSS, JavaScript, React, Vite"
        />

        {publicUrl.trim() && (
          <Alert severity="warning">
            このURLは他人が見られるリンクとして扱われます。個人情報や秘密情報を含めないでください。
          </Alert>
        )}
        <TextField
          label="公開URL（任意）"
          value={publicUrl}
          onChange={(event) => setPublicUrl(event.target.value)}
          fullWidth
          InputProps={{ startAdornment: iconAdornment(<LinkIcon color="primary" />) }}
        />
        <TextField
          label="GitHub / リポジトリURL（任意）"
          value={repositoryUrl}
          onChange={(event) => setRepositoryUrl(event.target.value)}
          fullWidth
          InputProps={{ startAdornment: iconAdornment(<GitHubIcon color="primary" />) }}
        />
        <TextField
          label="作品画像URL（任意）"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          fullWidth
          helperText="画像アップロード基盤は今後差し替え予定です。未入力ならテーマ画像を使います。"
          InputProps={{ startAdornment: iconAdornment(<ImageIcon color="primary" />) }}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <CheckCircleIcon color="primary" />
              <Typography fontWeight={900}>最低限条件の達成チェック</Typography>
            </Stack>
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
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <StarRoundedIcon color="warning" />
              <Typography fontWeight={900}>挑戦項目の達成チェック</Typography>
            </Stack>
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

        <Box sx={{ maxWidth: { md: "50%" } }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <SaveIcon color="primary" />
              <Typography fontWeight={900}>保存状態</Typography>
            </Stack>
            <ToggleButtonGroup
              exclusive
              value={status}
              onChange={(_, next) => next && setStatus(next)}
              fullWidth
              color="primary"
            >
              <ToggleButton value="DRAFT">下書き</ToggleButton>
              <ToggleButton value="COMPLETED">完成</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" sx={{ bgcolor: "#eef2ff", color: "#1d4ed8", fontWeight: 800 }} />
          ))}
        </Stack>

        <ActionButton
          variant="contained"
          size="large"
          startIcon={<UploadFileIcon />}
          loading={isSaving}
          loadingLabel="保存中..."
          disabled={!canSubmit || isSaving}
          onClick={handleSubmit}
          sx={{ minHeight: 52, borderRadius: 2, fontWeight: 900 }}
        >
          {submitLabel}
        </ActionButton>
      </Stack>
    </Paper>
  );
};
