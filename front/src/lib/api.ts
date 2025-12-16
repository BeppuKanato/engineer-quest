export const getApiBaseUrl = () => {
  // ブラウザ側：window が存在する
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // サーバー側（SSR）：内部ネットワークを使う
  return process.env.INTERNAL_API_BASE_URL;
};
