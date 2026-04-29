import { useConvex } from "convex/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, spacing } from "@/theme/tokens";

// "Reconnecting…" banner shown when the Convex WebSocket has dropped
// after a previous successful connect. Subscribed via the client's
// `subscribeToConnectionState` callback so the indicator flips
// instantly without polling.
//
// We only show the banner once we've ever connected — otherwise a
// fresh app launch would flash this during the initial handshake.
export function ConnectionBanner() {
  const client = useConvex();
  const { t } = useTranslation();
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    const initial = client.connectionState();
    setDisconnected(
      initial.hasEverConnected && !initial.isWebSocketConnected,
    );
    const unsubscribe = client.subscribeToConnectionState((state) => {
      setDisconnected(state.hasEverConnected && !state.isWebSocketConnected);
    });
    return unsubscribe;
  }, [client]);

  if (!disconnected) return null;

  return (
    <SafeAreaView edges={["top"]} pointerEvents="none" style={styles.wrap}>
      <View style={styles.banner}>
        <Text style={styles.text}>{t("network.reconnecting")}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 100,
  },
  banner: {
    backgroundColor: colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.text2,
  },
});
