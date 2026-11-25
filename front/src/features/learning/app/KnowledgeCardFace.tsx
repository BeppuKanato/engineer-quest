"use client";

// 知識カードの「面」（2026-11-25）。カードは文字のリストではなく、
// 絵・タイトル・詳細が最初から面に出ているカードとして見せる。
// 「ボタンで開く」形にはしない。未所持は絵をシルエットにし、
// 使いどころ（このミッションとのつながり）だけをプレビューとして見せる。

import { knowledgeCardTones, uncollectedTone } from "@/components/rewards/rarity.tokens";
import { Box, Chip, Typography } from "@mui/material";

export type CardFaceData = {
  id: string;
  title: string;
  label: string;
  rarity: string;
  description: string;
  connection: string;
  useCase: string;
};

const Illo: React.FC<{ children: React.ReactNode; fit?: "slice" | "meet" }> = ({ children, fit = "slice" }) => (
  <Box component="svg" viewBox="0 0 300 140" preserveAspectRatio={`xMidYMid ${fit}`} sx={{ width: "100%", height: "100%", display: "block" }} aria-hidden>
    <rect x="0" y="0" width="300" height="140" fill="#eef4fc" />
    {children}
  </Box>
);

/** カードの絵：カードが表す知識そのものを描く（ミッションの解法ではない）。 */
export const cardIllustrationFor = (cardId: string, fit: "slice" | "meet" = "slice"): React.ReactNode => {
  switch (cardId) {
    case "knowledge-card-bfs-shortest-path": {
      const xs = [45, 150, 255];
      const ys = [35, 105];
      return (
        <Illo fit={fit}>
          <g stroke="#c7d6ea" strokeWidth="3">
            {ys.map((y) => <line key={`h${y}`} x1={xs[0]} y1={y} x2={xs[2]} y2={y} />)}
            {xs.map((x) => <line key={`v${x}`} x1={x} y1={ys[0]} x2={x} y2={ys[1]} />)}
          </g>
          <polyline points="45,105 150,105 150,35 255,35" fill="none" stroke="#2563eb" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
          {ys.map((y) => xs.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="11" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5" />))}
          <circle cx="45" cy="105" r="11" fill="#2563eb" />
          <circle cx="255" cy="35" r="12" fill="#fef3c7" stroke="#d97706" strokeWidth="3.5" />
        </Illo>
      );
    }
    case "knowledge-card-bfs-deque":
      return (
        <Illo fit={fit}>
          <text x="26" y="34" fontSize="12" fontWeight="700" fill="#111827">先頭（取り出す）</text>
          <text x="196" y="34" fontSize="12" fontWeight="700" fill="#111827">末尾（追加する）</text>
          <path d="M30 44 L18 58 L30 72" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M270 44 L282 58 L270 72" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="26" y="82" width="248" height="40" rx="8" fill="#ffffff" stroke="#5b7186" strokeWidth="2.5" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={40 + i * 58} y="90" width="46" height="24" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
          ))}
        </Illo>
      );
    case "knowledge-card-bfs-bidirectional":
      return (
        <Illo fit={fit}>
          <g fill="none" stroke="#2563eb" strokeOpacity="0.4" strokeWidth="5">
            <circle cx="52" cy="70" r="26" />
            <circle cx="52" cy="70" r="52" />
            <circle cx="248" cy="70" r="26" />
            <circle cx="248" cy="70" r="52" />
          </g>
          <circle cx="52" cy="70" r="11" fill="#2563eb" />
          <circle cx="248" cy="70" r="12" fill="#fef3c7" stroke="#d97706" strokeWidth="3.5" />
          <path d="M150 52 L153.5 63 L165 66.5 L153.5 70 L150 81 L146.5 70 L135 66.5 L146.5 63 Z" fill="#d97706" />
        </Illo>
      );
    case "knowledge-card-maze-digging-stack":
      return (
        <Illo fit={fit}>
          <rect x="35" y="14" width="230" height="112" rx="10" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
          <rect x="68" y="32" width="164" height="76" rx="8" fill="#bfdbfe" stroke="#2563eb" strokeWidth="3" />
          <rect x="101" y="50" width="98" height="40" rx="6" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="3" />
          <circle cx="150" cy="70" r="7" fill="#1d4ed8" />
          <path d="M238 22 A14 14 0 1 1 224 12" fill="none" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M224 4 L224 13 L233 12 Z" fill="#d97706" />
        </Illo>
      );
    case "knowledge-card-maze-digging-backtracking":
      return (
        <Illo fit={fit}>
          <polyline points="35,105 130,105 130,45 225,45" fill="none" stroke="#2563eb" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
          <g stroke="#111827" strokeWidth="4" strokeLinecap="round">
            <line x1="218" y1="38" x2="232" y2="52" />
            <line x1="232" y1="38" x2="218" y2="52" />
          </g>
          <polyline points="225,58 130,58" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="7 6" strokeLinecap="round" />
          <polyline points="130,105 130,126" fill="none" stroke="#2563eb" strokeWidth="7" strokeLinecap="round" />
          <circle cx="130" cy="105" r="8" fill="#ffffff" stroke="#2563eb" strokeWidth="3.5" />
          <circle cx="35" cy="105" r="9" fill="#2563eb" />
        </Illo>
      );
    case "knowledge-card-binary-search-halving-range":
      return (
        <Illo fit={fit}>
          <rect x="20" y="16" width="260" height="26" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
          <rect x="20" y="58" width="130" height="26" rx="4" fill="#93c5fd" stroke="#2563eb" strokeWidth="2.5" />
          <rect x="150" y="58" width="130" height="26" rx="4" fill="#e5e7eb" stroke="#c3cad4" strokeWidth="2" />
          <rect x="20" y="100" width="65" height="26" rx="4" fill="#2563eb" />
          <rect x="85" y="100" width="195" height="26" rx="4" fill="#e5e7eb" stroke="#c3cad4" strokeWidth="2" />
          <text x="288" y="76" fontSize="12" fontWeight="700" fill="#111827">半分</text>
        </Illo>
      );
    case "knowledge-card-binary-search-logarithmic-time": {
      const widths = [16, 32, 64, 128];
      const heights = [26, 40, 54, 68];
      let x = 24;
      return (
        <Illo fit={fit}>
          <line x1="16" y1="118" x2="284" y2="118" stroke="#5b7186" strokeWidth="2.5" />
          {widths.map((w, i) => {
            const bx = x;
            x += w + 10;
            return (
              <g key={i}>
                <rect x={bx} y={118 - heights[i]} width={w} height={heights[i]} rx="3" fill={i === 3 ? "#2563eb" : "#93c5fd"} />
                <text x={bx + w / 2} y={118 - heights[i] - 7} textAnchor="middle" fontSize="12" fontWeight="700" fill="#111827">{i + 1}回増</text>
              </g>
            );
          })}
          <text x="24" y="136" fontSize="11.5" fill="#111827">データが2倍になっても、手間は少ししか増えない</text>
        </Illo>
      );
    }
    default:
      return (
        <Illo fit={fit}>
          <circle cx="150" cy="70" r="26" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
          <text x="150" y="79" textAnchor="middle" fontSize="24" fontWeight="900" fill="#2563eb">？</text>
        </Illo>
      );
  }
};

