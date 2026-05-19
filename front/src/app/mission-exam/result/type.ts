import { MissionExamDifficulty } from "../exam/type";

export type MissionExamResultLog = {
  difficulty: MissionExamDifficulty;
  exp: number;
  submitCount: number;
  diffCheckCount: number;
  clearedAt: string;
};

export type MissionExamResult = {
  id: string;
  title: string;
  exp: number;
};

export type NextMission = {
  id: string;
  title: string;
};