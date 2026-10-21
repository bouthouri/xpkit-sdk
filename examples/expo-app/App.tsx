import * as React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { MMKV } from 'react-native-mmkv'
import {
  AchievementGrid,
  OnboardingCarousel,
  XPKitProvider,
  createMMKVStorage,
  useEmit,
  useLevel,
  useOnboarding,
  useXPKit,
} from '@xpkit-dev/react-native'
import { config, lowestThresholdVariable } from './src/config'

const mmkv = new MMKV({ id: 'xpkit-example' })
const storage = createMMKVStorage(mmkv)
const completeVariable = lowestThresholdVariable()

function Home({ onReset }: { onReset: () => void }) {
  const emit = useEmit()
  const { xp, level } = useLevel()

  return (
    <View style={styles.home}>
      <Text style={styles.level} testID="level-name">Level: {level?.name ?? '-'}</Text>
      <Text style={styles.xp} testID="xp-count">{xp} XP</Text>

      <Pressable
        testID="complete-button"
        accessibilityRole="button"
        accessibilityLabel="Complete"
        style={styles.complete}
        onPress={() => emit(completeVariable)}
      >
        <Text style={styles.completeText}>Complete</Text>
      </Pressable>

      <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
        <AchievementGrid />
      </ScrollView>

      <Pressable testID="reset-button" accessibilityRole="button" onPress={onReset} hitSlop={12}>
        <Text style={styles.reset}>Reset</Text>
      </Pressable>
    </View>
  )
}

function Root({ onReset }: { onReset: () => void }) {
  const { config: cfg } = useXPKit()
  const { visible, loading, dismiss } = useOnboarding(cfg.onboarding.screens.length > 0, storage)

  return (
    <>
      <Home onReset={onReset} />
      {!loading && visible ? (
        <OnboardingCarousel screens={cfg.onboarding.screens} assetMap={{}} onComplete={dismiss} />
      ) : null}
    </>
  )
}

export default function App() {
  // Bumping the key remounts the provider, which builds a fresh engine from empty storage.
  const [session, setSession] = React.useState(0)

  const reset = React.useCallback(() => {
    mmkv.clearAll()
    setSession(n => n + 1)
  }, [])

  return (
    <XPKitProvider key={session} config={config} storage={storage}>
      <StatusBar style="dark" />
      <Root onReset={reset} />
    </XPKitProvider>
  )
}

const styles = StyleSheet.create({
  home: { flex: 1, backgroundColor: '#fff', paddingTop: 72, paddingHorizontal: 16, paddingBottom: 32, alignItems: 'center' },
  level: { fontSize: 26, fontWeight: '700', color: '#111' },
  xp: { fontSize: 16, color: '#666', marginTop: 4 },
  complete: { marginTop: 24, backgroundColor: '#111', borderRadius: 20, paddingVertical: 28, paddingHorizontal: 64 },
  completeText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  grid: { flex: 1, alignSelf: 'stretch', marginTop: 24 },
  gridContent: { paddingBottom: 16 },
  reset: { fontSize: 14, color: '#888', marginTop: 8 },
})
