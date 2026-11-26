"use client";
/**
 * 単元ミッションのストーリー（2026-11-23 決定）。
 * 学習教材と同じ再生形式（大きな図＋1ステップ1文のキャプション）で見せる。
 * ビートは「場面 → 困りごと → 解決の方向 → 人間ならどうするか → コンピュータとの差
 * → 学ぶ＋最後に挑戦」。数は固定しない（ビートが単位ごとに増減する）。
 * 論理の注意（2026-11-23、Kanato の指摘）：困りごとと解法の対象を一致させること
 * （例：探す手間が困りごとで、並べ替えが解法なら、「並べば探すのが速くなる」を
 * 挟まないと並べ替える理由が成立しない）。コンピュータとの差は「できない」ではなく
 * 「曖昧な判断ができない・正確な手順が要る」で立てること。学習進捗には含めない。
 * 文案は下書き。ここではバブルソートだけ全ステップを用意し、他単元は
 * 1フレーム（場面＋ミッション文）で代替する。
 */
import type { ReactNode } from "react";
import { findUnitMission } from "@/features/learning/app/missionRegistry";
import { missionThumbnailFor } from "./MissionThumbnail";

export type MissionStoryStep = { caption: string; figure: ReactNode };
export type MissionStory = { steps: readonly MissionStoryStep[] };

const BOOK_COLORS = ["#7d8ca3", "#a98a6d", "#82a37d", "#9382a3", "#a37d7d", "#7d8ca3", "#a98a6d", "#82a37d", "#9382a3"];
const BOOK_HEIGHTS = [64, 92, 52, 80, 60, 96, 68, 88, 56];

/** 最終ステップの図：並び終わった棚とゴールの旗。 */
function SortedFigure() {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="番号順に並んだ本棚とゴールの旗" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      <rect x="40" y="150" width="380" height="10" rx="3" fill="#8a6a52" />
      <rect x="56" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="394" y="160" width="10" height="34" fill="#8a6a52" />
      {values.map((value, index) => {
        const height = 44 + index * 7;
        return (
          <g key={value}>
            <rect x={58 + index * 39} y={150 - height} width="32" height={height} rx="4" fill={BOOK_COLORS[index]} />
            <text x={74 + index * 39} y={150 - height / 2 + 7} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">{value}</text>
          </g>
        );
      })}
      <g transform="translate(404 22)">
        <rect x="-2" y="0" width="4" height="34" fill="#7c4a2d" />
        <path d="M 2 2 L 24 8 L 2 15 Z" fill="#dc2626" />
      </g>
    </svg>
  );
}

/** ステップ2の図：頼まれるたびに端から探す（困りごとの反復）。 */
function SearchFigure() {
  const values = [7, 3, 9, 1, 8, 2, 5, 4, 6];
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="端から1冊ずつ本を探す図" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      <rect x="40" y="150" width="380" height="10" rx="3" fill="#8a6a52" />
      <rect x="56" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="394" y="160" width="10" height="34" fill="#8a6a52" />
      {values.map((value, index) => (
        <g key={value} opacity={index < 6 ? 0.45 : 1}>
          <rect x={58 + index * 39} y={150 - BOOK_HEIGHTS[index]} width="32" height={BOOK_HEIGHTS[index]} rx="4" fill={BOOK_COLORS[index]} />
          <text x={74 + index * 39} y={150 - BOOK_HEIGHTS[index] / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{value}</text>
        </g>
      ))}
      {/* 端から端までの走査の矢印 */}
      <path d="M 66 34 L 402 34" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" />
      <path d="M 402 34 l -14 -6 M 402 34 l -14 6" stroke="#dc2626" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* 依頼の吹き出し */}
      <g>
        <rect x="150" y="8" width="150" height="34" rx="17" fill="#fff" stroke="#111827" strokeWidth="2" />
        <text x="225" y="31" textAnchor="middle" fontSize="16" fontWeight="800" fill="#111827">「6番の本を貸して」</text>
      </g>
    </svg>
  );
}

/** ステップ3の図：並んでいれば一瞬で見つかる（解決の方向）。 */
function InsightFigure() {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="並んだ棚では目当ての本がすぐ見つかる図" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      <rect x="40" y="150" width="380" height="10" rx="3" fill="#8a6a52" />
      <rect x="56" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="394" y="160" width="10" height="34" fill="#8a6a52" />
      {values.map((value, index) => {
        const height = 44 + index * 7;
        return (
          <g key={value}>
            <rect x={58 + index * 39} y={150 - height} width="32" height={height} rx="4" fill={BOOK_COLORS[index]} />
            <text x={74 + index * 39} y={150 - height / 2 + 7} textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff">{value}</text>
          </g>
        );
      })}
      {/* 6番を囲む（すぐ見つかる） */}
      <rect x={58 + 5 * 39 - 5} y={150 - (44 + 5 * 7) - 5} width="42" height={44 + 5 * 7 + 5} rx="7" fill="none" stroke="#16a34a" strokeWidth="4" />
      <path d="M 330 30 l 4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill="#f59e0b" />
    </svg>
  );
}

