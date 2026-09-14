/** 文字列探索で共有する、文字列とpatternの位置合わせ・prefix表・STEP TRACE表示。 */
"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

import {
  AlgorithmArray,
  AlgorithmValueCard,
  CodeLines,
  StepTraceControls,
  type AlgorithmCellState,
  type AlgorithmPointer,
} from "@/features/learning/components";

type AlignmentStep = {
  textIndex: number;
  patternIndex: number;
  patternStart: number;
  matchedPatternIndices?: number[];
  mismatch?: boolean;
  message: string;
  activeCodeLines?: number[];
  lpsActiveIndex?: number;
};

type AlignmentTraceData = {
  text: string;
  pattern: string;
  lps?: number[];
  steps: AlignmentStep[];
  code?: string;
  finalMessage?: string;
  intervalMs?: number;
  labels?: StringSearchLabels;
  showIndices?: boolean;
  showPositionSummary?: boolean;
  showPointers?: boolean;
  showStateLabels?: boolean;
};

type PrefixTableStep = {
  index?: number;
  length?: number;
  lengthAfter?: number;
  nextIndex?: number;
  action?: "EXTEND" | "FALLBACK" | "RECORD_ZERO";
  endIndex?: number;
  rangeLength?: number;
  overlapLength?: number;
  overlapText?: string;
  candidates?: PrefixComparisonCandidate[];
  lps: Array<number | null>;
  message: string;
  activeCodeLines?: number[];
  phase?: "COMPARE" | "FALLBACK" | "RECORDED";
  comparisonResult?: "MATCH" | "MISMATCH";
  fallbackFromLength?: number;
  fallbackLookupIndex?: number;
  fallbackValue?: number;
};

type PrefixTableTraceData = {
  pattern: string;
  mode?: "MEANING" | "BUILD";
  steps: PrefixTableStep[];
  code?: string;
  finalMessage?: string;
  intervalMs?: number;
  labels?: StringSearchLabels;
  stepGranularity?: "CANDIDATE" | "RANGE";
  showIndices?: boolean;
  nextLabel?: string;
  stepDescriptions?: string[];
};

type StringSearchLabels = {
  text?: string;
  pattern?: string;
  alignmentStart?: string;
  textPointer?: string;
  patternPointer?: string;
  textActive?: string;
  patternActive?: string;
  textMatched?: string;
  patternMatched?: string;
  lpsTable?: string;
  prefix?: string;
  suffix?: string;
  candidateLength?: string;
  rangeLength?: string;
  comparableLengths?: string;
  excludedWholeRange?: string;
  match?: string;
  longest?: string;
  longestLength?: string;
  currentRange?: string;
  notExamined?: string;
  matchingRange?: string;
  prefixSide?: string;
  suffixSide?: string;
  overlapResult?: string;
  recordResult?: string;
  buildTarget?: string;
  buildReference?: string;
  retainedRange?: string;
  nextComparison?: string;
};

type PrefixComparisonCandidate = {
  prefix: string;
  suffix: string;
  length: number;
  isMatch: boolean;
};

type PrefixMeaningFrame = {
  step: PrefixTableStep;
  phase: "CANDIDATE" | "RESULT";
  candidateIndex?: number;
};

type DecisionState = AlignmentStep & {
  text: string;
  pattern: string;
  lps?: number[];
};

const CharacterRow = ({
  label,
  values,
  offset = 0,
  activeIndex,
  matchedIndices = [],
  mismatch = false,
  pointerLabel,
  pointerTone = "primary",
  activeStateLabel,
  matchedStateLabel,
  showIndices = true,
  showPointer = true,
  showStateLabels = true,
}: {
  label: string;
  values: string[];
  offset?: number;
  activeIndex?: number;
  matchedIndices?: number[];
  mismatch?: boolean;
  pointerLabel?: string;
  pointerTone?: "primary" | "secondary";
  activeStateLabel?: string;
  matchedStateLabel?: string;
  showIndices?: boolean;
  showPointer?: boolean;
  showStateLabels?: boolean;
}) => (
  <Box sx={{ overflowX: "auto", py: 0.5 }}>
    <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ minWidth: "max-content" }}>
      <Typography sx={{ width: 72, pt: 1.5, flexShrink: 0, fontWeight: 950, color: "#334155" }}>
        {label}
      </Typography>
      {Array.from({ length: offset }, (_, index) => (
        <Box key={`offset-${index}`} aria-hidden sx={{ width: { xs: 40, sm: 46 }, flexShrink: 0 }} />
      ))}
      {values.map((value, index) => {
        const state: AlgorithmCellState = index === activeIndex
          ? mismatch ? "incorrect" : "comparing"
          : matchedIndices.includes(index) ? "confirmed" : "idle";
        const pointers: AlgorithmPointer[] = showPointer && index === activeIndex && pointerLabel
          ? [{ index, label: pointerLabel, tone: pointerTone }]
          : [];
        return (
          <AlgorithmValueCard
            key={`${label}-${index}-${value}`}
            value={value}
            index={index}
            state={state}
            compact
            pointers={pointers}
            showIndex={showIndices}
            stateLabel={!showStateLabels ? "" : index === activeIndex
              ? mismatch ? "文字が不一致" : activeStateLabel
              : matchedIndices.includes(index) ? matchedStateLabel : undefined}
          />
        );
      })}
    </Stack>
  </Box>
);

