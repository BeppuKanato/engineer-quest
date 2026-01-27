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
  Select,
  MenuItem,
  Tooltip,
  IconButton,
} from "@mui/material";
import { JUDGE_TYPE, MISSION_EXAM_LANGUAGE, MissionExamAIResponse } from "@/type";
import React from "react";
import Editor from "@monaco-editor/react";
import { InfoIcon } from "lucide-react";

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
  judgeType: JUDGE_TYPE;
  setJudgeType: (type: JUDGE_TYPE) => void;
  onChangeLanguage: (lang: MISSION_EXAM_LANGUAGE) => void;
  onChangeCode: (v: string) => void;
  onEvaluate: () => void;
  onGoResult?: () => void;
  onShare: () => void;
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
  judgeType,
  setJudgeType,
  onChangeLanguage,
  onChangeCode,
  onEvaluate,
  onGoResult,
  onShare,
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
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "grey.300",
                bgcolor: "grey.50",
              }}
            >
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                採点方法を選択してください
              </Typography>

              <Select
                fullWidth
                value={judgeType || ""}
                onChange={(e) => setJudgeType(e.target.value as JUDGE_TYPE)}
                disabled={isEvaluating || isSharing}
              >
                <MenuItem value={JUDGE_TYPE.WITHOUT_FEEDBACK}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>スコアのみ</span>
                    <Tooltip title="スコアと良い点、悪い点を提示します。" placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MenuItem>
                <MenuItem value={JUDGE_TYPE.WITH_FEEDBACK}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>標準フィードバック</span>
                    <Tooltip title="スコアに加え、コードの良い点・改善点、改善方法の提案などのフィードバックを提示します。" placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MenuItem>
                {/* Philanthropists */}
                <MenuItem value={JUDGE_TYPE.PHILANTHROPIST}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>利他意識重視</span>
                    <Tooltip title="スコアに加え、周囲や将来にどのように役立つかに焦点を当てたフィードバックを提示します" placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MenuItem>
                {/* Achiever */}
                <MenuItem value={JUDGE_TYPE.ACHIEVER}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>成長重視</span>
                    <Tooltip title="スコアに加え、上達やスキルの向上、次に挑戦できる点に焦点を当てたフィードバックを提示します" placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MenuItem>
                {/* FreeSpirit */}
                <MenuItem value={JUDGE_TYPE.FREE_SPIRIT}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>自由度重視</span>
                    <Tooltip title="スコアに加え、発想や工夫の余地、選択の幅に焦点を当てたフィードバックを提示します" placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MenuItem>
                {/* Socializer */}
                <MenuItem value={JUDGE_TYPE.SOCIALIZER}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>つながり重視</span>
                    <Tooltip title="スコアに加え、他者との共有や関わりを意識した視点のフィードバックを提示します" placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MenuItem>
                {/* Player */}
                <MenuItem value={JUDGE_TYPE.PLAYER}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>報酬重視</span>
                    <Tooltip title="スコアに加え、報酬や利益に焦点を当てたフィードバックを提示します" placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MenuItem>
                {/* Disruptor */}
                <MenuItem value={JUDGE_TYPE.DISRUPTOR}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span>変化重視</span>
                    <Tooltip title="スコアに加え、別のやり方や改善など、変化に焦点を当てたフィードバックを提示します" placement="top">
                      <IconButton
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InfoIcon fontSize="small"/>
                      </IconButton>
                    </Tooltip>
                  </Box>
                </MenuItem>
              </Select>
            </Box>
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
                sx={{ fontSize: "1rem", fontWeight: "bold", px: 1 }}
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
                          color: "text.secondary",
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
                          color: "text.secondary",
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

            {/* フィードバック */}
            {aiResponseData.feedbacks && aiResponseData.feedbacks.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight="medium" mb={1}>
                  フィードバック
                </Typography>
                
                {aiResponseData.feedbacks.map((fb, idx) => (
                  <Box key={idx}>
                    {/* 区切り線（先頭以外） */}
                    {idx !== 0 && <Divider sx={{ my: 2 }} />}

                    {/* フィードバック見出し */}
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                    >
                      フィードバック {fb.index + 1}
                    </Typography>

                    {/* フィードバック本文 */}
                    <Typography
                      sx={{
                        whiteSpace: "pre-line",
                        color: "text.secondary",
                      }}
                    >
                      {fb.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* リザルト画面ボタン */}
            {hasPassed && onGoResult && (
              <Box mt={4} display="flex" justifyContent="center" gap={2}>
                <MUIButton
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={onGoResult}
                  disabled={isSharing}
                  sx={{ px: 4, py: 1.5, fontSize: "1rem" }}
                >
                  📊 リザルト画面へ
                </MUIButton>
                <MUIButton
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={onShare}
                  disabled={isSharing}
                  sx={{ px: 4, py: 1.5, fontSize: "1rem" }}
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
