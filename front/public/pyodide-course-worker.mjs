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
    const harness = `
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
