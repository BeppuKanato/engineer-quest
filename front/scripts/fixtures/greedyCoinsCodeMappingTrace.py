"""Observe every executed line without instrumenting or rewriting greedy_coins."""
import json
import sys

data = json.load(sys.stdin)
namespace = {}
exec(compile(data["code"], "<greedy-coins-mapping>", "exec"), namespace)
trace = []
previous = None


def capture(frame):
    local = frame.f_locals
    result = local.get("result")
    return {
        "remaining": local.get("remaining"), "coin": local.get("coin"),
        "result": list(result) if result is not None else None,
    }


def observe(frame, event, arg):
    global previous
    if frame.f_code.co_filename != "<greedy-coins-mapping>" or frame.f_code.co_name != "greedy_coins":
        return None
    if event == "line":
        if previous is not None:
            trace.append({"line": previous, "variables": capture(frame)})
        previous = frame.f_lineno
    elif event == "return":
        trace.append({"line": previous, "variables": capture(frame)})
    return observe


sys.settrace(observe)
result = namespace["greedy_coins"](data["amount"], data["coins"])
sys.settrace(None)

# Consecutive entries with the same line and locals are one teaching execution
# of that line; collapse them so the trace is stable across Python versions.
collapsed = []
for entry in trace:
    if collapsed and collapsed[-1]["line"] == entry["line"] and collapsed[-1]["variables"] == entry["variables"]:
        continue
    collapsed.append(entry)
print(json.dumps({"trace": collapsed, "result": result}))
