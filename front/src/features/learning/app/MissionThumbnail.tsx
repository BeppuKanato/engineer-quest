"use client";

// ミッション場面サムネイルの試作（2026-11-22）。
// 目的：サムネを見ただけで「このアルゴリズムがどんな課題に挑むのか」が直感的に分かり、
// 見た人が「自分ならどうする？」と考え始めること。興味はこの「どうすれば」が引く。
// 条件は3つ：①課題が一目で分かる、②答え（解法）は描かない、③通路が一目では読めず、
// 目が自然に経路を探す。解法を描くと答えになってしまい、「自分が解く課題」として伝わらない。
// 従来の CourseThumbnail はアルゴリズムの仕組みの図（ノード図など）で、課題の場面は描いていない。
// 2026-11-23：同じ課題の組（BFS/DFS）で場面が似すぎて見分けがつかない問題への対応。
// 「同じ課題だから仕方ない」ではサムネの識別の仕事が成り立たないため、場面の形に
// 手法の性格を埋め込んで描き分ける：BFS＝幅（横に広い空間、たくさんの分かれ道、
// 近くを少しずつ試した足あと）、DFS＝深さ（暗い塊に一本だけ刻まれた深い通路、
// 奥の行き止まりまで入った足あと）。課題は描き、経路（答え）は描かない点は同じ。
// 枠の形はカードのサムネ領域（約 2.2 : 1）に合わせてある。

import { Box } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";

/** BFS：広い倉庫で、たくさんの通路の前に困っている配送ロボット（幅の場面）。 */
export const BfsMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="広い倉庫で、たくさんの通路の前に困っている配送ロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 床のグリッド */}
    {Array.from({ length: 17 }, (_, i) => (
      <line key={`v${i}`} x1={(i + 1) * 26} y1="0" x2={(i + 1) * 26} y2="210" stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <line key={`h${i}`} x1="0" y1={(i + 1) * 26} x2="460" y2={(i + 1) * 26} stroke="#2563eb" strokeOpacity="0.06" />
    ))}
    {/* 棚：横に広く、浅く並べる。通路が何本もある「幅」の空間にする */}
    <g fill="#5b7186">
      <rect x="16" y="48" width="84" height="30" rx="6" />
      <rect x="132" y="48" width="84" height="30" rx="6" />
      <rect x="248" y="48" width="84" height="30" rx="6" />
      <rect x="364" y="48" width="84" height="30" rx="6" />
      <rect x="64" y="98" width="84" height="30" rx="6" />
      <rect x="180" y="98" width="84" height="30" rx="6" />
      <rect x="296" y="98" width="84" height="30" rx="6" />
    </g>
    <g stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2">
      <line x1="58" y1="48" x2="58" y2="78" />
      <line x1="174" y1="48" x2="174" y2="78" />
      <line x1="290" y1="48" x2="290" y2="78" />
      <line x1="406" y1="48" x2="406" y2="78" />
      <line x1="106" y1="98" x2="106" y2="128" />
      <line x1="222" y1="98" x2="222" y2="128" />
      <line x1="338" y1="98" x2="338" y2="128" />
    </g>
    {/* 届け先：家（広い空間の向こう側に小さく見える） */}
    <g>
      <path d="M394 26 L421 8 L448 26 Z" fill="#1e40af" />
      <rect x="398" y="26" width="46" height="24" rx="3" fill="#ffffff" stroke="#1e40af" strokeWidth="3" />
      <rect x="413" y="36" width="13" height="14" rx="2" fill="#2563eb" />
    </g>
    {/* 足あと：ロボットの周りで、近くの通路を少しずつ試して止まっている（幅の試行） */}
    <g fill="#94a3b8">
      <circle cx="192" cy="146" r="3" />
      <circle cx="174" cy="136" r="3" />
      <circle cx="160" cy="124" r="3" />
      <circle cx="206" cy="134" r="3" />
      <circle cx="188" cy="120" r="3" />
      <circle cx="176" cy="106" r="3" />
      <circle cx="244" cy="142" r="3" />
      <circle cx="264" cy="134" r="3" />
      <circle cx="284" cy="126" r="3" />
    </g>
    {/* ロボット：中央に立ち、荷物を抱えて、汗と「？」 */}
    <g>
      <line x1="221" y1="136" x2="221" y2="122" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="221" cy="118" r="5" fill="#2563eb" />
      <rect x="199" y="150" width="44" height="42" rx="10" fill="#2563eb" />
      <rect x="206" y="158" width="30" height="19" rx="5" fill="#dbeafe" />
      <circle cx="216" cy="166" r="3" fill="#1e3a8a" />
      <circle cx="226" cy="166" r="3" fill="#1e3a8a" />
      <path d="M216 174 Q221 171 226 174" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      {/* 汗 */}
      <path d="M251 156 C251 156 245 166 245 170.5 A6 6 0 0 0 257 170.5 C257 166 251 156 251 156 Z" fill="#7dd3fc" />
      {/* 抱えた荷物 */}
      <rect x="207" y="178" width="34" height="24" rx="3" fill="#b45309" />
      <line x1="207" y1="190" x2="241" y2="190" stroke="#92400e" strokeWidth="2.5" />
      <line x1="224" y1="178" x2="224" y2="202" stroke="#92400e" strokeWidth="2.5" />
    </g>
    {/* 「どうやって届けるの？」の吹き出し */}
    <g>
      <circle cx="276" cy="140" r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
      <path d="M264 150 L250 160 L266 158 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="276" y="148" textAnchor="middle" fontSize="20" fontWeight="900" fill="#2563eb">
        ？
      </text>
    </g>
  </Box>
);

