# 05 — Your first task

Do these in order. Each one has a check you can run yourself — no simulator, no review
needed to know whether it works.

```bash
bun install
bun dev      # → http://localhost:5173
bun test     # 12 pass, 11 fail. The failures are the task list.
```

Right now `bun test` says:

```
NotImplementedError: applyIncrement() is not implemented — see docs/05-first-task.md
```

That is task 1.

---

## Task 1 — the engine

**File:** [`achievements/engine.ts`](../achievements/engine.ts)
**Read first:** [`03-achievements-explained.md`](03-achievements-explained.md), then
[`examples/achievements/gamification-slice.tsx`](reference/examples/achievements/gamification-slice.tsx)
**Test:** `bun test achievements`

Six functions, none longer than a dozen lines:

| function | what it does |
|---|---|
| `conditionMet` | one condition against the counters. All six operators. |
| `conditionsMet` | AND over an achievement's conditions. `[]` → `false`. |
| `evaluateUnlocks` | full-catalog scan → ids to unlock now, in **catalog order** |
| `applyIncrement` | bump a counter, then evaluate. **Pure** — don't mutate the input. |
| `applySetCounter` | set a counter outright (data import), then evaluate |
| `withStatus` | decorate the catalog with `isUnlocked` + 0-100 `progress` |

**Done when:** `bun test` is fully green — 23 passing, including the 25-unlock replay of the
Progres catalog in the documented order with no duplicates on a re-run.

**Do not** edit `engine.test.ts` or anything in `fixtures/`. The test replays what Progres
does today; if it disagrees with your engine, your engine is the thing that's wrong.

**Watch for:**
- Returning matches sorted, or filtered to "achievements touching the counter that
  changed". Both break the order assertion, and the second is a real bug once conditions
  span variables.
- `==` instead of `>=`. Read the `describe(">= not ==")` block before you write anything.
- Mutating `input.counters`. There's a test for it.

**Then:** open the playground, pick Progres, and click the counters. The unlock lines
appear in the event log and the badges unmask as you go. That is your engine running.

---

## Task 2 — the onboarding carousel (web)

**File:** [`onboarding/web/index.tsx`](../onboarding/web/index.tsx) (a placeholder today)
**Read first:** [`02-onboarding-explained.md`](02-onboarding-explained.md), then
[`examples/onboarding/OnboardingCarousel.tsx`](reference/examples/onboarding/OnboardingCarousel.tsx)
and the five slides next to it
**Check:** `bun dev` → Energy XP tab

Build it in this order — each step is visible in the browser:

1. **Static slide 1.** Read `config.screens[0]`, render its title and subtitle. Nothing
   else.
2. **Paging.** A horizontal flex row with `scroll-snap-type: x mandatory` and
   `scroll-snap-align: start` per slide. Track the current index from the scroll position.
3. **The footer button.** All five label rules from `docs/02`, in order. Rule 1
   ("Continue without") is the one that matters.
4. **Back chevron + Skip.** Back appears from slide 2; slide 1 renders a same-width spacer
   so Skip doesn't jump.
5. **Pagination dots**, driven by the continuous scroll position rather than the integer
   index, so the active dot slides with the drag.
6. **`video` slides.** `<video autoplay muted loop playsinline>` with the URL from
   `resolveAsset(assets, screen.source)`. The three Energy XP videos are real and bundled.
7. **`notification` / `permission` slides.** Drive them from an injected
   `PermissionHandler` (`onboarding/types.ts`). No handler passed → a skippable slide, never
   a crash. Reproduce the five-state machine from `docs/02`, including `checking → null` and
   the 600 ms auto-advance on grant.
8. **`content` slides.** The simplest one; do it whenever.

**Done when:** all four Energy XP screens page correctly in the browser, the videos play,
the footer label follows the rules, and the Karv fixture also renders (its videos aren't
bundled — a missing asset should be visibly missing, not a crash).

---

## Task 3 — the two stores

**Files:** [`onboarding/store.ts`](../onboarding/store.ts),
[`achievements/store.ts`](../achievements/store.ts)
**Read first:** [`04-storage-and-state.md`](04-storage-and-state.md), then
[`examples/onboarding/onboarding-store.ts`](reference/examples/onboarding/onboarding-store.ts)
**Check:** reload the browser and your state survives

`createStore` from `zustand/vanilla` (not `create` from `zustand` — that pulls in React),
wrapped in `persist` over the injected adapter. Then wire the lifecycle into
`<Onboarding>`: render `null` when `isOnboarded`, call `complete()` on finish, fire
`onComplete` **only when `lastSeenVersion === null`**.

**Done when:**
- completing onboarding in the playground and reloading → it does not come back
- `replayOnboarding()` brings it back, and completing it a second time does **not** fire
  `onComplete`
- achievements: unlock a few badges, reload, they're still unlocked
- `partialize` keeps the catalog out of storage — check the value in devtools

---

## Task 4 — the achievements grid (web)

**File:** [`achievements/web/index.tsx`](../achievements/web/index.tsx)
**Read first:** `examples/achievements/achievement-badge.tsx` + `achievement-list.tsx`

Two-column grid, an "N/25 unlocked" header, and locked badges showing 🔒 / `???` /
"Keep progressing to unlock!" — never the real name. All of it driven by `withStatus()`
output; **no unlock logic in this file**.

---

## Task 5 — the native renderers

**Files:** `onboarding/native/`, `achievements/native/` — read the README in each.

Last, because you can't run them. By this point the stores, the engine and the whole slide
state machine are already written and platform-free; what's left is markup and four
imports. Each folder's README has the web→native mapping table.

---

## Ground rules

- **Never** `import ... from "@bouthouri/crayons"` in `shared/`, `onboarding/` or
  `achievements/`. It doesn't work on web and it isn't the dependency this repo takes.
  (`grep -r "@bouthouri/crayons" shared/ onboarding/ achievements/` must stay empty.)
- **Never** add `react-native` to `dependencies`.
- **Never** edit `examples/` or `fixtures/`.
- Import from `../shared/index` — one definition of every shape, and it's the one the
  editor emits.
- `bun typecheck` and `bun test` before you push.
- Stuck for more than 30 minutes? Say so on the issue. Being stuck quietly is the only
  actual mistake available here.
