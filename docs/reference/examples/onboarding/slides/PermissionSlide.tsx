// from crayons@0.0.194 — components/onboarding/slides/PermissionSlide.tsx — READ ONLY
import { useEffect, useRef, useState } from "react";
import { AppState, Linking, StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Text } from "../../text";
import { Button } from "../../button";

interface Props {
  permission: string;
  title: string;
  subtitle?: string;
  icon?: string;
  buttonText?: string;
  grantedTitle?: string;
  grantedSubtitle?: string;
  onGrant?: () => Promise<void>;
  onCheckStatus?: () => Promise<"granted" | "denied" | "blocked">;
  onNext: () => void;
  autoAdvance?: boolean;
  onStatusChange?: (granted: boolean) => void;
}

type Status = "checking" | "idle" | "granted" | "blocked" | "denied";

export const PermissionSlide = ({
  title,
  subtitle,
  icon,
  buttonText = "Allow",
  grantedTitle = "Permission granted",
  grantedSubtitle,
  onGrant,
  onCheckStatus,
  onNext,
  autoAdvance = true,
  onStatusChange,
}: Props) => {
  const [status, setStatus] = useState<Status>(onCheckStatus ? "checking" : "idle");
  const [loading, setLoading] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  // Check initial status if checker provided
  useEffect(() => {
    if (!onCheckStatus) return;
    (async () => {
      const result = await onCheckStatus();
      if (result === "granted") {
        setStatus("granted");
        onStatusChange?.(true);
        if (autoAdvance) setTimeout(onNext, 600);
      } else if (result === "blocked") {
        setStatus("blocked");
      } else {
        setStatus("idle");
      }
    })();
  }, []);

  // Re-check when returning from Settings
  useEffect(() => {
    if (status !== "blocked" || !onCheckStatus) return;

    const sub = AppState.addEventListener("change", async (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        const result = await onCheckStatus();
        if (result === "granted") {
          setStatus("granted");
          onStatusChange?.(true);
          if (autoAdvance) setTimeout(onNext, 600);
        }
      }
      appStateRef.current = nextState;
    });

    return () => sub.remove();
  }, [status, onCheckStatus, onNext]);

  const handleGrant = async () => {
    setLoading(true);
    try {
      await onGrant?.();
      setStatus("granted");
      onStatusChange?.(true);
      setTimeout(onNext, 600);
    } catch {
      setStatus(onCheckStatus ? "blocked" : "denied");
    } finally {
      setLoading(false);
    }
  };

  const iconName =
    (icon as keyof typeof MaterialIcons.glyphMap) || "notifications";

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
          <MaterialIcons name={iconName} size={80} color="#FFC928" />
        )}
      </View>

      {status !== "granted" && status !== "blocked" && subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      {status === "granted" && grantedSubtitle && (
        <Text style={styles.subtitle}>{grantedSubtitle}</Text>
      )}

      {status === "blocked" && (
        <Text style={styles.hintText}>Permission was previously denied</Text>
      )}

      {(status === "idle" || status === "denied") && (
        <View style={styles.actions}>
          <Button onPress={handleGrant} disabled={loading}>
            {loading ? "Requesting..." : buttonText}
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
