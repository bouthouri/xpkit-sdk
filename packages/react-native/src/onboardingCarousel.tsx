import * as React from 'react'
import { Dimensions, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { OnboardingScreen, AssetMap } from '@xpkit-dev/core'

export interface OnboardingCarouselProps {
  screens: OnboardingScreen[]
  assetMap: AssetMap
  onComplete: () => void
  requestPermission?: (kind: string) => Promise<'granted' | 'denied' | 'blocked'>
}

function resolveAsset(assetMap: AssetMap, key: string): unknown {
  return (assetMap as Record<string, unknown>)[key]
}

function ContentScreen({ screen, assetMap }: { screen: Extract<OnboardingScreen, { type: 'content' }>; assetMap: AssetMap }) {
  const imageSource = screen.image ? resolveAsset(assetMap, screen.image.key) : undefined
  return (
    <View style={styles.screen}>
      {imageSource ? (
        <Image source={imageSource as number} style={styles.image} />
      ) : null}
      <Text style={styles.title}>{screen.title}</Text>
      <Text style={styles.body}>{screen.body}</Text>
    </View>
  )
}

function VideoScreen({ screen }: { screen: Extract<OnboardingScreen, { type: 'video' }> }) {
  return (
    <View style={styles.screen}>
      {screen.title ? <Text style={styles.title}>{screen.title}</Text> : null}
      {screen.subtitle ? <Text style={styles.subtitle}>{screen.subtitle}</Text> : null}
    </View>
  )
}

function PermissionScreen({
  screen,
  onRequest,
}: {
  screen: Extract<OnboardingScreen, { type: 'permission' }>
  onRequest: () => void
}) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{screen.title}</Text>
      {screen.subtitle ? <Text style={styles.subtitle}>{screen.subtitle}</Text> : null}
      <Pressable style={styles.grantButton} onPress={onRequest} accessibilityRole="button">
        <Text style={styles.grantButtonText}>Allow</Text>
      </Pressable>
    </View>
  )
}

function NotificationScreen({
  screen,
  onRequest,
}: {
  screen: Extract<OnboardingScreen, { type: 'notification' }>
  onRequest: () => void
}) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{screen.title}</Text>
      {screen.subtitle ? <Text style={styles.subtitle}>{screen.subtitle}</Text> : null}
      <Pressable style={styles.grantButton} onPress={onRequest} accessibilityRole="button">
        <Text style={styles.grantButtonText}>Enable notifications</Text>
      </Pressable>
    </View>
  )
}

export function OnboardingCarousel({ screens, assetMap, onComplete, requestPermission }: OnboardingCarouselProps) {
  const [index, setIndex] = React.useState(0)
  const [width, setWidth] = React.useState(() => Dimensions.get('window').width - 48)
  const scrollRef = React.useRef<ScrollView>(null)

  if (screens.length === 0) return null

  const screen = screens[Math.min(index, screens.length - 1)]!
  const isLast = index === screens.length - 1

  function goTo(next: number) {
    setIndex(next)
    scrollRef.current?.scrollTo({ x: next * width, y: 0, animated: true })
  }

  function goNext() {
    if (isLast) {
      onComplete()
    } else {
      goTo(index + 1)
    }
  }

  async function handlePermissionRequest(kind: string) {
    await requestPermission?.(kind)
    goNext()
  }

  function renderScreen(item: OnboardingScreen) {
    switch (item.type) {
      case 'content':
        return <ContentScreen screen={item} assetMap={assetMap} />
      case 'video':
        return <VideoScreen screen={item} />
      case 'permission':
        return <PermissionScreen screen={item} onRequest={() => handlePermissionRequest(item.permission)} />
      case 'notification':
        return <NotificationScreen screen={item} onRequest={() => handlePermissionRequest('notifications')} />
    }
  }

  const isPermissionScreen = screen.type === 'permission' || screen.type === 'notification'
  const showNext = !isPermissionScreen && !screen.hideFooterButton
  const nextLabel = screen.buttonText ?? (isLast ? 'Get started' : 'Next')

  return (
    <Modal transparent animationType="slide" onRequestClose={onComplete}>
      <View style={styles.overlay}>
        <View
          style={styles.card}
          onLayout={(event: { nativeEvent: { layout: { width: number } } }) => {
            const next = event.nativeEvent.layout.width
            if (next > 0 && next !== width) setWidth(next)
          }}
        >
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={!screen.disableSwipe}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event: { nativeEvent: { contentOffset: { x: number } } }) => {
              const next = Math.round(event.nativeEvent.contentOffset.x / width)
              if (next >= 0 && next < screens.length) setIndex(next)
            }}
          >
            {screens.map(item => (
              <View key={item.id} testID={`xpkit-onboarding-${item.id}`} style={[styles.page, { width }]}>
                {renderScreen(item)}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.pageIndicator}>{index + 1} / {screens.length}</Text>
            {showNext && (
              <Pressable
                testID="xpkit-onboarding-next"
                accessibilityRole="button"
                style={styles.nextButton}
                onPress={goNext}
              >
                <Text style={styles.nextButtonText}>{nextLabel}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, width: '100%', overflow: 'hidden' },
  page: { padding: 24, justifyContent: 'center' },
  screen: { alignItems: 'center', gap: 16 },
  image: { width: '100%', height: 200, borderRadius: 8 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: '#111' },
  body: { fontSize: 16, textAlign: 'center', color: '#555', lineHeight: 24 },
  subtitle: { fontSize: 15, textAlign: 'center', color: '#777' },
  grantButton: { marginTop: 16, backgroundColor: '#007AFF', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
  grantButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  pageIndicator: { fontSize: 13, color: '#aaa' },
  nextButton: { backgroundColor: '#111', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  nextButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
})