export const KnowledgeCardFace: React.FC<{ card: CardFaceData; owned: boolean; layout?: "face" | "tile" }> = ({ card, owned, layout = "face" }) => {
  const tone = knowledgeCardTones[card.rarity as keyof typeof knowledgeCardTones] ?? knowledgeCardTones.COMMON;
  if (layout === "tile") {
    return (
      <Box sx={{ border: `2px solid ${owned ? tone.border : "#dbe3ef"}`, borderRadius: 3, bgcolor: "#fff", overflow: "hidden", display: "flex", flexDirection: { xs: "column", sm: "row" } }}>
        <Box sx={{ width: { sm: 190 }, flexShrink: 0, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.25, py: 0.75, bgcolor: owned ? tone.bgcolor : uncollectedTone.background }}>
            <Chip size="small" label={card.label} sx={{ bgcolor: "#fff", fontWeight: 700 }} />
            <Chip size="small" label={owned ? "所持" : "未所持"} sx={owned ? { bgcolor: "#16a34a", color: "#fff", fontWeight: 700 } : { bgcolor: "#fff", fontWeight: 700 }} />
          </Box>
          <Box sx={{ height: 118, flexShrink: 0, bgcolor: "#eef4fc", ...(owned ? {} : { filter: "grayscale(1)", bgcolor: uncollectedTone.background }) }}>
            {cardIllustrationFor(card.id, "meet")}
          </Box>
        </Box>
        <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.6, minWidth: 0 }}>
          <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1.4 }}>{card.title}</Typography>
          {owned ? (
            <>
              <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.7 }}>
                <Box component="span" sx={{ fontWeight: 800 }}>このミッションでの使いどころ：</Box>{card.useCase}
              </Typography>
              <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.7 }}>
                <Box component="span" sx={{ fontWeight: 800 }}>つながり：</Box>{card.connection}
              </Typography>
              <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.7 }}>{card.description}</Typography>
            </>
          ) : (
            <>
              <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.7 }}>
                <Box component="span" sx={{ fontWeight: 800 }}>このミッションでの使いどころ：</Box>{card.useCase}
              </Typography>
              <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.7 }}>まだ持っていないカードです。中身は、関連する単元で獲得すると開けます。</Typography>
            </>
          )}
        </Box>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        border: `2px solid ${owned ? tone.border : "#dbe3ef"}`,
        borderRadius: 3,
        bgcolor: "#fff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75, bgcolor: owned ? tone.bgcolor : uncollectedTone.background }}>
        <Chip size="small" label={card.label} sx={{ bgcolor: "#fff", fontWeight: 700 }} />
        <Chip size="small" label={tone.label} sx={{ bgcolor: "#fff", color: owned ? tone.color : uncollectedTone.color, fontWeight: 700 }} />
        <Box sx={{ flex: 1 }} />
        <Chip size="small" label={owned ? "所持" : "未所持"} sx={owned ? { bgcolor: "#16a34a", color: "#fff", fontWeight: 700 } : { bgcolor: "#fff", fontWeight: 700 }} />
      </Box>
      <Box sx={{ height: 118, flexShrink: 0, ...(owned ? {} : { filter: "grayscale(1)", bgcolor: uncollectedTone.background }) }}>
        {cardIllustrationFor(card.id)}
      </Box>
      <Box sx={{ p: 1.5, pt: 1.25, display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Typography component="p" sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1.4 }}>{card.title}</Typography>
        {owned ? (
          <>
            <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.75 }}>{card.description}</Typography>
            <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.75 }}>
              <Box component="span" sx={{ fontWeight: 800 }}>つながり：</Box>{card.connection}
            </Typography>
            <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.75 }}>
              <Box component="span" sx={{ fontWeight: 800 }}>使いどころ：</Box>{card.useCase}
            </Typography>
          </>
        ) : (
          <>
            <Typography component="p" sx={{ fontSize: 16, lineHeight: 1.75 }}>
              <Box component="span" sx={{ fontWeight: 800 }}>使いどころ：</Box>{card.useCase}
            </Typography>
            <Typography component="p" sx={{ fontSize: 14, lineHeight: 1.7 }}>まだ持っていないカードです。中身は、関連する単元で獲得すると開けます。</Typography>
          </>
        )}
      </Box>
    </Box>
  );
};
