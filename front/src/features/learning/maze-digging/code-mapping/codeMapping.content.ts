import type { LearningStep } from "../../player/content.types";
import {
  buildMazeDiggingInitialGrid, mazeDiggingBacktracks, mazeDiggingDirections, mazeDiggingMainChoices,
  mazeDiggingMainSize, runMazeDigging,
} from "../mazeDiggingMaze";
import { mazeDiggingCode, type MazeDiggingCodeLineId } from "./mazeDiggingCode";
import {
  defineMazeDiggingCodeMappingContent, executionStep, type MazeDiggingCodeMappingCanvasState,
  type MazeDiggingCodeMappingContent, type MazeDiggingCodeVariables,
} from "./codeMapping.types";

const directionLabels: Readonly<Record<string, string>> = { up: "上", right: "右", down: "下", left: "左" };
const pair = (x: number, y: number): readonly [number, number] => [x, y];
const coord = (x: number, y: number) => `(${x}, ${y})`;

/**
 * コード側フレームだけを構成する。盤面はフェーズ2のスナップショットを参照し、再実装しない。
 * フレームの並びと変数は、参照コードを実際に実行したときの行順・ローカル変数と一致させる
 * （候補が空のときの戻りや、繰り返しを抜ける判定も含む。検証は CPython のトレースと突き合わせる）。
 * バックトラックはフェーズ2では圧縮して見せたが、ここでは実際の実行どおり
 * 「候補の収集（4方向＋終了確認）→ stack.pop()」を1マスずつたどり、戻り切った時点で
 * フェーズ2のバックトラックステップへ対応づける。
 * `else:` は CPython が行イベントを発しないため、候補が空と判定した直後に
 * 説明用のフレームを1つだけ挟む（変数は if の直後と同じ）。
 */
