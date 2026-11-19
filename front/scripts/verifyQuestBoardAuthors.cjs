const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '../src');
const profileAchievement = { title: '学んだ考え方をつなぐ探求者', rarity: 'RARE', iconKey: 'course' };
const author = { authorName: '学び手あおい', authorMascotId: 'penguin', authorAchievement: profileAchievement };
const secondAuthor = { authorName: '学び手そら', authorMascotId: 'owl', authorAchievement: null };
const time = '2026-11-19T00:00:00Z';
const basePost = {
  id: 'fixture-post', category: 'QUESTION', categoryLabel: '質問', title: '探索の順番について相談したいです',
  body: '幅優先探索と深さ優先探索では、次の場所を選ぶ順番はどう変わるのでしょうか。',
  excerpt: '探索の順番を比べながら、考え方を整理しています。', code: null, referenceUrl: null, status: 'OPEN',
  courseId: null, courseTitle: null, commentCount: 2,
  reactions: { total: 2, byType: { LIKE: 2, HELPFUL: 0, SAVED_ME: 0 }, userReactedTypes: [] },
  canResolve: false, isOwner: false, isDeleted: false, createdAt: time, updatedAt: time, ...author,
};
const comments = [
  { id: 'comment-a', body: '次に調べる場所を、どのように記録しているか比べると分かりやすいです。', createdAt: time, updatedAt: time, ...secondAuthor },
  { id: 'comment-b', body: '順番を書き出して試してみます。ありがとうございます。', createdAt: time, updatedAt: time, ...author, authorMascotId: 'red-panda' },
];
// Deliberately stale author metadata proves the UI also guards deleted posts.
const deleted = { ...basePost, id: 'deleted', title: 'この投稿は削除されました', body: 'この投稿は削除されました', excerpt: 'この投稿は削除されました', isDeleted: true, commentCount: 0, authorName: '隠すべき著者', authorMascotId: 'owl', authorAchievement: { ...profileAchievement, title: '隠すべき実績' } };
const options = { categories: [{ value: 'QUESTION', label: '質問' }, { value: 'WORK_SHARE', label: '作品共有' }], statuses: [], reactionTypes: [] };
function createLoader(mode) {
  const cache = new Map();
  const detail = { post: mode === 'deleted' ? { ...deleted, comments: [] } : { ...basePost, comments }, options };
  const list = { posts: [basePost, { ...basePost, id: 'second', title: 'はじめての実装を完成させました', ...secondAuthor }, deleted], options };
  const cached = key => key === 'quest-board' ? list : key === 'quest-board-courses' ? [] : detail;
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    vm.runInNewContext(code, { exports, require(name) {
      if (name === '@/app/component/userSession' || name === './userSession') return { useUserSession: () => ({ status: 'authenticated', token: 'fixture-token', appUser: { selectedMascotId: 'red-panda' }, isAppUserLoading: false }) };
      if (name === '@/app/component/feedbackV1') return { FeedbackDestination: () => null };
      if (name === '@/lib/clientQueryCache') return { peekClientQueryData: cached, queryTags: {}, fetchClientQuery: async (key, query) => query() };
      if (name === 'next/navigation') return { useRouter: () => ({ push() {} }), useParams: () => ({ postId: 'fixture-post' }), usePathname: () => mode === 'list' ? '/quest-board' : '/quest-board/fixture-post' };
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
        const target = ['.tsx', '.ts', '.json'].map(ext => base + ext).find(fs.existsSync);
        if (target) return target.endsWith('.json') ? JSON.parse(fs.readFileSync(target, 'utf8')) : load(target);
      }
      return require(name);
    } }, { filename: file });
    return exports;
  }
  return load;
}
function renderBoardFixture(mode = 'list') {
  const load = createLoader(mode);
  const file = mode === 'list' ? '/app/quest-board/page.tsx' : '/app/quest-board/[postId]/page.tsx';
  return renderToStaticMarkup(React.createElement(load(root + file).default));
}
function verify() {
  for (const mode of ['list', 'detail', 'deleted']) {
    const html = renderBoardFixture(mode);
    assert(!html.includes('隠すべき著者') && !html.includes('隠すべき実績'));
    if (mode === 'deleted') assert(!html.includes('data-board-author') && !html.includes('data-profile-achievement'));
    else {
      assert(html.includes('/images/mascots/penguin/face.png'));
      assert(html.includes('/images/mascots/owl/face.png'));
      assert(html.includes(profileAchievement.title));
      const expected = mode === 'list' ? 2 : 3;
      assert.equal((html.match(/data-board-author=/g) ?? []).length, expected);
      assert.equal((html.match(/data-profile-achievement=/g) ?? []).length, mode === 'list' ? 1 : 2);
      assert(html.includes('SchoolIcon'), 'The selected achievement icon key is rendered');
    }
    assert(!/href="\/profile(?:\/|\?)/.test(html), 'No author profile links are added');
  }
  const load = createLoader('list');
  const { QuestBoardAuthor } = load(root + '/app/quest-board/_components/QuestBoardAuthor.tsx');
  const html = renderToStaticMarkup(React.createElement(QuestBoardAuthor, { author: { ...author, authorMascotId: 'invalid-id', authorAchievement: { ...profileAchievement, iconKey: 'future-icon' } } }));
  assert(html.includes('/images/mascots/red-panda/face.png') && html.includes('EmojiEventsIcon'));
  console.log('Quest board author UI: list/detail/comments, mascot images, null badges, icon keys/fallbacks and deleted-author defense passed.');
}
module.exports = { renderBoardFixture };
if (require.main === module) verify();
