// from progres/apps/mobile/components/achievements/achievement-list.tsx — READ ONLY
import { View, FlatList, StyleSheet } from "react-native";
import { AchievementBadge } from "./achievement-badge";
import { Achievement } from "./types";

interface BadgeListProps {
  achievements: Achievement[];
}

export const BadgeList = ({ achievements }: BadgeListProps) => {
  const renderAchievement = ({
    item,
    index,
  }: {
    item: Achievement;
    index: number;
  }) => {
    return (
      <View
        style={[
          styles.badgeContainer,
          index % 2 === 0 ? styles.leftBadge : styles.rightBadge,
        ]}
      >
        <AchievementBadge achievement={item} />
      </View>
    );
  };

  return (
    <FlatList
      data={achievements}
      renderItem={renderAchievement}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.row}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  row: {
    justifyContent: "space-between",
  },
  badgeContainer: {
    flex: 1,
  },
  leftBadge: {
    marginRight: 5,
  },
  rightBadge: {
    marginLeft: 5,
  },
});
