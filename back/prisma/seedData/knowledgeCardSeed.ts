import { KnowledgeCardRarity, type Prisma } from "@prisma/client";

import { learningSeed } from "./learningSeed";

export const KNOWLEDGE_CARD_TABLE_COUNT = 15;

type CardDefinition = {
  title: string;
  label: string;
  description: string;
  connection: string;
  useCase: string;
  searchKeywords: string[];
  rarity: KnowledgeCardRarity;
};

const definitions: Record<string, CardDefinition[]> = {
  "course-algorithm-bubble-sort-v2": [
    { title: "交換回数から乱れを測る", label: "Inversion Count", description: "並びがどれだけ乱れているかは、順序が逆になった組の数で表せます。", connection: "バブルソートの交換は、逆転した組を1つずつ減らす動きです。", useCase: "ランキングの変化量や、並びの近さを数値で比較するときに使えます。", searchKeywords: ["転倒数", "inversion count"], rarity: KnowledgeCardRarity.RARE },
    { title: "途中終了で無駄を減らす", label: "Early Exit", description: "1周して一度も交換がなければ、残りの処理をせず整列完了と判断できます。", connection: "基本形に小さな判定を加えるだけで、整列済みデータを速く処理できます。", useCase: "ほぼ並んでいる小さなデータを扱う処理で役立ちます。", searchKeywords: ["バブルソート 改良", "early exit sort"], rarity: KnowledgeCardRarity.COMMON },
    { title: "左右へ往復する並べ替え", label: "Cocktail Sort", description: "左から右、次に右から左へ比較を繰り返す、バブルソートの仲間です。", connection: "隣同士の比較と交換という同じ考えを、両方向に広げています。", useCase: "一方向だけでは移動に時間がかかる小さな値と大きな値を同時に動かせます。", searchKeywords: ["カクテルソート", "cocktail shaker sort"], rarity: KnowledgeCardRarity.RARE },
    { title: "アルゴリズムを見るアニメーション", label: "Algorithm Visualization", description: "値をカードや棒として描くと、比較・交換・確定の動きを目で追えます。", connection: "コースで操作した配列表示も、アルゴリズム可視化の一例です。", useCase: "処理の説明、デバッグ、学習用ツールの制作に使われます。", searchKeywords: ["sorting visualization", "algorithm animation"], rarity: KnowledgeCardRarity.COMMON },
    { title: "比較だけでは越えられない境界", label: "Comparison Lower Bound", description: "比較だけで一般的なデータを並べ替える方法には、必要な比較回数の理論的な下限があります。", connection: "二重ループを減らすだけでなく、比較ソート全体の限界を考える入口になります。", useCase: "より速いソートを設計するとき、方式そのものを変える必要があるか判断できます。", searchKeywords: ["comparison sort lower bound", "Omega n log n"], rarity: KnowledgeCardRarity.EPIC },
  ],
  "course-algorithm-binary-search-v1": [
    { title: "Pythonのbisect", label: "bisect", description: "Pythonには整列済みリストの挿入位置を二分探索で探すbisectモジュールがあります。", connection: "自分で実装した二分探索と同じ範囲の絞り込みを標準機能として利用できます。", useCase: "小さな整列済みリストへ順序を保ったまま値を追加するときに便利です。", searchKeywords: ["Python bisect", "bisect_left"], rarity: KnowledgeCardRarity.COMMON },
    { title: "最初の位置を探すlower bound", label: "Lower Bound", description: "値そのものではなく、条件を初めて満たす位置を二分探索で求める考え方です。", connection: "重複する値の先頭や、値を挿入すべき場所を探せます。", useCase: "期間検索、価格帯検索、重複データの範囲取得に使えます。", searchKeywords: ["lower bound", "upper bound"], rarity: KnowledgeCardRarity.RARE },
    { title: "答えを二分探索する", label: "Binary Search on Answer", description: "配列ではなく、答えの候補範囲を半分ずつ絞る方法があります。", connection: "ある値で条件を満たすかを判定できれば、最小値や最大値を探せます。", useCase: "必要なサーバ台数、作業時間、容量の最小値を求める問題に使われます。", searchKeywords: ["答えで二分探索", "binary search on answer"], rarity: KnowledgeCardRarity.EPIC },
    { title: "データベースのB-tree", label: "B-tree Index", description: "データベースの索引では、二分探索木を多分岐にしたB-tree系の構造が広く使われます。", connection: "整列された情報から探索範囲を減らす考えが、大量データの検索へつながります。", useCase: "ID検索、範囲検索、並び替えを含むデータベース処理で利用されます。", searchKeywords: ["B-tree index", "database index"], rarity: KnowledgeCardRarity.RARE },
    { title: "探索前の並べ替えコスト", label: "Sort or Scan", description: "一度だけ探すなら線形探索、何度も探すなら事前に並べ替えて二分探索する方が有利な場合があります。", connection: "探索時間だけでなく、準備に必要な時間も含めて方法を選びます。", useCase: "検索回数が多い商品一覧やログ検索の設計判断に使えます。", searchKeywords: ["sort versus search", "preprocessing algorithm"], rarity: KnowledgeCardRarity.COMMON },
  ],
  "course-algorithm-kmp-v1": [
    { title: "接頭辞と接尾辞の共通部分", label: "Prefix Function", description: "文字列の先頭と末尾がどこまで同じかを記録すると、比較の再利用ができます。", connection: "KMP法の部分一致表を別の角度から表す考え方です。", useCase: "文字列の周期判定や、繰り返し構造の検出にも使えます。", searchKeywords: ["prefix function", "failure function"], rarity: KnowledgeCardRarity.COMMON },
    { title: "重なって現れるパターン", label: "Overlapping Match", description: "検索語が重なって出現する場合、見つけた直後の戻り先が重要になります。", connection: "部分一致表を使えば、最初から比較し直さず次の一致候補へ進めます。", useCase: "DNA配列、ログ、繰り返し文字列から全出現位置を探すときに使えます。", searchKeywords: ["overlapping string match", "KMP all matches"], rarity: KnowledgeCardRarity.COMMON },
    { title: "後ろから比べるBoyer–Moore法", label: "Boyer-Moore", description: "検索語の末尾側から比較し、不一致文字を利用して大きく移動する文字列探索法です。", connection: "KMP法とは異なる情報を使って、比較を飛ばします。", useCase: "長い文章から比較的長い単語を探す場面で高速になることがあります。", searchKeywords: ["Boyer-Moore algorithm", "bad character rule"], rarity: KnowledgeCardRarity.RARE },
    { title: "複数語を同時に探す", label: "Aho-Corasick", description: "多数の検索語を木構造にまとめ、文章を1回たどりながら同時に検出する方法があります。", connection: "KMP法の戻り先を、複数パターンを扱える構造へ発展させた考え方です。", useCase: "禁止語検出、ウイルスパターン検査、辞書語の一括検索に使われます。", searchKeywords: ["Aho-Corasick", "multiple pattern matching"], rarity: KnowledgeCardRarity.EPIC },
    { title: "正規表現エンジンの探索", label: "Regex Engine", description: "正規表現は固定文字列より柔軟なパターンを表せますが、内部では別の状態遷移や探索が必要です。", connection: "固定語に強いKMP法と比較すると、問題に応じて検索方法を選ぶ理由が分かります。", useCase: "入力検証、ログ抽出、文章の置換に使われます。", searchKeywords: ["regex engine", "finite automaton"], rarity: KnowledgeCardRarity.RARE },
  ],
  "course-algorithm-selection-sort-v1": [
    { title: "書き換え回数が少ないソート", label: "Write Efficiency", description: "選択ソートは比較回数が多い一方、交換回数を少なくできます。", connection: "1周につき交換を最大1回に抑える特徴があります。", useCase: "書き込み回数に制約がある記憶装置を考える入口になります。", searchKeywords: ["selection sort writes", "write efficient sorting"], rarity: KnowledgeCardRarity.RARE },
    { title: "先頭k件だけを選ぶ", label: "Top-k Selection", description: "全件を並べ替えず、必要な上位k件だけを選ぶ方が効率的な場合があります。", connection: "未確定範囲から最小値や最大値を選ぶ考えを途中で止めて利用できます。", useCase: "ランキング上位、人気商品、最高得点者の抽出に使えます。", searchKeywords: ["top-k algorithm", "partial selection"], rarity: KnowledgeCardRarity.COMMON },
    { title: "k番目の値を直接探す", label: "Quickselect", description: "クイックソートの分割を利用し、k番目に小さい値だけを探す方法があります。", connection: "すべてを整列せず、必要な位置だけを確定する選択問題です。", useCase: "中央値、百分位、順位境界の計算に使われます。", searchKeywords: ["quickselect", "selection algorithm"], rarity: KnowledgeCardRarity.EPIC },
    { title: "その場で並べ替えるin-place", label: "In-place", description: "入力配列の中で要素を交換し、追加領域をほとんど使わない処理をin-placeと呼びます。", connection: "選択ソートは代表的なin-placeソートです。", useCase: "利用できるメモリが小さい環境で方式を選ぶ基準になります。", searchKeywords: ["in-place algorithm", "space complexity"], rarity: KnowledgeCardRarity.COMMON },
    { title: "安定な選択ソート", label: "Stable Selection", description: "最小値を交換せず、間の要素をずらして挿入すれば元の順番を保てます。", connection: "同じ選択の考えでも、移動方法によって安定性が変わります。", useCase: "同じ値を持つデータの元の順番を残したい場合の設計比較に役立ちます。", searchKeywords: ["stable selection sort", "sorting stability"], rarity: KnowledgeCardRarity.RARE },
  ],
  "course-algorithm-breadth-first-search-v1": [
    { title: "キューを支えるdeque", label: "collections.deque", description: "Pythonのdequeは、先頭からの取り出しと末尾への追加を効率よく行えます。", connection: "幅優先探索で必要な先入れ先出しのキューを実装できます。", useCase: "探索待ちデータ、処理待ちジョブ、履歴の管理に使えます。", searchKeywords: ["Python deque", "FIFO queue"], rarity: KnowledgeCardRarity.COMMON },
    { title: "重みなしグラフの最短距離", label: "Unweighted Shortest Path", description: "すべての移動コストが同じなら、最初に到達した経路が最短になります。", connection: "BFSが距離の小さい順に頂点を調べるためです。", useCase: "迷路、最少手数、友達関係の距離を求める問題に使えます。", searchKeywords: ["unweighted shortest path", "BFS distance"], rarity: KnowledgeCardRarity.COMMON },
    { title: "両側から探す双方向探索", label: "Bidirectional Search", description: "開始地点と目的地の両方から探索し、途中で出会わせる方法です。", connection: "BFSの探索範囲を2つに分けることで、調べる頂点を大きく減らせる場合があります。", useCase: "経路探索や単語変換など、開始と終了が明確な問題に使われます。", searchKeywords: ["bidirectional BFS", "bidirectional search"], rarity: KnowledgeCardRarity.EPIC },
    { title: "Webクローラーの巡回", label: "Web Crawling", description: "ページ内のリンクをたどって新しいページを収集する処理は、グラフ探索として考えられます。", connection: "ページを頂点、リンクを辺としてBFSで近いページから巡回できます。", useCase: "検索エンジン、リンク検査、サイト構造の調査に使われます。", searchKeywords: ["web crawler BFS", "link graph"], rarity: KnowledgeCardRarity.RARE },
    { title: "つながりの近さを表す次数", label: "Degrees of Separation", description: "人同士が何人を介してつながるかは、グラフ上の最短距離として表せます。", connection: "BFSで始点からの段数を記録すれば、関係の距離を求められます。", useCase: "SNSの友達候補やネットワーク分析に使われます。", searchKeywords: ["degrees of separation", "social graph BFS"], rarity: KnowledgeCardRarity.RARE },
  ],
  "course-algorithm-depth-first-search-v1": [
    { title: "選択を戻すバックトラッキング", label: "Backtracking", description: "候補を1つ選んで深く試し、失敗したら直前の選択まで戻る探索です。", connection: "DFSの進む・戻る動きを、答えの組み合わせ探しに利用します。", useCase: "数独、迷路、組み合わせ、配置問題に使われます。", searchKeywords: ["backtracking", "DFS puzzle"], rarity: KnowledgeCardRarity.COMMON },
    { title: "依存関係を並べるトポロジカルソート", label: "Topological Sort", description: "先に必要な作業を守りながら、有向グラフの頂点を順番に並べる方法です。", connection: "DFSから戻る順番を利用して作れます。", useCase: "ビルド順、履修順、タスク依存関係の解決に使われます。", searchKeywords: ["topological sort DFS", "dependency graph"], rarity: KnowledgeCardRarity.RARE },
    { title: "訪問中を使った循環検出", label: "Cycle Detection", description: "未訪問・訪問中・完了の3状態を使うと、有向グラフの循環を検出できます。", connection: "DFSで訪問中の頂点へ戻った場合、循環があると判断できます。", useCase: "依存関係の設定ミスや無限ループにつながる参照の発見に使われます。", searchKeywords: ["DFS cycle detection", "three color algorithm"], rarity: KnowledgeCardRarity.COMMON },
    { title: "迷路を作る深さ優先探索", label: "Maze Generation", description: "未訪問の隣へ進み、行き止まりで戻る動きから迷路を生成できます。", connection: "探索経路を作る側に利用したDFSの応用です。", useCase: "ゲームの迷路や手続き型マップ生成に使われます。", searchKeywords: ["DFS maze generation", "recursive backtracker"], rarity: KnowledgeCardRarity.RARE },
    { title: "強く結ばれたグループ", label: "Strongly Connected Components", description: "有向グラフで互いに行き来できる頂点を、まとまりとして分ける方法があります。", connection: "複数回のDFSや、探索中の情報を利用して求められます。", useCase: "循環する依存関係、Webリンク、状態遷移の分析に使われます。", searchKeywords: ["strongly connected components", "Tarjan algorithm"], rarity: KnowledgeCardRarity.EPIC },
  ],
  "course-algorithm-merge-sort-v1": [
    { title: "巨大データを扱う外部ソート", label: "External Sort", description: "メモリに入り切らないデータを小分けに整列し、ファイルを結合する方法です。", connection: "分割して整列し、順番を保ちながら結合するマージソートの考えを使います。", useCase: "大規模ログやデータベース処理に使われます。", searchKeywords: ["external merge sort", "large file sorting"], rarity: KnowledgeCardRarity.EPIC },
    { title: "同じ値の順番を守る安定ソート", label: "Stable Sort", description: "比較する値が同じ要素について、入力時の順番を維持する性質です。", connection: "結合時に左側を先に選べば、マージソートを安定にできます。", useCase: "名前順の後に成績順で並べるなど、複数条件の並べ替えに役立ちます。", searchKeywords: ["stable sort", "multi key sorting"], rarity: KnowledgeCardRarity.COMMON },
    { title: "分割を同時に進める並列化", label: "Parallel Merge Sort", description: "左右に分けた部分は独立しているため、別々の処理装置で同時に整列できます。", connection: "分割統治法は並列処理と相性がよい構造を持ちます。", useCase: "複数コアを使った大量データ処理に応用されます。", searchKeywords: ["parallel merge sort", "parallel divide and conquer"], rarity: KnowledgeCardRarity.RARE },
    { title: "連結リストとの相性", label: "Linked List Sort", description: "連結リストは途中への挿入がしやすく、要素をつなぎ替えて結合できます。", connection: "ランダムアクセスを必要としないマージソートは連結リストにも適用しやすい方法です。", useCase: "配列以外のデータ構造にソートを適用するときの方式選択に役立ちます。", searchKeywords: ["merge sort linked list", "linked list sorting"], rarity: KnowledgeCardRarity.RARE },
    { title: "Pythonが使うTimsort", label: "Timsort", description: "Pythonのsortedやlist.sortは、実データに多い整列済み部分を利用するTimsortを使います。", connection: "Timsortは整列済みのまとまりを見つけ、それらをマージする考えを含みます。", useCase: "標準ソートが多様な入力で高速に動く理由を知る入口になります。", searchKeywords: ["Python Timsort", "natural merge sort"], rarity: KnowledgeCardRarity.COMMON },
  ],
};

