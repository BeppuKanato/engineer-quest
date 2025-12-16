"use client";

import { HomePageResponse, MISSION_TYPE, MissionSentence } from "@/type";
import { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Skeleton,
  LinearProgress,
} from "@mui/material";
import { Star } from "lucide-react";
import { MissionDialog } from "./component/missionDialog";
import { MissionSnackbar } from "./component/acceptSnackbar";
import { NavBar } from "../component/common/navBar";
import { MissionTypeBadge, getMissionTypeConfig } from "../component/common/missionTypeConfig";
import { MissionDifficultyBadge } from "../component/common/missionDifficultyConfig";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { fetchWithUserId } from "@/utils/fetchers";

export default function HomePage() {
  const [responseData, setResponseData] = useState<HomePageResponse | null>(null);
  const [showMissionSentence, setShowMissionSentence] = useState(false);
  const [missionSentence, setMissionSentence] = useState<MissionSentence | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [user, setUser] = useState<User | null>();
  
  const router = useRouter();

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
  //HomeAPIへ通信
  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchData = async() => {
      const res = await fetchWithUserId(user, "/home", {method: "POST"});
      const json: HomePageResponse = await res?.json();
      setResponseData(json);
    };

    fetchData();
  }, [user]);

  const onClickMissionCard = (
    id: string,
    title: string,
    detail: string,
    type: MISSION_TYPE,
    sentences: {
      sentence: string;
      speaker: { name: string; imagePath: string };
    }[]
  ) => {
    setMissionSentence({ id, title, detail, type, sentences });
    setShowMissionSentence(true);
  };

  const onClickMissionAccept = async (
    missionId: string,
    missionTitle: string
  ) => {
    if(!user) return;
    await fetchWithUserId(user, "/home/acceptMission", {method: "POST", body: JSON.stringify({missionId})});
    setResponseData((prev) =>
      prev
        ? {
            ...prev,
            acceptableMission: prev.acceptableMission.filter((m) => m.id !== missionId),
          }
        : prev
    );
    setSnackbarMessage(`ミッション「${missionTitle}」を受注しました！`);
    setShowSnackbar(true);
    setShowMissionSentence(false);
  };

  return (
    <div className="min-h-screen bg-indigo-50 pb-20">
      <NavBar />

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4 sticky top-0 z-40 flex items-center justify-between">
        {responseData ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg">
              🙂
            </div>
            <div>
              <p className="font-medium">{responseData.user.rank.name}</p>
              <p className="text-xs text-gray-500">CodeQuest</p>
            </div>
          </div>
        ) : (
          <Skeleton variant="rectangular" width={150} height={24} />
        )}
        <div className="flex items-center gap-3">
          {responseData ? (
            <>
              <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-yellow-700 text-sm font-medium">
                <Star className="w-4 h-4" /> Lv.{responseData.user.level}
              </div>
              <LinearProgress
                variant="determinate"
                value={
                  (responseData.user.experience /
                    responseData.user.levelRequirement.requiredExperience) * 100
                }
                className="w-24 h-2 rounded-full"
              />
            </>
          ) : (
            <Skeleton variant="rectangular" width={100} height={24} />
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
        {responseData ? (
          <Card className="p-4 shadow-sm">
            <Typography className="text-lg font-bold text-orange-600">
              {responseData.user.experience}
            </Typography>
            <Typography className="text-xs text-gray-500">総EXP</Typography>
          </Card>
        ) : (
          <Skeleton variant="rectangular" height={72} />
        )}
      </div>

      {/* Missions */}
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <h2 className="text-lg font-bold mb-2">受注可能なミッション</h2>
        {responseData?.acceptableMission ? (
          responseData.acceptableMission.map((mission) => {
            const typeConfig = getMissionTypeConfig(mission.type);

            return (
              <Card
                key={mission.id}
                variant="outlined"
                className="flex items-center gap-4 p-4 hover:shadow-lg transition cursor-pointer border-2"
                onClick={() =>
                  onClickMissionCard(
                    mission.id,
                    mission.title,
                    mission.detail,
                    mission.type,
                    mission.beforeSentences.map((s) => ({
                      sentence: s.sentence,
                      speaker: {
                        name: s.speaker.name,
                        imagePath: s.speaker.imagePath,
                      },
                    }))
                  )
                }
                style={{
                  borderColor: typeConfig.color,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                  {mission.client.imagePath}
                </div>
                <div className="flex-1">
                  <Typography className="text-sm font-medium">{mission.title}</Typography>
                  <Typography className="text-xs text-gray-500 line-clamp-2">
                    {mission.detail}
                  </Typography>
                </div>

                <div className="flex flex-col gap-1 items-end text-xs">
                  {/* ミッションタイプ */}
                  <MissionTypeBadge type={mission.type} />

                  {/* ✅ 難易度バッジをコンポーネント化 */}
                  <MissionDifficultyBadge difficulty={mission.difficulty.name} />
                </div>
              </Card>
            );
          })
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={72} className="rounded-lg" />
          ))
        )}
      </div>

      {/* Dialog */}
      {missionSentence && (
        <MissionDialog
          isOpen={showMissionSentence}
          mission={missionSentence}
          missionTypeLabel={getMissionTypeConfig(missionSentence.type).label}
          missionTypeColor={getMissionTypeConfig(missionSentence.type).color}
          missionTypeIcon={getMissionTypeConfig(missionSentence.type).icon}
          onClose={() => setShowMissionSentence(false)}
          onAccept={() =>
            onClickMissionAccept(
              missionSentence.id,
              missionSentence.title
            )
          }
        />
      )}

      {/* Snackbar */}
      {showSnackbar && (
        <MissionSnackbar
          message={snackbarMessage}
          duration={3000}
          onClose={() => setShowSnackbar(false)}
        />
      )}
    </div>
  );
}
