---
'@xpkit-dev/core': minor
'@xpkit-dev/react-native': patch
---

Engine `onChange(listener)` fires after every state change. `XPKitProvider` uses it, so hooks re-render when an external `engine` is emitted on outside React (PRS-490).
