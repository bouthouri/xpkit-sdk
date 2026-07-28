// from karv/apps/mobile/livestore/schema.ts (excerpt: habits, habit_periods,
// milestone_achieved + the MilestoneAchieved event) — READ ONLY
//
// Why this is here: it shows what a milestone unlock actually PERSISTS in a shipped
// app, and it is the reason `karv.json` treats `level` — not `id` — as the frozen
// field for milestones.
//
//   milestone_achieved.id = `${habitId}_${level}`
//
// So karv's identity for a milestone is (habit, level). The `id` slugs in the karv
// fixture ("first-spark", "the-groove", …) are new and free to change; the `level`
// numbers are not.
//
// It also shows the shape of a per-entity counter. Karv's `completionCount` is
// per-habit, derived by counting daily_logs rows — NOT a single global integer like
// Progres's six counters. v1's `variables[]` has no way to say "per entity"; that
// gap is recorded in docs/01-json-contract.md.

import { Events, makeSchema, Schema, State } from "@livestore/livestore";

export const tables = {
  habits: State.SQLite.table({
    name: "habits",
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      name: State.SQLite.text({ default: "" }),
      energy: State.SQLite.integer({ default: 0 }),
      frequency: State.SQLite.text({ default: "[]" }), // JSON array of day numbers [0-6]
      categoryId: State.SQLite.text({ default: "0" }), // "0" = Uncategorized
      startDate: State.SQLite.text({ default: "" }), // ISO date — when habit becomes active
      createdAt: State.SQLite.text({ default: "" }),
      deletedAt: State.SQLite.text({ nullable: true }), // null = active, ISO = soft deleted
    },
  }),

  dailyLogs: State.SQLite.table({
    name: "daily_logs",
    columns: {
      id: State.SQLite.text({ primaryKey: true }), // `${habitId}_${date}` — deterministic
      habitId: State.SQLite.text({ default: "" }),
      date: State.SQLite.text({ default: "" }), // YYYY-MM-DD
      done: State.SQLite.integer({ default: 0 }),
      energy: State.SQLite.integer({ default: 0 }),
      completedAt: State.SQLite.text({ nullable: true }),
    },
  }),

  // A milestone's energy reduction takes effect the day AFTER it is reached — the
  // completion on the milestone date used the old energy. Hence a period table
  // rather than mutating habits.energy in place.
  habitPeriods: State.SQLite.table({
    name: "habit_periods",
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      habitId: State.SQLite.text({ default: "" }),
      frequency: State.SQLite.text({ default: "[]" }),
      energy: State.SQLite.integer({ default: 0 }),
      effectiveFrom: State.SQLite.text({ default: "" }),
    },
  }),

  milestoneAchieved: State.SQLite.table({
    name: "milestone_achieved",
    columns: {
      id: State.SQLite.text({ primaryKey: true }), // `${habitId}_${level}` — the frozen identity
      habitId: State.SQLite.text({ default: "" }),
      level: State.SQLite.integer({ default: 0 }),
      achievedAt: State.SQLite.text({ default: "" }),
    },
  }),
};

export const events = {
  milestoneAchieved: Events.synced({
    name: "v1.MilestoneAchieved",
    schema: Schema.Struct({
      habitId: Schema.String,
      level: Schema.Number,
      achievedAt: Schema.String,
    }),
  }),

  frequencyChanged: Events.synced({
    name: "v1.FrequencyChanged",
    schema: Schema.Struct({
      id: Schema.String, // habit_periods row id
      habitId: Schema.String,
      frequency: Schema.Array(Schema.Number),
      energy: Schema.Number,
      effectiveFrom: Schema.String,
    }),
  }),
};
