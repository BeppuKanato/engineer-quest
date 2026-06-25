"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";

import type { MatchItem, MatchTarget } from "../type";

const UNASSIGNED_TARGET = "__unassigned";

const MatchCard = ({
  item,
  selected,
  disabled,
  onClick,
  onRemove,
}: {
  item: MatchItem;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  onRemove?: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled,
  });

  return (
    <motion.div layout transition={{ duration: 0.2 }}>
      <Paper
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }}
        elevation={0}
        sx={{
          minHeight: 48,
          px: 1.25,
          py: 0.8,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          borderRadius: 2,
          border: selected ? "2px solid #2563eb" : "1px solid #bfdbfe",
          bgcolor: selected ? "#eff6ff" : "#fff",
          boxShadow: selected ? "0 0 0 4px rgba(37, 99, 235, 0.10)" : "none",
          cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
          opacity: isDragging ? 0.35 : 1,
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
          transition: "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
          userSelect: "none",
          touchAction: "none",
          "&:hover": disabled
            ? undefined
            : {
                borderColor: "#2563eb",
                bgcolor: "#f8fbff",
                boxShadow: "0 8px 18px rgba(37, 99, 235, 0.12)",
              },
        }}
      >
        <Box
          aria-hidden
          sx={{ display: "grid", placeItems: "center", color: "#64748b" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>
        <Typography fontWeight={800} sx={{ flex: 1 }}>
          {item.label}
        </Typography>
        {onRemove && !disabled && (
          <Tooltip title="配置を外す">
            <IconButton
              size="small"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Paper>
    </motion.div>
  );
};

const MatchTargetZone = ({
  target,
  children,
  selectedItem,
  disabled,
  onClick,
}: {
  target: MatchTarget;
  children: React.ReactNode;
  selectedItem: MatchItem | null;
  disabled: boolean;
  onClick: () => void;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: target.id, disabled });

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      onClick={onClick}
      sx={{
        minHeight: 112,
        p: 1.5,
        borderRadius: 2,
        border: isOver
          ? "2px solid #2563eb"
          : selectedItem
          ? "2px dashed #60a5fa"
          : "1px dashed #94a3b8",
        bgcolor: isOver ? "#eff6ff" : selectedItem ? "#f8fbff" : "#f8fafc",
        cursor: disabled || !selectedItem ? "default" : "pointer",
        transition: "border-color 160ms ease, background-color 160ms ease, transform 160ms ease",
        transform: isOver ? "scale(1.01)" : "none",
      }}
    >
      <Typography fontWeight={900} color="#1e3a5f" sx={{ mb: 1 }}>
        {target.label}
      </Typography>
      <Stack spacing={0.8}>{children}</Stack>
      {!children && (
        <Typography variant="caption" color="text.secondary">
          ここにカードを配置
        </Typography>
      )}
    </Paper>
  );
};

const UnassignedZone = ({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled: boolean;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: UNASSIGNED_TARGET,
    disabled,
  });

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        minHeight: 120,
        p: 1.25,
        borderRadius: 2,
        border: isOver ? "2px solid #2563eb" : "1px solid #dbe3ef",
        bgcolor: isOver ? "#eff6ff" : "#f8fafc",
        transition: "border-color 160ms ease, background-color 160ms ease",
      }}
    >
      {children}
    </Paper>
  );
};

export const InteractiveMatchInput = ({
  items,
  targets,
  answer,
  onAnswerChange,
  disabled,
}: {
  items: MatchItem[];
  targets: MatchTarget[];
  answer: Record<string, string>;
  onAnswerChange: (answer: { matchPairs: Record<string, string[]> }) => void;
  disabled: boolean;
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const emitAnswer = (nextAnswer: Record<string, string>) => {
    const matchPairs = targets.reduce<Record<string, string[]>>((acc, target) => {
      acc[target.id] = items
        .filter((item) => nextAnswer[item.id] === target.id)
        .map((item) => item.id);
      return acc;
    }, {});
    onAnswerChange({ matchPairs });
  };

  const assignItem = (itemId: string, targetId: string) => {
    if (disabled) return;
    const nextAnswer = { ...answer };
    if (targetId === UNASSIGNED_TARGET) {
      delete nextAnswer[itemId];
    } else {
      nextAnswer[itemId] = targetId;
    }
    emitAnswer(nextAnswer);
    setSelectedItemId(null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveItemId(null);
    if (!over) return;
    assignItem(String(active.id), String(over.id));
  };

  const unassignedItems = items.filter((item) => !answer[item.id]);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const activeItem = items.find((item) => item.id === activeItemId) ?? null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveItemId(String(active.id))}
      onDragCancel={() => setActiveItemId(null)}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 0.75fr) minmax(0, 1.25fr)" },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Box>
          <Typography fontWeight={900} sx={{ mb: 1 }}>
            配置するカード
          </Typography>
          <UnassignedZone disabled={disabled}>
            <Stack spacing={1}>
              {unassignedItems.map((item) => (
                <MatchCard
                  key={item.id}
                  item={item}
                  selected={selectedItemId === item.id}
                  disabled={disabled}
                  onClick={() => setSelectedItemId((current) => current === item.id ? null : item.id)}
                />
              ))}
              {unassignedItems.length === 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
                  すべて配置されています
                </Typography>
              )}
            </Stack>
          </UnassignedZone>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, lineHeight: 1.6 }}>
            ドラッグするか、カードを選んで配置先を押します。
          </Typography>
        </Box>

        <Box>
          <Typography fontWeight={900} sx={{ mb: 1 }}>
            配置先
          </Typography>
          <Stack spacing={1.25}>
            {targets.map((target) => {
              const assignedItems = items.filter((item) => answer[item.id] === target.id);
              return (
                <MatchTargetZone
                  key={target.id}
                  target={target}
                  selectedItem={selectedItem}
                  disabled={disabled}
                  onClick={() => selectedItem && assignItem(selectedItem.id, target.id)}
                >
                  {assignedItems.length > 0
                    ? assignedItems.map((item) => (
                        <MatchCard
                          key={item.id}
                          item={item}
                          selected={selectedItemId === item.id}
                          disabled={disabled}
                          onClick={() => setSelectedItemId((current) => current === item.id ? null : item.id)}
                          onRemove={() => assignItem(item.id, UNASSIGNED_TARGET)}
                        />
                      ))
                    : null}
                </MatchTargetZone>
              );
            })}
          </Stack>
        </Box>
      </Box>

      <DragOverlay>
        {activeItem ? (
          <Paper sx={{ px: 2, py: 1.25, borderRadius: 2, border: "2px solid #2563eb", boxShadow: 6 }}>
            <Typography fontWeight={900}>{activeItem.label}</Typography>
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
