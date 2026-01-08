"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MissionResultResponse } from "@/type";
import { MissionDifficultyBadge } from "@/app/component/common/missionDifficultyConfig";
import Confetti from "react-confetti";
import { SentenceDialog } from "../component/sentenceDialog";
import { Card, CardContent, CardHeader, Typography, Skeleton, Button, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress } from "@mui/material";
import { formatSecondsToHM } from "@/utils/formatTime";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchWithUserId } from "@/utils/fetchers";

// NotificationDialog コンポーネント（見た目改良版）
interface NotificationDialogProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  isLast?: boolean;
  onNext: () => void;
  onGoHome?: () => void;
}

function NotificationDialog({ open, title, content, isLast, onNext, onGoHome }: NotificationDialogProps) {
  return (
    <Dialog open={open} onClose={isLast ? onGoHome : onNext} maxWidth="xs" fullWidth>
      <Card className="rounded-2xl shadow-lg p-4 bg-white">
        <DialogTitle>
          <Typography variant="h6" component="span" className="font-bold text-indigo-700 text-center">{title}</Typography>
        </DialogTitle>
        <DialogContent>
          <div className="mt-2">{content}</div>
        </DialogContent>
        <DialogActions className="justify-center mt-2">
          <Button
            variant="contained"
            color="primary"
            className="rounded-xl px-6 py-2 font-semibold"
            onClick={isLast ? onGoHome : onNext}
          >
            {isLast ? "🏠 ホームへ戻る" : "次へ"}
          </Button>
        </DialogActions>
      </Card>
    </Dialog>
  );
}

