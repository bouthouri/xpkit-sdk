# onboarding/native — write this last

Not because it matters less. Because you cannot run it yet, and code you cannot run is
code you cannot verify.

**Nothing you write for `web/` is thrown away.** `types.ts` and `store.ts` sit one level
up and are platform-free; `use-store.ts` here is byte-identical to the web one. The
carousel's whole state machine — current index, footer button label, permission-granted
tracking, replay behaviour — is platform-free logic you write once. What changes is the
markup and four imports.

| web | native |
|---|---|
| `<div>` + `scroll-snap` | `ScrollView` `horizontal` `pagingEnabled` |
| `<video autoplay muted loop playsinline>` | `expo-video` — `useVideoPlayer` + `<VideoView>` |
| `<span>` / `<button>` | `Text` / `Pressable` from `react-native` |
| `style={{...}}` | `StyleSheet.create` |
| `Notification.requestPermission()` | an injected `PermissionHandler` backed by `expo-notifications` |

Reference `examples/onboarding/OnboardingCarousel.tsx` and `examples/onboarding/slides/`
for the real shipped behaviour. Copy the behaviour, not the dependencies.

## Why the shipped carousel can't just be lifted here

Full write-up: [`../../docs/issues/onboarding-web-limitation.md`](../../docs/issues/onboarding-web-limitation.md).
The short version, in the order things fail:

1. `crayons/theme/typography.ts` uses `Platform.select` with no `web`/`default` key, so
   `components/text.tsx:90` does `Object.entries(undefined)` and **throws at import
   time**. That breaks all of crayons on web, not just onboarding.
2. `react-native-pager-view` v7 is android/ios only.
3. Reanimated `useEvent` / `useHandler` are native-bridge only — they exist there purely
   to read PagerView's `onPageScroll`.
4. `expo-notifications` is a hard top-level import in `NotificationPermissionSlide`.
5. `react-native-mmkv`, `expo-application`, `Linking.openSettings()`.

**None of that has to be fixed for your work to land.** If crayons is ported to web
later, nothing here changes.

## What IS web-safe today

`View`, `Text`, `Pressable`, `ScrollView`, `Image`, `FlatList`, `StyleSheet`, plus
`expo-video`, Reanimated core, `@expo/vector-icons` and `react-native-safe-area-context`.
Build against that set and one renderer can get very close to covering both.

## Why `index.tsx` here doesn't import `react-native`

This repo has no React Native, no Metro and no simulator, and `react-native` is
deliberately absent from `dependencies` (amended Rule 8 — no *platform* code in the
shared layer). Importing it would break `bun typecheck` for the one person who can't run
it anyway. The imports you need are in a comment at the top of `index.tsx`; uncomment
them in the app that consumes this folder.
