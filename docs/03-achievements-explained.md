# 03. Achievements, XP and levels

Core has two ways to track progress. Both read the same config.

- `createEngine`: one engine for variables, XP, levels, achievements, milestones and streaks.
- The achievements store: counters and unlocked badges only.

## Conditions

```ts
{ variableId: 'pathCreated', operator: '>=', threshold: 3 }
```

- `conditionMet(condition, counters)` checks one condition. All six operators work:
  `>=`, `>`, `==`, `<`, `<=`, `!=`.
- `conditionsMet(achievement, counters)` is true when every condition holds (AND).
- An achievement with no conditions never unlocks. The schema also rejects it, with
  `Every achievement needs at least one unlock condition.`
- `counters` is a `CounterState`, a `Record<string, number>`. A missing key reads as 0
  (`counterValue`).

## Pure functions

These take state in and return new state. They never mutate their input.

| function | what it does |
|---|---|
| `evaluateUnlocks({ catalog, counters, unlocked })` | ids that should unlock now, in catalog order |
| `applyIncrement({ catalog, counters, unlocked, variableId, by? })` | adds `by` (default 1), then evaluates the whole catalog |
| `applySetCounter({ ..., variableId, value })` | sets a counter, then evaluates. For import and restore |
| `withStatus({ catalog, counters, unlocked })` | each achievement plus `isUnlocked` and `progress` (0 to 100) |
| `progressOf(achievement, counters)` | the progress of the least complete condition |

`applyIncrement` and `applySetCounter` return `{ counters, unlocked, newlyUnlocked }`.
Comparisons use `>=`, so one call that jumps a counter from 0 to 50 unlocks every badge
whose threshold is passed, in catalog order. An unlocked achievement shows `progress: 100`.

## The engine

```ts
import { createEngine, createMemoryStorage, parseConfig } from '@xpkit-dev/core'

const engine = createEngine(parseConfig(raw), { storage: createMemoryStorage() })
engine.emit({ type: 'pathCreated' })
```

`emit({ type })` treats `type` as a variable id. One event does this, in order:

1. A `boolean` variable is set to `true`. Any other variable goes up by 1. A variable that
   is not declared in `variables` counts up as well.
2. XP goes up by 1. Every event is worth 1 XP, whatever the variable.
3. Achievements are evaluated. Booleans count as 1 or 0.
4. Milestones are evaluated for that variable.
5. Streaks are evaluated for that variable.
6. The level is evaluated.
7. The state is saved (see [04](04-storage-and-state.md)).

`getState()` returns a copy: `variables`, `unlockedAchievements`, `milestoneLevels`,
`reachedStreakMilestones`, `xp` and `currentLevelId`. Mutating it changes nothing.

### Signals

`engine.subscribe(listener)` returns an unsubscribe function. The listener gets an
`EngineSignal`:

| signal | when | fields |
|---|---|---|
| `achievementUnlocked` | all conditions are met for the first time | `id` |
| `milestoneReached` | the variable reaches the milestone `threshold`, once per entity and level | `id`, `effect` |
| `levelUp` | the level changes | `levelId` |
| `streakMilestone` | the variable reaches a value in `streak.milestones`, once each | `id`, `value` |

A milestone with `variableKey` only checks that variable. A milestone without it is checked
against whichever variable was just emitted.

### Levels

Levels are sorted by `xpThreshold`. The current level is the highest one with
`xpThreshold <= xp`. `levelUp` fires only when the level id changes, so a level with
threshold 0 fires on the first event. Before that, `currentLevelId` is `null`.

## The achievements store

```ts
import { configureXPKit, createAchievementsStore, parseConfig } from '@xpkit-dev/core'

configureXPKit({ keyPrefix: 'progres' })
const config = parseConfig(raw)
const store = createAchievementsStore({ catalog: config.gamification.achievements })

const unlocked = store.getState().increment('pathCreated')
```

It is a zustand vanilla store with `counters` and `unlocked`, plus three actions.

- `increment(variableId, by?)` returns the ids unlocked by that call.
- `setCounter(variableId, value)` does the same for an absolute value.
- `reset()` clears both fields. Meant for debugging and tests.

Only `counters` and `unlocked` are persisted, under `<keyPrefix>:achievements`. The catalog
comes from the config on each launch, so adding a badge needs no migration. Options:
`name` (key suffix) and `persist: false` for tests. The store returns ids instead of
showing toasts, so each platform decides how to celebrate.

Use the engine when you want XP, levels, milestones and streaks. Use the store when you
only need badges.
