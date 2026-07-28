// from crayons@0.0.194 — components/onboarding/slides/ContentSlide.tsx — READ ONLY
import { ReactNode } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { Text } from "../../text";

interface Props {
  title: string;
  content: string;
  image?: ReactNode;
}

export const ContentSlide = ({ title, content, image }: Props) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text preset="subheading" style={styles.title}>
        {title}
      </Text>
      {image && <View style={styles.imageContainer}>{image}</View>}
      <Text style={styles.content}>{content}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageContainer: { marginBottom: 24 },
  title: { textAlign: "center", paddingTop: 16, marginBottom: 24 },
  content: { textAlign: "center", lineHeight: 22 },
});