const StringAlignment = ({
  text,
  pattern,
  step,
  lps,
  labels = {},
  showIndices = true,
  showPositionSummary = true,
  showPointers = true,
  showStateLabels = true,
}: {
  text: string;
  pattern: string;
  step: AlignmentStep;
  lps?: number[];
  labels?: StringSearchLabels;
  showIndices?: boolean;
  showPositionSummary?: boolean;
  showPointers?: boolean;
  showStateLabels?: boolean;
}) => {
  const matchedPatternIndices = step.matchedPatternIndices ?? [];
  const matchedTextIndices = matchedPatternIndices.map((index) => step.patternStart + index);
  return (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      {showPositionSummary && <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap>
        <Chip label={`${labels.alignmentStart ?? "照合を始める位置"} ${step.patternStart}`} color="primary" variant="outlined" sx={{ fontWeight: 900 }} />
        <Chip label={`${labels.textPointer ?? "長い文字列の確認位置"} = ${step.textIndex}`} sx={{ fontWeight: 900 }} />
        <Chip label={`${labels.patternPointer ?? "探す文字列の確認位置"} = ${step.patternIndex}`} sx={{ fontWeight: 900 }} />
      </Stack>}
      <CharacterRow
        label={labels.text ?? "長い文字列"}
        values={[...text]}
        activeIndex={step.textIndex}
        matchedIndices={matchedTextIndices}
        mismatch={step.mismatch}
        pointerLabel={labels.textPointer ?? "長い文字列の確認位置"}
        activeStateLabel={labels.textActive ?? "いま確認する文字"}
        matchedStateLabel={labels.textMatched ?? "一致を確認済み"}
        showIndices={showIndices}
        showPointer={showPointers}
        showStateLabels={showStateLabels}
      />
      <CharacterRow
        label={labels.pattern ?? "探す文字列"}
        values={[...pattern]}
        offset={step.patternStart}
        activeIndex={step.patternIndex}
        matchedIndices={matchedPatternIndices}
        mismatch={step.mismatch}
        pointerLabel={labels.patternPointer ?? "探す文字列の確認位置"}
        pointerTone="secondary"
        activeStateLabel={labels.patternActive ?? "いま確認する文字"}
        matchedStateLabel={labels.patternMatched ?? "一致を確認済み"}
        showIndices={showIndices}
        showPointer={showPointers}
        showStateLabels={showStateLabels}
      />
      {lps && (
        <Box sx={{ minWidth: 0 }}>
          <Typography fontSize={13} fontWeight={900} color="#475569" sx={{ mb: 0.5 }}>
            {labels.lpsTable ?? "探す文字列のLPS表"}
          </Typography>
          <AlgorithmArray
            values={lps}
            states={step.lpsActiveIndex === undefined ? undefined : { [step.lpsActiveIndex]: "selected" }}
            stateLabels={step.lpsActiveIndex === undefined ? undefined : { [step.lpsActiveIndex]: "今回使う値" }}
            compact
            showIndices={showIndices}
            ariaLabel={labels.lpsTable ?? "探す文字列のLPS表"}
          />
        </Box>
      )}
    </Stack>
  );
};

const useTrace = (stepCount: number, intervalMs = 1000, resetKey?: unknown) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setStepIndex(0);
  }, [resetKey]);

  useEffect(() => {
    if (!playing || stepIndex >= stepCount - 1) {
      if (stepIndex >= stepCount - 1) setPlaying(false);
      return;
    }
    const timer = window.setTimeout(
      () => setStepIndex((current) => Math.min(stepCount - 1, current + 1)),
      intervalMs,
    );
    return () => window.clearTimeout(timer);
  }, [intervalMs, playing, stepCount, stepIndex]);

  return { stepIndex, setStepIndex, playing, setPlaying };
};

const AlignmentTrace = ({ data }: { data: AlignmentTraceData }) => {
  const trace = useTrace(data.steps.length, data.intervalMs, data);
  const step = data.steps[trace.stepIndex];
  if (!step) return null;

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <StringAlignment
        text={data.text}
        pattern={data.pattern}
        step={step}
        lps={data.lps}
        labels={data.labels}
        showIndices={data.showIndices}
        showPositionSummary={data.showPositionSummary}
        showPointers={data.showPointers}
        showStateLabels={data.showStateLabels}
      />
      <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2, bgcolor: "#eff6ff" }}>
        <Typography aria-live="polite" fontWeight={900}>{step.message}</Typography>
        {trace.stepIndex === data.steps.length - 1 && data.finalMessage && (
          <Typography color="#166534" fontWeight={900} sx={{ mt: 0.75 }}>{data.finalMessage}</Typography>
        )}
      </Paper>
      {data.code && <CodeLines code={data.code} activeLines={step.activeCodeLines ?? []} showLineNumbers wrapLongLines />}
      {data.steps.length > 1 && <StepTraceControls
        stepIndex={trace.stepIndex}
        stepCount={data.steps.length}
        playing={trace.playing}
        onReset={() => { trace.setPlaying(false); trace.setStepIndex(0); }}
        onPrevious={() => { trace.setPlaying(false); trace.setStepIndex((current) => Math.max(0, current - 1)); }}
        onNext={() => { trace.setPlaying(false); trace.setStepIndex((current) => Math.min(data.steps.length - 1, current + 1)); }}
        onPlayingChange={trace.setPlaying}
      />}
    </Stack>
  );
};

