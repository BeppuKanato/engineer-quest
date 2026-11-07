"""Observe every executed line without instrumenting or rewriting binary_search."""
import json
import sys

data = json.load(sys.stdin)
namespace = {}
exec(compile(data["code"], "<binary-search-mapping>", "exec"), namespace)
trace = []
previous = None


def capture(frame):
    local = frame.f_locals
    mid = local.get("mid")
    return {
        "lo": local.get("lo"), "hi": local.get("hi"), "mid": mid,
        "midValue": local["values"][mid] if mid is not None else None,
    }


def observe(frame, event, arg):
    global previous
    if frame.f_code.co_filename != "<binary-search-mapping>" or frame.f_code.co_name != "binary_search":
        return None
    if event == "line":
        if previous is not None:
            trace.append({"line": previous, "variables": capture(frame)})
        previous = frame.f_lineno
    elif event == "return":
        trace.append({"line": previous, "variables": capture(frame)})
    return observe


sys.settrace(observe)
result = namespace["binary_search"](data["values"], data["target"])
sys.settrace(None)

# Consecutive entries with the same line and locals are one teaching execution
# of that line; collapse them so the trace is stable across Python versions.
collapsed = []
for entry in trace:
    if collapsed and collapsed[-1]["line"] == entry["line"] and collapsed[-1]["variables"] == entry["variables"]:
        continue
    collapsed.append(entry)
print(json.dumps({"trace": collapsed, "result": result}))
