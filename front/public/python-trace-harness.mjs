/** 同じPythonソースをWorkerとCPython検証から使う。結果・例外本文・任意のlocalsは返さない。 */
export function buildPythonTraceHarness({ code, functionName, args, maxEvents = 500 }) {
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
_eq_events = []
_eq_count = 0
_eq_root = None
_eq_last_line = None
_eq_result = None
_eq_error = None
_eq_status = "returned"
_eq_truncated = False
_eq_limit_line = None
_eq_boundaries = {}

class _EqTraceLimit(BaseException):
    pass

def _eq_distances(value):
    if type(value) is not dict or len(value) > 64:
        return None
    if not all(type(key) is str and len(key) <= 100 and ((type(item) is int and item.bit_length() < 256) or (type(item) is float and _eq_math.isfinite(item))) for key, item in value.items()):
        return None
    return dict(value)

def _eq_locals(frame):
    values = frame.f_locals
    result = {}
    if "queue" in values:
        value = values["queue"]
        result["queue"] = list(value) if type(value) in (list, tuple, _eq_collections.deque) and len(value) <= 64 and all(type(item) is str and len(item) <= 100 for item in value) else None
    if "distances" in values:
        result["distances"] = _eq_distances(values["distances"])
    for key in ("node", "neighbor"):
        if key in values:
            value = values[key]
            result[key] = value if type(value) is str and len(value) <= 100 else None
    return result

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
            _eq_events.append({"line": frame.f_lineno, "event": event, "boundary": _eq_boundaries.get(frame.f_lineno, "line"), "locals": _eq_locals(frame)})
    return _eq_trace

_eq_previous_trace = _eq_sys.gettrace()
try:
    _eq_tree = _eq_ast.parse(_eq_source, filename=_eq_filename)
    for _eq_item in _eq_ast.walk(_eq_tree):
        if isinstance(_eq_item, _eq_ast.For) or (isinstance(_eq_item, _eq_ast.While) and any(isinstance(node, _eq_ast.Name) and node.id == "queue" for node in _eq_ast.walk(_eq_item.test))):
            _eq_boundaries[_eq_item.lineno] = "while" if isinstance(_eq_item, _eq_ast.While) else "for"
    _eq_namespace = {}
    _eq_sys.settrace(_eq_trace)
    exec(compile(_eq_tree, _eq_filename, "exec"), _eq_namespace)
    _eq_function = _eq_namespace.get(_eq_name)
    if not callable(_eq_function):
        raise NameError()
    _eq_result = _eq_distances(_eq_function(*_eq_args))
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
_eq_json.dumps({"events": _eq_events, "status": _eq_status, "result": _eq_result, "error": _eq_error, "stoppedLine": _eq_last_line, "eventCount": _eq_count, "limit": _eq_limit}, allow_nan=False)
`;
}
