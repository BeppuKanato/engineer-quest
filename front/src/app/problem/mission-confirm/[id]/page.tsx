"use client";

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Skeleton,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MISSION_STATUS_TYPE, MissionConfirmResponse } from "@/type";
import { BackHeader } from "@/app/component/common/backHeader";
import { getMissionComponent } from "../../mapping";
import { MissionExamTypeBadge } from "@/app/component/common/missionExamTypeIcon";
import { NavBar } from "@/app/component/common/navBar";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchWithUserId } from "@/utils/fetchers";

export default function MissionConfirmPage() {
  const [responseData, setResponseData] = useState<MissionConfirmResponse | null>(null);
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
    });

    return () => unsub();
  }, [router])

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchData = async() => {
      const res = await fetchWithUserId(user, "/problem/missionConfirm", {method: "POST", body: JSON.stringify({missionId: id})})
      const json: MissionConfirmResponse = await res.json();
      setResponseData(json);
      setLoading(false);
    };

    fetchData();
  }, [user, id]);

  //ミッションを開始状態に変更
  const startMission = async (missionId: string) => {
    if (!user) {
      return;
    }
    await fetchWithUserId(user, "/problem/startMission", {method: "POST", body: JSON.stringify({missionId})});
  };

  //ミッション開始処理
  const handleStartMission = async () => {
    if (!responseData) return;

    const progress = responseData.missionProgresses[0];
    const currentStep = progress?.currentStep ?? 1;
    const totalSteps = responseData.steps.length;
    const isExam = currentStep > totalSteps; // ステップ完了済なら試験へ
    const stepId = responseData.steps[Math.max(0, currentStep - 1)]?.id;

    try {
      // 初回なら進捗開始
      if (progress?.status === MISSION_STATUS_TYPE.NOT_STARTED) {
        await startMission(String(id));
      }

      // ステップか試験かで分岐
      if (isExam) {
        router.push(`/problem/mission-exam/${id}`);
      } else {
        router.push(`/problem/step-explain/${stepId}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const stepNum = responseData?.steps.length ?? 0;
  const lessonNum =
    responseData?.steps.reduce(
      (acc, step) => acc + step._count.explains + step._count.stepExams,
      0
    ) ?? 0;

  const exam = responseData?.exam;

  return (
    <div className="min-h-screen bg-indigo-50 pb-20">
      <NavBar />
      <BackHeader
        title="ミッション一覧へ戻る"
        onClick={() => router.replace("/problem/mission-select")}
      />

      <div className="mt-6"/>

      {/* 目標カード */}
      <Card className="w-full max-w-2xl mx-auto p-6">
        <CardHeader title={<Typography variant="h6" fontWeight="bold">🎯 テーマ／目標画面</Typography>} />
        <CardContent>
          {loading ? (
            <Skeleton variant="rectangular" height={100} className="mb-4" />
          ) : (
            <>
              <Typography className="text-gray-700 mb-4">
                テーマ／目標はこちらです
              </Typography>
              <Card className="border-2 border-indigo-500 p-4">
                {getMissionComponent(responseData?.component || "", "", "")}
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      {/* 学習内容カード */}
      {stepNum > 0 && (
        <Card className="w-full max-w-2xl mx-auto p-6">
          <CardHeader
            title={
              <div className="flex items-center justify-between">
                <Typography variant="h6" fontWeight="bold">
                  📚 学習内容
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {stepNum} ステップ / {lessonNum} レッスン
                </Typography>
              </div>
            }
          />
          <CardContent className="flex flex-col gap-4">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={80} className="rounded-md" />
                ))
              : responseData?.steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const currentStep = responseData.missionProgresses[0].currentStep ?? 1;
                  const isCompleted = stepNumber < currentStep;
                  const isNext = stepNumber === currentStep;

                  return (
                    <Card
                      key={step.id}
                      className={`p-4 flex flex-col gap-2 ${
                        isCompleted
                          ? "bg-green-100 border border-green-300"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                              isCompleted
                                ? "bg-green-500 text-white"
                                : "bg-indigo-500 text-white"
                            }`}
                          >
                            {stepNumber}
                          </span>
                          {isNext && (
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                              ▶ ここから
                            </span>
                          )}
                        </div>
                        <Typography variant="body2" color="textSecondary">
                          レッスン: {step._count.explains + step._count.stepExams}
                        </Typography>
                      </div>
                      <Typography fontWeight="medium">{step.title}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {step.detail}
                      </Typography>
                    </Card>
                  );
                })}
          </CardContent>
        </Card>
      )}

      {/* 🧠 試験情報カード */}
      {exam && (
        <Card className="w-full max-w-2xl mx-auto p-6 border border-indigo-200">
          <CardHeader
            title={
              <Typography variant="h6" fontWeight="bold">
                🧠 試験内容
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="textSecondary">
                この試験では、これまで学んだ内容を活かして成果物を完成させます。
              </Typography>
            }
            action={<MissionExamTypeBadge type={exam.type} />}
          />
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              実施要件
            </Typography>
            <List dense>
              {exam.instructions.map((item, i) => (
                <ListItem key={i}>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
            {exam.criteria?.score && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                合格ライン：{exam.criteria.score}点（AIによる自動採点）
              </Typography>
            )}
          </CardContent>
          <CardActions className="flex justify-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartMission}
            >
              ✏️ ミッションスタート              
            </Button>
          </CardActions>
        </Card>
      )}
    </div>
  );
}
