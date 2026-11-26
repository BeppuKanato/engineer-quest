"use client";

// 発展ミッションの場面サムネイル（2026-11-25）。単元ミッションのサムネイルと
// 同じ条件で描く：①課題が一目で分かる、②答え（解法）は描かない、
// ③見た人が「自分ならどうする？」と考え始める。困っている場面（AS-IS）を描き、
// 経路や手順そのものは描かない。枠は 460×210 で単元側とそろえる。

import { Box } from "@mui/material";

/** 困っているロボット（単元サムネと同一の姿）。 */
const SceneRobot: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1="22" y1="-14" x2="22" y2="-28" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="22" cy="-32" r="5" fill="#2563eb" />
    <rect x="0" y="0" width="44" height="42" rx="10" fill="#2563eb" />
    <rect x="7" y="8" width="30" height="19" rx="5" fill="#dbeafe" />
    <circle cx="17" cy="16" r="3" fill="#1e3a8a" />
    <circle cx="27" cy="16" r="3" fill="#1e3a8a" />
    <path d="M17 24 Q22 21 27 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
    <path d="M52 6 C52 6 46 16 46 20.5 A6 6 0 0 0 58 20.5 C58 16 52 6 52 6 Z" fill="#7dd3fc" />
  </g>
);

const QuestionBubble: React.FC<{ x: number; y: number; tail: string }> = ({ x, y, tail }) => (
  <g>
    <circle cx={x} cy={y} r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
    <path d={tail} fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
    <text x={x} y={y + 8} textAnchor="middle" fontSize="20" fontWeight="900" fill="#2563eb">
      ？
    </text>
  </g>
);

/** ダンジョンの最短脱出：石のダンジョンの入口で困るロボット。奥に出口の扉が光るが、道順は読めない。 */
export const DungeonEscapeThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="ダンジョンの入口で、出口までの道に困っているロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* ダンジョンの壁の塊 */}
    <rect x="10" y="6" width="440" height="198" rx="10" fill="#5b7186" />
    {/* 部屋と通路：枝分かれが多く、一目では道順が読めない形にする（解法は描かない） */}
    <g stroke="#e9dcc3" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M40 168 L150 168 L150 96" />
      <path d="M96 168 L96 60 L210 60" />
      <path d="M150 96 L262 96 L262 168 L368 168" />
      <path d="M210 60 L330 60 L330 120" />
      <path d="M262 168 L262 132" />
      <path d="M330 120 L404 120" />
      <path d="M368 168 L368 132" />
    </g>
    {/* 部屋の広がり */}
    <g fill="#e9dcc3">
      <rect x="76" y="40" width="44" height="40" rx="6" />
      <rect x="242" y="76" width="44" height="40" rx="6" />
      <rect x="348" y="148" width="44" height="40" rx="6" />
    </g>
    {/* 出口の扉：いちばん奥で光る */}
    <g>
      <line x1="420" y1="92" x2="420" y2="98" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="406" y1="96" x2="410" y2="101" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="434" y1="96" x2="430" y2="101" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <rect x="406" y="102" width="28" height="42" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
      <path d="M412 144 L412 122 A8 8 0 0 1 428 122 L428 144 Z" fill="#f59e0b" />
    </g>
    {/* 入口のロボット：地図を持って困っている */}
    <SceneRobot x={16} y={150} />
    <g transform="rotate(-8 84 176)">
      <rect x="70" y="158" width="30" height="36" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      <path d="M76 168 h18 M76 176 h18 M76 184 h12" stroke="#94a3b8" strokeWidth="2" />
    </g>
    <QuestionBubble x={128} y={138} tail="M116 148 L102 158 L120 154 Z" />
  </Box>
);

