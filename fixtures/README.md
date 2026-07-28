# fixtures/ — the JSON contract

**Read only.** Two people are building XP Kit and they cannot see each other's code:

- **intern A** builds the editor that *emits* this JSON (`xpkit` repo, PR #13)
- **intern B** builds the runtime that *consumes* it (this repo)

These three files are the meeting point. Each one is hand-translated from what the
app ships **today**, so the question "is the editor emitting the right JSON?" is a
diff, not an argument.

If your code doesn't parse a fixture, your code is wrong. Fixing the fixture to
make a test pass is changing the contract.

| File | Translated from | Contents |
|---|---|---|
| `energy-xp.json` | `energy-xp/apps/mobile/constants/onboardingScreens.tsx` | canonical onboarding — 3 video + 1 notification screen |
| `progres.json` | `progres/apps/mobile/store/gamification/config.ts` | canonical gamification — 6 counters + 25 achievements |
| `karv.json` | karv `constants/onboardingScreens.tsx` + `utils/milestones.ts` | secondary — 4 screens + 7 mastery tiers with effects |

The field-by-field mapping — and the list of app fields v1 has **no slot for** — is
in [`../docs/01-json-contract.md`](../docs/01-json-contract.md).

## assets/

Real Energy XP intro videos (2.2 MB), so the carousel you build is faithful rather
than a grey box. These are App Store marketing content — nothing private.

| Key | File |
|---|---|
| `onboarding-1` | `assets/onboarding-1.mp4` |
| `onboarding-2` | `assets/onboarding-2.mp4` |
| `onboarding-3` | `assets/onboarding-3.mp4` |

`karv.json` references `onboarding1` / `onboarding2` / `onboarding3` (karv's own
file names, no dash). **Those binaries are not bundled** — karv is the secondary,
data-only fixture. Resolving one throws a named error from `resolveAsset`, which is
worth seeing once: it is exactly what a typo in an app's asset map looks like.
