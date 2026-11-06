import type { LearningStep } from "../../player/content.types";
import {
  wallExtensionAllowedDirections, wallExtensionDirections, wallExtensionExtensions,
  wallExtensionMainChoices, wallExtensionMainSize, wallExtensionPillars, type WallExtensionDirection,
} from "../wallExtensionMaze";
import { wallExtensionCode, type WallExtensionCodeLineId } from "./wallExtensionCode";
import {
  defineWallExtensionCodeMappingContent, executionStep, type WallExtensionCodeMappingCanvasState,
  type WallExtensionCodeMappingContent, type WallExtensionCodeVariables,
} from "./codeMapping.types";

const directionLabels: Readonly<Record<WallExtensionDirection, string>> = {
  up: "上", down: "下", left: "左", right: "右",
};

/**
 * コード側フレームだけを構成する。盤面はフェーズ2のスナップショットを参照し、再実装しない。
 * フレームの並びと変数は、参照コードを実際に実行したときの行順・ローカル変数と一致させる
 * （ループ脱出と、条件が成り立たなかった場合も含む。検証は CPython のトレースと突き合わせる）。
 * `else:` は CPython が行イベントを発しないため、if が成り立たなかった直後に
 * 説明用のフレームを1つだけ挟む（変数は if の直後と同じ）。
 */