/** DFS：暗い塊に一本だけ刻まれた深い通路。その入口で困っているロボット（深さの場面）。 */
export const DfsMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="一本の深い通路の入口で困っているロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 壁の塊：通路以外は全部壁 */}
    <rect x="10" y="6" width="440" height="198" rx="10" fill="#5b7186" />
    {/* 一本の通路：入口から奥へ、折れ曲がりながら深く続く */}
    <path
      d="M74 214 L74 96 L196 96 L196 158 L322 158 L322 58 L404 58"
      fill="none"
      stroke="#eef4fc"
      strokeWidth="36"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {/* 行き止まりの枝：本道から分かれて、奥で行き止まっている */}
    <path d="M196 158 L196 192" fill="none" stroke="#eef4fc" strokeWidth="30" strokeLinecap="round" />
    {/* 出口：通路のいちばん奥に、小さく光る扉 */}
    <g>
      <line x1="420" y1="24" x2="420" y2="30" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="406" y1="28" x2="410" y2="33" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <line x1="434" y1="28" x2="430" y2="33" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
      <rect x="406" y="34" width="28" height="46" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="3" />
      <path d="M412 80 L412 52 A8 8 0 0 1 428 52 L428 80 Z" fill="#f59e0b" />
    </g>
    {/* 足あと：本道を進み、行き止まりの枝の奥まで入って止まっている（深さの試行） */}
    <g fill="#94a3b8">
      <circle cx="106" cy="96" r="3" />
      <circle cx="136" cy="96" r="3" />
      <circle cx="166" cy="96" r="3" />
      <circle cx="196" cy="118" r="3" />
      <circle cx="196" cy="140" r="3" />
      <circle cx="196" cy="168" r="3" />
    </g>
    {/* ロボット：通路の入口に立ち、汗と「？」 */}
    <g>
      <line x1="76" y1="136" x2="76" y2="122" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="76" cy="118" r="5" fill="#2563eb" />
      <rect x="54" y="150" width="44" height="42" rx="10" fill="#2563eb" />
      <rect x="61" y="158" width="30" height="19" rx="5" fill="#dbeafe" />
      <circle cx="71" cy="166" r="3" fill="#1e3a8a" />
      <circle cx="81" cy="166" r="3" fill="#1e3a8a" />
      <path d="M71 174 Q76 171 81 174" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
      {/* 汗 */}
      <path d="M104 156 C104 156 98 166 98 170.5 A6 6 0 0 0 110 170.5 C110 166 104 156 104 156 Z" fill="#7dd3fc" />
    </g>
    {/* 「どうやって抜けるの？」の吹き出し（暗い壁の上で白く浮く） */}
    <g>
      <circle cx="128" cy="142" r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
      <path d="M116 152 L102 162 L120 158 Z" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
      <text x="128" y="150" textAnchor="middle" fontSize="20" fontWeight="900" fill="#2563eb">
        ？
      </text>
    </g>
  </Box>
);

