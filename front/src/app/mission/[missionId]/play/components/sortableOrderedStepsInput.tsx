"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Chip, IconButton, Paper, Stack, Tooltip, Typography, keyframes } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useSoundEffect } from "@/app/component/soundFeedback";
import type { OrderedStep } from "../type";

const movedPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.30); }
  55% { box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.12); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
`;

const SortableStep = ({
  step,
  index,
  total,
  disabled,
  recentlyMoved,
  onMove,
  onGrab,
}: {
  step: OrderedStep;
  index: number;
  total: number;
  disabled: boolean;
  recentlyMoved: boolean;
  onMove: (direction: -1 | 1) => void;
  onGrab: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    disabled,
    animateLayoutChanges: ({ isSorting, wasDragging, index, newIndex }) =>
      isSorting || wasDragging || index !== newIndex,
    transition: {
      duration: 300,
      easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    },
  });

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        minHeight: 64,
        p: 1.25,
        borderRadius: 2,
        border: isDragging ? "2px solid #2563eb" : "1px solid #dbe3ef",
        display: "flex",
        gap: 1,
        alignItems: "center",
        bgcolor: isDragging || recentlyMoved ? "#eff6ff" : "#fff",
        boxShadow: isDragging ? "0 14px 28px rgba(37, 99, 235, 0.18)" : "none",
        opacity: isDragging ? 0.45 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : "auto",
        cursor: disabled ? "default" : "default",
        touchAction: "none",
        animation: recentlyMoved ? `${movedPulse} 480ms ease-out` : "none",
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
      }}
    >
      <Tooltip title="ドラッグして並べ替え">
        <IconButton
          size="small"
          disabled={disabled}
          aria-label={`${step.label}をドラッグして並べ替え`}
          {...attributes}
          {...listeners}
          onPointerDown={(event) => {
            listeners?.onPointerDown?.(event);
            if (!disabled) {
              onGrab();
            }
          }}
          onKeyDown={(event) => {
            listeners?.onKeyDown?.(event);
            if (!disabled && (event.key === " " || event.key === "Enter")) {
              onGrab();
            }
          }}
          sx={{
            cursor: disabled ? "default" : isDragging ? "grabbing" : "grab",
            touchAction: "none",
            bgcolor: isDragging ? "#dbeafe" : "transparent",
            "&:hover": { bgcolor: "#eff6ff" },
          }}
        >
          <DragIndicatorIcon />
        </IconButton>
      </Tooltip>
      <Chip label={index + 1} size="small" color={isDragging ? "primary" : "default"} sx={{ fontWeight: 900 }} />
      <Typography sx={{ flex: 1, fontWeight: 800 }}>{step.label}</Typography>
      <Tooltip title="上へ移動">
        <span>
          <IconButton
            size="small"
            disabled={disabled || index === 0}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMove(-1)}
          >
            <ArrowUpwardIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="下へ移動">
        <span>
          <IconButton
            size="small"
            disabled={disabled || index === total - 1}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onMove(1)}
          >
            <ArrowDownwardIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Paper>
  );
};

export const SortableOrderedStepsInput = ({
  steps,
  answer,
  onAnswerChange,
  disabled,
}: {
  steps: OrderedStep[];
  answer: string[];
  onAnswerChange: (answer: string[]) => void;
  disabled: boolean;
}) => {
  const { play } = useSoundEffect();
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [recentlyMovedId, setRecentlyMovedId] = useState<string | null>(null);
  const movedTimerRef = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const currentAnswer = answer.length > 0 ? answer : steps.map((step) => step.id);
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    return () => {
      if (movedTimerRef.current) window.clearTimeout(movedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (answer.length === 0 && steps.length > 0) {
      onAnswerChange(steps.map((step) => step.id));
    }
  }, [answer.length, onAnswerChange, steps]);

  const emphasizeMovedStep = (stepId: string) => {
    setRecentlyMovedId(stepId);
    if (movedTimerRef.current) window.clearTimeout(movedTimerRef.current);
    movedTimerRef.current = window.setTimeout(() => setRecentlyMovedId(null), 520);
  };

  const move = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= currentAnswer.length) return;
    emphasizeMovedStep(currentAnswer[index]);
    onAnswerChange(arrayMove(currentAnswer, index, nextIndex));
    play("dragDrop");
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = currentAnswer.indexOf(String(active.id));
    const newIndex = currentAnswer.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    emphasizeMovedStep(String(active.id));
    onAnswerChange(arrayMove(currentAnswer, oldIndex, newIndex));
    play("dragDrop");
  };

  const activeStep = activeStepId ? stepById.get(activeStepId) ?? null : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => {
        setActiveStepId(String(active.id));
      }}
      onDragCancel={() => setActiveStepId(null)}
      onDragEnd={(event) => {
        setActiveStepId(null);
        handleDragEnd(event);
      }}
    >
      <SortableContext items={currentAnswer} strategy={verticalListSortingStrategy}>
        <Stack spacing={1}>
          {currentAnswer.map((stepId, index) => {
            const step = stepById.get(stepId);
            if (!step) return null;

            return (
              <motion.div
                key={stepId}
                layout="position"
                transition={{
                  layout: {
                    duration: reduceMotion ? 0 : 0.3,
                    ease: [0.2, 0.8, 0.2, 1],
                  },
                }}
              >
                <SortableStep
                  step={step}
                  index={index}
                  total={currentAnswer.length}
                  disabled={disabled}
                  recentlyMoved={recentlyMovedId === stepId}
                  onMove={(direction) => move(index, direction)}
                  onGrab={() => play("dragPickup")}
                />
              </motion.div>
            );
          })}
        </Stack>
      </SortableContext>
      <DragOverlay>
        {activeStep ? (
          <Paper
            sx={{
              minWidth: 280,
              px: 2,
              py: 1.5,
              borderRadius: 2,
              border: "2px solid #2563eb",
              boxShadow: "0 18px 36px rgba(37, 99, 235, 0.24)",
            }}
          >
            <Typography fontWeight={900}>{activeStep.label}</Typography>
          </Paper>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