const PrefixSuffixExplanation = ({ content }: { content: Record<string, unknown> }) => {
  const pattern = String(content.pattern ?? "");
  const candidates = Array.isArray(content.candidates)
    ? content.candidates as PrefixComparisonCandidate[]
    : [];
  const rangeLength = Number(content.rangeLength ?? pattern.length);
  const presentationMode = content.presentationMode === "TERMS"
    ? "TERMS"
    : content.presentationMode === "REUSE"
      ? "REUSE"
      : content.presentationMode === "LENGTHS"
        ? "LENGTHS"
        : content.presentationMode === "RULE" ? "RULE" : "CALCULATION";
  const labels = content.labels && typeof content.labels === "object" && !Array.isArray(content.labels)
    ? content.labels as StringSearchLabels
    : {};
  const matchedXs = candidates.filter((candidate) => candidate.isMatch).map((candidate) => candidate.length);
  const showRulePhase = content.showRulePhase !== false && presentationMode === "CALCULATION";
  const calculationStepCount = presentationMode === "LENGTHS"
    ? candidates.length
    : candidates.length + (showRulePhase ? 2 : 1);
  const trace = useTrace(calculationStepCount, Number(content.intervalMs ?? 1200), content);
  const candidateOffset = showRulePhase ? 1 : 0;
  const phase = showRulePhase && trace.stepIndex === 0
    ? "RULE"
    : trace.stepIndex < candidates.length + candidateOffset ? "CANDIDATE" : "RESULT";
  const candidateIndex = Math.max(0, trace.stepIndex - candidateOffset);
  const currentCandidate = candidates[candidateIndex];
  const checkedCandidates = candidates.slice(0, candidateIndex);

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Box>
        <Typography fontWeight={950} sx={{ mb: 1 }}>{labels.pattern ?? "調べる文字列"}</Typography>
        <AlgorithmArray
          values={[...pattern]}
          states={[...pattern].map((_, index) => index < rangeLength ? "active" : "excluded")}
          stateLabels={[...pattern].map((_, index) => index < rangeLength ? "今回調べる範囲" : "今回は調べない")}
          compact
          ariaLabel={`${labels.prefix ?? "先頭側"}と${labels.suffix ?? "末尾側"}を調べる文字列`}
        />
      </Box>

      {presentationMode === "RULE" ? (
        <ComparisonLengthRule pattern={pattern} rangeLength={rangeLength} labels={labels} />
      ) : presentationMode === "LENGTHS" ? (
        <Stack spacing={1.5}>
          <Chip
            color="primary"
            label={`今回調べる範囲の長さ m = ${rangeLength}`}
            sx={{ alignSelf: "flex-start", fontWeight: 950 }}
          />
          {currentCandidate && (
            <Stack spacing={1}>
              <Typography fontWeight={950}>比較する文字数 x = {currentCandidate.length}</Typography>
              <Typography color="#475569" fontWeight={750}>
                先頭と末尾から、それぞれ{currentCandidate.length}文字ずつ取り出します。
              </Typography>
              <PrefixCandidateCard
                pattern={pattern}
                endIndex={rangeLength - 1}
                candidate={currentCandidate}
                labels={labels}
                showCandidateLength={false}
                showComparisonResult={false}
              />
            </Stack>
          )}
          {candidates.length > 1 && (
            <StepTraceControls
              stepIndex={trace.stepIndex}
              stepCount={candidates.length}
              playing={trace.playing}
              onReset={() => { trace.setPlaying(false); trace.setStepIndex(0); }}
              onPrevious={() => { trace.setPlaying(false); trace.setStepIndex((current) => Math.max(0, current - 1)); }}
              onNext={() => { trace.setPlaying(false); trace.setStepIndex((current) => Math.min(candidates.length - 1, current + 1)); }}
              onPlayingChange={trace.setPlaying}
            />
          )}
        </Stack>
      ) : presentationMode === "TERMS" ? (
        <Stack spacing={1.5}>
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
            <Typography fontWeight={950}>前のActivityで見た2つの並びに名前を付けます</Typography>
            <Typography color="#334155" fontWeight={750} sx={{ mt: 0.5 }}>
              先頭から続く並びを「接頭辞（prefix）」、末尾で終わる並びを「接尾辞（suffix）」と呼びます。
            </Typography>
          </Paper>
          {candidates[0] && (
            <PrefixCandidateCard
              pattern={pattern}
              endIndex={rangeLength - 1}
              candidate={candidates[0]}
              labels={labels}
              showCandidateLength={false}
              showComparisonResult={false}
            />
          )}
          <Typography color="#166534" fontWeight={900}>
            この例では、接頭辞「{candidates[0]?.prefix ?? ""}」と接尾辞「{candidates[0]?.suffix ?? ""}」が一致しています。
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {phase === "RULE" && (
            <ComparisonLengthRule pattern={pattern} rangeLength={rangeLength} labels={labels} />
          )}

          {phase === "CANDIDATE" && currentCandidate && (
            <Stack spacing={1.25}>
              {presentationMode === "REUSE" && (
                <Paper elevation={0} sx={{ p: 1.25, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
                  <Typography fontWeight={900}>
                    patternを右へずらしたとき、以前一致した並びの末尾と、ずらした後のpatternの先頭を確認します。
                  </Typography>
                  <Typography color="#475569" fontWeight={750} sx={{ mt: 0.5 }}>
                    これは検索中にtextをもう一度読む比較ではなく、再比較せずに使える文字をpattern内で判断する確認です。
                  </Typography>
                </Paper>
              )}
              {checkedCandidates.length > 0 && (
                <CheckedCandidateSummary candidates={checkedCandidates} />
              )}
              <Typography fontWeight={950}>
                {presentationMode === "REUSE"
                  ? `比較する文字数 x = ${currentCandidate.length}`
                  : `比較する文字数 x = ${currentCandidate.length}`}
              </Typography>
              <PrefixCandidateCard
                pattern={pattern}
                endIndex={rangeLength - 1}
                candidate={currentCandidate}
                labels={labels}
                showCandidateLength={false}
              />
            </Stack>
          )}

          {phase === "RESULT" && (
            <Stack spacing={1.25}>
              <CheckedCandidateSummary candidates={candidates} />
              <PrefixComparisonResult
                matchedXs={matchedXs}
                longest={String(content.longest ?? "")}
                longestLength={Number(content.longestLength ?? 0)}
                labels={labels}
              />
            </Stack>
          )}

          <StepTraceControls
            stepIndex={trace.stepIndex}
            stepCount={calculationStepCount}
            playing={trace.playing}
            onReset={() => { trace.setPlaying(false); trace.setStepIndex(0); }}
            onPrevious={() => { trace.setPlaying(false); trace.setStepIndex((current) => Math.max(0, current - 1)); }}
            onNext={() => { trace.setPlaying(false); trace.setStepIndex((current) => Math.min(calculationStepCount - 1, current + 1)); }}
            onPlayingChange={trace.setPlaying}
          />
        </Stack>
      )}
    </Stack>
  );
};

const blankStateLabels = (length: number) => Object.fromEntries(
  Array.from({ length }, (_, index) => [index, ""]),
) as Partial<Record<number, string>>;

const ComparisonLengthRule = ({
  pattern,
  rangeLength,
  labels,
}: {
  pattern: string;
  rangeLength: number;
  labels: StringSearchLabels;
}) => {
  const comparableXs = Array.from({ length: Math.max(rangeLength - 1, 0) }, (_, index) => index + 1);
  const currentRange = pattern.slice(0, rangeLength);
  return (
    <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, border: "1px solid #93c5fd", bgcolor: "#eff6ff" }}>
      <Stack spacing={1.25}>
        <Stack direction="row" gap={1} flexWrap="wrap" useFlexGap alignItems="center">
          <Chip label={`${labels.rangeLength ?? "範囲の長さ m"} = ${rangeLength}`} color="primary" sx={{ fontWeight: 950 }} />
          <Typography fontWeight={900}>今回調べる範囲は「{currentRange}」です。</Typography>
        </Stack>
        <Box>
          <Typography fontWeight={950}>{labels.comparableLengths ?? "比較する文字数 x"}</Typography>
          <Typography color="#334155" fontWeight={750} sx={{ mt: 0.25 }}>
            先頭と末尾から、必ず同じx文字を取り出して比べます。
          </Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
            {comparableXs.length > 0
              ? comparableXs.map((x) => <Chip key={x} size="small" label={`x = ${x}`} sx={{ fontWeight: 900, bgcolor: "#fff" }} />)
              : <Chip size="small" label="比較できるxはありません" sx={{ fontWeight: 900, bgcolor: "#fff" }} />}
          </Stack>
          {comparableXs.length > 0 && (
            <Typography fontFamily="monospace" fontWeight={900} color="#1d4ed8" sx={{ mt: 0.75 }}>
              1 ≤ x ≤ m - 1
            </Typography>
          )}
        </Box>
        <Paper elevation={0} sx={{ p: 1.25, borderRadius: 1.5, border: "1px solid #cbd5e1", bgcolor: "#fff" }}>
          <Typography fontWeight={950}>{labels.excludedWholeRange ?? "文字列全体は比較候補に含めません"}</Typography>
          <Typography color="#475569" fontWeight={750} sx={{ mt: 0.25 }}>
            x = m = {rangeLength}では、先頭側も末尾側も文字列全体「{currentRange}」になります。
            同じ文字列全体どうしは必ず一致し、どの位置でもmが結果になってしまうため比較しません。
          </Typography>
        </Paper>
      </Stack>
    </Paper>
  );
};

