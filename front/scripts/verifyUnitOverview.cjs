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

// 2. The bordered wave stays legible; the illustration belongs to the mission band.
const mapSection = overview.slice(overview.indexOf('function UnitPathMap'), overview.indexOf('function UnitKnowledgeCards'));
assert(mapSection.includes('border:'), 'the map area must have a border frame');
assert(!mapSection.includes('bgcolor: tokens.surface'), 'the map area must not be a filled white panel');
assert(!mapSection.includes('CourseThumbnail'), 'the wave must not place a thumbnail behind the labels');
assert(overview.includes('missionThumbnailFor(unit.courseId) ?? <CourseThumbnail courseId={unit.courseId} />'), 'the mission band owns the illustration');

// 3. The mission band offers the right CTA; the map retains phase review and mission entry.
for (const label of ['学習を始める', '学習を進める', 'ミッションに挑戦する', '単元の結果を見る']) {
  assert(overview.includes(label), `the mission band must offer: ${label}`);
}
assert(mapSection.includes('disabled={!reachable || starting}'), 'unreachable steps must not be actionable');
assert(mapSection.includes('if (isMission) onMission(); else onStart(index, current);'), 'the map must route the final challenge and regular phases to the appropriate handler');
assert(mapSection.includes('aria-current={current ? "step" : undefined}'), 'the current node must be identified');
assert(overview.includes('スタート') && overview.includes('ゴール'), 'the path must have start and goal flags');

// 4. Card awards stay recorded in the unit content, but stages must not advertise them:
//    which card (if any) is presented is a table outcome, not a per-stage promise (#178).
const content = readFront('src/features/learning/bfs/unit/unit.content.ts');
for (const rarity of ['RARE', 'COMMON', 'EPIC']) {
  assert(content.includes(`cardRarity: "${rarity}"`), `a phase must declare cardRarity ${rarity}`);
}
assert(!mapSection.includes('knowledgeCardTones'), 'stages must not render card-rarity badges');
assert(!mapSection.includes('知識カードが手に入る'), 'stage labels must not promise a knowledge card');

// 5. Achievements preview shows only this unit's achievements, via the API courseId.
assert(overview.includes('getAchievements'), 'the overview must load achievements for the preview');
assert(overview.includes('item.courseId === courseId'), 'the preview must filter achievements by courseId');
assert(readFront('src/api/achievements.api.ts').includes('courseId: string | null'), 'the front achievement type must carry courseId');
assert(readRepo('back/src/service/achievement.service.ts').includes('courseId: a.courseId'), 'the achievements API must return courseId');
const seed = readRepo('back/prisma/seedData/achievementSeed.ts');
assert(seed.includes('ach-unit-bfs-complete') && seed.includes('courseId: BFS_COURSE_ID'), 'the BFS unit achievement remains tagged with its course');
assert(overview.includes('<UnitKnowledgeCards courseId={courseId} />'), 'the overview includes the current unit’s knowledge cards');

// 6. The unit intro comes from the content layer through the registry.
assert(content.includes('bfsUnitIntro'), 'the unit content must define the intro line');
assert(readFront('src/features/learning/app/unitRegistry.ts').includes('intro: bfsUnitIntro'), 'the registry must expose the intro');

// 7. Optional phases are read from the shared definition catalog
//    (unit/optionalPhases.ts), never hardcoded in display components
//    (2026-11-28 generalization: no 6.5-specific display code).
//    1.5 "prediction" was abolished as an optional phase the same day:
//    prediction lives inside phase 2, so the catalog must not carry it.
const optionalCatalog = readFront('src/features/learning/unit/optionalPhases.ts');
assert(optionalCatalog.includes('anchorPhase: 6'), 'the catalog must anchor optional phases to required phases');
assert(!optionalCatalog.includes('optional-prediction'), 'the catalog must not carry the abolished 1.5 prediction phase');
assert(overview.includes('unitOptionalPhases'), 'the wave map must read the optional-phase catalog');
assert(!mapSection.includes('予測・実験') && !mapSection.includes('実装の橋渡し'), 'the wave map must not hardcode optional-phase names');
assert(overview.includes('OptionalPhaseChip'), 'the wave map must mark optional nodes with the shared chip');
assert(readFront('src/features/learning/unit/LearningUnitPreview.tsx').includes('findOptionalPhase'), 'the player header must resolve the active optional phase from the catalog');
assert(readFront('src/app/component/feedbackV1.tsx').includes('findOptionalPhase'), 'feedback candidates must resolve optional-phase targets from the catalog');

console.log('verifyUnitOverview: all contracts hold');
