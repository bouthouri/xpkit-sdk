# @xpkit-dev/react-native

React Native bindings for XP Kit: provider, gamification hooks, MMKV storage adapter, `AchievementBadge` / `AchievementGrid`, `OnboardingCarousel` and `WhatsNew`. Built on `@xpkit-dev/core`.

## Install

```bash
bun add @xpkit-dev/react-native react-native-mmkv
```

## Use

```tsx
import { MMKV } from 'react-native-mmkv'
import { parseConfig } from '@xpkit-dev/core'
import { XPKitProvider, AchievementGrid, createMMKVStorage, useEmit, useLevel } from '@xpkit-dev/react-native'

const config = parseConfig(require('./xpkit.json'))
const storage = createMMKVStorage(new MMKV({ id: 'xpkit' }))

export default function App() {
  return (
    <XPKitProvider config={config} storage={storage}>
      <Home />
    </XPKitProvider>
  )
}

function Home() {
  const emit = useEmit()
  const { level, xp } = useLevel()
  // emit('myVariable') -> engine evaluates achievements, levels, milestones
  return <AchievementGrid columns={3} />
}
```

- `storage` can be sync (MMKV, memory) or async (AsyncStorage); the provider refreshes once the engine is `ready`.
- Pass `engine` to `XPKitProvider` to share an engine you created yourself (`config` is still used for lookups). Hooks re-render when that engine changes outside React, e.g. `engine.emit` from a store action.
- Hooks: `useEmit`, `useUnlockedAchievements`, `useLevel`, `useXPKitSignal`, `useOnAchievementUnlocked`, `useOnLevelUp`, `useOnboarding`, `useWhatsNew`.
- Badges expose `testID="xpkit-badge-<id>"`; onboarding pages `xpkit-onboarding-<screenId>` and `xpkit-onboarding-next`.
