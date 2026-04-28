"use client";

import { Card, CardContent, CardHeader, Typography, Skeleton, Button as MUIButton } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { getMissionComponent } from "../../mapping";
import { StepExamResponse } from "@/type";
import { Textarea } from "@/app/component/ui/textarea";
import { BackHeader } from "@/app/component/common/backHeader";
import Confetti from "react-confetti";
import { navigateWithUpdateUsageTime } from "../../common/common";
import ReactMarkdown from "react-markdown";
import { fetchWithoutUserId, fetchWithUserId } from "@/utils/fetchers";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { InstructionList } from "../../mission-exam/components/instructionList";
import { Snackbar, Alert } from "@mui/material";

export default function StepExamPage() {
  const [responseData, setResponseData] = useState<StepExamResponse | null>(null);
  const [examNum, setExamNum] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showScale, setShowScale] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [user, setUser] = useState<User | null>();
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const router = useRouter();
  const { id } = useParams();

  const startTime = useRef(new Date());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    const fetchData = async() => {
      const res = await fetchWithoutUserId("/problem/stepExam", {method: "POST", body: JSON.stringify({stepId: id})});
      const json: StepExamResponse = await res.json();
      setResponseData(json)
    }
    fetchData();
  }, [id]);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 animate-pulse h-64">
        <CardHeader title={<Skeleton width="40%" />} />
        <CardContent>
          <Skeleton variant="rectangular" width="100%" height={120} />
        </CardContent>
      </Card>
      <Card className="p-6 animate-pulse h-64">
        <CardHeader title={<Skeleton width="40%" />} />
        <CardContent>
          <div className="flex gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        </CardContent>
        <div className="flex justify-end mt-4">
          <Skeleton variant="rectangular" width={100} height={36} />
        </div>
      </Card>
    </div>
  );

  if (!responseData) return <div className="bg-indigo-50 min-h-screen w-full p-6">{renderSkeleton()}</div>;

  const currentStep = responseData.mission.steps.find((s) => s.id === responseData.id);
  const currentOrder = currentStep?.order ?? 0;
  const isLastStep = currentOrder === responseData.mission.steps.length;

  const handleAnswerOnclick = async () => {
    if (!user || isSaving) return;

    // 余分な空白や改行を除去
    const normalize = (str: string) =>
      str
        .replace(/```html/g, "") // Markdownの開始タグ除去
        .replace(/```css/g, "")     // Markdownの開始タグ除去
        .replace(/```js/g, "") // Markdownの開始タグ除去
        .replace(/```java/g, "") // Markdownの開始タグ除去
        .replace(/```text/g, "") // Markdownの開始タグ除去
        .replace(/```/g, "")     // Markdownの終了タグ除去
        .replace(/\s+/g, "")     // 余分な空白・改行除去
        .trim(); // 全ての空白・改行を削除してトリム

    const userAnswer = normalize(inputValue);
    const correctAnswer = normalize(responseData.stepExams[examNum].answer);

    if (userAnswer !== correctAnswer) {
      setIsCorrect(false);
      return;
    }

    // 正解時
    setShowScale(true);
    setTimeout(() => setShowScale(false), 150);
    setShowConfetti(true);

    setIsSaving(true);

    try {
      const res = await fetchWithUserId(user, "/problem/completeStep", {
        method: "POST",
        body: JSON.stringify({
          missionId: responseData.mission.id,
          updateStepNum: responseData.order + 1,
        }),
      });

      if (!res.ok) {
        throw new Error("進行状況の保存に失敗");
      }

      setIsCorrect(true);

      setSnackbar({
        open: true,
        message: "進行状況を保存しました",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "進行状況の保存に失敗しました",
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const goToNextExam = () => {
    setExamNum(examNum + 1);
    setInputValue("");
    setIsCorrect(null);
    setShowAnswer(false);
  }

  const goNextStep = () => {
    const nextStep = responseData.mission.steps.find((s) => s.order === currentOrder + 1);
    if (nextStep) {
      navigateWithUpdateUsageTime(user, router, `/problem/step-explain/${nextStep.id}`, startTime.current, "push");
    }
  };

  const goMissionExam = () => {
    router.push(`/problem/mission-exam/${responseData.mission.id}`);
  };

  return (
    <div className="bg-indigo-50 min-h-screen w-full relative">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={700} gravity={0.2} />}
      {/* ヘッダーは container の外に */}
      <BackHeader 
        title="ミッション確認へ戻る" 
        onClick={() => navigateWithUpdateUsageTime(user, router, `/problem/mission-confirm/${responseData.mission.id}`, startTime.current, "replace")}
      />

      <div className="container mx-auto p-6 flex flex-col gap-6">
        <Typography variant="h4" className="text-center mb-4 font-bold">{responseData.title}</Typography>

        <div className="flex items-center gap-2 mb-4 justify-center">
          <span className="text-sm text-gray-500">試験進捗:</span>
          <div className="flex gap-1">
            {responseData.stepExams.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${index < examNum ? "bg-green-500" : index === examNum ? "bg-blue-500" : "bg-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">{examNum + 1} / {responseData.stepExams.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="w-full p-6">
            <CardHeader title={<Typography variant="h6">🎯 テーマ／目標画面</Typography>} />
            <CardContent>
              {responseData.stepExams[examNum].componentType !== null ? (
                <>
                  <Typography className="text-gray-700 mb-4">
                    テーマ／目標画面はこちらです
                  </Typography>
                  <div className="border-2 border-indigo-500 rounded-md p-4">
                    {getMissionComponent(
                      responseData.mission.component || "",
                      responseData.stepExams[examNum].highlight || "",
                      responseData.stepExams[examNum].componentType || "",
                    )}
                  </div>
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-400 rounded-md p-6 text-center text-gray-600 bg-gray-50">
                  <Typography className="text-base mb-2 font-medium">
                    💡 コードの記述に挑戦しましょう
                  </Typography>
                  <Typography className="text-sm">
                    分からない点は検索や生成AIに頼りましょう。
                  </Typography>
                </div>
              )}
              {/* instruction list（課題条件） */}
              {responseData.stepExams[examNum].instructions &&
                responseData.stepExams[examNum].instructions.length > 0 && (
                  <div className="mt-4">
                    <InstructionList
                      instructions={responseData.stepExams[examNum].instructions}
                      title="今回の課題条件はこちらです："
                    />
                  </div>
                )}
            </CardContent>
          </Card>

          <Card className="w-full p-4 border-2 border-blue-300 bg-blue-50">
            <CardHeader title={
              <Typography>
                {responseData.stepExams[examNum].supporter.imagePath}{" "}
                {responseData.stepExams[examNum].supporter.name}からの試験 ステップ {examNum + 1}
              </Typography>
            } />
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
                  {responseData.stepExams[examNum].supporter.imagePath}
                </div>
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-sm relative flex-1">
                  <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-100 border-l border-b border-blue-300 rotate-45"></div>
                  <p>{responseData.stepExams[examNum].content}</p>
                </div>
              </div>

              <p className="mt-3">📝コードを入力してください</p>
              <Textarea
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setIsCorrect(null); }}
                className="w-full h-32 p-2 border border-gray-300 rounded-md font-mono text-sm"
                placeholder="ここにコードを書いてください..."
              />

              <div className="flex justify-end gap-2 mt-4">
                {/* <MUIButton variant="outlined" color="primary">💡 ヒント</MUIButton> */}
                <MUIButton variant="outlined" color="primary" onClick={() => setShowAnswer(!showAnswer)}>
                  {showAnswer ? "解答表示中" : "👀 解答を見る"}
                </MUIButton>
                {isCorrect ? (
                  examNum + 1 !== responseData.stepExams.length ? (
                    <MUIButton variant="contained" color="primary" onClick={goToNextExam} disabled={isSaving}>次へ→</MUIButton>
                  ) : !isLastStep ? (
                    <MUIButton variant="contained" color="primary" onClick={goNextStep} disabled={isSaving}>次のステップへ→</MUIButton>
                  ) : (
                    <MUIButton variant="contained" color="primary" onClick={goMissionExam} disabled={isSaving}>ミッション試験へ</MUIButton>
                  )
                ) : (
                  <MUIButton
                    variant="contained"
                    color="primary"
                    onClick={handleAnswerOnclick}
                    disabled={isSaving}
                  >
                    {isSaving ? "保存中..." : "解答する"}
                  </MUIButton>

                )}
              </div>

              {showAnswer && (
                <div className="mt-3 bg-black text-green-200 font-mono text-sm p-3 rounded-md overflow-x-auto">
                  <ReactMarkdown>
                    {responseData.stepExams[examNum].answer || ""}
                  </ReactMarkdown>
                </div>
              )}

              {isCorrect === true && (
                <div className={`mt-2 p-2 bg-green-600 text-white rounded-md text-sm transform transition-transform duration-500 ${showScale ? "scale-125" : "scale-100"}`}>
                  ✅ 正解！
                </div>
              )}
              {isCorrect === false && (
                <div className="mt-2 p-2 bg-red-600 text-white rounded-md text-sm">
                  ❌ 不正解
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
