// from crayons@0.0.194 — components/onboarding/slides/NotificationPermissionSlide.tsx — READ ONLY
import { useEffect, useRef, useState } from "react";
import { AppState, Linking, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Text } from "../../text";
import { Button } from "../../button";
import * as Notifications from "expo-notifications";

interface Props {
  title: string;
  subtitle?: string;
  grantedTitle?: string;
  grantedSubtitle?: string;
  onNext: () => void;
  autoAdvance?: boolean;
  onStatusChange?: (granted: boolean) => void;
}

type Status = "checking" | "idle" | "granted" | "blocked" | "denied";

export const NotificationPermissionSlide = ({
  title,
  subtitle,
  grantedTitle = "Notifications enabled",
  grantedSubtitle,
  onNext,
  autoAdvance = true,
  onStatusChange,
}: Props) => {
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  // Check initial permission status
  useEffect(() => {
    (async () => {
      const result = await Notifications.getPermissionsAsync();
      if (result.status === "granted") {
        setStatus("granted");
        onStatusChange?.(true);
        if (autoAdvance) setTimeout(onNext, 600);
      } else if (result.canAskAgain === false) {
        setStatus("blocked");
      } else {
        setStatus("idle");
      }
    })();
  }, []);

  // Re-check when returning from Settings (only when blocked)
  useEffect(() => {
    if (status !== "blocked") return;

    const sub = AppState.addEventListener("change", async (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        const result = await Notifications.getPermissionsAsync();
        if (result.status === "granted") {
          setStatus("granted");
          onStatusChange?.(true);
          if (autoAdvance) setTimeout(onNext, 600);
        }
      }
      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [status, onNext]);

  const handleGrant = async () => {
    setLoading(true);
    try {
      const result = await Notifications.requestPermissionsAsync();
      if (result.status === "granted") {
        setStatus("granted");
        onStatusChange?.(true);
        setTimeout(onNext, 600);
      } else if (result.canAskAgain === false) {
        setStatus("blocked");
      } else {
        setStatus("denied");
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "checking") return null;

  return (
    <View style={styles.container}>
      <Text preset="subheading" style={styles.title}>
        {status === "granted" ? grantedTitle : title}
      </Text>

      <View style={styles.iconContainer}>
        {status === "granted" ? (
          <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
        ) : (
          <MaterialIcons name="notifications" size={80} color="#FFC928" />
        )}
      </View>

      {status !== "granted" && subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      {status === "granted" && grantedSubtitle && (
        <Text style={styles.subtitle}>{grantedSubtitle}</Text>
      )}

      {status === "blocked" && (
        <Text style={styles.hintText}>
          Permission was previously denied. You can enable it in Settings.
        </Text>
      )}

      {(status === "idle" || status === "denied") && (
        <View style={styles.actions}>
          <Button onPress={handleGrant} loading={loading}>
            Allow Notifications
          </Button>
        </View>
      )}

      {status === "blocked" && (
        <View style={styles.actions}>
          <Button onPress={() => Linking.openSettings()}>Open Settings</Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: { marginBottom: 24 },
  title: { textAlign: "center", marginBottom: 24 },
  hintText: {
    textAlign: "center",
    color: "grey",
    marginBottom: 24,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  actions: { width: "100%", gap: 16, alignItems: "center" },
});