/** ロボット（頭の左上基準）。場面サムネ共通の主人公。dream は「作りたいものを思い浮かべている」顔。 */
const TroubledRobot: React.FC<{ x: number; y: number; dream?: boolean }> = ({ x, y, dream }) => (
  <g transform={`translate(${x} ${y})`}>
    <line x1="22" y1="-14" x2="22" y2="-28" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="22" cy="-32" r="5" fill="#2563eb" />
    <rect x="0" y="0" width="44" height="42" rx="10" fill="#2563eb" />
    <rect x="7" y="8" width="30" height="19" rx="5" fill="#dbeafe" />
    <circle cx="17" cy="16" r="3" fill="#1e3a8a" />
    <circle cx="27" cy="16" r="3" fill="#1e3a8a" />
    {dream ? (
      <path d="M17 21 Q22 26 27 21" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
    ) : (
      <path d="M17 24 Q22 21 27 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
    )}
    {dream ? (
      <path d="M54 -8 L56.5 -1 L63 1.5 L56.5 4 L54 11 L51.5 4 L45 1.5 L51.5 -1 Z" fill="#f59e0b" />
    ) : (
      <path d="M52 6 C52 6 46 16 46 20.5 A6 6 0 0 0 58 20.5 C58 16 52 6 52 6 Z" fill="#7dd3fc" />
    )}
  </g>
);

/** 思い浮かべている完成した迷路（点線枠の設計図パネル）。作る側の単元で使う。 */
const ThoughtMaze: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="0" y="0" width="106" height="66" rx="10" fill="#ffffff" stroke="#2563eb" strokeWidth="2" strokeDasharray="6 5" />
    <rect x="10" y="10" width="86" height="46" fill="#f4f8fd" stroke="#5b7186" strokeWidth="3" />
    <g stroke="#5b7186" strokeWidth="3">
      <line x1="34" y1="10" x2="34" y2="36" />
      <line x1="34" y1="36" x2="62" y2="36" />
      <line x1="62" y1="24" x2="62" y2="56" />
      <line x1="78" y1="10" x2="78" y2="32" />
      <line x1="10" y1="46" x2="44" y2="46" />
    </g>
  </g>
);

/** 「？」の吹き出し。 */
const QuestionBubble: React.FC<{ x: number; y: number; tail: string }> = ({ x, y, tail }) => (
  <g>
    <circle cx={x} cy={y} r="16" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
    <path d={tail} fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" />
    <text x={x} y={y + 8} textAnchor="middle" fontSize="20" fontWeight="900" fill="#2563eb">
      ？
    </text>
  </g>
);

/** 穴掘り法：岩盤の前で掘り進めなくて困っているロボット。掘った部分だけが通路になっている。 */
export const DiggingMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="完成した迷路を思い浮かべながら、岩盤を掘るロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    {/* 岩盤の塊 */}
    <rect x="10" y="6" width="440" height="198" rx="10" fill="#8d6e63" />
    <g fill="#6d4c41" opacity="0.55">
      <rect x="252" y="140" width="13" height="13" rx="2" />
      <rect x="336" y="140" width="13" height="13" rx="2" />
      <rect x="392" y="96" width="13" height="13" rx="2" />
    </g>
    <path d="M356 158 l10 8 l-6 8 M404 168 l10 8 l-6 8" stroke="#5d4037" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    {/* 掘った通路：入口から入って、途中で岩にぶつかっている */}
    <path
      d="M4 160 L96 160 L96 88 L172 88"
      fill="none"
      stroke="#e9dcc3"
      strokeWidth="36"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    {/* 掘り出した土の山 */}
    <ellipse cx="34" cy="198" rx="28" ry="9" fill="#6d4c41" />
    <ellipse cx="66" cy="202" rx="18" ry="6" fill="#795548" />
    <TroubledRobot x={140} y={70} dream />
    {/* シャベル：岩の面に向けている */}
    <g>
      <line x1="190" y1="98" x2="216" y2="78" stroke="#6d4c41" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M216 78 L234 70 L237 82 L222 88 Z" fill="#b0bec5" />
    </g>
    {/* 思い浮かべている完成した迷路 */}
    <circle cx="216" cy="30" r="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
    <circle cx="250" cy="30" r="5.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
    <ThoughtMaze x={284} y={14} />
  </Box>
);

