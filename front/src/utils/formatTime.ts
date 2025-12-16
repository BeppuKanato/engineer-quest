// 秒数を h:m:s 形式に変換
export const formatSecondsToHMS = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s]
    .map((v) => String(v).padStart(2, "0"))
    .join(":"); // 例: 01:05:09
};

// 秒数を h:m 形式に変換
export const formatSecondsToHM = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return [h, m]
    .map((v) => String(v).padStart(2, "0"))
    .join(":"); // 例: 01:05
};

// 分数を「X時間Y分」形式に変換
export const formatMinutesToHM = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return h > 0 ? `${h}時間${m}分` : `${m}分`;
};

export const formatSecondsToH = (seconds: number): string => {
  return (seconds / 3600).toFixed(1) + "h";
}