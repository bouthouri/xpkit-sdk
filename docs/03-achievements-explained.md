# 03 — How the real achievements work

25 badges driven by 6 integer counters, shipping in Progres today. Source:
[`examples/achievements/config.ts`](reference/examples/achievements/config.ts) (the catalog) and
[`examples/achievements/gamification-slice.tsx`](reference/examples/achievements/gamification-slice.tsx)
(the engine, ~30 lines of it).

Translated to v1 in [`fixtures/progres.json`](../packages/core/fixtures/progres.json). Your job is
[`achievements/engine.ts`](../achievements/engine.ts) — a pure version of that slice.

---

## The 6 counters and where they come from

Every badge in the app is one counter crossing one number. That is the whole model.

| counter | incremented by | call site |
|---|---|---|
| `progressCreated` | `addProgres()` | `ProgressSlice.ts:46` |
| `pathCreated` | `addPath()` | `ProgressSlice.ts:143` |
| `goalCreated` | `updatePath()` when a path gains a `.goal` | `ProgressSlice.ts:166` |
| `goalAchieved` | a score crosses its `.goal`, **or** a number-path milestone is hit | `ProgressSlice.ts:177, 199` |
| `pathAchieved` | `markStepAsDone()` finishes a path's last step | `ProgressSlice.ts:306` |
| `progressAchieved` | `markStepAsDone()` takes a progres to 100% | `ProgressSlice.ts:314` |

Seven call sites, six counters — `goalAchieved` has two. Notice what none of them know:
nothing in `ProgressSlice` mentions an achievement. Domain code emits a domain event and
the engine decides what that means. Keep that boundary; it is what makes the engine
testable and what lets the same engine sit behind Zustand, LiveStore, or a browser page.

## Full-catalog scan on every increment

```ts
// gamification-slice.tsx, inside incrementCounter
state.counters[counterKey] += 1;

newlyUnlocked = Object.entries(ACHIEVEMENTS).filter(([id, achievement]) => {
  if (state.unlockedAchievements.includes(id)) return false;
  return state.counters[achievement.target] >= achievement.goal;
});
```

The whole catalog is re-evaluated on every single increment. Not an index from counter →
affected achievements, not a dirty set. 25 comparisons on a user action is free, and the
moment conditions can span multiple variables — which v1's `conditions[]` allows — any
"only check what changed" optimisation is silently wrong.

`Object.entries` order is insertion order, so `newlyUnlocked` comes back in **catalog
order**. That is what the user sees as a toast queue, and it is asserted in
`engine.test.ts`. Preserve it: return matches in `catalog` order, unsorted.

## `>=`, not `==`

The single most important character in the file.

Data import can move a counter by 47 in one step. With `==`, only the badge whose goal
exactly equals the new value fires, and the other three in the series are lost **forever**
— nothing ever re-checks them, because the counter only goes up.

With `>=`, one jump unlocks the whole series at once, in catalog order:

```
setCounter("pathCreated", 50)
  → pathfinder (3), trailblazer (10), architect (25), mapmaker (50)
```

Both behaviours are pinned in `engine.test.ts` (`describe(">= not ==")`).

Corollary: `applyIncrement({ by: 25 })` must produce exactly what 25 calls of
`applyIncrement({ by: 1 })` produce. Also tested.

## Unlock persistence

```ts
unlockedAchievements: string[]   // ids, in unlock order
```

An array of ids. Not objects, not indices — **ids**.

- Not objects, because the catalog comes from config on every launch. Persisting a badge's
  name means a copy fix in the editor never reaches an existing user.
- Not indices, because inserting a badge mid-catalog would silently reassign everyone's
  collection.

Which makes `id` **frozen forever (Rule 2)**. Rename one and every user who had that badge
silently loses it. If you want to know what fixing that costs after the fact, read
[`examples/usage/energy-xp-onboarding-migration.ts`](reference/examples/usage/energy-xp-onboarding-migration.ts)
— 60 lines, two fallback paths, and a permanent migration flag, all to rename one
persistence key.

For the same reason: persist `counters` and `unlocked`, and **nothing else**. Never the
catalog. A config change that adds a badge must not be a migration.

## `conditions: []` must never unlock

An empty AND is vacuously true in logic. Here that would mean a half-configured badge in
the editor fires for every user on first launch, which is unrecoverable — it is already in
their persisted `unlocked` array. Return `false`. Tested.

## Notifications stay out of the engine

The slice fires `notify.celebrate(...)` — confetti and haptics — and does it **after** the
`set()` completes, not inside it. Two reasons, and one of them cost real debugging time:

- Immer's draft is not a place to run side effects (`trackEvent` inside a producer is a
  known footgun across these apps).
- The review prompt is chained to the triggering toast's `onHide`. Firing it immediately
  races an in-flight formSheet dismiss, and iOS silently fails to mount the native
  `<Modal>`. Read the comment in the slice; it is a good example of the kind of ordering
  constraint that never survives a rewrite unless someone wrote it down.

Your engine returns `newlyUnlocked` and fires nothing. The caller decides whether that
means a toast, a `console.log`, or a row in the playground's event log — a browser has
neither haptics nor `notify.celebrate`.

## Progress, for the UI

```ts
Math.min((current / goal) * 100, 100)
```

Generalise to N conditions however you can defend — the least-complete condition is the
obvious choice. Locked achievements still get a real number; the renderer decides whether
to show it. `withStatus()` in the engine is where this belongs, so no renderer contains
unlock logic.

## What the shipped UI does with all this

[`achievement-badge.tsx`](reference/examples/achievements/achievement-badge.tsx): a locked badge
shows 🔒 / `???` / "Keep progressing to unlock!" — never the real name or description.
[`achievement-list.tsx`](reference/examples/achievements/achievement-list.tsx): two-column
`FlatList`. [`achievements-screen.tsx`](reference/examples/achievements/achievements-screen.tsx):
an "N/25 achievements unlocked" header.
