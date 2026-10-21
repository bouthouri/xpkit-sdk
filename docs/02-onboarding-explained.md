# 02 — How the real onboarding works

The carousel you are rebuilding ships in three App Store apps. Read
[`examples/onboarding/`](reference/examples/onboarding/) alongside this file: this is the
commentary, that is the source.

Two files carry the whole thing. `Onboarding.tsx` is 36 lines of lifecycle.
`OnboardingCarousel.tsx` is the state machine. Everything else is a slide.

---

## The lifecycle wrapper — why the app integration is one line

```tsx
// examples/onboarding/Onboarding.tsx
export const Onboarding = ({ screens, onFirstComplete, showSkip = true }) => {
  const { isOnboarded, complete } = useOnboardingStore();
  if (isOnboarded) return null;
  return <OnboardingInner … />;
};
```

That early `return null` is the entire reason
[`examples/usage/energy-xp-layout-excerpt.tsx`](reference/examples/usage/energy-xp-layout-excerpt.tsx)
has no onboarding logic in it. The component is mounted unconditionally as a **sibling of
the router**, absolutely-filling the screen at `zIndex: 9999`. It is not a route. There is
no "should I navigate to onboarding?" decision anywhere in any of the three apps, and no
race between the splash screen and the first slide.

Copy this. `<Onboarding>` renders nothing when there is nothing to show.

## Replay — the one non-obvious piece of state

Two fields persist, and you need both:

| field | set when | read for |
|---|---|---|
| `isOnboarded` | on completion; cleared by `replay()` | "should I render at all?" |
| `lastSeenVersion` | on completion; **never cleared** | "has this user been here before?" |

```ts
const isReplay = useOnboardingStore.getState().lastSeenVersion !== null;
```

`isOnboarded` alone can't answer that, because `replay()` sets it back to `false`. The
asymmetry *is* the mechanism. A replay changes two behaviours:

1. **`onComplete` does not fire.** Re-watching the intro from Settings must not re-present
   the paywall. (crayons: `if (!isReplay && onFirstComplete) onFirstComplete()`.)
2. **Permission slides stop auto-advancing.** See below.

`replay()` is the whole Settings integration:

```tsx
<SettingsRow label="View onboarding again" onPress={replayOnboarding} />
```

## The five slide types (v1 has four)

| type | what it does |
|---|---|
| `content` | centred title + body in a `ScrollView`, optional image |
| `video` | looping muted video, aspect-ratio measured from the track, tap-to-play overlay |
| `permission` | generic: injected `onGrant` / `onCheckStatus` |
| `notification-permission` | `expo-notifications` hard-wired — v1 calls this `notification` |
| `custom` | arbitrary ReactNode. **Not in v1** — a JSON contract can't carry a component. |

### Video

`VideoSlide` reads the video's real dimensions from the `sourceLoad` event and sets
`aspectRatio` from them, rather than hardcoding a box. It also re-plays on
`AppState → active`, because iOS pauses video when the app backgrounds and the slide would
otherwise sit frozen. Both details are worth keeping; neither is obvious.

### Permission slides

A five-state machine: `checking → idle | granted | blocked | denied`.

- `checking` renders **`null`**, not a spinner. A one-frame flash of "Allow
  Notifications" before discovering permission was already granted looks broken.
- **`granted` → auto-advance after 600 ms**, and only when `autoAdvance` is true — which
  is `!isReplay`. First run: the user granted, so move on, the 600 ms just lets them see
  the green check. Replay: they are *browsing*, so let them page at their own speed.
- `blocked` (permission denied at OS level, `canAskAgain === false`) can't be re-prompted,
  so the slide shows an "Open Settings" button and subscribes to
  `AppState → active` to re-check when the user comes back.

## The footer button label

One button, five rules, checked in this order (`getButtonText()`):

1. permission slide, not granted → **"Continue without"**
2. permission slide, granted, `grantedButtonText` set → that
3. screen sets `buttonText` → that
4. last screen → **"Get Started"**
5. otherwise → **"Next"**

Rule 1 is the important one and the easiest to get wrong. On a permission slide the
"Allow" affordance is *inside* the slide; the footer button is the way past it. Labelling
it "Next" makes declining feel like a dead end, and "Skip" reads as skipping onboarding
rather than skipping the permission. "Continue without" says exactly what happens.

## Everything else in the chrome

- **Back chevron** in the header, from slide 2 onward. Slide 1 renders an empty
  same-width `View` so the Skip button doesn't jump.
- **Skip** in the header, right side, when `showSkip && onSkip`. Skipping still marks the
  user onboarded — it is not a cancel.
- **Pagination dots** driven by a continuous `position + offset` value, so the active dot
  slides with the drag rather than snapping on page change. On web, `scroll-snap` plus a
  scroll listener gets you the same value.
- **`goToIndex` resets `permissionGranted` to false.** Paging away from a permission slide
  must not leave the footer label stuck on `grantedButtonText`.
- Per-screen `disableSwipe` and `hideFooterButton` exist in crayons but **not in v1** —
  see the parity gaps in `docs/01`.

## What to build differently

- **`ScrollView pagingEnabled` (native) / `scroll-snap` (web), not PagerView.**
  `react-native-pager-view` has no web build, and crayons already made exactly this swap
  for `SettingsList` in 0.0.179. Losing PagerView also removes the need for Reanimated's
  `useEvent`/`useHandler`, which only existed to read its `onPageScroll`.
- **Permissions behind an injected handler** (`PermissionHandlers` in
  `onboarding/types.ts`), not a top-level `expo-notifications` import. A missing handler
  must degrade to a skippable slide, never a crash.
- **Storage behind the adapter.** See `docs/04`.
- **Your own theme.** Do not import crayons; `theme/typography.ts` throws on web.

## Hydration

If the injected storage is async (AsyncStorage), the persisted state is not available on
the first render. Render nothing until `persist`'s hydration settles
(`hasHydrated()` / `onFinishHydration`), or every cold start shows a returning user a
flash of slide 1. `localStorage` and MMKV are synchronous and hide this bug — which is
exactly why it needs handling up front rather than after the first RN build.
