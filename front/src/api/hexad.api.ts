import { fetcher } from "@/lib/fetcher";
import { fetchClientQuery, queryTags, setClientQueryData, invalidateClientQueries } from "@/lib/clientQueryCache";

export const HEXAD_QUESTIONNAIRE_VERSION = "hexad-24-ja-v1";

export type HexadScores = {
  philanthropist: number;
  socialiser: number;
  freeSpirit: number;
  achiever: number;
  disruptor: number;
  player: number;
};

export type HexadProfile = {
  questionnaireVersion: string;
  scores: HexadScores;
  completedAt: string;
};

export type HexadResponseStatus = {
  hasResponse: boolean;
  response: HexadProfile | null;
};

export const getHexadResponse = (token: string) =>
  fetchClientQuery(
    "hexad-response",
    () => fetcher<HexadResponseStatus>("/hexad", { method: "GET", token }),
    { staleTimeMs: 5 * 60_000, tags: [queryTags.hexad] }
  );

export const submitHexadResponse = async (
  token: string,
  answers: Record<string, number>
) => {
  const result = await fetcher<HexadResponseStatus>("/hexad", {
    method: "POST",
    token,
    body: JSON.stringify({
      questionnaireVersion: HEXAD_QUESTIONNAIRE_VERSION,
      answers,
    }),
  });
  invalidateClientQueries([queryTags.authUser, queryTags.profile, queryTags.home]);
  setClientQueryData("hexad-response", result, [queryTags.hexad]);
  return result;
};
