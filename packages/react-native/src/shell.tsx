import * as React from 'react'
import { useXPKit } from './provider.js'
import { useWhatsNew } from './useWhatsNew.js'
import { WhatsNew } from './whatsNew.js'
import { useOnboarding } from './useOnboarding.js'
import { OnboardingCarousel } from './onboardingCarousel.js'

export function XPKit() {
  const { config, assetMap, storage, appVersion, handlers } = useXPKit()

  const { visible: onboardingVisible, dismiss: dismissOnboarding } = useOnboarding(
    config.onboarding.screens.length > 0,
    storage,
  )

  const { visible: whatsNewVisible, unseenEntries, dismiss: dismissWhatsNew } = useWhatsNew(
    config.announcements,
    appVersion ?? '',
    storage,
  )

  function handleOnboardingComplete() {
    dismissOnboarding()
    handlers?.onOnboardingComplete?.()
  }

  if (onboardingVisible) {
    return (
      <OnboardingCarousel
        screens={config.onboarding.screens}
        assetMap={assetMap}
        onComplete={handleOnboardingComplete}
        requestPermission={handlers?.requestPermission}
      />
    )
  }

  if (appVersion && whatsNewVisible) {
    return <WhatsNew entries={unseenEntries} assetMap={assetMap} onDismiss={dismissWhatsNew} />
  }

  return null
}
