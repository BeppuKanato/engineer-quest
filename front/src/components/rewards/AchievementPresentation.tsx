"use client";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BuildIcon from "@mui/icons-material/Build";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SchoolIcon from "@mui/icons-material/School";
import StarsIcon from "@mui/icons-material/Stars";
import { Box, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useSoundEffect } from "../sound/SoundFeedback";
import type { LearningObserver } from "../../lib/learningEvents";
import { rewardColors as colors } from "./presentation";
import { useLearningVisit } from "../../hooks/useLearningVisit";
import { presentationFor, achievementText as text } from "./presentation";

/** 表示に必要な項目だけを持つ。API 固有の追加メタデータは要求しない。 */
export type AchievementPresentationItem = { id: string; title: string; description: string; rarity: string; iconKey?: string };

/** 実績マスタの iconKey → アイコン（掲示板の著者表示と同じ対応）。無いキーはトロフィー。 */
const achievementIcons: Record<string, typeof EmojiEventsIcon> = {
  build: BuildIcon, course: SchoolIcon, challenge: FlagIcon, perfect: StarsIcon, knowledge: MenuBookIcon,
};

/**
 * 解除された瞬間の実績1件（#333）。カード出現と同じ語彙（レアリティ色・放射・グロー）で、
 * トロフィーバッジがポップインする。出現はその場限りで、記録としての要約は別に残る。
 * 動きを減らす設定では静止表示にし、放射も出さない（ResultConfetti と同じ扱い）。
 */
