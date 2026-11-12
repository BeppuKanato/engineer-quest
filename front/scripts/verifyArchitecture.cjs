const assert = require("node:assert/strict");
const path = require("node:path");
const { Linter } = require("eslint");
const parser = require("@typescript-eslint/parser");
const architecture = require("./eslintArchitecture.cjs");
const linter = new Linter();
function messages(file,code) {
  return linter.verify(code, [{ files: ["**/*.ts", "**/*.tsx"], languageOptions: { parser }, plugins: { architecture }, rules: { "architecture/import-boundaries": "error" } }], { filename: path.resolve(__dirname,"../src",file) });
}
const rejected = [
  ["components/ui/Test.tsx", 'import X from "@/features/learning/X";', "shared"],
  ["api/test.ts", 'export type { X } from "../features/learning/types/x";', "shared"],
  ["features/learning/Test.tsx", 'import X from "../../app/component/X";', "app"],
  ["features/home/Test.tsx", 'import X from "@/features/learning/X";', "feature"],
  ["features/home/Test.tsx", 'const x = import("@/app/component/X");', "app"],
  ["types/test.ts", 'type X = import("@/features/learning/X").X;', "shared"],
  ["lib/test.ts", 'const x = require("@/app/component/X");', "shared"],
  ["features/learning/implementation/Test.tsx", 'import X from "../units/units/bfs/X";', "unit"],
];
for(const [file,code,id] of rejected) {
  const result=messages(file,code);assert.equal(result.length,1,file+code);assert.equal(result[0].messageId,id);
}
for(const [file,code] of [
  ["features/learning/units/units/bfs/X.ts", 'import X from "../../components/X";'],
  ["features/learning/unit/X.ts", 'import X from "../app/feedback/X";'],
  ["app/test.tsx", 'import X from "@/features/learning/X";'],
  ["lib/test.ts", 'import X from "@/types/test";'],
  ["features/home/test.tsx", 'import X from "react";'],
]) assert.deepEqual(messages(file,code),[],file+code);
console.log("Architecture rule: alias/relative imports, exports, dynamic imports, type imports, require and allowed composition directions passed.");