function frames(): [LearningStep<MazeDiggingCodeMappingCanvasState>, ...LearningStep<MazeDiggingCodeMappingCanvasState>[]] {
  const result: LearningStep<MazeDiggingCodeMappingCanvasState>[] = [];
  const size = mazeDiggingMainSize;
  const choices = mazeDiggingMainChoices;
  let reference = "all-walls";
  let vars: MazeDiggingCodeVariables = {
    size, step: null, x: null, y: null, dx: null, dy: null, nx: null, ny: null, candidates: null, stack: null,
  };
  const snapshotVars = (): MazeDiggingCodeVariables => ({
    ...vars,
    candidates: vars.candidates ? [...vars.candidates] : null,
    stack: vars.stack ? [...vars.stack] : null,
  });
  const add = (id: string, lineId: MazeDiggingCodeLineId, caption: string,
    captionKind: MazeDiggingCodeMappingCanvasState["state"]["captionKind"], frameKind: "code" | "execution" = "code") => {
    result.push({ id, caption, canvas: {
      data: { kind: "maze-digging-code-mapping", code: mazeDiggingCode },
      state: { executionStepId: reference, execution: executionStep(reference).canvas, frameKind, captionKind, variables: snapshotVars() },
      highlights: [{ kind: "code-line", id: lineId }],
    } });
  };
  const checkpoint = (stepId: string, lineId: MazeDiggingCodeLineId,
    captionKind: MazeDiggingCodeMappingCanvasState["state"]["captionKind"]) => {
    reference = stepId;
    add(`execution-${stepId}`, lineId, executionStep(stepId).caption, captionKind, "execution");
  };

  add("define-function", "define-function", "盤面の大きさと方向の番号を受け取り、迷路を作るdig_mazeを用意します。", "assignment");
  checkpoint("all-walls", "initialize-grid", "assignment");
  add("define-directions", "define-directions", "上・右・下・左の順に、進む方向と進む量の対応を用意します。", "assignment");
  checkpoint("dig-start", "dig-start", "assignment");

  vars = { ...vars, stack: [pair(1, 1)] };
  add("initialize-stack", "initialize-stack", "掘った部屋をためるstackに、スタートの部屋 (1, 1) を入れます。", "assignment");
  vars = { ...vars, step: 0 };
  add("initialize-step", "initialize-step", "方向の番号を使う位置stepを0にします。", "assignment");

  // 以降は参照コードの制御フローをそのままシミュレーションし、実行行1つにフレーム1つを対応させる。
  const grid = buildMazeDiggingInitialGrid(size).map(row => [...row]);
  const stackRooms: (readonly [number, number])[] = [pair(1, 1)];
  const backtrackAfterDig = new Map(
    mazeDiggingBacktracks(runMazeDigging(size, choices).digs)
      .map((backtrack, index) => [backtrack.afterDigIndex, { backtrack, ordinal: index + 1 }] as const),
  );
  let stepCount = 0;
  let digCount = 0;
  let popsSinceDig = 0;
  let iteration = 0;
  for (;;) {
    if (stackRooms.length === 0) {
      checkpoint("complete", "while-stack", "evaluation");
      break;
    }
    iteration += 1;
    add(`while-stack-${iteration}`, "while-stack", "stackに部屋が残っているので、掘る処理を続けます。", "evaluation");
    const [x, y] = stackRooms[stackRooms.length - 1];
    vars = { ...vars, x, y };
    add(`current-room-${iteration}`, "current-room", `stackの一番上の部屋 ${coord(x, y)} を現在マスとします。`, "assignment");
    vars = { ...vars, candidates: [] };
    add(`initialize-candidates-${iteration}`, "initialize-candidates", "候補の部屋を集めるcandidatesを、空のリストにします。", "assignment");

    const scanned: (readonly [number, number])[] = [];
    mazeDiggingDirections.forEach((direction, directionIndex) => {
      const label = directionLabels[direction.name];
      vars = { ...vars, dx: direction.x, dy: direction.y };
      add(`for-direction-${iteration}-${directionIndex + 1}`, "for-direction",
        `${label}への進む量 ${coord(direction.x, direction.y)} を取り出して、その方向を見ます。`, "structure");
      const nx = x + 2 * direction.x;
      const ny = y + 2 * direction.y;
      vars = { ...vars, nx, ny };
      add(`compute-next-${iteration}-${directionIndex + 1}`, "compute-next",
        `現在マスから2マス${label}の部屋 ${coord(nx, ny)} を計算します。`, "assignment");
      const inBoard = nx >= 1 && nx < size - 1 && ny >= 1 && ny < size - 1;
      const diggable = inBoard && grid[ny][nx] === 1;
      add(`if-diggable-${iteration}-${directionIndex + 1}`, "if-diggable",
        diggable ? `${coord(nx, ny)} は盤の内側にあり、まだ壁のままなので掘れます。`
          : !inBoard ? `${coord(nx, ny)} は盤の外側になるので、掘れません。`
            : `${coord(nx, ny)} はすでに掘られているので、掘れません。`, "evaluation");
      if (diggable) {
        scanned.push(pair(nx, ny));
        vars = { ...vars, candidates: [...scanned] };
        add(`append-candidate-${iteration}-${directionIndex + 1}`, "append-candidate",
          `部屋 ${coord(nx, ny)} をcandidatesの末尾へ追加します。`, "assignment");
      }
    });
    add(`for-direction-end-${iteration}`, "for-direction", "4つの方向をすべて見たので、候補を集める繰り返しを終えます。", "evaluation");
    add(`if-candidates-${iteration}`, "if-candidates",
      scanned.length > 0 ? `候補が${scanned.length}つあるので、番号で1つ選んで掘ります。` : "候補が1つもないので、この部屋からは掘れません。", "evaluation");

    if (scanned.length > 0) {
      const choice = choices[stepCount];
      const [nx, ny] = scanned[choice];
      vars = { ...vars, nx, ny };
      add(`choose-candidate-${digCount + 1}`, "choose-candidate", `番号${choice}が示す候補の部屋 ${coord(nx, ny)} を掘ることにします。`, "assignment");
      stepCount += 1;
      vars = { ...vars, step: stepCount };
      add(`advance-step-${digCount + 1}`, "advance-step", `stepに1を加えて${stepCount}にし、次の番号を使う準備をします。`, "assignment");
      const betweenX = (x + nx) / 2;
      const betweenY = (y + ny) / 2;
      grid[betweenY][betweenX] = 0;
      add(`dig-between-${digCount + 1}`, "dig-between", `間の壁マス ${coord(betweenX, betweenY)} を掘って通路にします。`, "assignment");
      grid[ny][nx] = 0;
      add(`dig-room-${digCount + 1}`, "dig-room", `部屋 ${coord(nx, ny)} を掘って通路にします。`, "assignment");
      stackRooms.push(pair(nx, ny));
      vars = { ...vars, stack: [...stackRooms] };
      digCount += 1;
      popsSinceDig = 0;
      checkpoint(`dig-${digCount}`, "push-stack", "assignment");
    } else {
      add(`else-branch-${iteration}`, "else-branch", "候補がない場合は、stackから現在マスを取り除いて戻ります。", "evaluation");
      const [poppedX, poppedY] = stackRooms[stackRooms.length - 1];
      stackRooms.pop();
      vars = { ...vars, stack: [...stackRooms] };
      popsSinceDig += 1;
      const group = backtrackAfterDig.get(digCount - 1);
      if (group && popsSinceDig === group.backtrack.poppedRooms.length) {
        checkpoint(`backtrack-${group.ordinal}`, "pop-stack", "assignment");
      } else {
        add(`pop-stack-${iteration}`, "pop-stack", `行き止まりの部屋 ${coord(poppedX, poppedY)} をstackから取り除き、1マス戻ります。`, "assignment");
      }
    }
  }
  add("return-grid", "return-grid", "完成した迷路の盤面を返します。", "structure");

  const [first, ...rest] = result;
  if (!first) throw new Error("Maze-digging code mapping needs a frame");
  return [first, ...rest];
}

export const mazeDiggingCodeMappingContent: MazeDiggingCodeMappingContent =
  defineMazeDiggingCodeMappingContent({
    version: 1, kind: "step-sequence", id: "maze-digging-code-mapping", phase: 4, intervalMs: 3500,
    stageName: "動きとコードの対応", steps: frames(),
  });