/** 棒倒し法：柱の並ぶ広場で、どの柱からどう壁を伸ばすか困っているロボット。 */
export const WallExtensionMissionThumbnail: React.FC = () => (
  <Box
    component="svg"
    viewBox="0 0 460 210"
    preserveAspectRatio="xMidYMid slice"
    sx={{ width: "100%", height: "100%", display: "block" }}
    role="img"
    aria-label="完成した迷路を思い浮かべながら、柱から壁を伸ばすロボット"
  >
    <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
    <rect x="0" y="172" width="460" height="38" fill="#e2eedd" />
    {/* 伸ばし済みの壁と、伸ばし途中の壁 */}
    <g stroke="#5b7186" strokeWidth="13">
      <line x1="188" y1="44" x2="188" y2="104" />
      <line x1="268" y1="44" x2="348" y2="44" />
      <line x1="268" y1="104" x2="348" y2="104" />
      <line x1="348" y1="104" x2="348" y2="164" />
      <line x1="108" y1="164" x2="188" y2="164" />
      <line x1="196" y1="164" x2="238" y2="164" />
    </g>
    {/* 伸ばし途中の先端のきらめき */}
    <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
      <line x1="248" y1="156" x2="254" y2="150" />
      <line x1="250" y1="164" x2="258" y2="164" />
      <line x1="248" y1="172" x2="254" y2="178" />
    </g>
    {/* 柱 */}
    <g fill="#5b7186">
      {[100, 180, 260, 340, 404].map((x) =>
        [36, 96, 156].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="16" height="16" rx="3" />),
      )}
    </g>
    <TroubledRobot x={22} y={126} dream />
    {/* 手に持った壁のパネル */}
    <rect x="70" y="136" width="46" height="13" rx="3" fill="#5b7186" />
    {/* 思い浮かべている完成した迷路 */}
    <circle cx="54" cy="80" r="3.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
    <circle cx="66" cy="66" r="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
    <ThoughtMaze x={92} y={4} />
  </Box>
);

/** バブルソート：番号がバラバラの本棚の前で困っているロボット。 */
export const BubbleSortMissionThumbnail: React.FC = () => {
  const books: { x: number; h: number; color: string; num: number }[] = [
    { x: 44, h: 64, color: "#7d8ca3", num: 7 },
    { x: 84, h: 84, color: "#a3826d", num: 3 },
    { x: 124, h: 56, color: "#7da383", num: 9 },
    { x: 164, h: 76, color: "#8d7da3", num: 1 },
    { x: 204, h: 60, color: "#a37d7d", num: 8 },
    { x: 244, h: 88, color: "#7d8ca3", num: 2 },
    { x: 284, h: 66, color: "#a3826d", num: 5 },
    { x: 324, h: 80, color: "#7da383", num: 4 },
    { x: 364, h: 58, color: "#8d7da3", num: 6 },
  ];
  return (
    <Box
      component="svg"
      viewBox="0 0 460 210"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="番号がバラバラに並んだ本棚の前で困っているロボット"
    >
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      {/* 本棚の脚 */}
      <rect x="26" y="126" width="9" height="58" fill="#8d6e63" />
      <rect x="425" y="126" width="9" height="58" fill="#8d6e63" />
      {/* 本 */}
      {books.map((b) => (
        <g key={b.x}>
          <rect x={b.x} y={126 - b.h} width="36" height={b.h} rx="3" fill={b.color} />
          <text x={b.x + 18} y={126 - b.h / 2 + 7} textAnchor="middle" fontSize="18" fontWeight="900" fill="#ffffff">
            {b.num}
          </text>
        </g>
      ))}
      {/* 棚板 */}
      <rect x="22" y="126" width="416" height="9" rx="3" fill="#8d6e63" />
      <TroubledRobot x={28} y={150} />
      {/* 手に持った本 */}
      <rect x="76" y="162" width="26" height="36" rx="3" fill="#7d8ca3" />
      <text x="89" y="187" textAnchor="middle" fontSize="15" fontWeight="900" fill="#ffffff">
        3
      </text>
      <QuestionBubble x={126} y={168} tail="M114 158 L100 148 L112 166 Z" />
    </Box>
  );
};

