const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const frontRoot = path.resolve(__dirname, '..');
const readFront = (relative) => fs.readFileSync(path.join(frontRoot, relative), 'utf8');
const readRepo = (relative) => fs.readFileSync(path.join(frontRoot, '..', relative), 'utf8');

const overview = readFront('src/features/learning/app/UnitOverview.tsx');

// 1. The path is a sine wave with the nodes on it, drawn as one SVG layer.
// The wave geometry is shared with the final result's mini map (unitPathGeometry).
const geometry = readFront('src/features/learning/app/unitPathGeometry.ts');
assert(geometry.includes('Math.sin'), 'unit path must be a sine curve');
assert(geometry.includes('wavePoint'), 'node positions must derive from the wave function');
assert(overview.includes('unitPathGeometry'), 'the overview must use the shared wave geometry');
assert(overview.includes('motion.path'), 'the completed portion of the path must be drawn with entry motion');

// 2. The map area is a border-only frame (no filled panel) with the unit figure as a faint backdrop.
const mapSection = overview.slice(overview.indexOf('function UnitPathMap'), overview.indexOf('function UnitAchievements'));
assert(mapSection.includes('border:'), 'the map area must have a border frame');
assert(!mapSection.includes('bgcolor: tokens.surface'), 'the map area must not be a filled white panel');
assert(mapSection.includes('CourseThumbnail'), 'the map backdrop must reuse the unit thumbnail figure');

// 3. No standalone start button: the current node is the only entry, marked with the chip.
assert(!overview.includes('学習を始める'), 'the standalone start button must be gone');
assert(!overview.includes('復習する'), 'the standalone review button must be gone');
assert(overview.includes('ここから始める'), 'the current node must carry the start chip');
assert(overview.includes('スタート') && overview.includes('ゴール'), 'the path must have start and goal flags');

// 4. Card awards stay recorded in the unit content, but stages must not advertise them:
//    which card (if any) is presented is a table outcome, not a per-stage promise (#178).
const content = readFront('src/features/learning/units/bfs/unit/unit.content.ts');
for (const rarity of ['RARE', 'COMMON', 'EPIC']) {
  assert(content.includes(`cardRarity: "${rarity}"`), `a phase must declare cardRarity ${rarity}`);
}
assert(!overview.includes('knowledgeCardTones'), 'stages must not render card-rarity badges');
assert(!overview.includes('知識カードが手に入る'), 'stage labels must not promise a knowledge card');

// 5. Achievements preview shows only this unit's achievements, via the API courseId.
assert(overview.includes('getAchievements'), 'the overview must load achievements for the preview');
assert(overview.includes('item.courseId === courseId'), 'the preview must filter achievements by courseId');
assert(readFront('src/api/achievements.api.ts').includes('courseId: string | null'), 'the front achievement type must carry courseId');
assert(readRepo('back/src/service/achievement.service.ts').includes('courseId: a.courseId'), 'the achievements API must return courseId');
const seed = readRepo('back/prisma/seedData/achievementSeed.ts');
const cardComplete = seed.split('\n').find((line) => line.includes('ach-bfs-card-complete'));
assert(cardComplete && cardComplete.includes('courseId: BFS_COURSE_ID'), 'the BFS card-complete achievement must be tagged with the BFS courseId in the seed');

// 6. The unit intro comes from the content layer through the registry.
assert(content.includes('bfsUnitIntro'), 'the unit content must define the intro line');
assert(readFront('src/features/learning/app/unitRegistry.ts').includes('intro: bfsUnitIntro'), 'the registry must expose the intro');

console.log('verifyUnitOverview: all contracts hold');