function frames(): [LearningStep<WallExtensionCodeMappingCanvasState>, ...LearningStep<WallExtensionCodeMappingCanvasState>[]] {
  const result: LearningStep<WallExtensionCodeMappingCanvasState>[] = [];
  const size = wallExtensionMainSize;
  let reference = "empty-board";
  let vars: WallExtensionCodeVariables = {
    size, i: null, y: null, x: null, pillars: null, choice: null, allowed: null, dx: null, dy: null,
  };
  const snapshotVars = (): WallExtensionCodeVariables => ({
    ...vars,
    pillars: vars.pillars ? [...vars.pillars] : null,
    allowed: vars.allowed ? [...vars.allowed] : null,
  });
  const add = (id: string, lineId: WallExtensionCodeLineId, caption: string,
    captionKind: WallExtensionCodeMappingCanvasState["state"]["captionKind"], frameKind: "code" | "execution" = "code") => {
    result.push({ id, caption, canvas: {
      data: { kind: "wall-extension-code-mapping", code: wallExtensionCode },
      state: { executionStepId: reference, execution: executionStep(reference).canvas, frameKind, captionKind, variables: snapshotVars() },
      highlights: [{ kind: "code-line", id: lineId }],
    } });
  };
  const checkpoint = (stepId: string, lineId: WallExtensionCodeLineId,
    captionKind: WallExtensionCodeMappingCanvasState["state"]["captionKind"]) => {
    reference = stepId;
    add(`execution-${stepId}`, lineId, executionStep(stepId).caption, captionKind, "execution");
  };

  add("define-function", "define-function", "盤面の大きさと方向の番号を受け取り、迷路を作るgenerate_mazeを用意します。", "assignment");
  checkpoint("empty-board", "initialize-grid", "assignment");

  // 外周: for の行と4つの書き込み行が、i = 0..8 でそのまま繰り返される。
  for (let i = 0; i < size; i++) {
    vars = { ...vars, i };
    add(`for-border-${i}`, "for-border",
      i === 0 ? "iに0を入れて、外側を囲む繰り返しを始めます。" : `iに${i}を入れて、外側を囲む繰り返しを続けます。`, "structure");
    add(`border-top-${i}`, "border-top", `上の辺の左から${i + 1}マス目を壁にします。`, "assignment");
    add(`border-bottom-${i}`, "border-bottom", `下の辺の左から${i + 1}マス目を壁にします。`, "assignment");
    add(`border-left-${i}`, "border-left", `左の辺の上から${i + 1}マス目を壁にします。`, "assignment");
    if (i === size - 1) checkpoint("border-walls", "border-right", "assignment");
    else add(`border-right-${i}`, "border-right", `右の辺の上から${i + 1}マス目を壁にします。`, "assignment");
  }
  add("for-border-exit", "for-border", "外側のすべての辺を囲んだので、この繰り返しを終えます。", "evaluation");

  vars = { ...vars, pillars: [] };
  add("initialize-pillars", "initialize-pillars", "柱の座標を記録するpillarsを、空のリストにします。", "assignment");

  // 柱: 2マスおきの二重ループ。行・列の候補を終えた脱出も、実行どおりフレームにする。
  const pillarKeys = wallExtensionPillars(size);
  for (const pillarKey of pillarKeys) {
    const [x, y] = pillarKey.split(",").map(Number);
    if (vars.y !== y) {
      if (vars.y !== null) add(`for-pillar-column-exit-${vars.y}`, "for-pillar-column", "xの候補をすべて見たので、内側の繰り返しを終えます。", "evaluation");
      vars = { ...vars, y };
      add(`for-pillar-row-${y}`, "for-pillar-row", `yに${y}を入れて、柱を立てる段を選びます。`, "structure");
    }
    vars = { ...vars, x };
    add(`for-pillar-column-${y}-${x}`, "for-pillar-column", `xに${x}を入れて、柱を立てる列を選びます。`, "structure");
    add(`place-pillar-${x}-${y}`, "place-pillar", `（${x}, ${y}）のマスを、柱として壁にします。`, "assignment");
    vars = { ...vars, pillars: [...(vars.pillars ?? []), [x, y] as const] };
    if (pillarKey === pillarKeys.at(-1)) checkpoint("pillars", "append-pillar", "assignment");
    else add(`append-pillar-${x}-${y}`, "append-pillar", `柱（${x}, ${y}）を、pillarsの末尾へ記録します。`, "assignment");
  }
  add(`for-pillar-column-exit-${vars.y}`, "for-pillar-column", "xの候補をすべて見たので、内側の繰り返しを終えます。", "evaluation");
  add("for-pillar-row-exit", "for-pillar-row", "yの候補をすべて見たので、柱を立てる繰り返しを終えます。", "evaluation");

  add("define-directions", "define-directions", "方向の名前と進む量の対応を、directionsに用意します。", "assignment");

  // 伸長: 書き込み行がフェーズ2の伸長ステップと1対1に対応する（チェックポイント）。
  const extensions = wallExtensionExtensions(size, wallExtensionMainChoices);
  extensions.forEach((extension, index) => {
    const [x, y] = extension.pillar.split(",").map(Number);
    const choice = wallExtensionMainChoices[index];
    vars = { ...vars, x, y, choice };
    add(`for-extension-${x}-${y}`, "for-extension", `柱（${x}, ${y}）と番号${choice}を取り出して、壁を伸ばす処理を始めます。`, "structure");
    add(`if-first-row-${x}-${y}`, "if-first-row",
      y === 2 ? "yが2なので、この柱は一番上の段にあります。" : "yが2ではないので、この柱は一番上の段にはありません。", "evaluation");
    if (y === 2) {
      vars = { ...vars, allowed: [...wallExtensionAllowedDirections(extension.pillar)] };
      add(`allowed-four-${x}-${y}`, "allowed-four", "一番上の段の柱は、上下左右の4方向へ伸ばせます。", "assignment");
    } else {
      add(`else-branch-${x}-${y}`, "else-branch", "一番上の段でない柱は、上へ伸ばすと輪ができることがあるため、上を除きます。", "evaluation");
      vars = { ...vars, allowed: [...wallExtensionAllowedDirections(extension.pillar)] };
      add(`allowed-three-${x}-${y}`, "allowed-three", "この柱は、下・左・右の3方向へ伸ばせます。", "assignment");
    }
    const delta = wallExtensionDirections[extension.direction];
    vars = { ...vars, dx: delta.x, dy: delta.y };
    add(`lookup-delta-${x}-${y}`, "lookup-delta",
      `番号${choice}が示す方向は${directionLabels[extension.direction]}で、移動量は（${delta.x}, ${delta.y}）です。`, "assignment");
    checkpoint(`extend-${x}-${y}`, "write-wall", "assignment");
  });
  checkpoint("complete", "for-extension", "evaluation");
  add("return-grid", "return-grid", "完成した迷路の盤面を返します。", "structure");

  const [first, ...rest] = result;
  if (!first) throw new Error("Wall-extension code mapping needs a frame");
  return [first, ...rest];
}

export const wallExtensionCodeMappingContent: WallExtensionCodeMappingContent =
  defineWallExtensionCodeMappingContent({
    version: 1, kind: "step-sequence", id: "wall-extension-code-mapping", phase: 4, intervalMs: 3500,
    stageName: "動きとコードの対応", steps: frames(),
  });
