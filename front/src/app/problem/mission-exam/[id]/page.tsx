"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MissionExamRepsonse,
  MissionExamAIResponse,
  MISSION_EXAM_TPYE,
  MISSION_EXAM_LANGUAGE,
  JUDGE_TYPE,
  FailedConnectionResponse,
} from "@/type";
import { BackHeader } from "@/app/component/common/backHeader";
import { navigateWithUpdateUsageTime } from "../../common/common";
import { BaseExamLayout } from "../components/baseExamLayout";
import { BaseExamLayoutSkeleton } from "../components/baseExamLayoutSkeleton";
import { ObjectScreen } from "../components/objectScreen";
import { InstructionList } from "../components/instructionList";
import { HybridExamScreen } from "../components/hybridScreen";
import { NavBar } from "@/app/component/common/navBar";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchWithoutUserId, fetchWithUserId } from "@/utils/fetchers";
import { Alert, Snackbar } from "@mui/material";

export default function MissionExamPage() {
  const [responseData, setResponseData] = useState<MissionExamRepsonse | null>(null);
  const [codes, setCodes] = useState<{ [key in MISSION_EXAM_LANGUAGE]?: string }>({});
  const [currentLanguage, setCurrentLanguage] = useState<MISSION_EXAM_LANGUAGE>(MISSION_EXAM_LANGUAGE.HTML);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [aiResponseData, setAIResponseData] = useState<MissionExamAIResponse | null>(null);
  const [hasPassed, setHasPassed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSelectingFeedback, setIsSelectingFeedback] = useState(false);
  const [isFeedbackConfirmed, setIsFeedbackConfirmed] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "warning" | "error";
  }>({
    open: false,
    message: "",
    severity: "success"
  });
  const router = useRouter();
  const { id } = useParams();
  const startTime = useRef(new Date());
  const [user, setUser] = useState<User | null>(null);

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
  // missionExam API
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const res = await fetchWithoutUserId("/problem/missionExam", {
        method: "POST",
        body: JSON.stringify({ missionId: id }),
      });
      const json: MissionExamRepsonse = await res.json();
      setResponseData(json);

      json.exam.language.forEach((langu) => {
        setCodes((prev) => ({
          ...prev,
          [langu]: prev[langu] || "",
        }));
      });
      setCurrentLanguage(json.exam.language[0]);
    };

    fetchData();
  }, [user, id]);

  // AI判定ボタン
  const handleOnClickAIJudge = async () => {
    if (!responseData || !user) return;

    setIsEvaluating(true);
    const res = await fetchWithUserId(user, "/problem/missionExamAIJudge", {
      method: "POST",
      body: JSON.stringify({
        missionId: responseData.id,
        examId: responseData.exam.id,
        userCode: codes,
      })
    });

    if (!res.ok) {
      const json: FailedConnectionResponse = await res.json();
      setSnackbar({
        open: true,
        message: json.message,
        severity: "error"
      });
      setIsEvaluating(false);
      return;
    }
    
    const json: MissionExamAIResponse = await res.json();

    setAIResponseData(json);
    setHasPassed(json.isPassed);

    setSelectedIndex(null);
    setIsFeedbackConfirmed(false);

    setIsEvaluating(false);
  };

  //共有ボタン
  const handleShare = async() => {
    if (!responseData || !user) return;
    setIsSharing(true);

    const res = await fetchWithUserId(user, "/share/create", {
      method: "POST",
      body: JSON.stringify({
        examId: responseData.exam.id
      })
    });

    if (res.ok) {
      setSnackbar({
        open: true,
        message: "結果を共有しました🎉",
        severity: "success"
      });
    }
    else if (res.status === 404) {
      setSnackbar({
        open: true,
        message: "すでに共有されています",
        severity: "warning"
      })
    }
    else {
      setSnackbar({
        open: false,
        message: "共有に失敗しました",
        severity: "error"
      })
    }
    setIsSharing(false);
  }

  const handleSelectFeedback = async() => {
    if (!responseData || !user || selectedIndex == null || selectedIndex == undefined || !aiResponseData) return;

    setIsSelectingFeedback(true);
    
    const res = await fetchWithUserId(user, "/problem/selectFeedback", {
      method: "POST",
      body: JSON.stringify({
        progressId: aiResponseData?.progressId,
        selectedIndex: selectedIndex,
        selectedJudgeType: aiResponseData.feedbacks[selectedIndex].type
      })
    });

    if (res.ok) {
      setSnackbar({
        open: true,
        message: "選択した内容を保存しました🎉",
        severity: "success"
      });
      setIsFeedbackConfirmed(true);
    }
    else {
      const json: FailedConnectionResponse = await res.json();
      setSnackbar({
        open: false,
        message: json.message || "保存に失敗しました",
        severity: "error"
      });
    }

    setIsSelectingFeedback(false);
  }

  // ローディング状態
  if (!responseData) {
    return (
      <div className="bg-indigo-50 min-h-screen w-full p-6">
        <BackHeader title="ミッション確認へ戻る" onClick={() => router.back()} />
        <BaseExamLayoutSkeleton />
      </div>
    );
  }

  const examType = responseData.exam.type;

  return (
    <div className="min-h-screen bg-indigo-50 pb-20">
      <NavBar />
      <BackHeader
        title="ミッション確認へ戻る"
        onClick={() =>
          navigateWithUpdateUsageTime(
            user,
            router,
            `/problem/mission-confirm/${responseData.id}`,
            startTime.current,
            "replace"
          )
        }
      />

      <div className="mt-6" />
      <BaseExamLayout
        title={responseData.title}
        userCode={codes[currentLanguage] || ""}
        currentLanguage={currentLanguage}
        languages={responseData.exam.language}
        isEvaluating={isEvaluating}
        isSharing={isSharing}
        aiResponseData={aiResponseData}
        hasPassed={hasPassed}
        selectedIndex={selectedIndex}
        isSelectingFeedback={isSelectingFeedback}
        isFeedbackConfirmed={isFeedbackConfirmed}
        setSelectedIndex={setSelectedIndex}
        onChangeLanguage={(lang) => setCurrentLanguage(lang)}
        onChangeCode={(code) => setCodes({ ...codes, [currentLanguage]: code })}
        onEvaluate={handleOnClickAIJudge}
        onGoResult={() =>
          navigateWithUpdateUsageTime(
            user, 
            router,
            `/problem/result/${responseData.id}`,
            startTime.current,
            "push"
          )
        }
        onShare={handleShare}
        onSelectFeedback={handleSelectFeedback}
      >
        {examType === MISSION_EXAM_TPYE.REPRODUCTION && (
          <ObjectScreen componentName={responseData.exam.component} />
        )}

        {examType === MISSION_EXAM_TPYE.FREE_CREATION && (
          <InstructionList instructions={responseData.exam.instructions} title="以下の条件を満たしてください：" />
        )}

        {examType === MISSION_EXAM_TPYE.HYBRID && (
          <HybridExamScreen
            componentName={responseData.exam.component}
            instructions={responseData.exam.instructions}
            title="以下の条件を満たしてください："
          />
        )}
      </BaseExamLayout>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{vertical: "bottom", horizontal: "center"}}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