const CheckedCandidateSummary = ({ candidates }: { candidates: PrefixComparisonCandidate[] }) => (
  <Stack direction="row" gap={0.75} flexWrap="wrap" useFlexGap alignItems="center">
    <Typography color="#475569" fontSize={13} fontWeight={900}>確認済み</Typography>
    {candidates.map((candidate) => (
      <Chip
        key={`checked-${candidate.length}`}
        size="small"
        color={candidate.isMatch ? "success" : "error"}
        variant="outlined"
        label={`x = ${candidate.length}：${candidate.isMatch ? "一致" : "一致しない"}`}
        sx={{ fontWeight: 900 }}
      />
    ))}
  </Stack>
);

const PrefixComparisonResult = ({
  matchedXs,
  longest,
  longestLength,
  labels,
}: {
  matchedXs: number[];
  longest: string;
  longestLength: number;
  labels: StringSearchLabels;
}) => (
  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid #86efac", bgcolor: "#f0fdf4" }}>
    <Typography fontWeight={900} color="#166534">
      一致した候補：{matchedXs.length > 0 ? matchedXs.map((x) => `x = ${x}`).join("、") : "なし"}
    </Typography>
    <Typography fontWeight={950}>{labels.longest ?? "最長の一致"}：{longest || "なし"}</Typography>
    <Typography color="#166534" fontWeight={900} sx={{ mt: 0.5 }}>
      {labels.longestLength ?? "一致した中で最も大きいx"} = {longestLength}
    </Typography>
  </Paper>
);

