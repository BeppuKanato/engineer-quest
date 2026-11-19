// 凍結中のフィードバック入力だけが使う従来の計算。画面・APIには公開しない。
const requiredExp = (level: number) => Math.floor(100 * Math.pow(level, 1.5));
export const deriveLevel = (exp: number) => { let level = 1; while (exp >= requiredExp(level + 1)) level += 1; return level; };
