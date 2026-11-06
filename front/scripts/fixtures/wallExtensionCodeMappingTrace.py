"""Observe every executed line without instrumenting or rewriting generate_maze."""
import json
import sys

data = json.load(sys.stdin)
namespace = {}
exec(compile(data["code"], "<wall-extension-mapping>", "exec"), namespace)
trace = []
previous = None


def capture(frame):
    local = frame.f_locals
    return {
        "size": local["size"], "i": local.get("i"), "y": local.get("y"), "x": local.get("x"),
        "pillars": [list(pair) for pair in local["pillars"]] if "pillars" in local else None,
        "choice": local.get("choice"),
        "allowed": list(local["allowed"]) if "allowed" in local else None,
        "dx": local.get("dx"), "dy": local.get("dy"),
    }


def observe(frame, event, arg):
    global previous
    if frame.f_code.co_filename != "<wall-extension-mapping>" or frame.f_code.co_name != "generate_maze":
        return None
    if event == "line":
        if previous is not None:
            trace.append({"line": previous, "variables": capture(frame)})
        previous = frame.f_lineno
    elif event == "return":
        trace.append({"line": previous, "variables": capture(frame)})
    return observe


sys.settrace(observe)
result = namespace["generate_maze"](data["size"], data["choices"])
sys.settrace(None)

# Python 3.12+ inlines the list comprehension into the caller's frame, so the
# initialize-grid line fires once per comprehension iteration. Those entries
# share the same line and locals, i.e. one teaching execution of that line;
# collapse consecutive duplicates so the trace is stable across versions.
collapsed = []
for entry in trace:
    if collapsed and collapsed[-1]["line"] == entry["line"] and collapsed[-1]["variables"] == entry["variables"]:
        continue
    collapsed.append(entry)
print(json.dumps({"trace": collapsed, "result": result}))
