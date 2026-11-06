"""Observe every executed line without instrumenting or rewriting dfs_order."""
import json
import sys

data = json.load(sys.stdin)
namespace = {}
exec(compile(data["code"], "<dfs-mapping>", "exec"), namespace)
trace = []
previous = None


def capture(frame):
    local = frame.f_locals
    return {
        "start": local["start"], "node": local.get("node"), "neighbor": local.get("neighbor"),
        "stack": list(local["stack"]) if "stack" in local else None,
        "order": list(local["order"]) if "order" in local else None,
        "visited": [node for node in data["graph"] if node in local["visited"]] if "visited" in local else None,
    }


def observe(frame, event, arg):
    global previous
    if frame.f_code.co_filename != "<dfs-mapping>" or frame.f_code.co_name != "dfs_order":
        return None
    if event == "line":
        if previous is not None:
            trace.append({"line": previous, "variables": capture(frame)})
        previous = frame.f_lineno
    elif event == "return":
        trace.append({"line": previous, "variables": capture(frame)})
    return observe


sys.settrace(observe)
result = namespace["dfs_order"](data["graph"], "A")
sys.settrace(None)
print(json.dumps({"trace": trace, "result": result}))