export default function ResultPage() {
  const [responseData, setResponseData] = useState<MissionResultResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [shortFeedback, setShortFeedback] = useState("");

  const [notificationQueue, setNotificationQueue] = useState<{ title: string; content: React.ReactNode }[]>([]);
  const [currentNotification, setCurrentNotification] = useState<{ title: string; content: React.ReactNode; isLast?: boolean } | null>(null);

  const [user, setUser] = useState<User | null>();
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async(user) => {
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async() => {
      const res = await fetchWithUserId(user, "/problem/missionResult", {
        method: "POST", 
        body: JSON.stringify({
          missionId: id,
        })}
      );
      const json: MissionResultResponse = await res?.json();
      setResponseData(json);

      setDialogOpen(true);

      const totalExp = json.experienceUpdate.oldExperience + json.experienceUpdate.gainedExperience;
      const requiredExp = json.experienceUpdate.levelUps[0].requiredExperience;

      // 余りの計算
      const displayedExp = totalExp % requiredExp;

      // パーセンテージ（%）計算
      const progressValue = (displayedExp / requiredExp) * 100;
      // 通知データを見た目重視で作成
      const notifications = [
        {
          title: "⭐ 獲得EXP",
          content: (
            <div className="p-2 text-center">
              <div className="flex justify-center items-center gap-4 mb-4">
                <Typography className="font-semibold text-indigo-700">
                  Lv. {json.experienceUpdate.oldLevel}
                </Typography>
                <span className="text-2xl">→</span>
                <Typography className="font-semibold text-indigo-700">
                  Lv. {json.experienceUpdate.newLevel}
                </Typography>
              </div>

              {/* 元の経験値バー */}
              <div className="mb-2">
                <LinearProgress
                  variant="determinate"
                  value={
                    (json.experienceUpdate.oldExperience /
                      json.experienceUpdate.levelUps[0].requiredExperience) *
                    100
                  }
                  className="h-4 rounded-full"
                />
                <Typography variant="caption" className="text-gray-500">
                  {json.experienceUpdate.oldExperience} /{" "}
                  {json.experienceUpdate.levelUps[0].requiredExperience} EXP
                </Typography>
              </div>

              <div className="my-3 text-2xl">⬇</div>

              {/* 新しい経験値バー */}
              <div>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  className="h-4 rounded-full"
                />
                <Typography variant="caption" className="text-gray-500">
                  {displayedExp} / {requiredExp} EXP
                </Typography>
              </div>
            </div>
          ),
        },
        // {
        //   title: "🏆 実績達成",
        //   content: (
        //     <ul className="list-none p-2 space-y-1">
        //       {json.missionData.steps.map((step) => (
        //         <li
        //           key={step.title}
        //           className="flex items-center gap-2 px-2 py-1 bg-indigo-50 rounded-lg"
        //         >
        //           <span className="text-green-600 font-bold">✔️</span>
        //           <span className="text-indigo-700 font-semibold">{step.title}</span>
        //         </li>
        //       ))}
        //     </ul>
        //   ),
        // },
      ];

      if (json.updatedRank) { 
        notifications.push({
          title: "🎖 ランクアップ",
          content: (
            <div className="text-center p-2">
              <Typography className="text-yellow-500 font-extrabold text-2xl">
                🎉 ランクアップ！
              </Typography>
              <Typography className="text-gray-600 mt-1">
                新しいランク: {json.user.rank.name}
              </Typography>
            </div>
          ),
        });
      }
      setNotificationQueue(notifications);
      //フィードバックがある場合は短縮版をセット
      if (json.examResult[0].judgeType === "WITH_FEEDBACK" && json.examResult[0].feedback) {
        setShortFeedback(json.examResult[0].feedback.slice(0, 60) + "..."); // 最初の60文字だけ取得
      }
    };
    fetchData();
  }, [user, id]);

  if (!responseData) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-md rounded-2xl">
            <CardHeader>
              <Skeleton variant="text" width={150} height={28} />
            </CardHeader>
            <CardContent>
              <Skeleton variant="rectangular" height={80} className="rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const handleNextNotification = () => {
    if (notificationQueue.length > 0) {
      const [next, ...rest] = notificationQueue;
      const isLast = rest.length === 0;
      setCurrentNotification({ ...next, isLast });
      setNotificationQueue(rest);
    } else {
      setCurrentNotification(null);
      router.push("/home");
    }
  };

  return (
    <div className="bg-gradient-to-b from-indigo-100 via-white to-indigo-50 min-h-screen p-6">
      <Confetti recycle={false} numberOfPieces={300} />
      {/* 会話ダイアログ */}
      <SentenceDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setShowResult(true);
        }}
        sentences={responseData.missionData.afterSentences}
        onGoHome={() => router.push("/home")}
      />


      {/* リザルト画面 */}
      {showResult && (
        <>
          {/* 🎉 ヒーローセクション */}
          <div className="text-center mb-10">
            <Typography variant="h3" className="font-extrabold text-indigo-600 drop-shadow-lg">
              🎉 ミッション達成！ 🎉
            </Typography>
            <Typography variant="subtitle1" className="mt-3 text-gray-700">
              よく頑張りました！ あなたの努力が形になりました 🚀
            </Typography>
          </div>

          {/* 🌟 完了したミッション */}
          <Card className="bg-white shadow-lg rounded-2xl p-6 max-w-4xl mx-auto mb-8">
            <CardHeader title="📌 完了したミッション" />
            <CardContent>
              <Typography variant="h5" className="text-indigo-700 font-semibold">
                {responseData.missionData.title}
                <MissionDifficultyBadge difficulty={responseData.missionData.difficulty.name} />
              </Typography>
              <Typography className="mt-2 text-gray-600">{responseData.missionData.detail}</Typography>
            </CardContent>
          </Card>

          {/* 📝 学習結果（最新1件） */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            <Card className="shadow-md rounded-2xl text-center">
              <CardHeader title="✅ 合否判定" />
              <CardContent>
                <Typography
                  variant="h5"
                  className={`font-extrabold ${responseData.examResult[0].isPassed ? "text-green-600" : "text-red-500"}`}
                >
                  {responseData.examResult[0].isPassed ? "合格 🎉" : "不合格 ❌"}
                </Typography>
              </CardContent>
            </Card>

            <Card className="shadow-md rounded-2xl text-center">
              <CardHeader title="⭐ スコア" />
              <CardContent>
                <Typography variant="h4" className="text-indigo-600 font-extrabold">
                  {responseData.examResult[0].point}/100
                </Typography>
                <div className="w-full bg-gray-200 rounded h-3 mt-3">
                  <div
                    className="h-3 rounded bg-indigo-500"
                    style={{ width: `${responseData.examResult[0].point}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
            {/* フィードバックがあるなら */}
            {responseData.examResult[0].judgeType === "WITH_FEEDBACK" && (
              <Card className="shadow-md rounded-2xl text-center">
                <CardHeader title="🤖 AIフィードバック" />
                <CardContent>
                  <Typography className="text-gray-700 whitespace-pre-line">
                    {shortFeedback}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 📊 過去の試験結果履歴 */}
          <Card className="bg-white shadow-md rounded-2xl p-6 max-w-4xl mx-auto mb-10">
            <CardHeader title="📊 過去の試験結果履歴" />
            <CardContent className="space-y-4">
              {responseData.examResult.map((progress, idx) => {
                const date = new Date(progress.createdAt);
                return (
                  <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-none">
                    <Typography className="text-gray-600 text-sm">{date.toLocaleString("ja-JP")}</Typography>
                    <Typography className={`font-bold ${progress.isPassed ? "text-green-600" : "text-red-500"}`}>
                      {progress.point} 点 {progress.isPassed ? "（合格）" : "（不合格）"}
                    </Typography>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 🎁 獲得リザルト */}
          <Card className="bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-2xl shadow-md p-8 max-w-4xl mx-auto mb-10">
            <CardHeader title="🎁 獲得リザルト" />
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl">📚</p>
                  <p className="font-bold text-lg">学習ステップ数</p>
                  <p className="text-indigo-700 font-extrabold text-xl">{responseData.missionData._count.steps}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl">⭐</p>
                  <p className="font-bold text-lg">獲得EXP</p>
                  <p className="text-indigo-700 font-extrabold text-xl">{responseData.missionData.experience}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl">⌛</p>
                  <p className="font-bold text-lg">学習時間</p>
                  <p className="text-indigo-700 font-extrabold text-xl">
                    {formatSecondsToHM(responseData.dayUsagetime)} / {formatSecondsToHM(responseData.weekUsagetime)} / {formatSecondsToHM(responseData.totalUsagetime)}
                  </p>
                  <p className="text-xs text-gray-500">日 / 週 / 総計</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ✔️ 習得スキル */}
          <Card className="bg-white rounded-2xl shadow-md p-6 max-w-4xl mx-auto mb-10">
            <CardHeader title="💡 習得したスキル" />
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {responseData.missionData.steps.map((step) => (
                  <span key={step.title} className="px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-full shadow-sm">
                    ✔️ {step.title}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

      {/* 通知開始ボタン */}
      {showResult && notificationQueue.length > 0 && !currentNotification && (
        <div className="text-center mt-8">
          <Button
            variant="contained"
            className="px-6 py-3 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
            onClick={handleNextNotification}
          >
            🔔 獲得報告を見る
          </Button>
        </div>
      )}

      {/* NotificationDialog */}
      {currentNotification && (
        <NotificationDialog
          open={true}
          title={currentNotification.title}
          content={currentNotification.content}
          isLast={currentNotification.isLast}
          onNext={handleNextNotification}
          onGoHome={() => router.push("/home")}
        />
      )}
      </>
      )}
    </div>
  );
}