export const knowledgeCardSeed: Prisma.KnowledgeCardUncheckedCreateInput[] = learningSeed.courses.flatMap((course) =>
  (definitions[course.id] ?? []).map((definition, index) => ({
    id: `card-${course.id.replace("course-algorithm-", "")}-${index + 1}`,
    courseId: course.id,
    label: definition.label,
    title: definition.title,
    description: definition.description,
    connection: definition.connection,
    useCase: definition.useCase,
    searchKeywords: definition.searchKeywords,
    catalogNumber: index + 1,
    rarity: definition.rarity,
    sortOrder: index + 1,
    isPublished: true,
  })),
);

const seedHash = (value: string) => {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const shuffled = <T>(items: readonly T[], seed: number) => {
  const result = [...items];
  let state = seed || 1;
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(random() * (index + 1));
    [result[index], result[selected]] = [result[selected], result[index]];
  }
  return result;
};

export const knowledgeCardScheduleSeed: Prisma.KnowledgeCardScheduleEntryUncheckedCreateInput[] = learningSeed.courses.flatMap((course) => {
  const missions = course.missions.filter((mission) => mission.isPublished && mission.isRequiredForCourseCompletion).sort((left, right) => left.order - right.order);
  const cards = knowledgeCardSeed.filter((card) => card.courseId === course.id);
  if (cards.length === 0) return [];
  if (cards.length > missions.length) throw new Error(`${course.id}: knowledge cards exceed required missions`);
  const finalMission = missions.at(-1)!;
  const earlierMissions = missions.slice(0, -1);
  const finalCard = cards.find((card) => card.rarity === KnowledgeCardRarity.EPIC) ?? cards.at(-1)!;
  const earlierCards = cards.filter((card) => card.id !== finalCard.id);

  return Array.from({ length: KNOWLEDGE_CARD_TABLE_COUNT }, (_, offset) => offset + 1).flatMap((tableNumber) => {
    const seed = seedHash(`${course.id}:${course.version}:${tableNumber}`);
    const selectedMissions = shuffled(earlierMissions, seed).slice(0, earlierCards.length).sort((left, right) => left.order - right.order);
    const orderedCards = shuffled(earlierCards, seed ^ 0x9e3779b9);
    return [
      ...selectedMissions.map((mission, index) => ({ id: `schedule-${course.id}-v${course.version}-t${tableNumber}-m${mission.order}`, courseId: course.id, courseVersion: course.version, tableNumber, missionId: mission.id, knowledgeCardId: String(orderedCards[index].id) })),
      { id: `schedule-${course.id}-v${course.version}-t${tableNumber}-m${finalMission.order}`, courseId: course.id, courseVersion: course.version, tableNumber, missionId: finalMission.id, knowledgeCardId: String(finalCard.id) },
    ];
  });
});
