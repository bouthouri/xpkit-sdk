import { z } from 'zod'
import { assertObject, assertVersion, formatIssues } from './parse-utils.js'

export const assetRefSchema = z.object({
  kind: z.literal('asset'),
  key: z.string().trim().min(1).refine(
    value => !value.includes('require(') && !value.startsWith('.') && !value.startsWith('/'),
    {
      message: 'AssetRef.key must be a non-empty asset key, not a raw path.',
    },
  ),
})

export type AssetRef = z.infer<typeof assetRefSchema>

export const schemaVersion = '1.0.0'
const semanticVersionPattern = /^\d+\.\d+\.\d+$/

// --- Shared schemas ---

export const levelSchema = z.object({// Schema for a gamification level
  id: z.string(),
  name: z.string(),
  xpThreshold: z.number(),
})

// --- v1.0 schema (unchanged) ---

export const exportSchemaV1_0 = z.object({// Schema for exporting gamification levels
  schemaVersion: z.literal('1.0.0'),
  projectName: z.string(),
  levels: z.array(levelSchema),
})

// --- v1.1 schemas ---

export const variableSchema = z.object({// Schema for a gamification variable
  id: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  name: z.string(),
  type: z.enum(['counter', 'streak', 'boolean']),
  description: z.string(),
})

export const conditionSchema = z.object({// Schema for a condition that triggers an achievement
  variableId: z.string(),
  operator: z.enum(['>=', '>', '==', '<', '<=', '!=']),
  threshold: z.number(),
})

export const CONDITIONS_REQUIRED_MESSAGE = 'Every achievement needs at least one unlock condition.'

export const achievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(''),
  icon: z.union([z.string(), assetRefSchema]).optional().default(''),
  tier: z.string().nullable().optional().default(null),
  hidden: z.boolean().optional().default(false),
  rarity: z.string().nullable().optional().default(null),
  category: z.string().nullable().optional().default(null),
  purpose: z.string().optional().default(''),
  conditions: z.array(conditionSchema, { required_error: CONDITIONS_REQUIRED_MESSAGE }).min(1, CONDITIONS_REQUIRED_MESSAGE),
})

export const exportSchemaV1_1 = z.object({
  schemaVersion: z.literal('1.1.0'),
  projectName: z.string(),
  levels: z.array(levelSchema),
  variables: z.array(variableSchema).default([]),
  achievements: z.array(achievementSchema).default([]),
})

// --- v1 entity schemas ---

export const announcementSchema = z.object({
  id: z.string().trim().min(1),
  version: z.string().trim().regex(semanticVersionPattern, {
    message: 'Version must use X.X.X format, like 1.6.0.',
  }),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  image: assetRefSchema.optional(),
})

export const onboardingScreenSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal('content'),
    title: z.string(),
    body: z.string(),
    image: assetRefSchema.optional(),
    buttonText: z.string().optional(),
    disableSwipe: z.boolean().optional(),
    hideFooterButton: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('video'),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    source: assetRefSchema,
    buttonText: z.string().optional(),
    disableSwipe: z.boolean().optional(),
    hideFooterButton: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('permission'),
    permission: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    grantedTitle: z.string().optional(),
    grantedSubtitle: z.string().optional(),
    grantedButtonText: z.string().optional(),
    buttonText: z.string().optional(),
    disableSwipe: z.boolean().optional(),
    hideFooterButton: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('notification'),
    title: z.string(),
    subtitle: z.string().optional(),
    grantedTitle: z.string().optional(),
    grantedSubtitle: z.string().optional(),
    grantedButtonText: z.string().optional(),
    buttonText: z.string().optional(),
    disableSwipe: z.boolean().optional(),
    hideFooterButton: z.boolean().optional(),
  }),
])

export const onboardingConfigSchema = z.object({ // Schema for the entire onboarding configuration
  screens: z.array(onboardingScreenSchema),
  showSkip: z.boolean().optional().default(true),
})

export const effectSchema = z.object({
  type: z.string(),
}).catchall(z.unknown())

export const milestoneSchema = z.object({
  id: z.string(),
  variableKey: z.string().optional(),
  level: z.number(),
  threshold: z.number(),
  label: z.string(),
  hint: z.string().optional(),
  tier: z.string().optional(),
  effect: effectSchema.optional(),
})

export const streakSchema = z.object({
  id: z.string(),
  variableKey: z.string(),
  milestones: z.array(z.number()), //where the user gets reawards for streaks
})

export const gamificationConfigSchema = z.object({
  levels: z.array(levelSchema),
  variables: z.array(variableSchema),
  achievements: z.array(achievementSchema),
  milestones: z.array(milestoneSchema),
  streaks: z.array(streakSchema),
})

export const xpkitConfigSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  projectName: z.string(),
  announcements: z.array(announcementSchema),
  onboarding: onboardingConfigSchema,
  gamification: gamificationConfigSchema,
})

export type XPKitConfig = z.infer<typeof xpkitConfigSchema>
export type GamificationConfig = z.infer<typeof gamificationConfigSchema>


/**
 * Parse a full XP Kit config. Throws on an unknown schemaVersion BEFORE zod runs,
 * so a v2 file fails with "Unsupported schemaVersion: 2.0.0" rather than forty
 * confusing field errors.
 */
export function parseConfig(raw: unknown): XPKitConfig {
  const candidate = assertObject(raw)
  assertVersion(candidate, schemaVersion)

  const result = xpkitConfigSchema.safeParse(raw)
  if (!result.success) throw new Error(formatIssues(result.error))
  return result.data
}

export const importSchema = z.discriminatedUnion('schemaVersion', [
  exportSchemaV1_0,
  exportSchemaV1_1,
])

export const exportSchema = exportSchemaV1_1

export type Level = z.infer<typeof levelSchema>
export type Variable = z.infer<typeof variableSchema>
export type Condition = z.infer<typeof conditionSchema>
export type Achievement = z.infer<typeof achievementSchema>
export type Announcement = z.infer<typeof announcementSchema>
export type OnboardingScreen = z.infer<typeof onboardingScreenSchema>
export type OnboardingConfig = z.infer<typeof onboardingConfigSchema>
export type Effect = z.infer<typeof effectSchema>
export type Milestone = z.infer<typeof milestoneSchema>
export type Streak = z.infer<typeof streakSchema>

export type ExportLevel = z.infer<typeof levelSchema>
export type ExportVariable = z.infer<typeof variableSchema>
export type ExportAchievement = z.infer<typeof achievementSchema>
export type ExportConfigV1_0 = z.infer<typeof exportSchemaV1_0>
export type ExportConfigV1_1 = z.infer<typeof exportSchemaV1_1>
export type ExportConfig = z.infer<typeof importSchema>
