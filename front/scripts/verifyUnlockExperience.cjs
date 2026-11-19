const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname, '../src');

function hooks() {
  const slots = [];
  let cursor = 0, pending = [];
  return {
    react: {
      ...React,
      useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
      useState(value) { const index = cursor++; if (!(index in slots)) slots[index] = typeof value === 'function' ? value() : value; return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next; }]; },
      useEffect(callback, deps) { const index = cursor++; const old = slots[index]; if (!old || !deps || deps.some((value, i) => value !== old[i])) pending.push(callback); slots[index] = deps; },
      useCallback(callback) { cursor++; return callback; },
      useMemo(callback) { cursor++; return callback(); },
    },
    render(component, props) { cursor = 0; return component(props); },
    flush(replay = false) { const effects = pending; pending = []; for (const effect of effects) { effect(); if (replay) effect(); } },
  };
}
function load(file, overrides, globals = {}) {
  const cache = new Map();
  function moduleAt(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const exports = {}; cache.set(filename, exports);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, { exports, ...globals, require(name) {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (!name.startsWith('.')) return require(name);
      const target = path.resolve(path.dirname(filename), name);
      return moduleAt(['.tsx', '.ts'].map(ext => target + ext).find(fs.existsSync));
    } }, { filename });
    return exports;
  }
  return moduleAt(file);
}
const item = { id: 'first', title: '実績', description: '説明', rarity: 'RARE' };
for (const kind of ['phase', 'unit', 'create']) {
  const state = hooks(), played = [];
  let play = name => played.push(name);
  const { AchievementBand, NewAchievementZone } = load(root + '/components/rewards/AchievementPresentation.tsx', {
    react: state.react,
    '../sound/SoundFeedback': { useSoundEffect: () => ({ play }) },
  });
  const Presentation = kind === 'unit' ? NewAchievementZone : AchievementBand;
  assert.equal(Presentation({ items: [] }), null);
  const props = { items: [item, { ...item, id: 'second' }], placement: kind === 'create' ? 'create-submission' : 'phase-result' };
  const list = Presentation(props).props.children[1];
  state.render(list.type, list.props); state.flush(true);
  assert.deepEqual(played, ['achievementUnlocked'], 'Multiple unlocks and StrictMode effect replay sound once');
  play = name => played.push(name);
  state.render(list.type, { ...list.props, items: props.items.map(value => ({ ...value })).reverse() }); state.flush();
  assert.equal(played.length, 1, 'Copied/reordered items and changed sound callback do not replay');
  state.render(list.type, { ...list.props, items: [...props.items, { ...item, id: 'late' }] }); state.flush();
  assert.equal(played.length, 2, 'A later newly unlocked batch sounds once');
}

// Test the unchanged real SoundContext settings and HTMLAudioElement boundary.
const soundHooks = hooks();
const storage = new Map([['engineerQuest.sound.enabled', 'false'], ['engineerQuest.sound.masterVolume', '0.2']]);
const audioPlays = [];
let now = 1000;
class AudioStub {
  constructor(src) { this.src = src; }
  cloneNode() { return new AudioStub(this.src); }
  play() { audioPlays.push({ src: this.src, volume: this.volume }); return Promise.resolve(); }
}
const { SoundProvider } = load(root + '/components/sound/SoundFeedback.tsx', { react: soundHooks.react }, {
  window: { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, performance: { now: () => now } },
  Audio: AudioStub,
});
soundHooks.render(SoundProvider, { children: null }); soundHooks.flush();
let sound = soundHooks.render(SoundProvider, { children: null }).props.value;
sound.play('achievementUnlocked'); assert.equal(audioPlays.length, 0, 'Persisted mute prevents playback');
sound.setEnabled(true);
sound = soundHooks.render(SoundProvider, { children: null }).props.value;
sound.play('achievementUnlocked');
assert.equal(audioPlays[0].src, '/audio/se/achievement-unlocked.ogg');
assert(Math.abs(audioPlays[0].volume - 0.45 * 0.2) < 1e-9, 'Master volume scales the existing effect volume');
now += 1000;
sound.setEnabled(false);
sound = soundHooks.render(SoundProvider, { children: null }).props.value;
sound.play('achievementUnlocked'); assert.equal(audioPlays.length, 1, 'Toggling mute prevents subsequent playback');

const boundary = fs.readFileSync(root + '/features/learning/rewards/LearningRewardBoundary.tsx', 'utf8');
assert(boundary.includes('play("achievementUnlocked"); setStage("praise")'));
assert(boundary.includes('play("cardFlip")'));
assert(!boundary.includes('play("cardAcquired")'));
const create = fs.readFileSync(root + '/app/create/quests/[questId]/work/page.tsx', 'utf8');
assert(create.includes('key={submission.id} items={unlockedAchievements} placement="create-submission"'));
assert(!create.includes('実績を解除しました：'));
for (const file of ['components/rewards/AchievementPresentation.tsx', 'components/rewards/presentation.ts', 'components/sound/SoundFeedback.tsx', 'hooks/useLearningVisit.ts']) {
  assert(!/from\s+["'][^"']*(?:features\/|app\/)/u.test(fs.readFileSync(root + '/' + file, 'utf8')), `${file} must not import feature/app internals`);
}
console.log('Unlock experience: phase/unit/create batches, StrictMode replay, rerenders, late arrivals, real SoundContext mute/master volume, card acquisition cue and shared dependency direction passed.');
