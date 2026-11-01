# Example app e2e (Maestro)

One flow, `flows/example/onboarding-unlock-level-relaunch.yaml` (scenario EX-01 in `specs/example.feature`): onboarding through 3 screens, 1 tap unlocks Starter, 3 taps reach Explorer, a relaunch keeps both.

Run it against a Release build (JS embedded, no Metro):

```sh
bun install && bun run build            # repo root: packages need dist/
cd examples/expo-app
bunx expo run:ios --configuration Release        # or: bunx expo run:android --variant release
maestro test e2e/flows/example/onboarding-unlock-level-relaunch.yaml
```

With several devices, add `--udid <id>` before `test`.
