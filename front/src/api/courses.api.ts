import { fetcher } from "@/lib/fetcher";
import type { Course } from "@/app/courses/type";
import type { CourseRoadmap } from "@/app/courses/roadmap/type";
import { fetchClientQuery, queryTags } from "@/lib/clientQueryCache";

export const getCourses = async (token: string): Promise<Course[]> => {
    return fetchClientQuery(
      "courses",
      () => fetcher<Course[]>("/courses", { method: "GET", token }),
      { staleTimeMs: 30_000, tags: [queryTags.courses] }
    );
};

export const getCourseRoadmap = async (
    token: string,
    courseId: string
): Promise<CourseRoadmap> => {
    return fetchClientQuery(
      `course-roadmap:${courseId}`,
      () => fetcher<CourseRoadmap>(`/courses/${encodeURIComponent(courseId)}`, { method: "GET", token }),
      { staleTimeMs: 20_000, tags: [queryTags.courses, queryTags.roadmap] }
    );
};
