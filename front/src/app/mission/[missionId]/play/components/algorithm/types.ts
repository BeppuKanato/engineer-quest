export type AlgorithmSceneState = {
  values: number[];
  compareIndices?: [number, number];
  activeRange?: [number, number];
  confirmedIndices?: number[];
  passIndex?: number;
  pointerIndex?: number;
  stepType?: string;
  message?: string;
  variables?: Record<string, string | number>;
};
