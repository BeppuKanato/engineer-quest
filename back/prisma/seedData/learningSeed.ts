import { bubbleSortCourseSeed } from "./bubbleSortCourseSeed";
import { binarySearchCourseSeed } from "./binarySearchCourseSeed";
import type { CourseSeed } from "./learningSeedTypes";

export const learningSeed: { courses: CourseSeed[] } = {
  courses: [bubbleSortCourseSeed, binarySearchCourseSeed],
};
