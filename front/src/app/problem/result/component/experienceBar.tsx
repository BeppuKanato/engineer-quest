"use client";

import { useEffect, useState } from "react";
import { MissionResultResponse } from "@/type";
import { Typography, Card, CardContent } from "@mui/material";

type Props = {
  experienceUpdate: MissionResultResponse["experienceUpdate"];
  onEnd?: () => void; // アニメーション終了時コールバック
};

export function ExperienceProgress({ experienceUpdate, onEnd }: Props) {
  const { oldLevel, gainedExperience, levelUps, oldExperience } = experienceUpdate;

  const [currentLevel, setCurrentLevel] = useState(oldLevel);
  const [currentExp, setCurrentExp] = useState(oldExperience);
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (gainedExperience <= 0) {
      onEnd?.();
      return;
    }

    let totalExpToAdd = gainedExperience;
    let idx = displayIndex;

    const interval = setInterval(() => {
      if (totalExpToAdd <= 0 || idx >= levelUps.length) {
        clearInterval(interval);
        onEnd?.(); // アニメーション終了通知
        return;
      }

      const currentLevelData = levelUps[idx];
      const requiredExp = currentLevelData.requiredExperience;

      const expToNextLevel = requiredExp - currentExp;

      if (totalExpToAdd >= expToNextLevel) {
        // レベルアップ
        totalExpToAdd -= expToNextLevel;
        setCurrentExp(0);
        setCurrentLevel((prev) => prev + 1);
        idx += 1;
        setDisplayIndex(idx);
      } else {
        setCurrentExp((prev) => prev + totalExpToAdd);
        totalExpToAdd = 0;
      }
    }, 100); // 100msごとに進める

    return () => clearInterval(interval);
  }, [currentExp, displayIndex, gainedExperience, levelUps, onEnd]);

  const currentRequiredExp = levelUps[displayIndex]?.requiredExperience ?? 1;
  const progressPercent = Math.min((currentExp / currentRequiredExp) * 100, 100);

  return (
    <Card className="max-w-md mx-auto p-4 mb-6 shadow-md rounded-xl bg-white">
      <CardContent>
        <Typography variant="h6" className="mb-2">
          レベル {currentLevel}
        </Typography>
        <div className="w-full bg-gray-200 rounded h-6">
          <div
            className="h-6 rounded bg-indigo-500 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <Typography variant="body2" className="text-right mt-1 text-gray-700">
          {currentExp} / {currentRequiredExp} EXP
        </Typography>
      </CardContent>
    </Card>
  );
}