/** ステップ4の図：人間は棚を見渡して、だいたいの場所に置いていく（俯瞰と近似配置）。 */
function PlaceFigure() {
  // 並びかけの棚：[1, 2, 空き, 5, 7, 8, 9] の上に、本「3」が空きへ降りてくる
  const placed: { value: number; height: number; color: string }[] = [
    { value: 1, height: 51, color: BOOK_COLORS[0] },
    { value: 2, height: 58, color: BOOK_COLORS[1] },
  ];
  const after: { value: number; height: number; color: string }[] = [
    { value: 5, height: 79, color: BOOK_COLORS[4] },
    { value: 7, height: 93, color: BOOK_COLORS[5] },
    { value: 8, height: 100, color: BOOK_COLORS[6] },
    { value: 9, height: 107, color: BOOK_COLORS[7] },
  ];
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="本をだいたいの場所に置いていく図" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      {/* 俯瞰の弧 */}
      <path d="M 70 44 Q 230 6 390 44" stroke="#2563eb" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeDasharray="1 9" />
      <circle cx="70" cy="44" r="5" fill="#2563eb" />
      <circle cx="390" cy="44" r="5" fill="#2563eb" />
      <rect x="40" y="150" width="380" height="10" rx="3" fill="#8a6a52" />
      <rect x="56" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="394" y="160" width="10" height="34" fill="#8a6a52" />
      {placed.map((book, index) => (
        <g key={book.value}>
          <rect x={58 + index * 39} y={150 - book.height} width="32" height={book.height} rx="4" fill={book.color} />
          <text x={74 + index * 39} y={150 - book.height / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{book.value}</text>
        </g>
      ))}
      {/* 空き場所（差し込み先） */}
      <rect x={58 + 2 * 39} y={150 - 65} width="32" height="65" rx="4" fill="none" stroke="#16a34a" strokeWidth="3" strokeDasharray="6 5" />
      {after.map((book, index) => (
        <g key={book.value}>
          <rect x={58 + (index + 3) * 39} y={150 - book.height} width="32" height={book.height} rx="4" fill={book.color} />
          <text x={74 + (index + 3) * 39} y={150 - book.height / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{book.value}</text>
        </g>
      ))}
      {/* 降りてくる本「3」 */}
      <g>
        <rect x={58 + 2 * 39} y="34" width="32" height="65" rx="4" fill={BOOK_COLORS[2]} stroke="#2563eb" strokeWidth="3" />
        <text x={74 + 2 * 39} y={34 + 65 / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">3</text>
        <path d="M 152 106 L 152 122 M 145 115 L 152 123 L 159 115" stroke="#16a34a" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/** ステップ5の図：コンピュータは曖昧な判断ができない（本当の差）。 */
function GapFigure() {
  return (
    <svg viewBox="0 0 460 210" width="100%" height="100%" role="img" aria-label="判断の決め方が分からず困るコンピュータの図" style={{ display: "block" }}>
      <rect width="460" height="210" fill="#eef3f9" />
      <rect x="120" y="150" width="300" height="10" rx="3" fill="#8a6a52" />
      <rect x="136" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="394" y="160" width="10" height="34" fill="#8a6a52" />
      <rect x="196" y="62" width="52" height="88" rx="5" fill="#7d8ca3" />
      <text x="222" y="118" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">7</text>
      <rect x="304" y="88" width="52" height="62" rx="5" fill="#a98a6d" />
      <text x="330" y="130" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">3</text>
      {/* コンピュータ（ロボット） */}
      <g>
        <rect x="36" y="86" width="62" height="54" rx="12" fill="#64748b" />
        <circle cx="56" cy="108" r="6" fill="#fff" />
        <circle cx="78" cy="108" r="6" fill="#fff" />
        <path d="M 54 128 Q 67 120 80 128" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <line x1="67" y1="86" x2="67" y2="68" stroke="#64748b" strokeWidth="4" />
        <circle cx="67" cy="64" r="5" fill="#64748b" />
      </g>
      {/* 決められていない判断の「？」 */}
      {[{ x: 222, y: 34 }, { x: 330, y: 60 }, { x: 140, y: 44 }].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="17" fill="#fff" stroke="#2563eb" strokeWidth="2.5" />
          <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize="19" fontWeight="800" fill="#2563eb">?</text>
        </g>
      ))}
    </svg>
  );
}

const bubbleSortStory: MissionStory = {
  steps: [
    {
      caption: "図書室の本棚は、本が番号のバラバラな順番で並んでいます。",
      figure: null, // 場面の絵（サムネと同じ場面）を下で差し込む
    },
    {
      caption: "「6番の本を貸して」と頼まれるたびに、端から1冊ずつ探さなければいけません。しかも、頼みは毎日やってきます。",
      figure: <SearchFigure />,
    },
    {
      caption: "そもそも、本が番号順に並んでいれば、探すのは一瞬で済むはずです。",
      figure: <InsightFigure />,
    },
    {
      caption: "人間の司書なら、棚をざっと見渡して、本をだいたいの場所に置いていくことができます。",
      figure: <PlaceFigure />,
    },
    {
      caption: "でも機械には、棚を見渡すことも、「この辺」と当たりをつけることもできません。機械は、どうすれば並べ替えることができるのでしょうか？",
      figure: <GapFigure />,
    },
    {
      caption: "この単元で、その方法を見てみましょう。最後は、自分のコードで本棚を並べ替えることに挑戦します。",
      figure: <SortedFigure />,
    },
  ],
};

export function missionStoryFor(courseId: string): MissionStory | null {
  const scene = missionThumbnailFor(courseId);
  if (courseId === "course-algorithm-bubble-sort-v2") {
    return {
      steps: bubbleSortStory.steps.map(step => step.figure ? step : { ...step, figure: scene }),
    };
  }
  // 他単元は当面1フレーム（場面＋ミッション文）で代替する。
  const mission = findUnitMission(courseId);
  if (!mission || !scene) return null;
  return { steps: [{ caption: mission.description, figure: scene }] };
}
