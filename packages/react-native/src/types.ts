import type { AssetMap, Engine, EngineEvent, EngineSignal, StorageAdapter, XPKitConfig } from '@xpkit-dev/core'

export interface XPKitHandlerContext {
  config: XPKitConfig
  assetMap: AssetMap
  storage: StorageAdapter
}

export interface XPKitHandlers {
  onOnboardingComplete?: () => void
  track?: (event: string, props?: EngineEvent) => void
  onSignal?: (signal: EngineSignal, context: XPKitHandlerContext) => void
  requestPermission?: (kind: string) => Promise<'granted' | 'denied' | 'blocked'>
  onEffect?: (effect: unknown, context: XPKitHandlerContext) => void
}

export interface XPKitProviderProps {
  config: XPKitConfig
  /**
   * Use this engine instead of creating one from `config` + `storage`. `config` is still
   * required: it is the source for achievement and level lookups.
   */
  engine?: Engine
  /** Optional. Gamification-only apps can omit it. */
  assetMap?: AssetMap
  /** Sync or async. Also used for onboarding and what's-new flags. */
  storage: StorageAdapter
  /** Current app version (semver string), used to gate the what's-new modal. */
  appVersion?: string
  handlers?: XPKitHandlers
  children?: React.ReactNode
}
