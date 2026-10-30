---
'@xpkit-dev/core': minor
---

Add `ENGINE_STATE_KEY`, `parseEngineState`, `createEngine({ initialState })` (seeds only when storage has no valid state) and `engine.replaceState()` (PRS-530).
Behaviour change: a stored state with a wrong-typed field is now treated as corrupt (like bad JSON) instead of loaded as is.
