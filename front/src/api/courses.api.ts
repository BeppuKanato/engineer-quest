import { fetcher } from "@/lib/fetcher";
import type { Course } from "@/app/courses/type";

export const getCourses = async (token: string): Promise<Course[]> => {
    console.log("test")
    return fetcher<Course[]>("/courses/dev/cmpcf2afh0000yzx8g2oejijs", {
        method: "GET",
        token,
    });
};