/**
 * バブルソートのミッション解決後の棚（2026-11-24）。開始時のサムネイルと
 * 同じ本（色・高さは本ごとに同じ）が、番号順に並んだ状態。開始時の問いへの
 * 答えとして、単元リザルトで使う。
 */
export const BubbleSortSolvedThumbnail: React.FC = () => {
  const books: { h: number; color: string; num: number }[] = [
    { h: 76, color: "#8d7da3", num: 1 },
    { h: 88, color: "#7d8ca3", num: 2 },
    { h: 84, color: "#a3826d", num: 3 },
    { h: 80, color: "#7da383", num: 4 },
    { h: 66, color: "#a3826d", num: 5 },
    { h: 58, color: "#8d7da3", num: 6 },
    { h: 64, color: "#7d8ca3", num: 7 },
    { h: 60, color: "#a37d7d", num: 8 },
    { h: 56, color: "#7da383", num: 9 },
  ];
  const sparkle = (x: number, y: number, r: number) =>
    `M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`;
  return (
    <Box
      component="svg"
      viewBox="0 0 460 210"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="番号順に並んだ本棚"
    >
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      <rect x="26" y="126" width="9" height="58" fill="#8d6e63" />
      <rect x="425" y="126" width="9" height="58" fill="#8d6e63" />
      {books.map((b, i) => (
        <g key={b.num}>
          <rect x={44 + i * 40} y={126 - b.h} width="36" height={b.h} rx="3" fill={b.color} />
          <text x={44 + i * 40 + 18} y={126 - b.h / 2 + 7} textAnchor="middle" fontSize="18" fontWeight="900" fill="#ffffff">
            {b.num}
          </text>
        </g>
      ))}
      <rect x="22" y="126" width="416" height="9" rx="3" fill="#8d6e63" />
      <path d={sparkle(72, 34, 11)} fill="#d97706" />
      <path d={sparkle(392, 26, 9)} fill="#d97706" />
      <path d={sparkle(228, 20, 8)} fill="#d97706" />
    </Box>
  );
};

/**
 * バブルソート解決後（アニメーション版、2026-11-24）：単元リザルトのミッション
 * バンド専用。本が学習前のバラバラな位置から番号順の位置へ滑って並ぶ。
 * 「並べ替えられるようになった」ことを動きで回収する。色と高さは本ごとに
 * 固定で、静止画版（BubbleSortSolvedThumbnail）と一致させる。
 */
