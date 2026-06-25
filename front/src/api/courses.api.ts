import { fetcher } from "@/lib/fetcher";
import type { Course } from "@/app/courses/type";
import type { CourseRoadmap } from "@/app/courses/roadmap/type";

export const getCourses = async (token: string): Promise<Course[]> => {
    return fetcher<Course[]>("/courses", {
        method: "GET",
        token,
    });
};

export const getCourseRoadmap = async (
    token: string,
    courseId: string
): Promise<CourseRoadmap> => {
    return fetcher<CourseRoadmap>(`/courses/${encodeURIComponent(courseId)}`, {
        method: "GET",
        token,
    });
};
