const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs";
let readyPromise;

const getPyodide = () => {
  if (!readyPromise) {
    readyPromise = import(PYODIDE_URL).then(({ loadPyodide }) =>
      loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/" })
    );
  }
  return readyPromise;
};

self.onmessage = async ({ data }) => {
  const { id, code, tests, kind } = data;
  try {
    const pyodide = await getPyodide();
    if (kind === "ping") {
      self.postMessage({ id, ready: true });
      return;
    }
    pyodide.setStdout({ batched: (text) => self.postMessage({ id, stdout: text }) });
    pyodide.setStderr({ batched: (text) => self.postMessage({ id, stderr: text }) });
    const harness = kind === "runCreateQuest" ? `
import ast
import copy
import json

__eq_namespace = {}
exec(${JSON.stringify(code)}, __eq_namespace)
__eq_requirements = json.loads(${JSON.stringify(JSON.stringify(data.requirements ?? []))})
__eq_function_name = ${JSON.stringify(data.functionName ?? "")}
if __eq_function_name not in __eq_namespace or not callable(__eq_namespace[__eq_function_name]):
    raise NameError(f"{__eq_function_name}(...) 関数が見つかりません。")
__eq_function = __eq_namespace[__eq_function_name]

def __eq_plain(value):
    if isinstance(value, list):
        return [__eq_plain(item) for item in value]
    if isinstance(value, dict):
        return {key: __eq_plain(item) for key, item in value.items()}
    if isinstance(value, __eq_TrackedNumber):
        return int(value)
    return value

class __eq_TrackedNumber(int):
    comparisons = 0
    @classmethod
    def reset(cls): cls.comparisons = 0
    @classmethod
    def hit(cls): cls.comparisons += 1
    def __lt__(self, other): self.hit(); return int(self) < int(other)
    def __le__(self, other): self.hit(); return int(self) <= int(other)
    def __gt__(self, other): self.hit(); return int(self) > int(other)
    def __ge__(self, other): self.hit(); return int(self) >= int(other)
    def __eq__(self, other): self.hit(); return int(self) == int(other)
    def __ne__(self, other): self.hit(); return int(self) != int(other)

class _EQTrackedCharacter(str):
    comparisons = 0
    @classmethod
    def reset(cls): cls.comparisons = 0
    @classmethod
    def hit(cls): cls.comparisons += 1
    def __eq__(self, other): self.hit(); return str(self) == str(other)
    def __ne__(self, other): self.hit(); return str(self) != str(other)

class _EQTrackedString:
    def __init__(self, value): self.value = str(value)
    def __len__(self): return len(self.value)
    def __getitem__(self, key):
        value = self.value[key]
        return _EQTrackedString(value) if isinstance(key, slice) else _EQTrackedCharacter(value)
    def __str__(self): return self.value

class __eq_TrackedGraph(dict):
    accesses = 0
    @classmethod
    def reset(cls): cls.accesses = 0
    def __getitem__(self, key):
        type(self).accesses += 1
        return super().__getitem__(key)
    def get(self, key, default=None):
        type(self).accesses += 1
        return super().get(key, default)

def __eq_as_bag(value):
    return sorted(json.dumps(__eq_plain(item), ensure_ascii=False, sort_keys=True) for item in value)

def __eq_track_field(value, field):
    if isinstance(value, list):
        return [__eq_track_field(item, field) for item in value]
    if isinstance(value, dict):
        return {key: (__eq_TrackedNumber(item) if key == field and isinstance(item, int) else __eq_track_field(item, field)) for key, item in value.items()}
    return value

__eq_tree = ast.parse(${JSON.stringify(code)})
__eq_sorted_is_local = any(
    (isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == "sorted") or
    (isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == "sorted" for target in node.targets))
    for node in ast.walk(__eq_tree)
)
__eq_standard_calls = []
for node in ast.walk(__eq_tree):
    if not isinstance(node, ast.Call):
        continue
    if isinstance(node.func, ast.Name) and node.func.id == "sorted" and not __eq_sorted_is_local:
        __eq_standard_calls.append("sorted()")
    if isinstance(node.func, ast.Attribute) and node.func.attr == "sort":
        __eq_standard_calls.append(".sort()")

__eq_requirement_results = []
for __eq_requirement in __eq_requirements:
    __eq_test_results = []
    for __eq_case in __eq_requirement.get("tests", []):
        __eq_type = __eq_case.get("type")
        try:
            if __eq_type == "SOURCE_NO_STANDARD_SORT":
                __eq_passed = len(__eq_standard_calls) == 0
                __eq_expected = "標準ソートの直接呼び出しなし"
                __eq_actual = "呼び出しなし" if __eq_passed else "、".join(sorted(set(__eq_standard_calls)))
                __eq_metric = None
            elif __eq_type == "COMPARISON_LIMIT":
                __eq_size = int(__eq_case["size"])
                __eq_limit = int(__eq_case["maxComparisons"])
                __eq_plain_input = [
                    {"id": f"unit-{index}", "name": f"Unit {index}", "speed": (__eq_size * 13 - index * 37) % 997}
                    for index in range(__eq_size)
                ]
                __eq_expected_value = sorted(__eq_plain_input, key=lambda item: item["speed"], reverse=True)
                __eq_tracked_input = [
                    {**item, "speed": __eq_TrackedNumber(item["speed"])} for item in __eq_plain_input
                ]
                __eq_TrackedNumber.reset()
                __eq_actual_value = __eq_function(__eq_tracked_input)
                __eq_comparisons = __eq_TrackedNumber.comparisons
                __eq_actual_plain = __eq_plain(__eq_actual_value)
                __eq_passed = __eq_actual_plain == __eq_expected_value and __eq_comparisons <= __eq_limit
                __eq_expected = {"correctOrder": True, "maxComparisons": __eq_limit}
                __eq_actual = {"correctOrder": __eq_actual_plain == __eq_expected_value, "comparisons": __eq_comparisons}
                __eq_metric = {"comparisons": __eq_comparisons, "maxComparisons": __eq_limit}
            elif __eq_type == "FIELD_COMPARISON_LIMIT":
                __eq_args = copy.deepcopy(__eq_case.get("args", []))
                __eq_field = __eq_case.get("field", "id")
                __eq_limit = int(__eq_case["maxComparisons"])
                if __eq_case.get("size"):
                    __eq_size = int(__eq_case["size"])
                    __eq_target = int(__eq_case["targetId"])
                    __eq_args = [[
                        {"id": index * 2, "name": f"商品{index}", "stock": index % 10}
                        for index in range(__eq_size)
                    ], __eq_target]
                __eq_args[0] = __eq_track_field(__eq_args[0], __eq_field)
                for __eq_index in __eq_case.get("trackedArgIndexes", []):
                    __eq_args[__eq_index] = __eq_TrackedNumber(__eq_args[__eq_index])
                __eq_TrackedNumber.reset()
                __eq_value = __eq_function(*__eq_args)
                __eq_comparisons = __eq_TrackedNumber.comparisons
                __eq_expected = __eq_case.get("expected")
                __eq_actual = __eq_plain(__eq_value)
                __eq_passed = __eq_actual == __eq_expected and __eq_comparisons <= __eq_limit
                __eq_metric = {"comparisons": __eq_comparisons, "maxComparisons": __eq_limit}
            elif __eq_type == "STRING_COMPARISON_LIMIT":
                __eq_args = copy.deepcopy(__eq_case.get("args", []))
                __eq_limit = int(__eq_case["maxComparisons"])
                _EQTrackedCharacter.reset()
                __eq_value = __eq_function(_EQTrackedString(__eq_args[0]), _EQTrackedString(__eq_args[1]))
                __eq_comparisons = _EQTrackedCharacter.comparisons
                __eq_expected = __eq_case.get("expected")
                __eq_actual = __eq_plain(__eq_value)
                __eq_passed = __eq_actual == __eq_expected and __eq_comparisons <= __eq_limit
                __eq_metric = {"comparisons": __eq_comparisons, "maxComparisons": __eq_limit}
            elif __eq_type == "GRAPH_ACCESS_LIMIT":
                __eq_args = copy.deepcopy(__eq_case.get("args", []))
                __eq_limit = int(__eq_case["maxAccesses"])
                __eq_args[0] = __eq_TrackedGraph(__eq_args[0])
                __eq_TrackedGraph.reset()
                __eq_value = __eq_function(*__eq_args)
                __eq_accesses = __eq_TrackedGraph.accesses
                __eq_expected = __eq_case.get("expected")
                __eq_actual = __eq_plain(__eq_value)
                __eq_passed = __eq_actual == __eq_expected and __eq_accesses <= __eq_limit
                __eq_metric = {"accesses": __eq_accesses, "maxAccesses": __eq_limit}
            else:
                __eq_args = copy.deepcopy(__eq_case.get("args", []))
                __eq_before = copy.deepcopy(__eq_args)
                __eq_value = __eq_function(*__eq_args)
                if __eq_type == "INPUT_UNCHANGED":
                    __eq_passed = __eq_args == __eq_before
                    __eq_expected = "入力データが変わらない"
                    __eq_actual = "変更なし" if __eq_passed else "入力データが変更されました"
                elif __eq_type == "OUTPUT_SET_EQUALS":
                    __eq_expected = __eq_case.get("expected")
                    __eq_actual = __eq_plain(__eq_value)
                    __eq_passed = isinstance(__eq_actual, list) and __eq_as_bag(__eq_actual) == __eq_as_bag(__eq_expected)
                else:
                    __eq_expected = __eq_case.get("expected")
                    __eq_actual = __eq_plain(__eq_value)
                    __eq_passed = __eq_actual == __eq_expected
                __eq_metric = None
            __eq_test_results.append({
                "id": __eq_case["id"], "label": __eq_case["label"], "passed": __eq_passed,
                "expected": __eq_expected, "actual": __eq_actual, "metric": __eq_metric,
            })
        except Exception as error:
            __eq_test_results.append({
                "id": __eq_case.get("id", "unknown"), "label": __eq_case.get("label", "テスト"),
                "passed": False, "expected": __eq_case.get("expected"), "actual": None,
                "error": f"{type(error).__name__}: {error}",
            })
    __eq_requirement_results.append({
        "requirementId": __eq_requirement["id"],
        "passed": len(__eq_test_results) > 0 and all(item["passed"] for item in __eq_test_results),
        "testResults": __eq_test_results,
    })
json.dumps(__eq_requirement_results, ensure_ascii=False)
` : `
import json
__eq_namespace = {}
exec(${JSON.stringify(code)}, __eq_namespace)
__eq_tests = json.loads(${JSON.stringify(JSON.stringify(tests))})
__eq_results = []
for __eq_case in __eq_tests:
    __eq_function_name = __eq_case["functionName"]
    if __eq_function_name not in __eq_namespace or not callable(__eq_namespace[__eq_function_name]):
        raise NameError(f"{__eq_function_name}(...) 関数が見つかりません。")
    __eq_actual = __eq_namespace[__eq_function_name](*__eq_case["args"])
    __eq_results.append({
        "id": __eq_case["id"],
        "label": __eq_case["label"],
        "functionName": __eq_function_name,
        "args": __eq_case["args"],
        "displayInput": __eq_case.get("displayInput"),
        "expected": __eq_case["expected"],
        "actual": __eq_actual,
        "passed": __eq_actual == __eq_case["expected"],
    })
json.dumps(__eq_results)
`;
    const result = await pyodide.runPythonAsync(harness);
    self.postMessage({ id, done: true, results: JSON.parse(result) });
  } catch (error) {
    self.postMessage({ id, done: true, error: error instanceof Error ? error.message : String(error) });
  }
};
