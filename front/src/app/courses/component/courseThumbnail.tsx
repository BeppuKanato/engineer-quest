import type React from "react";

/**
 * 単元ごとのサムネイル（代表図）。イラスト資産ではなく、その単元を象徴する図を
 * コードで描く。新しい単元では代表図の定義を1つ足すだけでよい。
 * 未定義のコースは null を返し、CourseCard はカテゴリ別のビジュアルにフォールバックする。
 * 図は装飾であり、単元名はカードのタイトルが担うため aria-hidden とする。
 */

const EDGE = "#94a3b8";
const ACCENT = "#2563eb";
const INK = "#1e3a5f";

const GraphFigure: React.FC<{ dfs: boolean }> = ({ dfs }) => {
  // BFS / DFS は教材と同じグラフ（A〜F、7辺）を土台にし、探索の性格で描き分ける。
  const nodes = {
    A: { x: 30, y: 60, distance: 0 },
    B: { x: 80, y: 26, distance: 1 },
    C: { x: 80, y: 94, distance: 1 },
    D: { x: 130, y: 26, distance: 2 },
    E: { x: 130, y: 94, distance: 2 },
    F: { x: 176, y: 60, distance: 3 },
  } as const;
  const edges: Array<[keyof typeof nodes, keyof typeof nodes]> = [
    ["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "E"], ["D", "F"], ["E", "F"],
  ];
  // DFS の訪問順 A→B→D→F→E→C をたどる辺。
  const pathEdges = new Set(["A-B", "B-D", "D-F", "F-E", "E-C"]);
  const distanceFill = ["#2563eb", "#60a5fa", "#93c5fd", "#dbeafe"];
  return (
    <g>
      {edges.map(([from, to]) => {
        const key = `${from}-${to}`;
        const onPath = dfs && (pathEdges.has(key) || pathEdges.has(`${to}-${from}`));
        return (
          <line
            key={key}
            x1={nodes[from].x}
            y1={nodes[from].y}
            x2={nodes[to].x}
            y2={nodes[to].y}
            stroke={onPath ? ACCENT : EDGE}
            strokeWidth={onPath ? 4 : 2}
            strokeDasharray={!dfs || onPath ? undefined : "5 4"}
            strokeLinecap="round"
          />
        );
      })}
      {(Object.entries(nodes) as Array<[string, (typeof nodes)["A"]]>).map(([label, node]) => {
        const fill = dfs ? (label === "A" ? ACCENT : "#eff6ff") : distanceFill[node.distance];
        const textFill = dfs ? (label === "A" ? "#fff" : INK) : node.distance <= 1 ? "#fff" : INK;
        return (
          <g key={label}>
            <circle cx={node.x} cy={node.y} r={13} fill={fill} stroke={ACCENT} strokeWidth={1.5} />
            <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill={textFill}>
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

const Bars: React.FC<{ heights: number[]; fills: string[]; ringIndex?: number }> = ({ heights, fills, ringIndex }) => (
  <g>
    <line x1={16} y1={104} x2={188} y2={104} stroke={EDGE} strokeWidth={2} strokeLinecap="round" />
    {heights.map((height, index) => {
      const x = 28 + index * 26;
      return (
        <g key={index}>
          <rect x={x} y={104 - height} width={18} height={height} rx={3} fill={fills[index]} stroke={ACCENT} strokeWidth={index === ringIndex ? 2.5 : 1} />
          {index === ringIndex && (
            <path d={`M ${x + 9} 6 l 6 8 h -12 z`} fill={ACCENT} transform={`translate(0 ${104 - height - 22})`} />
          )}
        </g>
      );
    })}
  </g>
);

const BubbleSortFigure = () => (
  // 最大の要素が末尾へ確定していく途中の状態。
  <Bars heights={[34, 78, 50, 96, 62, 88]} fills={["#bfdbfe", "#bfdbfe", "#bfdbfe", "#bfdbfe", "#bfdbfe", ACCENT]} />
);

const SelectionSortFigure = () => (
  // 先頭の確定済みプレフィックスと、残りの中の最小への印。
  <Bars heights={[22, 36, 88, 58, 96, 72]} fills={[ACCENT, ACCENT, "#bfdbfe", "#bfdbfe", "#bfdbfe", "#bfdbfe"]} ringIndex={3} />
);

const MergeSortFigure = () => (
  <g>
    {/* 分割した2グループ */}
    {[30, 18, 38].map((height, index) => (
      <rect key={`l${index}`} x={36 + index * 20} y={44 - height} width={14} height={height} rx={3} fill="#bfdbfe" stroke={ACCENT} />
    ))}
    {[24, 36, 20].map((height, index) => (
      <rect key={`r${index}`} x={114 + index * 20} y={44 - height} width={14} height={height} rx={3} fill="#bfdbfe" stroke={ACCENT} />
    ))}
    <path d="M 62 50 v 8 M 140 50 v 8" stroke={EDGE} strokeWidth={2} strokeLinecap="round" />
    <path d="M 57 55 l 5 6 5 -6 M 135 55 l 5 6 5 -6" fill="none" stroke={EDGE} strokeWidth={2} strokeLinecap="round" />
    {/* 統合後の昇順 */}
    {[16, 22, 28, 34, 40, 46].map((height, index) => (
      <rect key={`m${index}`} x={28 + index * 26} y={104 - height} width={18} height={height} rx={3} fill="#93c5fd" stroke={ACCENT} />
    ))}
    <line x1={16} y1={104} x2={188} y2={104} stroke={EDGE} strokeWidth={2} strokeLinecap="round" />
  </g>
);

const BinarySearchFigure = () => {
  const values = [3, 7, 12, 18, 24, 31, 38, 45, 52];
  const mid = 4;
  return (
    <g>
      <line x1={14} y1={30} x2={186} y2={30} stroke={EDGE} strokeWidth={2} />
      <line x1={14} y1={30} x2={14} y2={38} stroke={EDGE} strokeWidth={2} />
      <line x1={186} y1={30} x2={186} y2={38} stroke={EDGE} strokeWidth={2} />
      {values.map((value, index) => {
        const x = 14 + index * 19.5;
        const isMid = index === mid;
        return (
          <g key={value}>
            <rect x={x} y={44} width={17.5} height={30} rx={3} fill={isMid ? ACCENT : "#eff6ff"} stroke={ACCENT} strokeWidth={isMid ? 2 : 1} />
            <text x={x + 8.75} y={59} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={isMid ? 800 : 600} fill={isMid ? "#fff" : INK}>
              {value}
            </text>
          </g>
        );
      })}
      <path d={`M ${14 + mid * 19.5 + 8.75} 88 l 6 9 h -12 z`} fill={ACCENT} />
      <text x={14 + mid * 19.5 + 8.75} y={110} textAnchor="middle" fontSize={10} fontWeight={700} fill={ACCENT}>
        中央
      </text>
    </g>
  );
};

const KmpFigure = () => {
  const text = ["A", "B", "A", "B", "A", "B", "C"];
  const pattern = ["A", "B", "A", "B", "C"];
  const cell = (x: number, y: number, char: string, matched: boolean, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={20} height={24} rx={3} fill={matched ? "#93c5fd" : "#eff6ff"} stroke={ACCENT} strokeWidth={matched ? 1.5 : 1} />
      <text x={x + 10} y={y + 12} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill={INK}>
        {char}
      </text>
    </g>
  );
  return (
    <g>
      <text x={8} y={34} fontSize={10} fontWeight={700} fill={INK}>文</text>
      {text.map((char, index) => cell(26 + index * 22, 22, char, index >= 2, `t${index}`))}
      <text x={8} y={82} fontSize={10} fontWeight={700} fill={INK}>型</text>
      {pattern.map((char, index) => cell(26 + (index + 2) * 22, 70, char, true, `p${index}`))}
    </g>
  );
};

const MazeFigure = () => {
  // 教材（フェーズ1・2）と同じ主教材 9×9 の完成迷路。行文字列の # が壁。
  const rows = [
    "#########",
    "#.......#",
    "#.#####.#",
    "#...#...#",
    "#.#.###.#",
    "#.#...#.#",
    "#.#####.#",
    "#.....#.#",
    "#########",
  ];
  const cell = 11;
  const ox = 50;
  const oy = 10;
  const center = (cx: number, cy: number): [number, number] => [ox + (cx + 0.5) * cell, oy + (cy + 0.5) * cell];
  // フェーズ1で示すスタート (1,7) → ゴール (7,7) の経路の折れ点。
  const route: Array<[number, number]> = [[1, 7], [1, 1], [7, 1], [7, 7]];
  const routePoints = route.map(([cx, cy]) => center(cx, cy).join(",")).join(" ");
  const [start, goal] = [center(1, 7), center(7, 7)];
  return (
    <g>
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          ch === "#" ? (
            <rect key={`${x}-${y}`} x={ox + x * cell} y={oy + y * cell} width={cell} height={cell} fill={INK} />
          ) : null,
        ),
      )}
      <polyline points={routePoints} fill="none" stroke={ACCENT} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={start[0]} cy={start[1]} r={3.5} fill={ACCENT} stroke="#fff" strokeWidth={1.5} />
      <circle cx={goal[0]} cy={goal[1]} r={3.5} fill={ACCENT} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
};

const FIGURES: Record<string, React.ReactElement> = {
  "course-algorithm-wall-extension-v1": <MazeFigure />,
  "course-algorithm-breadth-first-search-v1": <GraphFigure dfs={false} />,
  "course-algorithm-depth-first-search-v1": <GraphFigure dfs={true} />,
  "course-algorithm-bubble-sort-v2": <BubbleSortFigure />,
  "course-algorithm-selection-sort-v1": <SelectionSortFigure />,
  "course-algorithm-merge-sort-v1": <MergeSortFigure />,
  "course-algorithm-binary-search-v1": <BinarySearchFigure />,
  "course-algorithm-kmp-v1": <KmpFigure />,
};

export const CourseThumbnail: React.FC<{ courseId: string }> = ({ courseId }) => {
  const figure = FIGURES[courseId];
  if (!figure) return null;
  return (
    <svg viewBox="0 0 200 120" width="100%" height="100%" aria-hidden="true" focusable="false" style={{ display: "block" }}>
      {figure}
    </svg>
  );
};

export const hasCourseThumbnail = (courseId: string) => courseId in FIGURES;
