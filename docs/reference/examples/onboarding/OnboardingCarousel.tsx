// from crayons@0.0.194 — components/onboarding/OnboardingCarousel.tsx — READ ONLY
import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  useEvent,
  useHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";

import { Button } from "../button";
import { ContentColumn } from "../content-column";
import { Text } from "../text";
import { PaginationDots } from "./PaginationDots";
import { ContentSlide } from "./slides/ContentSlide";
import { CustomSlide } from "./slides/CustomSlide";
import { NotificationPermissionSlide } from "./slides/NotificationPermissionSlide";
import { PermissionSlide } from "./slides/PermissionSlide";
import { VideoSlide } from "./slides/VideoSlide";
import type { OnboardingCarouselProps } from "./types";

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

interface PageScrollEvent {
  position: number;
  offset: number;
}

const usePageScrollHandler = (handlers: {
  onPageScroll: (event: PageScrollEvent, context: Record<string, unknown>) => void;
}) => {
  const { context, doDependenciesDiffer } = useHandler(handlers);
  return useEvent(
    (event) => {
      "worklet";
      handlers.onPageScroll(event as unknown as PageScrollEvent, context);
    },
    ["onPageScroll"],
    doDependenciesDiffer,
  );
};

export const OnboardingCarousel = ({
  screens,
  onComplete,
  onSkip,
  showSkip = true,
  showProgress = true,
  isReplay = false,
  testID,
}: OnboardingCarouselProps) => {
  const pagerRef = useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const progress = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const pageScrollHandler = usePageScrollHandler({
    onPageScroll: (e) => {
      "worklet";
      progress.value = e.position + e.offset;
    },
  });

  const goToIndex = useCallback((index: number) => {
    setPermissionGranted(false);
    pagerRef.current?.setPage(index);
  }, []);

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setCurrentIndex(e.nativeEvent.position);
    },
    [],
  );

  const goToNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next < screens.length) {
      goToIndex(next);
    } else {
      onComplete();
    }
  }, [currentIndex, screens.length, onComplete, goToIndex]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const currentScreen = screens[currentIndex];
  const isLastScreen = currentIndex === screens.length - 1;
  const isFirstScreen = currentIndex === 0;
  const isPermissionScreen =
    currentScreen.type === "permission" ||
    currentScreen.type === "notification-permission";
  const disableSwipe = "disableSwipe" in currentScreen && currentScreen.disableSwipe;
  const hideFooterButton =
    "hideFooterButton" in currentScreen && currentScreen.hideFooterButton;

  const getButtonText = () => {
    if (isPermissionScreen && !permissionGranted) return "Continue without";
    if (
      isPermissionScreen &&
      permissionGranted &&
      "grantedButtonText" in currentScreen &&
      currentScreen.grantedButtonText
    ) {
      return currentScreen.grantedButtonText;
    }
    if ("buttonText" in currentScreen && currentScreen.buttonText) {
      return currentScreen.buttonText;
    }
    return isLastScreen ? "Get Started" : "Next";
  };

  return (
    <View style={styles.container} testID={testID}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        {!isFirstScreen ? (
          <TouchableOpacity
            onPress={goToPrev}
            hitSlop={16}
            style={styles.backButton}
            testID={testID ? `${testID}-back` : undefined}
          >
            <MaterialIcons name="arrow-back-ios" size={20} color="grey" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        {showSkip && onSkip ? (
          <TouchableOpacity
            onPress={onSkip}
            hitSlop={16}
            testID={testID ? `${testID}-skip` : undefined}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <ContentColumn>
        <AnimatedPagerView
        ref={pagerRef}
        style={styles.carousel}
        initialPage={0}
        scrollEnabled={!disableSwipe}
        onPageScroll={pageScrollHandler}
        onPageSelected={onPageSelected}
      >
        {screens.map((screen, index) => (
          <View key={index} style={styles.slide} testID={testID ? `${testID}-slide-${index}` : undefined}>
            {screen.type === "content" && (
              <ContentSlide
                title={screen.title}
                content={screen.content}
                image={screen.image}
              />
            )}
            {screen.type === "video" && (
              <VideoSlide
                source={screen.source}
                title={screen.title}
                subtitle={screen.subtitle}
                isActive={index === currentIndex}
              />
            )}
            {screen.type === "permission" && (
              <PermissionSlide
                permission={screen.permission}
                title={screen.title}
                subtitle={screen.subtitle}
                icon={screen.icon}
                buttonText={screen.buttonText}
                grantedTitle={screen.grantedTitle}
                grantedSubtitle={screen.grantedSubtitle}
                onGrant={screen.onGrant}
                onCheckStatus={screen.onCheckStatus}
                onNext={goToNext}
                autoAdvance={!isReplay}
                onStatusChange={setPermissionGranted}
              />
            )}
            {screen.type === "notification-permission" && (
              <NotificationPermissionSlide
                title={screen.title}
                subtitle={screen.subtitle}
                grantedTitle={screen.grantedTitle}
                grantedSubtitle={screen.grantedSubtitle}
                onNext={goToNext}
                autoAdvance={!isReplay}
                onStatusChange={setPermissionGranted}
              />
            )}
            {screen.type === "custom" && (
              <CustomSlide component={screen.component} onNext={goToNext} />
            )}
          </View>
        ))}
      </AnimatedPagerView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {showProgress && screens.length > 1 && (
          <PaginationDots count={screens.length} progress={progress} />
        )}

        {!hideFooterButton && (
          <View style={styles.buttonContainer}>
            <Button
              preset="neutral"
              onPress={goToNext}
              testID={testID ? `${testID}-next` : undefined}
            >
              {getButtonText()}
            </Button>
          </View>
        )}
        </View>
      </ContentColumn>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
  },
  skipText: { color: "grey", fontSize: 16 },
  carousel: { flex: 1 },
  slide: { flex: 1 },
  footer: {
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 20,
  },
  buttonContainer: {
    paddingHorizontal: 4,
  },
});