function AchievementUnlock({ item, index, stagger, onEvent, placement, phaseKey, layout = "row" }: {
  item: AchievementPresentationItem; index: number; stagger: number;
  onEvent?: LearningObserver; placement: "phase-result" | "unit-result-new" | "create-submission"; phaseKey?: string; layout?: "row" | "card";
}) {
  const reduced = useReducedMotion(), spec = presentationFor(item.rarity), tone = spec.tone;
  useLearningVisit(onEvent, true, "achievement_present_view", item.id, { placement, phaseKey, rarity: item.rarity });
  const delay = reduced ? 0 : index * stagger;
  // 獲得感はレアリティで差をつける（2026-11-24）：高いレアリティほどトロフィーを
  // 大きくし、登場の縮小率（spec.scale）も大きくする。発光・放射は従来どおり spec 依存。
  const badgeSizeBase = item.rarity === "EPIC" || item.rarity === "LEGENDARY" ? 72 : item.rarity === "RARE" ? 64 : 56;
  // カード形ではメダルを主役にするため一回り大きくする（2026-11-24）。
  const badgeSize = layout === "card" ? badgeSizeBase + 16 : badgeSizeBase;
  const Icon = (item.iconKey && achievementIcons[item.iconKey]) || EmojiEventsIcon;
  // メダルの造形もレアリティで変える（2026-11-24）：色を見る前に形で特別さが
  // 伝わるようにする。コモン＝素のメダル、レア＝リボン付き、エピック＝リボン＋
  // 二重リング、レジェンダリー＝さらに星の飾り。
  const medalTier = item.rarity === "LEGENDARY" ? 3 : item.rarity === "EPIC" ? 2 : item.rarity === "RARE" ? 1 : 0;
  const badge = <Box sx={{ position: "relative", flexShrink: 0, width: badgeSize, height: badgeSize + (medalTier >= 1 ? 10 : 0) }}>
    {!reduced && Array.from({ length: spec.rays }, (_, i) => <Box key={i} component={motion.span} aria-hidden
      initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.7, 0], scale: [0.6, 1.4, 1.8] }} transition={{ duration: 0.7, delay: delay + 0.1 + i * 0.035 }}
      sx={{ position: "absolute", left: `${50 + 62 * Math.cos(i * 2 * Math.PI / spec.rays)}%`, top: `${50 + 62 * Math.sin(i * 2 * Math.PI / spec.rays)}%`, color: tone.color, lineHeight: 0 }}><AutoAwesomeIcon sx={{ fontSize: 16 }} /></Box>)}
    {medalTier >= 1 && <>
      <Box aria-hidden sx={{ position: "absolute", left: badgeSize * 0.22, bottom: 0, width: badgeSize * 0.2, height: 14, bgcolor: tone.color, transform: "rotate(14deg)", borderRadius: 0.5 }} />
      <Box aria-hidden sx={{ position: "absolute", right: badgeSize * 0.22, bottom: 0, width: badgeSize * 0.2, height: 14, bgcolor: tone.color, transform: "rotate(-14deg)", borderRadius: 0.5 }} />
    </>}
    <Box sx={{ position: "relative", width: badgeSize, height: badgeSize, borderRadius: "50%", border: `2px solid ${tone.border}`, bgcolor: colors.surface, display: "grid", placeItems: "center" }}>
      <Icon aria-hidden sx={{ color: tone.color, fontSize: badgeSize * 0.56 }} />
      {medalTier >= 2 && <Box aria-hidden sx={{ position: "absolute", inset: 4, borderRadius: "50%", border: `2px solid ${tone.border}`, opacity: 0.65 }} />}
    </Box>
    {medalTier >= 3 && <Box aria-hidden sx={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", color: tone.color, lineHeight: 0 }}><AutoAwesomeIcon sx={{ fontSize: 18 }} /></Box>}
  </Box>;
  const texts = <Box sx={{ minWidth: 0 }}>
    {layout === "card"
      ? <Box component="span" sx={{ display: "inline-block", bgcolor: "#ffffff", border: `1.5px solid ${tone.border}`, color: tone.color, fontSize: 12, fontWeight: 800, px: 1, py: 0.125, borderRadius: 999 }}>{tone.label}</Box>
      : <Typography sx={{ fontSize: 12, fontWeight: 800, color: tone.color }}>{tone.label}</Typography>}
    <Typography component="h3" sx={{ fontWeight: 800, fontSize: 18, mt: layout === "card" ? 0.5 : 0 }}>{item.title}</Typography>
    <Typography sx={{ fontSize: layout === "card" ? 14 : 15 }}>{item.description}</Typography>
  </Box>;
  // 縦カード形（2026-11-24、Kanato の指定）：トロフィーを上に置き、レアリティ→
  // 名前→説明を縦に積む。単元リザルトのゾーン専用で、フェーズ結果のバンドは横形のまま。
  if (layout === "card") return <Box component={motion.div} data-achievement-id={item.id}
    initial={reduced ? false : { opacity: 0, scale: spec.scale, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: reduced ? 0 : 0.45, delay, ease: "easeOut" }}
    sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, p: 2, border: `2px solid ${tone.border}`, borderRadius: 2, bgcolor: tone.bgcolor, textAlign: "center",
      boxShadow: !reduced && spec.glow ? `0 0 ${spec.glow}px ${tone.border}` : "none" }}>
    <AutoAwesomeIcon aria-hidden sx={{ position: "absolute", top: 8, left: 10, fontSize: 16, color: tone.color, opacity: 0.75 }} />
    <AutoAwesomeIcon aria-hidden sx={{ position: "absolute", top: 12, right: 12, fontSize: 12, color: tone.color, opacity: 0.6 }} />
    {badge}
    {texts}
  </Box>;
  return <Box component={motion.div} data-achievement-id={item.id}
    initial={reduced ? false : { opacity: 0, scale: spec.scale, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: reduced ? 0 : 0.45, delay, ease: "easeOut" }}
    sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.5, p: 1.5, border: `2px solid ${tone.border}`, borderRadius: 2, bgcolor: tone.bgcolor, textAlign: "left",
      boxShadow: !reduced && spec.glow ? `0 0 ${spec.glow}px ${tone.border}` : "none" }}>
    {badge}
    {texts}
  </Box>;
}

function UnlockList({ items, stagger, onEvent, placement, phaseKey, layout = "row" }: {
  items: readonly AchievementPresentationItem[]; stagger: number;
  onEvent?: LearningObserver; placement: "phase-result" | "unit-result-new" | "create-submission"; phaseKey?: string; layout?: "row" | "card";
}) {
  const { play } = useSoundEffect();
  const presentedIds = useRef(new Set<string>());
  // 1バッチにつき1音。配列の作り直し・設定変更・StrictMode の effect 再実行では鳴らし直さない。
  useEffect(() => {
    const fresh = items.filter((item) => !presentedIds.current.has(item.id));
    if (!fresh.length) return;
    fresh.forEach((item) => presentedIds.current.add(item.id));
    play("achievementUnlocked");
  }, [items, play]);
  return <Box sx={layout === "card"
    ? { display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5, width: "100%" }
    : { display: "grid", gap: 1, width: "100%" }}>
    {items.map((item, index) => <AchievementUnlock key={item.id} item={item} index={index} stagger={stagger} onEvent={onEvent} placement={placement} phaseKey={phaseKey} layout={layout} />)}
  </Box>;
}

