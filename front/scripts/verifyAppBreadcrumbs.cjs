// パンくず配置の統一契約（Issue #161）: パンくずはヘッダー直下の独立行（1440px 基準、pt { xs: 3, md: 4 }）に置き、
// 内容コンテナの幅と下余白は各画面の都合のままにする。主要画面（コース等）は内容コンテナ内の先頭に置く形で同じ基準を満たす。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appRoot = path.resolve(__dirname, "../src/app");
const screenOwners = { "my-works/page.tsx": "features/create/MyWorksScreen.tsx", "create/quests/[questId]/work/page.tsx": "features/create/CreateQuestWorkScreen.tsx", "create/quests/[questId]/page.tsx": "features/create/CreateQuestDetailScreen.tsx", "create/page.tsx": "features/create/CreateScreen.tsx", "quest-board/[postId]/page.tsx": "features/quest-board/QuestPostDetailScreen.tsx", "quest-board/new/page.tsx": "features/quest-board/NewQuestPostScreen.tsx", "quest-board/page.tsx": "features/quest-board/QuestBoardScreen.tsx", "achievements/page.tsx": "features/collection/AchievementsScreen.tsx", "knowledge-cards/page.tsx": "features/collection/KnowledgeCardsScreen.tsx", "collection/page.tsx": "features/collection/CollectionScreen.tsx", "history/page.tsx": "features/history/HistoryScreen.tsx", "courses/page.tsx": "features/learning/catalog/CoursesScreen.tsx" };
const read = (relative) => fs.readFileSync(screenOwners[relative] ? path.resolve(appRoot, "..", screenOwners[relative]) : path.join(appRoot, relative), "utf8");
const ROW = 'maxWidth: 1440, pt: { xs: 3, md: 4 }';

// 独立行に分離した画面：パンくず行（1440 / pt {3,4}）があり、内容コンテナの幅が元のまま残っていること。
const standalonePages = [
  ["collection/page.tsx", "AppBreadcrumbs", 'maxWidth="lg"'],
  ["quest-board/page.tsx", "AppBreadcrumbs", "maxWidth: 1120"],
  ["quest-board/new/page.tsx", "AppBreadcrumbs", "maxWidth: 960"],
  ["quest-board/[postId]/page.tsx", "AppBreadcrumbs", "maxWidth: 960"],
  ["create/page.tsx", "CreateBreadcrumbs", "maxWidth: 1180"],
  ["create/quests/[questId]/page.tsx", "CreateBreadcrumbs", "maxWidth: 1120"],
  ["create/quests/[questId]/work/page.tsx", "CreateBreadcrumbs", "maxWidth: 1440, pt: 3, pb: 3"],
  ["my-works/page.tsx", "CreateBreadcrumbs", "maxWidth: 1080"],
];
for (const [file, component, contentWidth] of standalonePages) {
  const source = read(file);
  const rowIndex = source.indexOf(ROW);
  assert(rowIndex >= 0, `${file}: breadcrumb row uses the 1440 standard`);
  const crumbIndex = source.indexOf(`<${component}`, rowIndex);
  assert(crumbIndex > rowIndex && crumbIndex - rowIndex < 300, `${file}: breadcrumbs render inside the standard row`);
  assert(source.includes(contentWidth), `${file}: content container keeps its own width (${contentWidth})`);
}

// 主要画面：1440 コンテナ（py { xs: 3, md: 4 }）の先頭にパンくずがあること（従来どおり）。
for (const file of ["courses/page.tsx", "achievements/page.tsx", "history/page.tsx", "knowledge-cards/page.tsx", "profile/page.tsx"]) {
  const source = read(file);
  assert(source.includes("maxWidth: 1440, py: { xs: 3, md: 4 }"), `${file}: main-group container standard`);
  assert(source.includes("<AppBreadcrumbs"), `${file}: has breadcrumbs`);
}

console.log("App breadcrumbs: standalone 1440 row on collection / quest-board / create pages, main-group standard intact.");
