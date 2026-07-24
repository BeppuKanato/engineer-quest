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
${code}

import json
__eq_tests = ${JSON.stringify(tests)}
__eq_results = []
for __eq_case in __eq_tests:
    __eq_actual = bubble_sort(list(__eq_case["input"]))
    __eq_results.append({
        "input": __eq_case["input"],
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
