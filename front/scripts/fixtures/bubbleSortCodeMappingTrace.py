"""Observe every executed line without instrumenting or rewriting bubble_sort."""
import json
import sys

data = json.load(sys.stdin)
namespace = {}
exec(compile(data["code"], "<bubble-sort-mapping>", "exec"), namespace)
trace = []
previous = None


def capture(frame):
    local = frame.f_locals
    return {
        "result": list(local["result"]) if "result" in local else None,
        "n": local.get("n"), "i": local.get("i"), "j": local.get("j"),
    }


def observe(frame, event, arg):
    global previous
    if frame.f_code.co_filename != "<bubble-sort-mapping>" or frame.f_code.co_name != "bubble_sort":
        return None
    if event == "line":
        if previous is not None:
            trace.append({"line": previous, "variables": capture(frame)})
        previous = frame.f_lineno
    elif event == "return":
        trace.append({"line": previous, "variables": capture(frame)})
    return observe


sys.settrace(observe)
result = namespace["bubble_sort"](data["values"])
sys.settrace(None)

# Consecutive entries with the same line and locals are one teaching execution
# of that line; collapse them so the trace is stable across Python versions.
collapsed = []
for entry in trace:
    if collapsed and collapsed[-1]["line"] == entry["line"] and collapsed[-1]["variables"] == entry["variables"]:
        continue
    collapsed.append(entry)
print(json.dumps({"trace": collapsed, "result": result}))
