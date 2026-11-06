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
const header = read('app/component/appHeader.tsx');
assert(!header.includes('PageTransitionOverlay'), 'appHeader must not render PageTransitionOverlay');
assert(!header.includes('isNavigating'), 'appHeader must not track a blocking navigation state');

// 2. Home / courses keep previous data and use the shared session token (#138 N1, N2).
for (const page of ['app/home/page.tsx', 'app/courses/page.tsx']) {
  const source = read(page);
  assert(source.includes('useUserSession'), `${page} must use the session token`);
  assert(!source.includes('onAuthStateChanged'), `${page} must not subscribe to auth state itself`);
  assert(source.includes('peekClientQueryData'), `${page} must seed its initial render from the query cache`);
}
const courses = read('app/courses/page.tsx');
assert(!courses.includes('setCourses([])'), 'courses page must not blank the list while refetching');

// 3. Cache lifetimes: home / courses are long-lived because mutations invalidate by tag (#138 N3, N5).
assert(staleTimeOf(read('api/home.api.ts')) >= 300_000, 'home staleTime must be at least 5 minutes');
assert(staleTimeOf(read('api/courses.api.ts')) >= 300_000, 'courses staleTime must be at least 5 minutes');
const learningApi = read('api/learning.api.ts');
assert(learningApi.includes('fetchClientQuery'), 'getLearningProgress must go through the query cache');
assert(learningApi.includes('learning-progress:'), 'learning progress cache key must be per course');

// 4. Phase completion must not freeze the unit screen while saving (#140/#142 P1).
const unit = read('features/learning/bfs/unit/BfsUnitPreview.tsx');
assert(!unit.includes('inert={saving'), 'unit screen must not go inert while saving');
assert(unit.includes('CircularProgress'), 'saving state must be shown with a visible progress indicator');
assert(unit.includes('role="status"'), 'saving indicator must be announced via role=status');
assert(unit.includes('pointerEvents: "none"'), 'saving indicator must not block interaction');

// 5. The learning screen must not gate rendering on the start record POST (#140 P3).
const learningScreen = read('features/learning/app/LearningScreen.tsx');
assert(!learningScreen.includes('setReady'), 'learning screen must not gate on a ready flag after the start POST');
assert(learningScreen.includes('severity="warning"'), 'start-record failure must surface as a non-blocking warning');

console.log('verifyResponseFeedback: all checks passed');