const PrefixCandidateCard = ({
  pattern,
  endIndex,
  candidate,
  labels,
  showCandidateLength = true,
  showComparisonResult = true,
}: {
  pattern: string;
  endIndex: number;
  candidate: PrefixComparisonCandidate;
  labels: StringSearchLabels;
  showCandidateLength?: boolean;
  showComparisonResult?: boolean;
}) => {
  const values = [...pattern];
  const stateLabels = blankStateLabels(values.length);
  const prefixLabel = labels.prefix ? `${labels.prefix}・${candidate.length}文字` : `先頭から${candidate.length}文字`;
  const suffixLabel = labels.suffix ? `${labels.suffix}・${candidate.length}文字` : `末尾から${candidate.length}文字`;
  const prefixStates: Partial<Record<number, AlgorithmCellState>> = {};
  const suffixStates: Partial<Record<number, AlgorithmCellState>> = {};
  values.forEach((_, index) => {
    const outsideRange = index > endIndex;
    const tone: AlgorithmCellState = candidate.isMatch ? "correct" : "incorrect";
    prefixStates[index] = outsideRange ? "excluded" : index < candidate.length ? tone : "idle";
    suffixStates[index] = outsideRange
      ? "excluded"
      : index >= endIndex - candidate.length + 1 ? tone : "idle";
  });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${candidate.isMatch ? "#86efac" : "#fca5a5"}`,
        bgcolor: candidate.isMatch ? "#f0fdf4" : "#fff",
        minWidth: 0,
      }}
    >
      <Stack spacing={1.25}>
        {(showCandidateLength || showComparisonResult) && (
          <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {showCandidateLength && (
              <Chip size="small" label={`${labels.candidateLength ?? "比較する文字数 x"} = ${candidate.length}`} sx={{ fontWeight: 900 }} />
            )}
            {showComparisonResult && (
              <Chip
                size="small"
                color={candidate.isMatch ? "success" : "error"}
                variant={candidate.isMatch ? "filled" : "outlined"}
                icon={candidate.isMatch ? <CheckCircleIcon /> : undefined}
                label={candidate.isMatch ? labels.match ?? "一致" : "一致しない"}
                sx={{ fontWeight: 900 }}
              />
            )}
          </Stack>
        )}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "112px minmax(0, 1fr)" }, alignItems: "center", gap: 0.5 }}>
          <Typography fontSize={13} fontWeight={900}>{prefixLabel}</Typography>
          <AlgorithmArray values={values} states={prefixStates} stateLabels={stateLabels} compact showIndices={false} ariaLabel={`先頭から${candidate.length}文字は${candidate.prefix}`} />
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "112px minmax(0, 1fr)" }, alignItems: "center", gap: 0.5 }}>
          <Typography fontSize={13} fontWeight={900}>{suffixLabel}</Typography>
          <AlgorithmArray values={values} states={suffixStates} stateLabels={stateLabels} compact showIndices={false} ariaLabel={`末尾から${candidate.length}文字は${candidate.suffix}`} />
        </Box>
      </Stack>
    </Paper>
  );
};

const PrefixMeaningState = ({
  data,
  frame,
}: {
  data: PrefixTableTraceData;
  frame: PrefixMeaningFrame;
}) => {
  const { step, phase, candidateIndex } = frame;
  const patternValues = [...data.pattern];
  const endIndex = Math.min(step.endIndex ?? step.index ?? 0, patternValues.length - 1);
  const rangeLength = step.rangeLength ?? endIndex + 1;
  const overlapLength = Math.min(step.overlapLength ?? step.length ?? 0, Math.max(rangeLength - 1, 0));
  const overlapText = step.overlapText ?? data.pattern.slice(0, overlapLength);
  const candidates = step.candidates ?? [];
  const matchedXs = candidates.filter((candidate) => candidate.isMatch).map((candidate) => candidate.length);
  const currentCandidate = candidateIndex == null ? undefined : candidates[candidateIndex];
  const remainingCandidateCount = currentCandidate == null
    ? 0
    : candidates.length - (candidateIndex ?? 0) - 1;
  const checkedCandidates = phase === "RESULT"
    ? candidates
    : candidates.slice(0, candidateIndex ?? 0);
  const displayedLps = step.lps.map((value, index) => (
    phase === "RESULT" || index !== endIndex ? value : null
  ));
  const stateLabels = blankStateLabels(patternValues.length);
  const currentRangeStates: Partial<Record<number, AlgorithmCellState>> = {};
  const lpsStates: Partial<Record<number, AlgorithmCellState>> = {};

  patternValues.forEach((_, index) => {
    currentRangeStates[index] = index <= endIndex ? "active" : "excluded";
    lpsStates[index] = displayedLps[index] == null
      ? "excluded"
      : index === endIndex && phase === "RESULT" ? "correct" : "idle";
  });

  const range = data.pattern.slice(0, endIndex + 1);
  const labels = data.labels ?? {};
  const comparisonLabel = overlapLength > 0
    ? `${overlapText}（${overlapLength}文字）`
    : "なし（0文字）";

  return (
    <Stack spacing={2.25} sx={{ minWidth: 0 }}>
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid #bfdbfe", borderRadius: 2, bgcolor: "#fff" }}>
        <Typography fontWeight={950} sx={{ mb: 0.25 }}>
          {labels.currentRange ?? "今回調べる範囲"}：{range}
        </Typography>
        <AlgorithmArray
          values={patternValues}
          states={currentRangeStates}
          stateLabels={stateLabels}
          compact
          showIndices={data.showIndices ?? false}
          ariaLabel={`今回調べる範囲は${range}`}
        />
      </Paper>

      {phase === "CANDIDATE" && currentCandidate ? (
        <Stack spacing={1.25}>
          {checkedCandidates.length > 0 && <CheckedCandidateSummary candidates={checkedCandidates} />}
          <Typography fontWeight={950}>比較する文字数 x = {currentCandidate.length}</Typography>
          <PrefixCandidateCard
            pattern={data.pattern}
            endIndex={endIndex}
            candidate={currentCandidate}
            labels={labels}
            showCandidateLength={false}
          />
          <Typography color="#475569" fontWeight={800}>
            {remainingCandidateCount > 0
              ? `ほかの比較する文字数も確認します。`
              : "すべての比較が終わったので、最長の一致をLPS表へ記録します。"}
          </Typography>
        </Stack>
      ) : (
        <Stack spacing={1.25}>
          {candidates.length > 0 ? (
            data.stepGranularity === "RANGE" ? (
              <Stack spacing={1}>
                {candidates.map((candidate) => (
                  <Box key={`range-${endIndex}-${candidate.length}`}>
                    <Typography fontWeight={950} sx={{ mb: 0.5 }}>
                      比較する文字数 x = {candidate.length}
                    </Typography>
                    <PrefixCandidateCard
                      pattern={data.pattern}
                      endIndex={endIndex}
                      candidate={candidate}
                      labels={labels}
                      showCandidateLength={false}
                    />
                  </Box>
                ))}
              </Stack>
            ) : <CheckedCandidateSummary candidates={candidates} />
          ) : (
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #cbd5e1", bgcolor: "#fff" }}>
              <Typography fontWeight={900}>比較できる文字数がないため、LPS値は0です。</Typography>
            </Paper>
          )}
          <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid #86efac", borderRadius: 2, bgcolor: "#f0fdf4" }}>
            <Typography color="#166534" fontWeight={900}>
              一致した候補：{matchedXs.length > 0 ? matchedXs.map((x) => `x = ${x}`).join("、") : "なし"}
            </Typography>
            <Typography color="#166534" fontWeight={950}>
              {labels.overlapResult ?? "先頭と末尾で一致する最長の並び"}：{comparisonLabel}
            </Typography>
            <Typography fontWeight={900} sx={{ mt: 0.5 }}>
              {labels.recordResult ?? "記録"}：LPS表の index {endIndex} に {overlapLength} を記録
            </Typography>
          </Paper>
        </Stack>
      )}

      <Box>
        <Typography fontWeight={950} sx={{ mb: 0.75 }}>{labels.lpsTable ?? "LPS表"}</Typography>
        <AlgorithmArray
          values={displayedLps.map((value) => value ?? "—")}
          states={lpsStates}
          stateLabels={stateLabels}
          compact
          showIndices={data.showIndices ?? true}
          ariaLabel={`index ${endIndex}まで記録したLPS表`}
        />
      </Box>
    </Stack>
  );
};

const PrefixBuildState = ({
  data,
  step,
}: {
  data: PrefixTableTraceData;
  step: PrefixTableStep;
}) => {
  const patternValues = [...data.pattern];
  const index = Math.min(step.index ?? 0, patternValues.length - 1);
  const stateLabels = blankStateLabels(patternValues.length);
  const rangeStates: Partial<Record<number, AlgorithmCellState>> = {};
  const labels = data.labels ?? {};
  const currentRangeEnd = Math.min(index, patternValues.length - 1);
  const retainedLength = Math.min(step.length ?? 0, currentRangeEnd);
  const recorded = step.phase === "RECORDED";
  const fallback = step.phase === "FALLBACK";
  const hasFallbackExplanation = step.fallbackFromLength !== undefined
    && step.fallbackLookupIndex !== undefined
    && step.fallbackValue !== undefined;
  const fallbackLookupIndex = step.fallbackLookupIndex ?? -1;
  const fallbackFromText = hasFallbackExplanation
    ? data.pattern.slice(0, step.fallbackFromLength)
    : "";
  const fallbackToText = hasFallbackExplanation
    ? data.pattern.slice(0, step.fallbackValue)
    : "";
  const displayedRetainedLength = fallback ? (step.fallbackFromLength ?? retainedLength) : retainedLength;
  const displayedRetainedPrefix = data.pattern.slice(0, displayedRetainedLength);
  const displayedRetainedSuffix = displayedRetainedLength > 0
    ? data.pattern.slice(
      recorded ? currentRangeEnd - displayedRetainedLength + 1 : currentRangeEnd - displayedRetainedLength,
      recorded ? currentRangeEnd + 1 : currentRangeEnd,
    )
    : "";
  const visualLength = fallback ? (step.fallbackFromLength ?? retainedLength) : retainedLength;
  const prefixStart = 0;
  const suffixStart = Math.max(0, recorded ? currentRangeEnd - visualLength + 1 : currentRangeEnd - visualLength);
  patternValues.forEach((_, position) => {
    if (position > currentRangeEnd) {
      rangeStates[position] = "excluded";
      return;
    }
    const inKnownPrefix = visualLength > 0 && position >= prefixStart && position < visualLength;
    const inKnownSuffix = visualLength > 0
      && position >= suffixStart
      && position <= (recorded ? currentRangeEnd : currentRangeEnd - 1);
    const isCompared = !recorded && (position === visualLength || position === currentRangeEnd);
    rangeStates[position] = isCompared
      ? step.comparisonResult === "MISMATCH" ? "incorrect" : "comparing"
      : inKnownPrefix || inKnownSuffix ? "confirmed" : "idle";
  });

  const comparisonLength = fallback ? (step.fallbackFromLength ?? retainedLength) : retainedLength;
  const prefixComparison = data.pattern.slice(0, comparisonLength + 1);
  const suffixComparison = data.pattern.slice(currentRangeEnd - comparisonLength, currentRangeEnd + 1);
  const comparisonStates = Object.fromEntries(
    Array.from({ length: comparisonLength + 1 }, (_, position) => [
      position,
      position < comparisonLength
        ? "confirmed"
        : step.comparisonResult === "MISMATCH" ? "incorrect" : "comparing",
    ]),
  ) as Partial<Record<number, AlgorithmCellState>>;
  const lpsStates: Partial<Record<number, AlgorithmCellState>> = hasFallbackExplanation
    ? { [fallbackLookupIndex]: "selected" }
    : { [currentRangeEnd]: recorded ? "confirmed" : "active" };
  const lpsStateLabels = hasFallbackExplanation
    ? { [fallbackLookupIndex]: "次の候補の文字数" }
    : { [currentRangeEnd]: recorded ? "記録した値" : "今回求める値" };

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #bfdbfe", bgcolor: "#eff6ff" }}>
        <Typography fontWeight={950}>今回調べる範囲：{data.pattern.slice(0, currentRangeEnd + 1)}</Typography>
        <Typography color="#475569" fontWeight={800} sx={{ mt: 0.5 }}>
          {displayedRetainedLength > 0
            ? `${labels.retainedRange ?? "現在一致している先頭・末尾"}：先頭「${displayedRetainedPrefix}」／末尾「${displayedRetainedSuffix}」（${displayedRetainedLength}文字）`
            : `${labels.retainedRange ?? "現在一致している先頭・末尾"}：なし（0文字）`}
        </Typography>
        {recorded && (
          <Typography color="#166534" fontWeight={950} sx={{ mt: 0.5 }}>
            記録：LPS[{currentRangeEnd}] = {step.lps[currentRangeEnd]}
          </Typography>
        )}
      </Paper>
      {!recorded && (
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #cbd5e1", bgcolor: "#fff" }}>
          <Typography fontWeight={950} sx={{ mb: 1 }}>
            {fallback ? "不一致になった比較" : labels.nextComparison ?? "今回行う比較"}
          </Typography>
          <Stack spacing={1.25}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <Typography fontWeight={900} sx={{ width: { sm: 92 }, flexShrink: 0 }}>先頭側</Typography>
              <AlgorithmArray values={[...prefixComparison]} states={comparisonStates} compact showIndices={false} ariaLabel={`先頭側の${prefixComparison}`} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <Typography fontWeight={900} sx={{ width: { sm: 92 }, flexShrink: 0 }}>末尾側</Typography>
              <AlgorithmArray values={[...suffixComparison]} states={comparisonStates} compact showIndices={false} ariaLabel={`末尾側の${suffixComparison}`} />
            </Stack>
          </Stack>
          <Typography color={step.comparisonResult === "MISMATCH" ? "#b91c1c" : "#1d4ed8"} fontWeight={950} sx={{ mt: 1 }}>
            緑はすでに一致が分かっている部分、{step.comparisonResult === "MISMATCH" ? "赤" : "青"}は今回比べる2文字です。
          </Typography>
        </Paper>
      )}
      {hasFallbackExplanation && (
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #c4b5fd", bgcolor: "#faf5ff" }}>
          <Typography fontWeight={950}>不一致後に試す候補の選び方</Typography>
          <Typography color="#334155" fontWeight={800} sx={{ mt: 0.75 }}>
            現在の候補は、先頭から{step.fallbackFromLength}文字の「{fallbackFromText}」です。
          </Typography>
          <Typography color="#334155" fontWeight={800} sx={{ mt: 0.5 }}>
            この候補の最後の位置は index {step.fallbackLookupIndex} なので、
            LPS[{step.fallbackLookupIndex}] = {step.fallbackValue} を読みます。
          </Typography>
          <Typography color="#5b21b6" fontWeight={950} sx={{ mt: 0.5 }}>
            値は文字数です。patternの先頭から{step.fallbackValue}文字を取り、
            新しい候補を「{fallbackToText || "なし"}」にします。
          </Typography>
        </Paper>
      )}
      <AlgorithmArray
        values={patternValues}
        states={rangeStates}
        stateLabels={stateLabels}
        compact
        showIndices={data.showIndices ?? true}
        ariaLabel={`今回調べる範囲は${data.pattern.slice(0, currentRangeEnd + 1)}`}
      />
      <Box>
        <Typography fontWeight={950} sx={{ mb: 0.75 }}>{labels.lpsTable ?? "作成途中のLPS表"}</Typography>
        <AlgorithmArray
          values={step.lps.map((value) => value ?? "—")}
          states={lpsStates}
          stateLabels={lpsStateLabels}
          compact
          showIndices={data.showIndices ?? true}
          ariaLabel="作成途中のLPS表"
        />
      </Box>
    </Stack>
  );
};

const PrefixBuildTransitionState = ({
  data,
  step,
}: {
  data: PrefixTableTraceData;
  step: PrefixTableStep;
}) => {
  const patternValues = [...data.pattern];
  const index = Math.min(step.index ?? 0, patternValues.length - 1);
  const lengthBefore = step.length ?? 0;
  const lengthAfter = step.lengthAfter ?? lengthBefore;
  const nextIndex = step.nextIndex ?? index;
  const matched = step.comparisonResult === "MATCH";
  const candidateBefore = data.pattern.slice(0, lengthBefore);
  const candidateAfter = data.pattern.slice(0, lengthAfter);
  const rangeStates: Partial<Record<number, AlgorithmCellState>> = {};
  const rangeStateLabels: Partial<Record<number, string>> = {};

  patternValues.forEach((_, position) => {
    if (position > index) {
      rangeStates[position] = "excluded";
      return;
    }
    const isCompared = position === lengthBefore || position === index;
    rangeStates[position] = isCompared
      ? matched ? "comparing" : "incorrect"
      : "idle";
  });
  rangeStateLabels[lengthBefore] = "先頭側の次";
  rangeStateLabels[index] = "新しい末尾";

  const recorded = step.action === "EXTEND" || step.action === "RECORD_ZERO";
  const fallbackLookupIndex = lengthBefore > 0 ? lengthBefore - 1 : -1;
  const lpsStates: Partial<Record<number, AlgorithmCellState>> = recorded
    ? { [index]: "correct" }
    : fallbackLookupIndex >= 0 ? { [fallbackLookupIndex]: "selected", [index]: "active" } : { [index]: "active" };
  const lpsStateLabels: Partial<Record<number, string>> = recorded
    ? { [index]: "今回記録" }
    : fallbackLookupIndex >= 0
      ? { [fallbackLookupIndex]: "戻り先", [index]: "まだ未記録" }
      : { [index]: "まだ未記録" };

  const actionSummary = step.action === "EXTEND"
    ? `一致範囲を${lengthBefore}文字から${lengthAfter}文字へ伸ばし、LPS[${index}]へ${lengthAfter}を記録します。`
    : step.action === "FALLBACK"
      ? `LPS[${fallbackLookupIndex}] = ${lengthAfter}を使い、候補を「${candidateBefore || "なし"}」から「${candidateAfter || "なし"}」へ戻します。`
      : `これ以上短い候補がないため、LPS[${index}]へ0を記録します。`;
  const nextSummary = nextIndex === index
    ? `LPS[${index}]はまだ決まっていないので、同じ末尾でもう一度比較します。`
    : nextIndex < patternValues.length
      ? `次はLPS[${nextIndex}]を求めます。`
      : "LPS表が完成しました。";

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid #bfdbfe", borderRadius: 2, bgcolor: "#eff6ff" }}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" color="primary" label={`今回求める値：LPS[${index}]`} sx={{ fontWeight: 950 }} />
          <Typography fontWeight={900}>
            現在の候補：{candidateBefore ? `「${candidateBefore}」（${lengthBefore}文字）` : "なし（0文字）"}
          </Typography>
        </Stack>
      </Paper>

      <AlgorithmArray
        values={patternValues}
        states={rangeStates}
        stateLabels={rangeStateLabels}
        compact
        showIndices={data.showIndices ?? true}
        ariaLabel={`LPSのindex ${index}を求める比較`}
      />

      <Paper elevation={0} sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid #cbd5e1", borderRadius: 2, bgcolor: "#fff" }}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography fontWeight={950}>
            比較：pattern[{lengthBefore}]の「{data.pattern[lengthBefore]}」と pattern[{index}]の「{data.pattern[index]}」
          </Typography>
          <Chip
            size="small"
            color={matched ? "success" : "error"}
            variant={matched ? "filled" : "outlined"}
            icon={matched ? <CheckCircleIcon /> : undefined}
            label={matched ? "一致" : "不一致"}
            sx={{ fontWeight: 950 }}
          />
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, sm: 2 },
          border: `1px solid ${step.action === "FALLBACK" ? "#c4b5fd" : "#86efac"}`,
          borderRadius: 2,
          bgcolor: step.action === "FALLBACK" ? "#faf5ff" : "#f0fdf4",
        }}
      >
        <Typography fontWeight={950}>{actionSummary}</Typography>
        <Typography color="#475569" fontWeight={850} sx={{ mt: 0.5 }}>{nextSummary}</Typography>
      </Paper>

      <Box>
        <Typography fontWeight={950} sx={{ mb: 0.75 }}>{data.labels?.lpsTable ?? "作成途中のLPS表"}</Typography>
        <AlgorithmArray
          values={step.lps.map((value) => value ?? "—")}
          states={lpsStates}
          stateLabels={lpsStateLabels}
          compact
          showIndices={data.showIndices ?? true}
          ariaLabel="作成途中のLPS表"
        />
      </Box>
    </Stack>
  );
};

const createPrefixMeaningFrames = (steps: PrefixTableStep[]): PrefixMeaningFrame[] => steps.flatMap((step) => {
  const candidates = step.candidates ?? [];
  if (candidates.length === 0) return [{ step, phase: "RESULT" as const }];
  return [
    ...candidates.map((_, candidateIndex) => ({ step, phase: "CANDIDATE" as const, candidateIndex })),
    { step, phase: "RESULT" as const },
  ];
});

const createPrefixRangeFrames = (steps: PrefixTableStep[]): PrefixMeaningFrame[] => (
  steps.map((step) => ({ step, phase: "RESULT" as const }))
);

const prefixMeaningFrameMessage = (frame: PrefixMeaningFrame) => {
  if (frame.phase === "RESULT") return frame.step.message;
  const candidate = frame.step.candidates?.[frame.candidateIndex ?? 0];
  if (!candidate) return frame.step.message;
  return `x=${candidate.length}では、先頭の「${candidate.prefix}」と末尾の「${candidate.suffix}」を比較します。${candidate.isMatch ? "一致しました。" : "一致しません。"}`;
};

const PrefixTableTrace = ({ data }: { data: PrefixTableTraceData }) => {
  const meaningFrames = data.mode === "MEANING"
    ? data.stepGranularity === "RANGE" ? createPrefixRangeFrames(data.steps) : createPrefixMeaningFrames(data.steps)
    : [];
  const traceStepCount = data.mode === "MEANING" ? meaningFrames.length : data.steps.length;
  const trace = useTrace(traceStepCount, data.intervalMs, data);
  const frame = data.mode === "MEANING" ? meaningFrames[trace.stepIndex] : undefined;
  const step = frame?.step ?? data.steps[trace.stepIndex];
  if (!step) return null;
  const message = frame ? prefixMeaningFrameMessage(frame) : step.message;

  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      {data.mode === "MEANING"
        ? frame && <PrefixMeaningState data={data} frame={frame} />
        : step.action
          ? <PrefixBuildTransitionState data={data} step={step} />
          : <PrefixBuildState data={data} step={step} />}
      {!step.action && !(data.mode === "MEANING" && data.stepGranularity === "RANGE") && (
        <Paper elevation={0} sx={{ p: 1.5, border: "1px solid #bfdbfe", borderRadius: 2, bgcolor: "#eff6ff" }}>
        <Typography aria-live="polite" fontWeight={900}>{message}</Typography>
        {trace.stepIndex === traceStepCount - 1 && data.finalMessage && (
          <Typography color="#166534" fontWeight={900} sx={{ mt: 0.75 }}>{data.finalMessage}</Typography>
        )}
        </Paper>
      )}
      {data.code && <CodeLines code={data.code} activeLines={step.activeCodeLines ?? []} showLineNumbers wrapLongLines />}
      {traceStepCount > 1 && <StepTraceControls
        stepIndex={trace.stepIndex}
        stepCount={traceStepCount}
        playing={trace.playing}
        onReset={() => { trace.setPlaying(false); trace.setStepIndex(0); }}
        onPrevious={() => { trace.setPlaying(false); trace.setStepIndex((current) => Math.max(0, current - 1)); }}
        onNext={() => { trace.setPlaying(false); trace.setStepIndex((current) => Math.min(traceStepCount - 1, current + 1)); }}
        onPlayingChange={trace.setPlaying}
        nextLabel={data.nextLabel}
        stepDescription={data.stepDescriptions?.[trace.stepIndex]}
      />}
    </Stack>
  );
};

const DecisionSequenceVisualization = ({ content, answer }: { content: Record<string, unknown>; answer?: unknown }) => {
  const states = Array.isArray(content.visualizationStates) ? content.visualizationStates as DecisionState[] : [];
  const answerRecord = answer && typeof answer === "object" && !Array.isArray(answer)
    ? answer as { currentStep?: number; values?: unknown[] }
    : {};
  const answeredCount = Array.isArray(answerRecord.values) ? answerRecord.values.filter(Boolean).length : 0;
  const stepIndex = Math.min(answerRecord.currentStep ?? answeredCount, Math.max(states.length - 1, 0));
  const state = states[stepIndex];
  if (!state) return null;
  return (
    <Stack spacing={1.5} sx={{ minWidth: 0 }}>
      <Chip label={`問題 ${stepIndex + 1} / ${states.length}`} color="primary" sx={{ alignSelf: "flex-start", fontWeight: 900 }} />
      <StringAlignment
        text={state.text}
        pattern={state.pattern}
        step={state}
        lps={state.lps}
        labels={content.labels && typeof content.labels === "object" && !Array.isArray(content.labels)
          ? content.labels as StringSearchLabels
          : undefined}
      />
      <Typography color="#475569" fontWeight={850}>{state.message}</Typography>
    </Stack>
  );
};

export function StringSearchVisualization({
  rendererKey,
  content,
  answer,
}: {
  rendererKey: string;
  content: Record<string, unknown>;
  answer?: unknown;
}) {
  switch (rendererKey) {
    case "PREFIX_SUFFIX_EXPLANATION":
      return <PrefixSuffixExplanation content={content} />;
    case "PREFIX_TABLE_TRACE":
      return <PrefixTableTrace data={content as PrefixTableTraceData} />;
    case "STRING_SEARCH_DECISION_SEQUENCE":
      return <DecisionSequenceVisualization content={content} answer={answer} />;
    case "STRING_ALIGNMENT_TRACE":
    case "STRING_SEARCH_FALLBACK_TRACE":
    case "STRING_SEARCH_FULL_TRACE":
      return <AlignmentTrace data={content as AlignmentTraceData} />;
    default:
      return null;
  }
}
