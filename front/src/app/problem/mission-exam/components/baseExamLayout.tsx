"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button as MUIButton,
  CircularProgress,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Tabs,
  Tab,
  RadioGroup,
  Radio,
} from "@mui/material";
import { MISSION_EXAM_LANGUAGE, MissionExamAIResponse } from "@/type";
import React from "react";
import Editor from "@monaco-editor/react";

type Props = {
  title: string;
  currentLanguage: MISSION_EXAM_LANGUAGE;
  languages: MISSION_EXAM_LANGUAGE[];
  userCode: string;
  isEvaluating: boolean;
  isSharing: boolean;
  aiResponseData: MissionExamAIResponse | null;
  hasPassed: boolean;
  children: React.ReactNode; // 出題内容
  selectedIndex: number | null;
  isFeedbackConfirmed ?: boolean;
  isSelectingFeedback ?: boolean;
  setSelectedIndex: (index: number | null) => void;
  onChangeLanguage: (lang: MISSION_EXAM_LANGUAGE) => void;
  onChangeCode: (v: string) => void;
  onEvaluate: () => void;
  onGoResult?: () => void;
  onShare: () => void;
  onSelectFeedback?: () => void;
};

export const BaseExamLayout = ({
  title,
  currentLanguage,
  languages,
  userCode,
  isEvaluating,
  isSharing,
  aiResponseData,
  hasPassed,
  children,
  selectedIndex,
  isFeedbackConfirmed,
  isSelectingFeedback,
  setSelectedIndex,
  onChangeLanguage,
  onChangeCode,
  onEvaluate,
  onGoResult,
  onShare,
  onSelectFeedback,
}: Props) => {
  return (
    <Box sx={{ maxWidth: "1200px", mx: "auto", p: 4, display: "flex", flexDirection: "column", gap: 4 }}>
      {/* タイトル */}
      <Typography variant="h4" fontWeight="bold" textAlign="center">
        {title}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
        {/* 出題内容 */}
        <Card sx={{ flex: 1, p: 3, boxShadow: 2, borderRadius: 2 }}>
          <CardHeader title={<Typography variant="h6">🎯 出題内容</Typography>} />
          <CardContent>{children}</CardContent>
        </Card>

        {/* コードエディタ */}
        <Card sx={{ flex: 1, p: 3, boxShadow: 2, borderRadius: 2 }}>
          <CardHeader title={<Typography variant="h6">📝 コードエディタ</Typography>} />
          <CardContent>
            <Tabs
              value={currentLanguage}
              onChange={(event, newValue) => onChangeLanguage(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {languages.map((lang) => (
                <Tab key={lang} value={lang} label={lang} />
              ))}
            </Tabs>

            <Editor
              height="400px"
              language={currentLanguage.toLowerCase()}
              theme="vs-dark"
              value={userCode}
              onChange={(v) => onChangeCode(v || "")}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
              }}
            />
            {/* リセット / AI評価 */}
            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <MUIButton
                variant="outlined"
                fullWidth
                onClick={() => onChangeCode("")}
              >
                リセット
              </MUIButton>
              <MUIButton
                variant="contained"
                color="primary"
                fullWidth
                onClick={onEvaluate}
                disabled={!userCode.trim() || isEvaluating || isSharing}
              >
                {isEvaluating ? "🤖 AI評価中..." : "🤖 AI評価を受ける"}
              </MUIButton>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* AI評価中 */}
      {isEvaluating && (
        <Card sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CircularProgress color="primary" />
          <Typography color="text.secondary" variant="body2">
            🤖AIがあなたのコードを評価しています...
          </Typography>
        </Card>
      )}

      {/* AI評価結果 */}
      {!isEvaluating && aiResponseData && (
        <Card
          sx={{
            p: 3,
            boxShadow: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.300",
          }}
        >
          <CardHeader
            title={
              <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                🤖 AI評価結果
              </Typography>
            }
          />
          <CardContent>
            {/* スコア */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="body1" fontWeight="medium">
                スコア
              </Typography>
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{ color: aiResponseData.score >= 60 ? "success.main" : "error.main" }}
              >
                {aiResponseData.score}/100
              </Typography>
            </Box>

            {/* 合否 */}
            <Box textAlign="center" mb={2}>
              <Chip
                label={hasPassed ? "🎉 合格！" : "❌ 不合格"}
                color={hasPassed ? "success" : "error"}
                variant="outlined"
                sx={{ fontSize: "1rem", fontWeight: "bold", px: 2, py: 1}}
              />
            </Box>

            {/* プログレスバー */}
            <LinearProgress
              variant="determinate"
              value={aiResponseData.score}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 3,
                bgcolor: "grey.300",
                "& .MuiLinearProgress-bar": {
                  bgcolor: aiResponseData.score >= 60 ? "success.main" : "error.main",
                },
              }}
            />
            {/* 評価理由 */}
            <Box mb={3}>
              <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                評価理由
              </Typography>

              {/* 良い点 */}
              {aiResponseData.reason?.good?.length > 0 && (
                <Box mb={3}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="success.main"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    ✅ いい点
                  </Typography>
                  <Box sx={{ pl: 3, mt: 1 }}>
                    {aiResponseData.reason.good.map((item, idx) => (
                      <Typography
                        key={`good-${idx}`}
                        sx={{
                          whiteSpace: "pre-line",
                          color: "text.primary",
                          fontSize: "1.05rem",
                          lineHeight: 1.75,
                          mb: 0.5,
                          "&::before": {
                            content: '"・"',
                            mr: 1,
                          },
                        }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 改善点 */}
              {aiResponseData.reason?.bad?.length > 0 && (
                <Box mb={2}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="warning.main"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    💡 改善点
                  </Typography>
                  <Box sx={{ pl: 3, mt: 1 }}>
                    {aiResponseData.reason.bad.map((item, idx) => (
                      <Typography
                        key={`bad-${idx}`}
                        sx={{
                          whiteSpace: "pre-line",
                          color: "text.primary",
                          fontSize: "1.05rem",
                          lineHeight: 1.75,
                          mb: 0.5,
                          "&::before": {
                            content: '"・"',
                            mr: 1,
                          },
                        }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" fontWeight="medium" mb={1}>
              最も参考になるフィードバックを1つ選んでください：
            </Typography>
            {/* フィードバック */}
            {aiResponseData.feedbacks && aiResponseData.feedbacks.length > 0 && (
              <Box>
                <Box display="flex" flexDirection="column" gap={2}>
                  <RadioGroup
                    value={selectedIndex}
                    onChange={(e) => setSelectedIndex(Number(e.target.value))}
                  >
                    {aiResponseData.feedbacks.map((fb) => {
                      const isSelected = selectedIndex === fb.index;

                      return (
                        <Card
                          key={fb.index}
                          variant="outlined"
                            onClick={isFeedbackConfirmed ? undefined : () => setSelectedIndex(fb.index)}
                          sx={{
                            mb: 2,
                            borderRadius: 2,
                            cursor: "pointer",
                            backgroundColor: isSelected
                              ? "rgba(25, 118, 210, 0.08)"
                              : "rgba(25, 118, 210, 0.03)",
                            borderColor: isSelected ? "primary.main" : "divider",
                            transition: "all 0.2s ease",
                            pointerEvents: isFeedbackConfirmed ? "none" : "auto",
                            opacity: isFeedbackConfirmed && !isSelected ? 0.6 : 1,
                          }}
                        >
                          <CardContent>
                            {/* ヘッダ行：Radio + 見出し */}
                            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                              <Radio
                                checked={isSelected}
                                value={fb.index}
                                sx={{ mr: 1 }}
                              />

                              <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  color: "primary.main",
                                }}
                              >
                                📝 フィードバック {fb.index + 1}
                              </Typography>
                            </Box>

                            {/* 本文 */}
                            <Typography
                              sx={{
                                whiteSpace: "pre-line",
                                color: "text.primary",
                                fontSize: "1.05rem",
                                lineHeight: 1.7,
                              }}
                            >
                              {fb.text}
                            </Typography>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </RadioGroup>
                </Box>
              </Box>
            )}

            {aiResponseData && !isFeedbackConfirmed && (
              <Box mt={4} display="flex" justifyContent="center">
                <MUIButton
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={onSelectFeedback}
                  disabled={
                    selectedIndex == null || isSelectingFeedback
                  }
                  sx={{ px: 4, py: 1.5, fontSize: "1rem" }}
                >
                  {isSelectingFeedback ? "保存中..." : "フィードバックを確定"}
                </MUIButton>
              </Box>
            )}

            {isFeedbackConfirmed && (
              <Box display="flex" justifyContent="center" mt={2}>
                <Chip
                  label="✔ フィードバック確定済み"
                  color="success"
                  variant="outlined"
                />
              </Box>
            )}
            {/* リザルト画面ボタン */}
            {isFeedbackConfirmed && (
              <Box mt={4} display="flex" justifyContent="center" gap={2}>
                {hasPassed && onGoResult && (
                  <MUIButton
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={onGoResult}
                    sx={{ px: 4, py: 1.5 }}
                  >
                    📊 リザルト画面へ
                  </MUIButton>
                )}

                <MUIButton
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={onShare}
                  disabled={isSharing}
                  sx={{ px: 4, py: 1.5 }}
                >
                  結果を共有
                </MUIButton>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
