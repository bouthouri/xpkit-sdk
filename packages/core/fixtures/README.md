# fixtures/

Three real app configs, hand-translated from what each app shipped before the SDK existed.
They are test data. Nothing in `src/` imports them.

Tests import them through [`../test/helpers/fixtures.ts`](../test/helpers/fixtures.ts),
which exposes `energyXpRaw`, `karvRaw`, `progresRaw`, `rawFixtures` and `fixtureNames`.
They are also published as `@xpkit-dev/core/fixtures/<name>.json`.

If a fixture stops parsing, fix the code or the schema on purpose. Do not edit a fixture
just to turn a test green.

| File | Contents |
|---|---|
| `energy-xp.json` | onboarding: 4 screens (3 video, 1 notification) |
| `progres.json` | gamification: 6 counters and 25 achievements |
| `karv.json` | onboarding screens and 7 mastery milestones with effects |

The schema is described in [`../../../docs/01-json-contract.md`](../../../docs/01-json-contract.md).

## assets/

The Energy XP intro videos, used by `energy-xp.json`.

| Key | File |
|---|---|
| `onboarding-1` | `assets/onboarding-1.mp4` |
| `onboarding-2` | `assets/onboarding-2.mp4` |
| `onboarding-3` | `assets/onboarding-3.mp4` |

`karv.json` refers to `onboarding1`, `onboarding2` and `onboarding3` (no dash). Those files
are not bundled. Resolving one with `resolveAsset` throws an error that names the key, which
is what a typo in an app's asset map looks like.
