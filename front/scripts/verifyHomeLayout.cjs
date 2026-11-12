const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const srcRoot = path.resolve(__dirname, '../src');
const read = (relative) => fs.readFileSync(path.join(srcRoot, relative), 'utf8');

// 1. Progress overlay is shared: one implementation used by both the courses page and the home grid.
const overlay = read('features/learning/catalog/courseProgress.ts');
assert(overlay.includes('export async function withLearningProgress'), 'withLearningProgress must be exported from courseProgress');
const coursesPage = read('features/learning/catalog/CoursesScreen.tsx');
assert(coursesPage.includes('withLearningProgress'), 'courses page must use the shared overlay');
assert(!coursesPage.includes('saved.phases.filter'), 'courses page must not keep an inline copy of the overlay');
const homeGrid = read('features/learning/catalog/HomeUnitGrid.tsx');
assert(homeGrid.includes('withLearningProgress'), 'home unit grid must use the shared overlay');
assert(homeGrid.includes('getCourses'), 'home unit grid must list courses from the same source as the catalog');

// 2. Course thumbnails: every current course has a signature figure, and CourseCard falls back to the category visual.
const thumbnail = read('features/learning/catalog/components/CourseThumbnail.tsx');
for (const courseId of [
  'course-algorithm-bubble-sort-v2',
  'course-algorithm-binary-search-v1',
  'course-algorithm-kmp-v1',
  'course-algorithm-selection-sort-v1',
  'course-algorithm-breadth-first-search-v1',
  'course-algorithm-depth-first-search-v1',
  'course-algorithm-merge-sort-v1',
]) {
  assert(thumbnail.includes(courseId), `thumbnail figure missing for ${courseId}`);
}
const courseCard = read('features/learning/catalog/components/CourseCard.tsx');
assert(courseCard.includes('CourseThumbnail'), 'CourseCard must render the course thumbnail');
// 完了表示は StatusChip の「クリア済み」に一本化し、同じ意味のチップを重ねない（#176）。
assert(!courseCard.includes('コースクリア'), 'CourseCard must not duplicate the completed badge');
assert(courseCard.includes('<StatusChip status={status} />'), 'CourseCard keeps the shared status chip');
assert(courseCard.includes('COURSE_VISUAL_STYLE'), 'CourseCard must keep the category visual as the fallback');

// 3. Home unit grid: capped, personally ordered (in progress -> not started -> completed).
assert(/HOME_UNIT_LIMIT = 6/.test(homeGrid), 'home unit grid must cap at 6');
assert(homeGrid.includes('STATUS_ORDER'), 'home unit grid must order by learning status');
assert(homeGrid.includes('CourseCard'), 'home unit grid must reuse CourseCard');

// 4. Home page: the link-only "find other units" card is gone; the grid takes its place.
const homePage = read('app/home/page.tsx');
assert(!homePage.includes('ほかの単元を探す'), 'home page must not keep the duplicated find-units card');
assert(homePage.includes('<HomeUnitGrid'), 'home page must render the unit grid');
// 目標に設定した実績の進捗をホームにも出す（#183）。API は既に targetAchievement を返している。
assert(homePage.includes('homeData.targetAchievement'), 'home must render the pinned target achievement when present');
assert(homePage.includes('目標の実績'), 'home must label the target achievement card');
assert(homePage.includes('factor.progress'), 'home must show per-factor progress toward the target');

// 5. ContinueLearning: rich hero when a unit is in progress, nothing when none is.
const cont = read('features/learning/app/ContinueLearning.tsx');
assert(cont.includes('return null'), 'ContinueLearning must render nothing when no unit is in progress');
// ホームの用語は「単元」に統一する（#177）。一覧ページ自体の表記は別途判断。
assert(!homeGrid.includes('コース一覧へ'), 'home grid must not link with the old terminology');
assert(homeGrid.includes('単元一覧へ'), 'home grid links to the unit list');
assert(!cont.includes('コース一覧へ'), 'ContinueLearning must not link with the old terminology');
assert(cont.includes('単元一覧へ'), 'ContinueLearning links to the unit list');
assert(cont.includes('次は「'), 'ContinueLearning must name the next stage');
assert(cont.includes('formalName'), 'ContinueLearning must derive the next stage name from the unit definition');
assert(!cont.includes('コース一覧から学びたい単元を選びましょう'), 'ContinueLearning must not degrade into a catalog link card');

console.log('verifyHomeLayout: all contracts hold');
