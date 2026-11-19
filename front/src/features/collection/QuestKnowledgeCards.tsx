"use client";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { getQuestKnowledgeCards, type QuestKnowledgeCard } from "@/api/knowledgeCardReference.api";
import { useUserSession } from "@/app/component/userSession";
import { UnknownKnowledgeCard } from "./UnknownKnowledgeCard";
import { knowledgeCardTones } from "./knowledgeCard.tokens";

export function QuestCardList({ cards }: { cards: readonly QuestKnowledgeCard[] }) {
  return <Stack spacing={1.5}>{cards.map(card => !card.isCollected
    ? <UnknownKnowledgeCard key={card.id} rarity={card.rarity} />
    : <Box component="details" key={card.id} data-reference-card sx={{ p: 1.5, border: "1px solid #dbe3ef", borderRadius: 2, bgcolor: "#fff", overflowWrap: "anywhere" }}>
      <Box component="summary" sx={{ cursor: "pointer", fontWeight: 800 }}><Chip label={knowledgeCardTones[card.rarity].label} size="small" sx={{ mr: 1, color: knowledgeCardTones[card.rarity].color, bgcolor: knowledgeCardTones[card.rarity].bgcolor }} />{card.title}</Box>
      <Typography variant="body2" sx={{ mt: 1.5, lineHeight: 1.8 }}>{card.description}</Typography>
      <Typography variant="body2" fontWeight={800} sx={{ mt: 1.5 }}>使える場面</Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{card.useCase}</Typography>
    </Box>)}</Stack>;
}

export function QuestKnowledgeCards({ questId }: { questId: string }) {
  const { token, status } = useUserSession();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ token: string; questId: string; cards?: QuestKnowledgeCard[]; failed?: boolean } | null>(null);
  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    let active = true;
    void getQuestKnowledgeCards(token, questId).then(data => { if (active) setState({ token, questId, cards: data.items }); }, () => { if (active) setState({ token, questId, failed: true }); });
    return () => { active = false; };
  }, [token, status, questId, revision]);
  const current = status === "authenticated" && state?.token === token && state?.questId === questId ? state : null;
  return <Accordion disableGutters elevation={0} data-quest-card-reference sx={{ border: "1px solid #dbe3ef", borderRadius: "8px !important" }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={900}>関連する知識カード（参考）</Typography></AccordionSummary>
    <AccordionDetails>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>この課題で役立つ知識カードです。持っていなくても作業・提出できます。</Typography>
      {current?.failed ? <Alert severity="info" action={<Button size="small" onClick={() => setRevision(value => value + 1)}>再読み込み</Button>}>参考カードを取得できませんでした。作業は続けられます。</Alert>
        : current?.cards ? current.cards.length ? <QuestCardList cards={current.cards} /> : <Typography variant="body2">対応する知識カードはありません。</Typography>
          : <Typography variant="body2" role="status">参考カードを読み込み中です。</Typography>}
    </AccordionDetails>
  </Accordion>;
}
