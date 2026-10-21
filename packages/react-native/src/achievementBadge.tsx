import * as React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { iconText, type Achievement } from '@xpkit-dev/core'

export interface AchievementBadgeProps {
  achievement: Achievement
  unlocked: boolean
  /** Diameter of the icon circle. Default 56. */
  size?: number
  onPress?: (achievement: Achievement) => void
}

export function AchievementBadge({ achievement, unlocked, size = 56, onPress }: AchievementBadgeProps) {
  const concealed = achievement.hidden && !unlocked
  const name = concealed ? '???' : achievement.name
  const glyph = unlocked ? iconText(achievement.icon) || '🏅' : '🔒'
  const label = concealed ? 'Hidden achievement, locked' : `${achievement.name}, ${unlocked ? 'unlocked' : 'locked'}`

  return (
    <Pressable
      testID={`xpkit-badge-${achievement.id}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!onPress}
      onPress={() => onPress?.(achievement)}
      style={[styles.badge, unlocked ? null : styles.locked]}
    >
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
          unlocked ? styles.circleUnlocked : styles.circleLocked,
        ]}
      >
        <Text style={{ fontSize: size * 0.5 }}>{glyph}</Text>
      </View>
      <Text numberOfLines={2} style={styles.name}>
        {name}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', padding: 8, gap: 6 },
  locked: { opacity: 0.4 },
  circle: { alignItems: 'center', justifyContent: 'center' },
  circleUnlocked: { backgroundColor: '#FFF4D6' },
  circleLocked: { backgroundColor: '#E5E5EA' },
  name: { fontSize: 12, textAlign: 'center', color: '#111' },
})
