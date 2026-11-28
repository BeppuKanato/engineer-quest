const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {loader,root,React,renderToStaticMarkup}=require('./dailyReviewTestHarness.cjs');
const load=loader();
const {HomeDashboard}=load(path.join(root,'features/home/HomeDashboard.tsx'));
const day={date:'2027-01-01',label:'金',learned:true,isToday:true};
const unit={id:'unit',title:'幅優先探索',group:'探索',status:'IN_PROGRESS',completedPhases:2,totalPhases:7,collectedCards:2,totalCards:3,href:'/courses/roadmap/unit',resumeHref:'/courses/roadmap/unit/learn?phase=bfs-check',nextPhase:'動きの確認問題'};
const data={user:{displayName:'学び手',selectedMascotId:'red-panda'},overview:{completedUnits:1,totalUnits:7,collectedCards:5,totalCards:21,units:[unit]},today:{recommended:unit,nearAchievements:[{id:'a',title:'探索を進める',progress:2,goal:3,href:'/courses',conditionLabel:null}],nearCards:[unit]},resume:{...unit,nextStep:'次の一歩を確かめる'},hasInProgressUnit:true,week:{streakDays:3,days:[day]},latestCard:{title:'キュー',label:'幅優先探索の考え方',rarity:'COMMON',courseTitle:'幅優先探索'},questions:[{id:'q',title:'探索の順序を教えてください',excerpt:'キューに入れる順番で結果が変わりますか',courseTitle:'幅優先探索',commentCount:0,authorName:'仲間',createdAt:'2027-01-01T00:00:00Z',href:'/quest-board/q'}]};
const render=data=>renderToStaticMarkup(React.createElement(HomeDashboard,{data,review:React.createElement('div',{'data-review-slot':true},'今日の復習'),goalBand:React.createElement('aside',{'data-goal-band':true},'目標帯')}));
const html=render(data);
const japanese=render({...data,today:{...data.today,nearAchievements:[{...data.today.nearAchievements[0],title:'知識の発見者 Lv.2'}]}});assert(japanese.includes('知識の発見者 第2段階')&&!japanese.includes('Lv.2'));
const sections=[...html.matchAll(/data-home-section="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(sections,['aim','review','status']);
for(const text of ['今日の狙い','幅優先探索','次の一歩を確かめる','次は『動きの確認問題』です','学習を再開する','/learn?phase=bfs-check','3日連続','data-learning-day="2027-01-01"','次の実績','あと1で達成','知識カード','5 / 21枚','キュー','学んだ知識を活かそう','まだ回答がありません','回答してみる','data-goal-band','data-review-slot'])assert(html.includes(text),text);
// 再開単元が今日の狙いと違うときだけ「前回の続き」が出て、節の順序は aim→resume→status。
const other=render({...data,resume:{...unit,id:'other',title:'深さ優先探索'}});
assert.deepEqual([...other.matchAll(/data-home-section="([^"]+)"/g)].map(match=>match[1]),['aim','review','resume','status']);
assert(other.includes('前回の続き')&&other.includes('この単元を再開する'));
const empty=render({...data,today:{recommended:null,nearAchievements:[],nearCards:[]},resume:null,hasInProgressUnit:false,questions:[],latestCard:null});
for(const id of ['aim','resume'])assert(!empty.includes(`data-home-section="${id}"`));assert(empty.includes('data-home-section="status"'));
// 掲示板は「場所」なので、答えられる質問が無くても見出しと促しは残る（空状態方針）。
assert(empty.includes('掲示板')&&empty.includes('学んだ知識を活かそう')&&empty.includes('いま答えられる質問はありません'));
// 初回（記録なし）は狙いカードではなく、コース一覧への誘導カードになる。
const freshUnit={...unit,status:'NOT_STARTED',completedPhases:0,nextPhase:null};
const fresh=render({...data,overview:{...data.overview,completedUnits:0,units:[freshUnit]},today:{...data.today,recommended:freshUnit},resume:null,hasInProgressUnit:false});
assert(fresh.includes('data-home-section="aim"')&&fresh.includes('学ぶ単元を選ぼう')&&fresh.includes('アルドはあいまいな判断ができないけど')&&fresh.includes('コース一覧を見る')&&!fresh.includes('学習をはじめる'));
// 復習は「進捗データ」：無い日はスロットごと消えて狙いが広がる。
const noReview=renderToStaticMarkup(React.createElement(HomeDashboard,{data,goalBand:React.createElement('aside',{'data-goal-band':true},'目標帯')}));
assert.deepEqual([...noReview.matchAll(/data-home-section="([^"]+)"/g)].map(match=>match[1]),['aim','status']);
const noFeedback=render({...data,resume:{...unit,nextStep:null}});assert(!noFeedback.includes('次の一歩'));
const dashboard=fs.readFileSync(path.join(root,'features/home/HomeDashboard.tsx'),'utf8');
assert(dashboard.includes('{goalBand}')&&dashboard.includes('{review}'));
const daily=fs.readFileSync(path.join(root,'features/learning/daily-review/DailyReviewCard.tsx'),'utf8');assert(daily.includes('!review')&&daily.includes('return null'));
const page=fs.readFileSync(path.join(root,'app/home/page.tsx'),'utf8');assert(page.includes('review={reviewReady ? <DailyReviewCardContent review={reviewReady} /> : undefined}')&&page.includes('goalBand={<GoalBand data={homeData} />}'));
assert(page.includes('目標はまだ設定されていません')&&page.includes('コース一覧で目標を設定する'));
assert(!page.includes('BigGoalBanner'));
assert(page.includes('useGoalCourseId')&&page.includes('findUnitMission'));
assert(!dashboard.includes('@/features/learning/'), 'Independent features are composed by the app through slots');
for(const removed of ['<ContinueLearning','<HomeUnitGrid','目標の実績','エンジニア見習い'])assert(!page.includes(removed));
for(const source of [page,dashboard,fs.readFileSync(path.join(root,'app/profile/page.tsx'),'utf8')])assert(!/user(?:Data)?\.(?:level|exp|rank)|レベルアップ|次のランク|>EXP</.test(source));
// ホームの旧グリッドは外しても、共通の単元一覧・サムネイルに対する既存の回帰検証は残す。
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
assert(read('app/courses/courseProgress.ts').includes('export async function withLearningProgress'));
const coursesPage=read('app/courses/page.tsx');assert(coursesPage.includes('withLearningProgress')&&!coursesPage.includes('saved.phases.filter'));
const thumbnail=read('app/courses/component/courseThumbnail.tsx');
for(const id of ['bubble-sort-v2','binary-search-v1','kmp-v1','selection-sort-v1','breadth-first-search-v1','depth-first-search-v1','merge-sort-v1'])assert(thumbnail.includes(`course-algorithm-${id}`));
const courseCard=read('app/courses/component/courseCard.tsx');
assert(courseCard.includes('CourseThumbnail')&&courseCard.includes('COURSE_VISUAL_STYLE')&&courseCard.includes('<StatusChip status={status} />')&&!courseCard.includes('コースクリア'));
const profile=read('app/profile/page.tsx');
for(const field of ['completedCourseCount','completedMissionCount','collectedCount','achievedCount'])assert(profile.includes(field));
for(const label of ['プロフィール設定','代表実績'])assert(profile.includes(label));
console.log('verifyHomeLayout: goal band slot (incl. unset invitation), aim/review grid (review collapses when absent), fresh start card, conditional resume section, status panel (streak, next achievement, latest card), board questions or board invitation, JST learning days and no EXP/rank passed.');
