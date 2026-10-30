/** アルゴリズム可視化コンポーネント間だけで共有する表示用の型。 */
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
