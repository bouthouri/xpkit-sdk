import { parseConfig, type XPKitConfig } from '@xpkit-dev/core'
import progres from '../../../packages/core/fixtures/progres.json'

// The Progres fixture ships without levels or onboarding, so the example adds both.
export const config: XPKitConfig = parseConfig({
  ...progres,
  projectName: 'XP Kit Example',
  onboarding: {
    showSkip: false,
    screens: [
      { id: 'welcome', type: 'content', title: 'Welcome', body: 'XP Kit turns a JSON config into XP, levels and badges.' },
      { id: 'badges', type: 'content', title: 'Earn badges', body: 'Every action you take can unlock an achievement.' },
      { id: 'levels', type: 'content', title: 'Level up', body: 'XP builds up and moves you to the next level.' },
    ],
  },
  gamification: {
    ...progres.gamification,
    levels: [
      { id: 'beginner', name: 'Beginner', xpThreshold: 0 },
      { id: 'explorer', name: 'Explorer', xpThreshold: 3 },
      { id: 'achiever', name: 'Achiever', xpThreshold: 10 },
    ],
  },
})

/**
 * The variable the "Complete" button emits: the first achievement whose conditions are
 * all `>=` on a single variable, with the smallest threshold. For Progres that is
 * `progressCreated` (threshold 1), so one tap unlocks "Starter".
 */
export function lowestThresholdVariable(source: XPKitConfig = config): string {
  let best: { variableId: string; threshold: number } | null = null
  for (const achievement of source.gamification.achievements) {
    const { conditions } = achievement
    if (conditions.length === 0) continue
    const variableId = conditions[0]!.variableId
    if (!conditions.every(c => c.operator === '>=' && c.variableId === variableId)) continue
    const threshold = Math.max(...conditions.map(c => c.threshold))
    if (best === null || threshold < best.threshold) best = { variableId, threshold }
  }
  if (!best) throw new Error('No single-variable ">=" achievement found in config')
  return best.variableId
}