/** フェーズの結果画面に出す実績バンド（#333）。そのフェーズの保存で解除された分だけを受ける。 */
export function AchievementBand({ items, phaseKey, onEvent, placement = "phase-result" }: { items: readonly AchievementPresentationItem[]; phaseKey?: string; onEvent?: LearningObserver; placement?: "phase-result" | "create-submission" }) {
  if (!items.length) return null;
  return <Box component="section" aria-label={text.achievement} data-achievement-band sx={{ width: "100%", maxWidth: 640, color: colors.text }}>
    <Typography component="h3" sx={{ fontWeight: 800, fontSize: 18, textAlign: "center", mb: 1 }}>{text.achievement}</Typography>
    <UnlockList items={items} stagger={0.15} onEvent={onEvent} placement={placement} phaseKey={phaseKey} />
  </Box>;
}

/** 最終リザルトの「新しい実績」ゾーン（#333）。フェーズ7と単元完了で解除された分を1件ずつ出す。 */
export function NewAchievementZone({ items, onEvent }: { items: readonly AchievementPresentationItem[]; onEvent?: LearningObserver }) {
  if (!items.length) return null;
  return <Box component="section" aria-label={text.newAchievements} data-new-achievements sx={{ width: "100%", maxWidth: 1060, color: colors.text, p: 2, bgcolor: colors.background, borderRadius: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
      <EmojiEventsIcon aria-hidden sx={{ fontSize: 28, color: "#d97706" }} />
      <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22 }}>新しい実績を獲得！</Typography>
      <Box component="span" sx={{ bgcolor: "#fef3c7", color: "#b45309", fontWeight: 900, fontSize: 14, px: 1.25, py: 0.25, borderRadius: 999 }}>{items.length} 件</Box>
    </Box>
    <UnlockList items={items} stagger={0.35} onEvent={onEvent} placement="unit-result-new" layout="card" />
  </Box>;
}

/**
 * ゾーンの下に置く「次の実績」（2026-11-24）。獲得の記録で終わらせず、次に近い
 * 未獲得実績を条件・進捗つきで示し、次の行動への出口にする。形はホームの
 * 「次の実績」の行と揃える（トロフィーの丸＋タイトル＋レアリティ＋進捗の形）。
 * 進捗ゲージの塗りは色の意味の統一に従い緑（完了した量）。
 */
export function NextAchievementRow({ title, description, rarity, progress, goal }: {
  title: string; description: string; rarity: string; progress: number; goal: number;
}) {
  const tone = presentationFor(rarity).tone;
  return <Box component="section" aria-label="次の実績" data-next-achievement sx={{ width: "100%", maxWidth: 1060, color: colors.text, p: 2, bgcolor: colors.background, borderRadius: 2 }}>
    <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.5 }}>
      <Typography component="h3" sx={{ fontWeight: 800, fontSize: 18 }}>次の実績</Typography>
      <Typography component="a" href="/achievements" sx={{ fontSize: 14, fontWeight: 700, color: "#2563eb", textDecoration: "none", whiteSpace: "nowrap" }}>実績一覧を見る</Typography>
    </Box>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 52, height: 52, borderRadius: "50%", bgcolor: "#dbeafe", color: "#1d4ed8", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <EmojiEventsIcon sx={{ fontSize: 30 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 18, lineHeight: 1.4 }}>{title}</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: tone.color }}>{tone.label}</Typography>
      </Box>
    </Box>
    <Typography sx={{ fontSize: 14, mt: 1 }}>{description}</Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1.5 }}>
      {goal <= 21 ? (
        <Box sx={{ display: "flex", gap: 0.75, flex: 1 }} aria-hidden>
          {Array.from({ length: goal }, (_, i) => (
            <Box key={i} sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: i < progress ? "#16a34a" : "#e7edf5", border: i === progress ? "2px solid #16a34a" : "2px solid transparent", boxSizing: "border-box" }} />
          ))}
        </Box>
      ) : (
        <Box sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: "#e7edf5", overflow: "hidden" }} aria-hidden>
          <Box sx={{ width: `${Math.min(100, (progress / goal) * 100)}%`, height: "100%", bgcolor: "#16a34a" }} />
        </Box>
      )}
      <Typography sx={{ fontSize: 16, fontWeight: 900, whiteSpace: "nowrap" }}>{progress} / {goal}</Typography>
      {goal > progress && <Box component="span" sx={{ bgcolor: "#dcfce7", color: "#15803d", fontWeight: 900, fontSize: 15, px: 1.5, py: 0.5, borderRadius: 999, whiteSpace: "nowrap" }}>あと {goal - progress}</Box>}
    </Box>
  </Box>;
}
