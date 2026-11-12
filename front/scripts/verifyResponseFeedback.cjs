const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const srcRoot = path.resolve(__dirname, '../src');
const read = (relative) => fs.readFileSync(path.join(srcRoot, relative), 'utf8');
const staleTimeOf = (source) => {
  const match = source.match(/staleTimeMs:\s*([0-9_]+)/);
  assert(match, 'staleTimeMs must be specified');
  return Number(match[1].replace(/_/g, ''));
};

// 1. Header navigation must not block the screen with a full-screen overlay (#138 N4).
const header = read('app/component/appHeader.tsx') + read('components/layouts/AppHeaderView.tsx');
assert(!header.includes('PageTransitionOverlay'), 'appHeader must not render PageTransitionOverlay');
assert(!header.includes('isNavigating'), 'appHeader must not track a blocking navigation state');

// 2. Home / courses keep previous data and use the shared session token (#138 N1, N2).
for (const page of ['app/home/page.tsx', 'app/courses/page.tsx', 'app/collection/page.tsx', 'app/history/page.tsx', 'app/knowledge-cards/page.tsx', 'app/achievements/page.tsx', 'app/profile/page.tsx', 'app/quest-board/page.tsx', 'app/quest-board/new/page.tsx', 'app/quest-board/[postId]/page.tsx', 'app/create/page.tsx', 'app/create/quests/[questId]/page.tsx', 'app/my-works/page.tsx']) {
  const source = read(page);
  assert(source.includes('useUserSession'), `${page} must use the session token`);
  assert(!source.includes('onAuthStateChanged'), `${page} must not subscribe to auth state itself`);
  assert(source.includes('peekClientQueryData'), `${page} must seed its initial render from the query cache`);
}
// 2b. The create work page joins the session too, but deliberately does not cache its
// attempt state; saving / submitting invalidates the works caches instead (#174).
const createWork = read('app/create/quests/[questId]/work/page.tsx');
assert(createWork.includes('useUserSession'), 'create work page must use the session token');
// 3カラムのカード上端を揃える（#184）: 要件カラムだけ見出し分ずれる形にしない。
assert(!createWork.includes('>要件</Typography>'), 'requirements column must not lead with a standalone heading');
assert(createWork.includes('alignItems: "start"'), 'the three-column grid keeps its tops aligned');
assert(!createWork.includes('onAuthStateChanged'), 'create work page must not subscribe to auth state itself');
assert(createWork.includes('invalidateClientQueries([queryTags.works])'), 'create work page must invalidate works caches after save/submit');
// Board list and new-post share the same cached board/courses entries, so the form
// opens instantly after visiting the list (#174).
const boardNew = read('app/quest-board/new/page.tsx');
assert(boardNew.includes('peekClientQueryData<QuestBoardListResponse>("quest-board")'), 'new post page must seed from the shared board cache');

const courses = read('app/courses/page.tsx');
assert(!courses.includes('setCourses([])'), 'courses page must not blank the list while refetching');

// 3. Cache lifetimes: home / courses are long-lived because mutations invalidate by tag (#138 N3, N5).
assert(staleTimeOf(read('api/home.api.ts')) >= 300_000, 'home staleTime must be at least 5 minutes');
assert(staleTimeOf(read('api/courses.api.ts')) >= 300_000, 'courses staleTime must be at least 5 minutes');
const learningApi = read('api/learning.api.ts');
assert(learningApi.includes('fetchClientQuery'), 'getLearningProgress must go through the query cache');
assert(learningApi.includes('learning-progress:'), 'learning progress cache key must be per course');

// 4. Phase completion must not freeze the unit screen while saving (#140/#142 P1).
const unit = read('features/learning/unit/LearningUnitPreview.tsx');
assert(!unit.includes('inert={saving'), 'unit screen must not go inert while saving');
assert(unit.includes('CircularProgress'), 'saving state must be shown with a visible progress indicator');
assert(unit.includes('role="status"'), 'saving indicator must be announced via role=status');
assert(unit.includes('pointerEvents: "none"'), 'saving indicator must not block interaction');

// 5. The learning screen must not gate rendering on the start record POST (#140 P3).
const learningScreen = read('features/learning/app/LearningScreen.tsx');
assert(!learningScreen.includes('setReady'), 'learning screen must not gate on a ready flag after the start POST');
assert(learningScreen.includes('severity="warning"'), 'start-record failure must surface as a non-blocking warning');

console.log('verifyResponseFeedback: all checks passed');
