"""Run the baseline's actual dfs_order; trace observations never change its body."""
import json
import sys

data = json.load(sys.stdin)
namespace = {}
exec(compile(data["code"], "<dfs-baseline>", "exec"), namespace)
events = []
previous_line = None
added = False


def save(kind, local, **details):
    order = list(local["order"])
    current = None if kind in ("push-start", "finish") else local["node"]
    events.append({
        "operation": {"kind": kind, **details}, "current": current,
        "stack": list(local["stack"]), "order": order,
        "completed": order if current is None else order[:-1],
    })


def trace(frame, event, arg):
    global previous_line, added
    if frame.f_code.co_filename != "<dfs-baseline>":
        return None
    local = frame.f_locals
    if event == "line":
        line = frame.f_lineno
        if previous_line == 4:
            save("push-start", local, nodeId=data["start"])
        elif previous_line == 7:
            added = False
            save("pop", local, nodeId=local["node"])
        elif previous_line == 11:
            added = True
            save("push", local, **edge_details(local))
        elif previous_line == 9 and line == 8:
            # The baseline exposes these checks; the remaining checks are folded.
            if (local["node"], local["neighbor"]) in (("B", "A"), ("D", "B")):
                save("skip-visited", local, **edge_details(local))
        if line == 5 and previous_line == 8 and not added and local["node"] in ("F", "E"):
            save("no-add", local, nodeId=local["node"])
        previous_line = line
    elif event == "return":
        save("finish", local)
    return trace


def edge_details(local):
    source, target = local["node"], local["neighbor"]
    edge = next(edge for edge in data["edges"] if {edge["from"], edge["to"]} == {source, target})
    return {"from": source, "nodeId": target, "edgeId": edge["id"]}


sys.settrace(trace)
result = namespace["dfs_order"](data["graph"], data["start"])
sys.settrace(None)
print(json.dumps({"events": events, "result": result}))
