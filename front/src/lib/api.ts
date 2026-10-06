const normalizeApiBaseUrl = (baseUrl: string): string => {
  const normalized = baseUrl.replace(/\/+$/, "");

  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export const getApiBaseUrl = (): string => {
  const baseUrl =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : process.env.INTERNAL_API_BASE_URL ??
        process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("API base URL is not defined");
  }

  return normalizeApiBaseUrl(baseUrl);
};
