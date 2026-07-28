// from crayons@0.0.194 — components/onboarding/slides/CustomSlide.tsx — READ ONLY
import { ReactNode, isValidElement, cloneElement } from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  component: ReactNode;
  onNext: () => void;
}

export const CustomSlide = ({ component, onNext }: Props) => {
  return (
    <View style={styles.container}>
      {isValidElement(component)
        ? cloneElement(component as React.ReactElement<any>, { onNext })
        : component}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