export const BubbleSortSolvedAnimatedThumbnail: React.FC = () => {
  const reduced = useReducedMotion();
  const books: { h: number; color: string; num: number }[] = [
    { h: 76, color: "#8d7da3", num: 1 },
    { h: 88, color: "#7d8ca3", num: 2 },
    { h: 84, color: "#a3826d", num: 3 },
    { h: 80, color: "#7da383", num: 4 },
    { h: 66, color: "#a3826d", num: 5 },
    { h: 58, color: "#8d7da3", num: 6 },
    { h: 64, color: "#7d8ca3", num: 7 },
    { h: 60, color: "#a37d7d", num: 8 },
    { h: 56, color: "#7da383", num: 9 },
  ];
  // 学習前の並び（ミッションサムネと同じ）：スロット順に 7,3,9,1,8,2,5,4,6。
  const startSlot: Record<number, number> = { 7: 0, 3: 1, 9: 2, 1: 3, 8: 4, 2: 5, 5: 6, 4: 7, 6: 8 };
  const sparkle = (x: number, y: number, r: number) =>
    `M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`;
  return (
    <Box
      component="svg"
      viewBox="0 0 460 210"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="本が番号順に並び替わる本棚"
    >
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      <rect x="26" y="126" width="9" height="58" fill="#8d6e63" />
      <rect x="425" y="126" width="9" height="58" fill="#8d6e63" />
      {books.map((b) => {
        const offset = reduced ? 0 : (startSlot[b.num] - (b.num - 1)) * 40;
        return (
          <motion.g key={b.num}
            initial={{ x: offset }}
            animate={{ x: 0 }}
            transition={{ delay: reduced ? 0 : 0.9, type: "spring", stiffness: 90, damping: 17 }}>
            <rect x={44 + (b.num - 1) * 40} y={126 - b.h} width="36" height={b.h} rx="3" fill={b.color} />
            <text x={44 + (b.num - 1) * 40 + 18} y={126 - b.h / 2 + 7} textAnchor="middle" fontSize="18" fontWeight="900" fill="#ffffff">
              {b.num}
            </text>
          </motion.g>
        );
      })}
      <rect x="22" y="126" width="416" height="9" rx="3" fill="#8d6e63" />
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : 1.9, duration: 0.5 }}>
        <path d={sparkle(72, 34, 11)} fill="#d97706" />
        <path d={sparkle(392, 26, 9)} fill="#d97706" />
        <path d={sparkle(228, 20, 8)} fill="#d97706" />
      </motion.g>
    </Box>
  );
};

/** 二分探索：番号順に並んだ長い箱の列の前で、探し物に困っているロボット。 */
export const BinarySearchMissionThumbnail: React.FC = () => {
  const boxes = [3, 7, 12, 19, 25, 31, 42, 50, 58, 66];
  return (
    <Box
      component="svg"
      viewBox="0 0 460 210"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="番号順に並んだ長い箱の列の前で、探し物に困っているロボット"
    >
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      {/* 箱の列 */}
      {boxes.map((num, i) => {
        const x = 24 + i * 43;
        return (
          <g key={num}>
            <rect x={x} y="76" width="38" height="42" rx="3" fill="#cbb489" />
            <line x1={x} y1="88" x2={x + 38} y2="88" stroke="#a98f5f" strokeWidth="2.5" />
            <rect x={x + 9} y="94" width="20" height="15" rx="2" fill="#ffffff" />
            <text x={x + 19} y="106" textAnchor="middle" fontSize="11" fontWeight="700" fill="#5d4a26">
              {num}
            </text>
          </g>
        );
      })}
      {/* 棚板 */}
      <rect x="16" y="118" width="428" height="9" rx="3" fill="#8d6e63" />
      {/* 足あと：端から1つずつ見て歩いた跡が、ずっと先まで続いている */}
      <g fill="#94a3b8">
        {Array.from({ length: 11 }, (_, i) => (
          <circle key={i} cx={128 + i * 22} cy="196" r="3" opacity={1 - i * 0.06} />
        ))}
      </g>
      <TroubledRobot x={20} y={146} />
      {/* 探し物のメモ */}
      <g transform="rotate(-6 84 172)">
        <rect x="70" y="152" width="29" height="38" rx="2" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="84" y="176" textAnchor="middle" fontSize="14" fontWeight="900" fill="#1e3a8a">
          19
        </text>
      </g>
      <QuestionBubble x={122} y={146} tail="M110 156 L96 166 L114 160 Z" />
    </Box>
  );
};

