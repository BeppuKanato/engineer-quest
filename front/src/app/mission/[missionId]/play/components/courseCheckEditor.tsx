"use client";

import Editor, { DiffEditor } from "@monaco-editor/react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { diffLines } from "diff";
import { normalizeTranscriptionCode } from "@/lib/bubbleSort";

type Props = {
  sampleCode: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onPassed: () => void;
};

export function CourseCheckEditor({
  sampleCode,
  value,
  disabled,
  onChange,
  onPassed,
}: Props) {
  const [checked, setChecked] = useState(false);
  const normalizedSample = useMemo(
    () => normalizeTranscriptionCode(sampleCode),
    [sampleCode],
  );
  const normalizedValue = useMemo(
    () => normalizeTranscriptionCode(value),
    [value],
  );
  const isMatch = normalizedSample === normalizedValue;
  const differences = useMemo(
    () => diffLines(normalizedSample, normalizedValue),
    [normalizedSample, normalizedValue],
  );
  const issueCount = differences.filter((part) => part.added || part.removed).length;

  const check = () => {
    setChecked(true);
    if (isMatch) onPassed();
  };

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
          gap: 2,
          minWidth: 0,
        }}
      >
        <Paper sx={{ overflow: "hidden", border: "1px solid #cbd5e1" }}>
          <Typography sx={{ px: 2, py: 1.25, fontWeight: 900, bgcolor: "#f8fafc" }}>
            完成コード
          </Typography>
          <Editor
            height="440px"
            language="python"
            value={sampleCode}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              renderLineHighlight: "all",
              wordWrap: "on",
            }}
          />
        </Paper>
        <Paper sx={{ overflow: "hidden", border: "2px solid #93c5fd" }}>
          <Typography sx={{ px: 2, py: 1.25, fontWeight: 900, bgcolor: "#eff6ff" }}>
            入力エディター
          </Typography>
          <Editor
            height="440px"
            language="python"
            value={value}
            onChange={(next) => {
              setChecked(false);
              onChange(next ?? "");
            }}
            options={{
              readOnly: disabled,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbersMinChars: 3,
              scrollBeyondLastLine: false,
              renderLineHighlight: "all",
              wordWrap: "on",
              autoClosingBrackets: "always",
              autoIndent: "full",
              tabSize: 4,
              insertSpaces: true,
            }}
          />
        </Paper>
      </Box>

      {checked && !isMatch && (
        <Stack spacing={1.5}>
          <Alert severity="warning">
            {issueCount}か所に差があります。入力内容は保持されています。
          </Alert>
          <Paper sx={{ overflow: "hidden", border: "1px solid #f59e0b" }}>
            <Typography sx={{ px: 2, py: 1.25, fontWeight: 900, bgcolor: "#fffbeb" }}>
              コード差分
            </Typography>
            <DiffEditor
              height="360px"
              language="python"
              original={sampleCode}
              modified={value}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                renderSideBySide: true,
                scrollBeyondLastLine: false,
              }}
            />
          </Paper>
        </Stack>
      )}

      {checked && isMatch && (
        <Alert severity="success">
          完成コードと一致しました。インデント、空行、処理順を正確に写経できています。
        </Alert>
      )}

      <Button
        variant="contained"
        size="large"
        disabled={disabled || !value}
        onClick={check}
        sx={{ alignSelf: { sm: "flex-end" }, minWidth: 200 }}
      >
        コードの差分を確認
      </Button>
    </Stack>
  );
}
