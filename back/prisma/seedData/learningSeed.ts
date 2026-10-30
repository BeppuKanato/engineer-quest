/** 公開対象のアルゴリズムCourse seedを列挙する集約入口。 */
import { bubbleSortCourseSeed } from "./bubbleSortCourseSeed";
import { binarySearchCourseSeed } from "./binarySearchCourseSeed";
import { breadthFirstSearchCourseSeed } from "./breadthFirstSearchCourseSeed";
import { depthFirstSearchCourseSeed } from "./depthFirstSearchCourseSeed";
import { kmpCourseSeed } from "./kmpCourseSeed";
import { mergeSortCourseSeed } from "./mergeSortCourseSeed";
import { selectionSortCourseSeed } from "./selectionSortCourseSeed";
import type { CourseSeed } from "./learningSeedTypes";

export const learningSeed: { courses: CourseSeed[] } = {
  courses: [bubbleSortCourseSeed, binarySearchCourseSeed, kmpCourseSeed, selectionSortCourseSeed, breadthFirstSearchCourseSeed, depthFirstSearchCourseSeed, mergeSortCourseSeed],
};
