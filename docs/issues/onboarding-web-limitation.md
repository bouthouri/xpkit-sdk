# The shipped onboarding carousel can't run in a browser

**Status:** known and accounted for. Nothing in this repo depends on fixing it.

This is written down because the intern working on `onboarding/` will read
`examples/onboarding/` and reasonably wonder why they can't just import it, and because
"port crayons to web" is the wrong answer to that question.

---

## Where we are

The carousel at `crayons/components/onboarding/` is React Native and does not load in a
browser. Verified blockers, in the order they fail:

### 1. `crayons/theme/typography.ts` — throws at import time

```ts
primary: Platform.select({
  ios: fonts.sourceCodePro,
  android: fonts.sourceCodeProAndroid,
}),
```

No `web` key and no `default` key, so on web `Platform.select` returns `undefined`. Then
`crayons/components/text.tsx:90`:

```ts
const fontWeightStyles = Object.entries(typography.primary).reduce(…)
```

`Object.entries(undefined)` throws. This runs at module scope, so it takes down **all of
crayons on web**, not just onboarding — anything importing `Text`, which is nearly
everything.

Cheap to fix (add `default:`) if anyone ever wants crayons on web. Not needed here.

### 2. `react-native-pager-view` v7 — no web build

android/ios only. `OnboardingCarousel` is built on it.

### 3. Reanimated `useEvent` / `useHandler` — native event bridge only

`usePageScrollHandler` exists solely to read PagerView's `onPageScroll` and feed the
pagination dots. Drop PagerView and this goes with it.

### 4. `expo-notifications` — hard top-level import

`slides/NotificationPermissionSlide.tsx` imports it at module scope, so the module can't
even be loaded on a platform without it, let alone rendered.

### 5. `react-native-mmkv`, `expo-application`, `Linking.openSettings()`

`utils/onboarding-store.ts` constructs an `MMKV()` and reads
`Application.nativeApplicationVersion` at module scope. Both permission slides call
`Linking.openSettings()`.

## Where we're going

A config-driven onboarding whose **logic is platform-free** and whose renderers are thin.
Each blocker maps to a deliberate choice already made in this repo:

| blocker | replacement |
|---|---|
| crayons theme | own theme; no crayons import in `shared/`, `onboarding/`, `achievements/` |
| PagerView | `ScrollView pagingEnabled` (native) / `scroll-snap` (web). crayons already made this swap for `SettingsList` in 0.0.179. |
| Reanimated `useEvent`/`useHandler` | gone with PagerView — a scroll position is a scroll position |
| `expo-notifications` | injected `PermissionHandler` (`onboarding/types.ts`) |
| MMKV / `expo-application` | injected `StorageAdapter` + `configureXPKit({ appVersion })` |
| `Linking.openSettings()` | optional `openSettings` on the handler |

Everything the runtime needs is web-safe today: `View`, `Text`, `Pressable`, `ScrollView`,
`Image`, `FlatList`, `StyleSheet`, plus `expo-video`, Reanimated core,
`@expo/vector-icons` and `react-native-safe-area-context` — all of which do have web
support. Build against that set and one renderer gets close to covering both platforms.

## What we're not depending on

Crayons becoming web-compatible. The intern's first renderer is `web/`, because it is the
only one they can run and verify themselves; the store, the lifecycle and the slide state
machine are shared, so `native/` is written later against the same code and nothing is
thrown away.

If crayons is ported to web later, nothing here has to change.
