"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Skeleton,
  LinearProgress,
  Button as MUIButton,
} from "@mui/material";
import { MissionSelectResponse, MISSION_TYPE, MISSION_STATUS_TYPE } from "@/type";
import { BackHeader } from "@/app/component/common/backHeader";
import { MissionDifficultyBadge } from "../../component/common/missionDifficultyConfig";
// import { getMissionTypeStyle } from "../../component/common/missionTypeConfig";
import { NavBar } from "@/app/component/common/navBar";
import { Award, Target, Zap } from "lucide-react";
import { getMissionTypeConfig } from "@/app/component/common/missionTypeConfig";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { fetchWithUserId } from "@/utils/fetchers";

// ミッション状態バッジ
const MissionStatusBadge = ({ status }: { status: MISSION_STATUS_TYPE }) => {
  const config = {
    [MISSION_STATUS_TYPE.NOT_STARTED]: { label: "未開始", color: "bg-gray-300 text-gray-700" },
    [MISSION_STATUS_TYPE.IN_PROGRESS]: { label: "進行中", color: "bg-yellow-300 text-yellow-800" },
    [MISSION_STATUS_TYPE.COMPLETED]: { label: "完了", color: "bg-green-300 text-green-800" },
    [MISSION_STATUS_TYPE.CANCELED]: { label: "中止", color: "bg-red-300 text-red-800" },
  };

  const { label, color } = config[status] ?? config[MISSION_STATUS_TYPE.NOT_STARTED];
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
};

export default function MissionSelectPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [responseData, setResponseData] = useState<MissionSelectResponse[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (!user) {
        router.push("/auth/login");
        return;
      }
      setUser(user);
    });

    return () => unsub();
  }, [router]);
  //missionSelectAPIに通信
  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchData = async () => {
      const res = await fetchWithUserId(user, "/problem/missionSelect", {method: "POST"});
      const json: MissionSelectResponse[] = await res.json();
      setIsLoading(false);
      setResponseData(json);
    }

    fetchData();
  }, [user])

  const mainMissions = responseData.filter((m) => m.type === MISSION_TYPE.MAIN);
  const subMissions = responseData.filter((m) => m.type === MISSION_TYPE.SUB);
  const promotionMissions = responseData.filter((m) => m.type === MISSION_TYPE.PROMOTION);

  const MissionCard = ({ mission }: { mission: MissionSelectResponse }) => {
    const progressPercent = Math.round(
      ((mission.missionProgresses[0].currentStep - 1) / (mission._count.steps + 1)) * 100
    );

    return (
      <Card
        className={`w-[500px] border-2 hover:shadow-lg transition cursor-pointer ${getMissionTypeConfig(mission.type).color}`}
      >
        <CardContent className="p-6">
          <div className="flex gap-2 mb-4">
            <MissionDifficultyBadge difficulty={mission.difficulty.name} star={mission.star} />
            <MissionStatusBadge status={mission.missionProgresses[0].status} />
          </div>

          <div className="flex gap-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl">
              {mission.client.imagePath}
            </div>

            <div className="flex flex-col flex-1 gap-2">
              <Typography variant="h6">{mission.title}</Typography>
              <span className="text-sm font-medium">{mission.client.name}</span>
              <Typography variant="body2" className="text-gray-700">
                {mission.detail}
              </Typography>

              <div className="mt-2 space-y-1">
                <LinearProgress variant="determinate" value={progressPercent} className="h-2 rounded-full" />
                <span className="text-xs text-gray-600">{progressPercent}% 完了</span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardActions className="flex justify-end p-4">
          <MUIButton
            variant="contained"
            color="primary"
            onClick={() => router.push(`/problem/mission-confirm/${mission.id}`)}
          >
            挑戦する
          </MUIButton>
        </CardActions>
      </Card>
    );
  };

  const renderSkeleton = () => (
    <Card className="w-[500px] p-6 border-2 animate-pulse">
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Skeleton variant="rectangular" width={60} height={24} />
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
        <div className="flex gap-6">
          <Skeleton variant="rectangular" width={64} height={64} className="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="rectangular" width="80%" height={20} />
            <Skeleton variant="rectangular" width="50%" height={16} />
            <Skeleton variant="rectangular" width="100%" height={16} />
            <Skeleton variant="rectangular" width="100%" height={8} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Skeleton variant="rectangular" width={100} height={36} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-indigo-50 pb-20">
      <NavBar />
      <BackHeader 
        title="ホームへ戻る" 
        onClick={() => router.replace("/home")} 
      />
      <div className="mt-6"/>
      {/* 昇進ミッションセクション */}
      {promotionMissions.length > 0 && (
        <>
          <div className="border-t-2 border-gray-300 my-4" />
          <div>
            <h2 className="text-lg font-bold mb-4 text-purple-600 flex items-center gap-2">
              <Award className="w-5 h-5" /> 昇進ミッション
            </h2>
            <div className="flex flex-wrap gap-6">
              {isLoading
                ? Array.from({ length: 1 }).map((_, i) => <div key={i}>{renderSkeleton()}</div>)
                : promotionMissions.map((mission) => (
                    <MissionCard key={mission.id} mission={mission} />
                  ))}
            </div>
          </div>
          <div className="border-t-2 border-gray-300 my-4" />
        </>
      )}

      <div>
        <h2 className="text-lg font-bold mb-4 text-red-600 flex items-center gap-2">
          <Zap className="w-5 h-5" />メインミッション
        </h2>
        <div className="flex flex-wrap gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i}>{renderSkeleton()}</div>)
            : mainMissions.map((mission) => <MissionCard key={mission.id} mission={mission} />)}
        </div>
      </div>

      <div className="border-t-2 border-gray-300 my-4" />

      <div>
        <h2 className="text-lg font-bold mb-4 text-blue-600 flex items-center gap-2">
          <Target className="w-5 h-5"/>サブミッション
        </h2>
        <div className="flex flex-wrap gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i}>{renderSkeleton()}</div>)
            : subMissions.map((mission) => <MissionCard key={mission.id} mission={mission} />)}
        </div>
      </div>
    </div>
  );
}
