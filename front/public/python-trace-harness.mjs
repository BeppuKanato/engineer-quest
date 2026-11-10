/** 同じPythonソースをWorkerとCPython検証から使う。結果・例外本文・任意のlocalsは返さない。 */
export function buildPythonTraceHarness({ code, functionName, args, maxEvents = 500, traceKind }) {
  const limit = Math.max(1, Math.min(2000, Math.floor(maxEvents) || 500));
  return `
import ast as _eq_ast
import collections as _eq_collections
import json as _eq_json
import math as _eq_math
import sys as _eq_sys

_eq_source = ${JSON.stringify(code)}
_eq_name = ${JSON.stringify(functionName)}
_eq_args = _eq_json.loads(${JSON.stringify(JSON.stringify(args))})
_eq_filename = "<learner>"
_eq_limit = ${limit}
_eq_dfs = ${traceKind === "dfs" ? "True" : "False"}
_eq_events = []
_eq_count = 0
_eq_root = None
_eq_last_line = None
_eq_result = None
_eq_visit_order = None
_eq_error = None
_eq_status = "returned"
_eq_truncated = False
_eq_limit_line = None
_eq_boundaries = {}
_eq_while_names = {}
_eq_ambiguous_kinds = set()
_eq_dfs_names = {kind: set() for kind in ("stack", "order", "node", "neighbor")}

class _EqTraceLimit(BaseException):
    pass

def _eq_distances(value):
    if type(value) is not dict or len(value) > 64:
        return None
    if not all(type(key) is str and len(key) <= 100 and ((type(item) is int and item.bit_length() < 256) or (type(item) is float and _eq_math.isfinite(item))) for key, item in value.items()):
        return None
    return dict(value)

def _eq_queue(value):
    return list(value) if type(value) in (list, tuple, _eq_collections.deque) and len(value) <= 64 and all(type(item) is str and len(item) <= 100 for item in value) else None

def _eq_grid(value):
    if type(value) not in (list, tuple) or len(value) < 3 or len(value) > 25 or len(value) % 2 == 0:
        return None
    size = len(value)
    grid = []
    for row in value:
        if type(row) not in (list, tuple) or len(row) != size:
            return None
        if not all(type(item) is int and -256 < item < 256 for item in row):
            return None
        grid.append(list(row))
    return grid

def _eq_array(value):
    return list(value) if type(value) in (list, tuple) and len(value) <= 64 and all((type(item) is int and item.bit_length() < 256) or (type(item) is float and _eq_math.isfinite(item)) for item in value) else None

def _eq_node(value):
    return value if type(value) is str and len(value) <= 100 else None

def _eq_order(value):
    return list(value) if type(value) is list and len(value) <= 64 and all(_eq_node(item) is not None for item in value) else None

def _eq_visited(value):
    return sorted(value) if type(value) is set and len(value) <= 64 and all(_eq_node(item) is not None for item in value) else None


def _eq_detect(values, preferred, convert, kind):
    if preferred in values:
        return preferred, convert(values[preferred])
    candidates = [(key, converted) for key, value in values.items() if (converted := convert(value)) is not None]
    if len(candidates) > 1:
        _eq_ambiguous_kinds.add(kind)
    return candidates[0] if len(candidates) == 1 else (None, None)

def _eq_dfs_locals(values):
    result = {}
    stack_name = None
    for kind, convert in (("stack", _eq_order), ("order", _eq_order), ("node", _eq_node), ("neighbor", _eq_node)):
        # 同じ型の stack と order は、名前か AST 上の役割で区別する。
        candidates = {key: values[key] for key in _eq_dfs_names[kind] if key in values}
        if kind in values:
            candidates = {kind: values[kind]}
        name, value = _eq_detect(candidates, kind, convert, kind)
        if name is not None:
            result[kind] = value
        if kind == "stack":
            stack_name = name
    name, value = _eq_detect(values, "visited", _eq_visited, "visited")
    if name is not None:
        result["visited"] = value
    return result, stack_name

def _eq_locals(frame):
    values = frame.f_locals
    if _eq_dfs:
        return _eq_dfs_locals(values)
    result = {}
    queue_name, queue_value = _eq_detect(values, "queue", _eq_queue, "queue")
    distance_name, distance_value = _eq_detect(values, "distances", _eq_distances, "distances")
    array_name, array_value = _eq_detect(values, "result", _eq_array, "array")
    if queue_name is not None:
        result["queue"] = queue_value
    if distance_name is not None:
        result["distances"] = distance_value
    grid_name, grid_value = _eq_detect(values, "grid", _eq_grid, "grid")
    if grid_name is not None:
        result["grid"] = grid_value
    if type(values.get("size")) is int:
        result["size"] = values["size"]
    choices = values.get("choices")
    if type(choices) in (list, tuple) and len(choices) <= 64 and all(type(item) is int for item in choices):
        result["choices"] = list(choices)
    if array_name is not None:
        result["array"] = array_value
    # lo / hi / mid / target は二分探索単元（Issue #293）向けの加算。対象名の変数が無い単元では何も記録されず、既存単元の結果は変わらない。
    for key in ("i", "j", "n", "lo", "hi", "mid", "target"):
        if key in values:
            value = values[key]
            result[key] = value if type(value) is int and value.bit_length() < 256 else None
    for key in ("node", "neighbor"):
        if key in values:
            value = values[key]
            result[key] = value if type(value) is str and len(value) <= 100 else None
    return result, queue_name

def _eq_trace(frame, event, arg):
    global _eq_count, _eq_root, _eq_last_line, _eq_truncated, _eq_limit_line
    if frame.f_code.co_filename != _eq_filename:
        return _eq_trace
    if event in ("line", "return", "exception"):
        _eq_last_line = frame.f_lineno
        if _eq_count >= _eq_limit:
            _eq_truncated = True
            _eq_limit_line = frame.f_lineno
            raise _EqTraceLimit()
        _eq_count += 1
    if event == "call" and _eq_root is None and frame.f_code.co_name == _eq_name:
        _eq_root = frame
    if frame is _eq_root and event in ("line", "return", "exception"):
        if len(_eq_events) < _eq_limit:
            _eq_values, _eq_queue_name = _eq_locals(frame)
            _eq_boundary = "while" if _eq_queue_name in _eq_while_names.get(frame.f_lineno, ()) else _eq_boundaries.get(frame.f_lineno, "line")
            _eq_events.append({"line": frame.f_lineno, "event": event, "boundary": _eq_boundary, "locals": _eq_values})
    return _eq_trace

_eq_previous_trace = _eq_sys.gettrace()
try:
    _eq_tree = _eq_ast.parse(_eq_source, filename=_eq_filename)
    for _eq_item in _eq_ast.walk(_eq_tree):
        if isinstance(_eq_item, _eq_ast.For):
            _eq_boundaries[_eq_item.lineno] = "for"
        elif isinstance(_eq_item, _eq_ast.While):
            _eq_while_names[_eq_item.lineno] = {node.id for node in _eq_ast.walk(_eq_item.test) if isinstance(node, _eq_ast.Name)}
        elif _eq_dfs and isinstance(_eq_item, _eq_ast.If):
            _eq_boundaries[_eq_item.lineno] = "if"
    if _eq_dfs:
        _eq_root_def = next((node for node in _eq_tree.body if isinstance(node, _eq_ast.FunctionDef) and node.name == _eq_name), None)
        if _eq_root_def is not None:
            _eq_loop_vars = set().union(*(_eq_while_names.values()))
            for node in _eq_ast.walk(_eq_root_def):
                if isinstance(node, _eq_ast.Return) and isinstance(node.value, _eq_ast.Name):
                    _eq_dfs_names["order"].add(node.value.id)
                if isinstance(node, _eq_ast.For) and isinstance(node.target, _eq_ast.Name):
                    _eq_dfs_names["neighbor"].add(node.target.id)
                if isinstance(node, _eq_ast.Assign) and isinstance(node.value, _eq_ast.Call):
                    call = node.value.func
                    if isinstance(call, _eq_ast.Attribute) and call.attr == "pop" and isinstance(call.value, _eq_ast.Name) and call.value.id in _eq_loop_vars:
                        _eq_dfs_names["stack"].add(call.value.id)
                        _eq_dfs_names["node"].update(target.id for target in node.targets if isinstance(target, _eq_ast.Name))
    _eq_namespace = {}
    _eq_exec_error = None
    try:
        exec(compile(_eq_tree, _eq_filename, "exec"), _eq_namespace)
    except BaseException as _eq_top_error:
        _eq_exec_error = _eq_top_error
    _eq_function = _eq_namespace.get(_eq_name)
    if not callable(_eq_function):
        if _eq_exec_error is not None:
            raise _eq_exec_error
        raise NameError()
    # Top-level trial calls are not recorded and cannot consume the D1 event budget.
    _eq_root = None
    _eq_events = []
    _eq_count = 0
    _eq_last_line = None
    _eq_ambiguous_kinds = set()
    _eq_sys.settrace(_eq_trace)
    _eq_returned = _eq_function(*_eq_args)
    if _eq_dfs:
        _eq_visit_order = _eq_order(_eq_returned)
    _eq_result = _eq_distances(_eq_returned)
    if _eq_result is None:
        _eq_result = _eq_grid(_eq_returned)
    if _eq_result is None:
        _eq_result = _eq_array(_eq_returned)
except _EqTraceLimit:
    _eq_status = "truncated"
except BaseException as _eq_exception:
    _eq_status = "error"
    _eq_line = getattr(_eq_exception, "lineno", None) if isinstance(_eq_exception, SyntaxError) else None
    _eq_tb = _eq_exception.__traceback__
    while _eq_tb is not None:
        if _eq_tb.tb_frame.f_code.co_filename == _eq_filename:
            _eq_line = _eq_tb.tb_lineno
        _eq_tb = _eq_tb.tb_next
    _eq_error = {"line": _eq_line, "kind": type(_eq_exception).__name__[:80]}
    _eq_last_line = _eq_line
finally:
    _eq_sys.settrace(_eq_previous_trace)
if _eq_truncated:
    _eq_status = "truncated"
    _eq_error = None
    _eq_result = None
    _eq_last_line = _eq_limit_line
_eq_root = None
_eq_namespace = {}
_eq_payload = {"events": _eq_events, "status": _eq_status, "result": _eq_result, "error": _eq_error, "stoppedLine": _eq_last_line, "eventCount": _eq_count, "limit": _eq_limit, "ambiguous": len(_eq_ambiguous_kinds) > 0, "ambiguousKinds": sorted(_eq_ambiguous_kinds)}
if _eq_dfs:
    _eq_payload["visitOrder"] = _eq_visit_order
_eq_json.dumps(_eq_payload, allow_nan=False)
`;
}