/** 貪欲法：お釣りの硬貨の選び方で困っているレジのロボット。 */
export const GreedyMissionThumbnail: React.FC = () => {
  const coins: { x: number; y: number; r: number; label: string }[] = [
    { x: 282, y: 136, r: 15, label: "500" },
    { x: 320, y: 144, r: 13, label: "100" },
    { x: 350, y: 138, r: 12, label: "50" },
    { x: 376, y: 146, r: 11, label: "10" },
    { x: 400, y: 140, r: 10, label: "5" },
    { x: 422, y: 148, r: 9, label: "1" },
  ];
  return (
    <Box
      component="svg"
      viewBox="0 0 460 210"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="お釣りの硬貨の選び方で困っているレジのロボット"
    >
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      <TroubledRobot x={50} y={98} />
      {/* 手に持った硬貨 */}
      <circle cx="106" cy="122" r="11" fill="#f2c94c" stroke="#c9962e" strokeWidth="2" />
      {/* レジ */}
      <g>
        <rect x="150" y="92" width="92" height="58" rx="6" fill="#5b7186" />
        <rect x="160" y="100" width="72" height="24" rx="3" fill="#dbeafe" />
        <text x="196" y="118" textAnchor="middle" fontSize="15" fontWeight="900" fill="#1e3a8a">
          786円
        </text>
        <circle cx="172" cy="138" r="4" fill="#dbeafe" />
        <circle cx="190" cy="138" r="4" fill="#dbeafe" />
        <circle cx="208" cy="138" r="4" fill="#dbeafe" />
      </g>
      {/* カウンター */}
      <rect x="0" y="148" width="460" height="62" fill="#a3826d" />
      <rect x="0" y="148" width="460" height="6" fill="#8d6e63" />
      {/* 並んだ硬貨（お釣りの候補） */}
      {coins.map((c) => (
        <g key={c.label}>
          <circle cx={c.x} cy={c.y} r={c.r} fill="#f2c94c" stroke="#c9962e" strokeWidth="2" />
          <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize="10" fontWeight="900" fill="#7c5a10">
            {c.label}
          </text>
        </g>
      ))}
      <QuestionBubble x={124} y={58} tail="M114 70 L100 86 L118 74 Z" />
    </Box>
  );
};

// ── 手法に完全に焦点を当てた版（2026-11-23、場面版との比較用に試作） ──
// 同じノード配置のグラフで、たどり方だけを描く。BFS＝波が同心円状に広がる、
// DFS＝一本の道が奥まで潜って行き止まりから引き返す。

const METHOD_NODES: { x: number; y: number }[] = [
  { x: 70, y: 45 }, { x: 150, y: 45 }, { x: 230, y: 45 }, { x: 310, y: 45 }, { x: 390, y: 45 },
  { x: 70, y: 105 }, { x: 150, y: 105 }, { x: 230, y: 105 }, { x: 310, y: 105 }, { x: 390, y: 105 },
  { x: 70, y: 165 }, { x: 150, y: 165 }, { x: 230, y: 165 }, { x: 310, y: 165 }, { x: 390, y: 165 },
];

