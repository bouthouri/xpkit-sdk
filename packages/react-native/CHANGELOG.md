# @xpkit-dev/react-native

## 0.1.2

### Patch Changes

- 3bbdb19: Engine `onChange(listener)` fires after every state change. `XPKitProvider` uses it, so hooks re-render when an external `engine` is emitted on outside React (PRS-490).
- Updated dependencies [3bbdb19]
  - @xpkit-dev/core@0.2.0

## 0.1.1

### Patch Changes

- 14d67b4: Fix the `@xpkit-dev/core` dependency range. 0.1.0 was published depending on `@xpkit-dev/core@0.0.0`, which does not exist, so it could not be installed. It now depends on `^0.1.0`.

## 0.1.0

### Minor Changes

- d482b05: First public release of the React Native SDK.

### Patch Changes

- Updated dependencies [d482b05]
  - @xpkit-dev/core@0.1.0
