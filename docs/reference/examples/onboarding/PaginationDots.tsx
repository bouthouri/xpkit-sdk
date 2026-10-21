// from crayons@0.0.194 — components/onboarding/PaginationDots.tsx — READ ONLY
import { View, StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

const DOT_SIZE = 10;

const Dot = ({
  index,
  animValue,
}: {
  index: number;
  animValue: SharedValue<number>;
}) => {
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          animValue.value,
          [index - 1, index, index + 1],
          [-DOT_SIZE, 0, DOT_SIZE],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <View style={styles.dotOuter}>
      <Animated.View style={[styles.dotInner, animStyle]} />
    </View>
  );
};

export const PaginationDots = ({
  count,
  progress,
}: {
  count: number;
  progress: SharedValue<number>;
}) => (
  <View style={styles.container}>
    {Array.from({ length: count }, (_, i) => (
      <Dot key={i} index={i} animValue={progress} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  dotOuter: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "#E0E0E0",
    overflow: "hidden",
  },
  dotInner: {
    flex: 1,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: "grey",
  },
});