const MethodEdges: React.FC = () => (
  <g stroke="#c7d6ea" strokeWidth="3">
    {[0, 1, 2].map((row) =>
      [0, 1, 2, 3].map((col) => {
        const a = METHOD_NODES[row * 5 + col];
        const b = METHOD_NODES[row * 5 + col + 1];
        return <line key={`h${row}-${col}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
      }),
    )}
    {[0, 1].map((row) =>
      [0, 1, 2, 3, 4].map((col) => {
        const a = METHOD_NODES[row * 5 + col];
        const b = METHOD_NODES[(row + 1) * 5 + col];
        return <line key={`v${row}-${col}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
      }),
    )}
  </g>
);

/** 手法版 BFS：スタートから波が層状に広がっていく。色の濃さ＝スタートからの距離。 */
export const BfsMethodThumbnail: React.FC = () => {
  const start = METHOD_NODES[10]; // 左下
  const layerFill = ["#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];
  return (
    <Box
      component="svg"
      viewBox="0 0 460 210"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="スタートから波のように広がって探索する幅優先探索の図"
    >
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      {/* 広がる波の輪 */}
      <g fill="none" stroke="#2563eb" strokeOpacity="0.16" strokeWidth="12">
        <circle cx={start.x} cy={start.y} r="46" />
        <circle cx={start.x} cy={start.y} r="96" />
        <circle cx={start.x} cy={start.y} r="146" />
        <circle cx={start.x} cy={start.y} r="196" />
      </g>
      <MethodEdges />
      {METHOD_NODES.map((n, i) => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        const d = col + (2 - row);
        return <circle key={i} cx={n.x} cy={n.y} r="13" fill={layerFill[d]} stroke="#ffffff" strokeWidth="2.5" />;
      })}
      {/* スタートの印 */}
      <circle cx={start.x} cy={start.y} r="5" fill="#ffffff" />
    </Box>
  );
};

/** 手法版 DFS：一本の道が奥まで潜り、行き止まりから引き返している。 */
export const DfsMethodThumbnail: React.FC = () => {
  // 潜っていく順路（ノード番号）：左下→上→右へ蛇行して右下の行き止まりへ
  const pathIdx = [10, 5, 0, 1, 6, 7, 2, 3, 8, 13, 14];
  const pathPoints = pathIdx.map((i) => `${METHOD_NODES[i].x},${METHOD_NODES[i].y}`).join(" ");
  const visited = new Set(pathIdx);
  const deadEnd = METHOD_NODES[14];
  return (
    <Box
      component="svg"
      viewBox="0 0 460 210"
      preserveAspectRatio="xMidYMid slice"
      sx={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="一本の道を奥までたどり、行き止まりから引き返す深さ優先探索の図"
    >
      <rect x="0" y="0" width="460" height="210" fill="#eef4fc" />
      <MethodEdges />
      {/* 引き返し（点線）：行き止まりから2つ手前まで戻った */}
      <polyline
        points={`${METHOD_NODES[14].x},${METHOD_NODES[14].y} ${METHOD_NODES[13].x},${METHOD_NODES[13].y} ${METHOD_NODES[8].x},${METHOD_NODES[8].y}`}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="4"
        strokeDasharray="7 6"
        strokeLinecap="round"
      />
      {/* 潜った道 */}
      <polyline points={pathPoints} fill="none" stroke="#2563eb" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
      {METHOD_NODES.map((n, i) =>
        visited.has(i) ? (
          <circle key={i} cx={n.x} cy={n.y} r="11" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
        ) : (
          <circle key={i} cx={n.x} cy={n.y} r="11" fill="#dbeafe" stroke="#ffffff" strokeWidth="2.5" />
        ),
      )}
      {/* スタートの印 */}
      <circle cx={METHOD_NODES[10].x} cy={METHOD_NODES[10].y} r="4.5" fill="#ffffff" />
      {/* 行き止まりの印 */}
      <g stroke="#dc2626" strokeWidth="4" strokeLinecap="round">
        <line x1={deadEnd.x - 7} y1={deadEnd.y - 7} x2={deadEnd.x + 7} y2={deadEnd.y + 7} />
        <line x1={deadEnd.x + 7} y1={deadEnd.y - 7} x2={deadEnd.x - 7} y2={deadEnd.y + 7} />
      </g>
    </Box>
  );
};

/** ミッション場面サムネがある単元はそれを、無い単元は null を返す。全単元が場面版にそろった。 */
export const missionThumbnailFor = (courseId: string): React.ReactNode => {
  switch (courseId) {
    case "course-algorithm-breadth-first-search-v1":
      return <BfsMissionThumbnail />;
    case "course-algorithm-depth-first-search-v1":
      return <DfsMissionThumbnail />;
    case "course-algorithm-maze-digging-v1":
      return <DiggingMissionThumbnail />;
    case "course-algorithm-wall-extension-v1":
      return <WallExtensionMissionThumbnail />;
    case "course-algorithm-bubble-sort-v2":
      return <BubbleSortMissionThumbnail />;
    case "course-algorithm-binary-search-v1":
      return <BinarySearchMissionThumbnail />;
    case "course-algorithm-greedy-coins-v1":
      return <GreedyMissionThumbnail />;
    default:
      return null;
  }
};
