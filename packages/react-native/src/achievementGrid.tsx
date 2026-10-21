import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import type { Achievement } from '@xpkit-dev/core'
import { AchievementBadge } from './achievementBadge.js'
import { useXPKit } from './provider.js'

export interface AchievementGridProps {
  /** Defaults to every achievement in the config. */
  achievements?: Achievement[]
  /** Badges per row. Default 3. */
  columns?: number
  onPress?: (achievement: Achievement) => void
}

export function AchievementGrid({ achievements, columns = 3, onPress }: AchievementGridProps) {
  const { config, state } = useXPKit()
  const items = achievements ?? config.gamification.achievements
  const unlocked = React.useMemo(() => new Set(state.unlockedAchievements), [state.unlockedAchievements])
  const width = `${100 / Math.max(1, columns)}%` as `${number}%`

  return (
    <View testID="xpkit-achievement-grid" style={styles.grid}>
      {items.map(achievement => (
        <View key={achievement.id} style={{ width }}>
          <AchievementBadge achievement={achievement} unlocked={unlocked.has(achievement.id)} onPress={onPress} />
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
})
