import { MissionExamDifficulty } from "../play/type";

export type MissionExamResultLog = {
  missionId: string;
  missionExamId: string;
  missionTitle: string;
  examTitle: string;
  difficulty: MissionExamDifficulty;
  rewardExp: number;
  completedAt: string;
  nextMission: NextMission | null;
  clearedDifficulties: {
    easy: boolean;
    normal: boolean;
    hard: boolean;
  };
};

export type NextMission = {
  id: string;
  title: string;
};
