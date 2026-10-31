# @xpkit-dev/core

## 0.2.0

### Minor Changes

- 3bbdb19: Engine `onChange(listener)` fires after every state change. `XPKitProvider` uses it, so hooks re-render when an external `engine` is emitted on outside React (PRS-490).
- 26b155b: Add `ENGINE_STATE_KEY`, `parseEngineState`, `createEngine({ initialState })` (seeds only when storage has no valid state) and `engine.replaceState()` (PRS-530).
  Behaviour change: a stored state with a wrong-typed field is now treated as corrupt (like bad JSON) instead of loaded as is.

## 0.1.0

### Minor Changes

- d482b05: First public release of the core engine.
