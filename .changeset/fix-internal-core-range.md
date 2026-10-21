---
"@xpkit-dev/react-native": patch
---

Fix the `@xpkit-dev/core` dependency range. 0.1.0 was published depending on `@xpkit-dev/core@0.0.0`, which does not exist, so it could not be installed. It now depends on `^0.1.0`.
