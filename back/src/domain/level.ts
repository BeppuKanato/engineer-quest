// src/domain/level.ts
export const BASE_EXP = 100;
export const EXPONENT = 1.5;

export const requiredExperienceForLevel = (level: number): number => {
  if (level <= 0) return 0;
  return Math.floor(BASE_EXP * Math.pow(level, EXPONENT));
};
