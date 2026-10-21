import * as React from 'react'
import {
  createEngine,
  type AssetMap,
  type Engine,
  type EngineEvent,
  type EngineSignal,
  type EngineState,
  type StorageAdapter,
  type XPKitConfig,
} from '@xpkit-dev/core'
import type { XPKitHandlerContext, XPKitHandlers, XPKitProviderProps } from './types.js'

interface XPKitContextValue {
  engine: Engine
  emit: (event: EngineEvent) => void
  state: EngineState
  config: XPKitConfig
  assetMap: AssetMap
  storage: StorageAdapter
  appVersion?: string
  handlers?: XPKitHandlers
}

// getState() returns a fresh copy each call; keep the previous reference when nothing
// changed so a no-op refresh does not re-render the tree.
function keepIfEqual(prev: EngineState, next: EngineState): EngineState {
  return JSON.stringify(prev) === JSON.stringify(next) ? prev : next
}

const EMPTY_ASSET_MAP: AssetMap = {}

const XPKitContext = React.createContext<XPKitContextValue | null>(null)

export function XPKitProvider({ config, engine: externalEngine, assetMap = EMPTY_ASSET_MAP, storage, appVersion, handlers, children }: XPKitProviderProps) {
  const engine = React.useMemo<Engine>(
    () => externalEngine ?? createEngine(config, { storage }),
    [externalEngine, config, storage],
  )
  const [state, setState] = React.useState<EngineState>(() => engine.getState())

  const handlerContext = React.useMemo<XPKitHandlerContext>(() => ({
    config,
    assetMap,
    storage,
  }), [assetMap, config, storage])

  // Async storage: the engine hydrates after mount. Refresh once it is ready.
  React.useEffect(() => {
    let active = true
    setState(prev => keepIfEqual(prev, engine.getState()))
    engine.ready.then(
      () => {
        if (active) setState(prev => keepIfEqual(prev, engine.getState()))
      },
      () => {},
    )
    return () => {
      active = false
    }
  }, [engine])

  // Install signal handlers before child passive effects can emit/flush events.
  React.useLayoutEffect(() => {
    return engine.subscribe((signal: EngineSignal) => {
      setState(engine.getState())
      handlers?.onSignal?.(signal, handlerContext)
      if (signal.type === 'milestoneReached') {
        handlers?.onEffect?.(signal.effect, handlerContext)
      }
    })
  }, [engine, handlerContext, handlers])

  const emit = React.useCallback((event: EngineEvent) => {
    engine.emit(event)
    setState(engine.getState())
    handlers?.track?.(event.type, event)
  }, [engine, handlers])

  const contextValue = React.useMemo<XPKitContextValue>(() => ({
    engine,
    emit,
    state,
    config,
    assetMap,
    storage,
    appVersion,
    handlers,
  }), [engine, emit, state, config, assetMap, storage, appVersion, handlers])

  return (
    <XPKitContext.Provider value={contextValue}>
      {children}
    </XPKitContext.Provider>
  )
}

export function useXPKit() {
  const context = React.useContext(XPKitContext)
  if (!context) {
    throw new Error('useXPKit must be used within XPKitProvider')
  }
  return context
}
