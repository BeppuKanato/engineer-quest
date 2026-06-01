import { fetcher } from "@/lib/fetcher";
import type { Course } from "@/app/courses/type";

export const getCourses = async (token: string): Promise<Course[]> => {
    return fetcher<Course[]>("/courses", {
        method: "GET",
        token,
    });
};