import assert from "node:assert/strict";
import {
  HEXAD_TYPES, HEXAD_DEFINITIONS, HEXAD_FRAMING_BLOCKS, resolveHexadCondition,
  selectTop1, selectRoulette, type HexadScores,
} from "../service/feedbackHexadConditions";

const normal: HexadScores = {
  Achiever: 24, Philanthropist: 12, Socialiser: 12,
  FreeSpirit: 12, Player: 12, Disruptor: 12,
};
const ties: HexadScores = { ...normal, Socialiser: 24 };
assert.equal(selectTop1(normal).type, "Achiever");
assert.deepEqual(selectTop1(ties, () => 0).ties, ["Achiever", "Socialiser"]);
assert.equal(selectTop1(ties, () => 0.99).type, "Socialiser");

const standard = resolveHexadCondition("STANDARD", null);
assert.equal(standard.promptContext, null);
const top = resolveHexadCondition("TOP_1", ties, "Socialiser");
assert.deepEqual(top.audit.top1Ties, ["Achiever", "Socialiser"]);
assert.deepEqual(top.promptContext, { kind: "single", type: "Socialiser", definition: HEXAD_FRAMING_BLOCKS.Socialiser });
assert(!JSON.stringify(top.promptContext).includes("24"), "single-type prompt cannot leak raw scores");
assert.throws(() => resolveHexadCondition("TOP_1", normal, "Player"), /TOP1_FIXED_TYPE_MISMATCH/);

const roulette = resolveHexadCondition("ROULETTE", ties, null, () => 0.9);
assert.deepEqual(roulette.promptContext, { kind: "single", type: "Socialiser", definition: HEXAD_FRAMING_BLOCKS.Socialiser });
assert.equal(roulette.audit.rouletteWeights?.Achiever, 8);
assert.equal(roulette.audit.rouletteWeights?.Socialiser, 8);
assert.equal(roulette.audit.rouletteWeights?.Player, 0);
assert.equal(roulette.audit.rouletteProbabilities?.Achiever, 0.5);
assert.equal(selectRoulette(normal, () => 0.5).type, "Achiever");
assert.throws(() => selectRoulette(Object.fromEntries(HEXAD_TYPES.map(t => [t, 16])) as HexadScores), /ROULETTE_NO_ELIGIBLE_TYPE/);

const multi = resolveHexadCondition("MULTI", ties);
assert.equal(multi.promptContext?.kind, "multi");
if (multi.promptContext?.kind === "multi") {
  assert.deepEqual(multi.promptContext.scores, ties);
  assert.deepEqual(multi.promptContext.definitions, HEXAD_DEFINITIONS);
}
assert.throws(() => resolveHexadCondition("MULTI", { ...ties, Achiever: 29 }), /INVALID_HEXAD_SCORES/);
console.log("PASS: four HEXAD context contracts, TOP-1 ties, roulette weights/zero case, MULTI scores");
