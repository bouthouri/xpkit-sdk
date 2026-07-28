// from crayons@0.0.194 — components/onboarding/slides/VideoSlide.tsx — READ ONLY
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../text";
import { useVideoPlayer, type VideoPlayer, VideoView } from "expo-video";
import { useEffect, useState } from "react";
import { AppState, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";

import type { VideoSource } from "../types";

interface VideoTrackSize {
  width: number;
  height: number;
}

interface SourceLoadPayload {
  availableVideoTracks?: Array<{ size?: VideoTrackSize }>;
}

interface Props {
  source: VideoSource;
  title?: string;
  subtitle?: string;
  isActive?: boolean;
}

export const VideoSlide = ({ source, title, subtitle, isActive = true }: Props) => {
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Playback controller: active/inactive gating + timing race retry + foreground resume
  useEffect(() => {
    if (!isActive) {
      player.pause();
      return;
    }
    if (player.status === "readyToPlay") player.play();

    const statusSub = (player as VideoPlayer).addListener(
      "statusChange",
      ({ status }: { status: string }) => {
        if (status === "readyToPlay") player.play();
      },
    );
    const appSub = AppState.addEventListener("change", (s) => {
      if (s === "active" && player.status === "readyToPlay") player.play();
    });
    return () => {
      statusSub.remove();
      appSub.remove();
    };
  }, [isActive, player]);

  // Track actual playing state for play button overlay
  useEffect(() => {
    const sub = (player as VideoPlayer).addListener(
      "playingChange",
      ({ isPlaying: playing }: { isPlaying: boolean }) => {
        setIsPlaying(playing);
      },
    );
    return () => sub.remove();
  }, [player]);

  // Aspect ratio detection from video metadata
  useEffect(() => {
    const subscription = (player as VideoPlayer).addListener(
      "sourceLoad",
      (payload: SourceLoadPayload) => {
        const track = payload?.availableVideoTracks?.[0];
        if (track?.size?.width && track?.size?.height) {
          setVideoAspectRatio(track.size.width / track.size.height);
        }
      },
    );
    return () => subscription.remove();
  }, [player]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {title && (
        <Text preset="subheading" style={styles.title}>
          {title}
        </Text>
      )}
      <View
        style={[
          styles.videoWrapper,
          videoAspectRatio ? { aspectRatio: videoAspectRatio } : { flex: 1 },
        ]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setLayout({ width, height });
        }}
      >
        {layout.width > 0 && (
          <Pressable
            onPress={() => player.play()}
            style={{ width: layout.width, height: layout.height }}
          >
            <VideoView
              player={player}
              style={{ width: layout.width, height: layout.height }}
              contentFit="contain"
              nativeControls={false}
            />
            {isActive && !isPlaying && (
              <Animated.View exiting={FadeOut.duration(300)} style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Ionicons name="play" size={32} color="white" style={{ marginLeft: 3 }} />
                </View>
              </Animated.View>
            )}
          </Pressable>
        )}
      </View>
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  videoWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 24,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