/** 島の数を数える：海に点々と浮かぶ島々を前に、数え方に困るロボット（小舟）。 */
export const IslandCountThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="海に点々と浮かぶ島の数を数えかねているロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#dbeafe" />
    {/* 波 */}
    <g stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" fill="none">
      <path d="M20 186 q10 -8 20 0 t20 0" />
      <path d="M300 196 q10 -8 20 0 t20 0" />
      <path d="M392 168 q10 -8 20 0 t20 0" />
      <path d="M150 200 q10 -8 20 0 t20 0" />
    </g>
    {/* 島々：大きさも形もバラバラに散らす（数そのものは描かない） */}
    <g fill="#7da383" stroke="#5d7d63" strokeWidth="2">
      <ellipse cx="96" cy="62" rx="46" ry="20" />
      <ellipse cx="238" cy="44" rx="30" ry="14" />
      <ellipse cx="356" cy="70" rx="52" ry="22" />
      <ellipse cx="176" cy="118" rx="24" ry="11" />
      <ellipse cx="318" cy="128" rx="36" ry="16" />
      <ellipse cx="424" cy="140" rx="22" ry="10" />
      <ellipse cx="66" cy="128" rx="18" ry="9" />
    </g>
    <g fill="#5d7d63">
      <path d="M96 44 l7 -14 l7 14 Z" />
      <path d="M356 50 l8 -16 l8 16 Z" />
      <path d="M238 32 l5 -10 l5 10 Z" />
    </g>
    {/* 小舟とロボット：島々を見渡して困っている */}
    <g>
      <path d="M120 168 L196 168 L182 190 L134 190 Z" fill="#a3826d" />
      <rect x="118" y="162" width="80" height="7" rx="3" fill="#8d6e63" />
    </g>
    <SceneRobot x={136} y={112} />
    <QuestionBubble x={216} y={108} tail="M204 118 L190 128 L208 124 Z" />
  </Box>
);

/** バグが入った版を特定する：版のパネルが長く並び、向こうの方は割れている。端から確認する大変さの場面。 */
export const FirstBrokenThumbnail: React.FC = () => {
  const panels = Array.from({ length: 9 }, (_, i) => 22 + i * 48);
  return (
    <Box
      component="svg"
      viewBox="0 0 460 210"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="版のパネルが長く並び、向こうの方が割れていて困っているロボット"
    >
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      {/* 床 */}
      <rect x="0" y="150" width="460" height="60" fill="#e2e8f0" />
      {/* 版のパネル：手前は無事、向こうは割れている（境目がどこかは分からない距離感にする） */}
      {panels.map((x, i) => {
        const broken = i >= 6;
        const faded = i >= 4 && i < 6;
        return (
          <g key={x} opacity={faded ? 0.55 : 1}>
            <rect x={x} y="52" width="40" height="98" rx="5" fill={broken ? "#cbd5e1" : "#ffffff"} stroke="#5b7186" strokeWidth="2.5" />
            <text x={x + 20} y="76" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1e3a8a">
              {i + 1}
            </text>
            {broken ? (
              <path d={`M${x + 8} 88 l10 12 l-6 10 l12 12 l-5 10`} stroke="#64748b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            ) : (
              <circle cx={x + 20} cy="112" r="9" fill="none" stroke="#16a34a" strokeWidth="3" />
            )}
          </g>
        );
      })}
      {/* 足あと：端から1つずつ確認して歩いた跡 */}
      <g fill="#94a3b8">
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={86 + i * 24} cy="196" r="3" opacity={1 - i * 0.07} />
        ))}
      </g>
      <SceneRobot x={18} y={146} />
      {/* 確認中のチェックリスト */}
      <g transform="rotate(-6 76 168)">
        <rect x="62" y="150" width="29" height="38" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
        <path d="M67 160 l3 3 l5 -6 M67 172 l3 3 l5 -6" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M78 160 h9 M78 172 h9" stroke="#94a3b8" strokeWidth="2" />
      </g>
      <QuestionBubble x={118} y={140} tail="M106 150 L92 160 L110 156 Z" />
    </Box>
  );
};

export const developmentMissionThumbnailFor = (missionId: string): React.ReactNode => {
  switch (missionId) {
    case "dungeon-escape":
      return <DungeonEscapeThumbnail />;
    case "island-count":
      return <IslandCountThumbnail />;
    case "first-broken-version":
      return <FirstBrokenThumbnail />;
    default:
      return null;
  }
};
