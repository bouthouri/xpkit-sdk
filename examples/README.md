# examples/ — real shipped code. READ ONLY.

Everything in this folder is **verbatim source from apps that are live on the App
Store**, copied in with a provenance header on line 1. It is here so you can read how
the thing you are rebuilding actually behaves, including the parts nobody would think
to write down.

Three rules:

1. **Do not edit these files.** They are a snapshot. If you change one, the next
   person reads a lie.
2. **Do not import them.** They will not compile here and will not run in a browser —
   see below. `examples/` is excluded from `tsconfig.json` and from vitest on purpose.
3. **Read them, then rebuild.** Your job is a config-driven, platform-free version of
   this behaviour in `onboarding/` and `achievements/`. Not a port. Not a copy.

## Why it doesn't run on web

Every file under `examples/onboarding/` is React Native. In load-failure order:

| # | Blocker | Where |
|---|---|---|
| 1 | `Platform.select` with no `web`/`default` key returns `undefined`, then `Object.entries(undefined)` **throws at import time** | `theme/typography.ts` → crayons `components/text.tsx:90` |
| 2 | `react-native-pager-view` v7 — android/ios only, no web build | `OnboardingCarousel.tsx` |
| 3 | Reanimated `useEvent` / `useHandler` — native event bridge | `OnboardingCarousel.tsx` |
| 4 | `expo-notifications`, hard top-level import | `slides/NotificationPermissionSlide.tsx` |
| 5 | `react-native-mmkv`, `expo-application`, `Linking.openSettings()` | `onboarding-store.ts`, permission slides |

Blocker 1 breaks **all of crayons** on web, not just onboarding. The full write-up is
in [`../docs/issues/onboarding-web-limitation.md`](../docs/issues/onboarding-web-limitation.md).

Nothing you build depends on any of this being fixed.

## What's in here

### `onboarding/` — from `crayons@0.0.194`

The shipped carousel, whole. Start with `Onboarding.tsx` (36 lines — the lifecycle
wrapper), then `OnboardingCarousel.tsx` (the state machine), then the five slides.

- `Onboarding.tsx` — renders `null` when onboarded; wraps the carousel; owns replay
  detection via `lastSeenVersion !== null`
- `OnboardingCarousel.tsx` — paging, back/skip header, footer button text rules,
  pagination dots driven by a Reanimated shared value
- `slides/` — `ContentSlide`, `VideoSlide`, `PermissionSlide`,
  `NotificationPermissionSlide`, `CustomSlide`
- `theme/` — the whole crayons theme, including the file that breaks web
- `onboarding-store.ts` — zustand + `persist` + MMKV, with the `configure()`-before-
  first-use pattern that `configureXPKit` copies

### `achievements/` — from Progres

- `config.ts` — the 25-badge catalog. **This is the source `fixtures/progres.json` was
  translated from.** The header comment lists all 6 counters and their call sites.
- `types.ts` — `GamificationCounters`, `Achievement`, `AchievementWithStatus`
- `gamification-slice.tsx` — `incrementCounter`: the full-catalog scan on every
  increment, `>=` comparison, unlock persistence by id. This is the engine you are
  rebuilding as a pure function.
- `achievement-badge.tsx` / `achievement-list.tsx` — locked badges show 🔒 / "???" /
  "Keep progressing to unlock!"; two-column `FlatList`
- `achievements-screen.tsx` — the "N/25 achievements unlocked" header

### `milestones/` — from Karv

A second, different shape of the same idea: thresholds that fire once and apply an
*effect*, rather than badges that accumulate.

- `milestones.ts` — the 7 mastery tiers, `getMilestone` (**exact match only**, unlike
  Progres's `>=`), `calculateSuggestedEnergy`, and the de-level logic
- `MilestonePrompt.tsx` — the celebration sheet
- `milestone-screen.tsx` — the formSheet route, and a good example of an ordering
  constraint you'd never guess (review prompt deferred via `requestAnimationFrame` so
  iOS doesn't drop the modal)
- `livestore-schema-excerpt.ts` — what an unlock persists, and why `level` is karv's
  frozen field

### `usage/` — the actual mount sites

- `energy-xp-onboardingScreens.tsx` — the four screens `fixtures/energy-xp.json` was
  translated from
- `energy-xp-layout-excerpt.tsx` / `karv-layout-excerpt.tsx` — the one-line
  integration, twice, in two apps with different data layers
- `energy-xp-onboarding-migration.ts` — what it costs to change a persistence key
  after users exist. Read this before you name anything.
- `karv-onboardingScreens.tsx` — the same shape in a second app
