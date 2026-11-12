import { fetcher } from "@/lib/fetcher";
import type { Course } from "@/types/course";
import { fetchClientQuery, queryTags } from "@/lib/clientQueryCache";

export const getCourses = async (token: string): Promise<Course[]> => {
    return fetchClientQuery(
      "courses",
      () => fetcher<Course[]>("/courses", { method: "GET", token }),
      { staleTimeMs: 300_000, tags: [queryTags.courses] }
    );
};
