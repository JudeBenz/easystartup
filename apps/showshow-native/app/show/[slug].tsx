import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { formatDate, formatMoney, getShow, type ShowDetail } from "@/lib/api";

export default function ShowDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = Colors[useColorScheme() ?? "light"];
  const [show, setShow] = useState<ShowDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setError(null);
    try {
      const data = await getShow(slug);
      setShow(data.show);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this show.");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!show) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  const dates =
    show.startDate && show.endDate ? `${formatDate(show.startDate)} – ${formatDate(show.endDate)}` : "See official site";
  const booth = formatMoney(show.boothFeeMin);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: show.name }} />
      <Text style={[styles.city, { color: colors.muted }]}>
        {show.city}, {show.region}
        {show.year ? ` · ${show.year}` : ""}
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>{show.name}</Text>
      <Text style={[styles.body, { color: colors.text }]}>{dates}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{show.venueName ?? show.fullAddress}</Text>

      <Fact label="Booth fee" value={booth ?? "See official site"} />
      <Fact label="Application fee" value={formatMoney(show.applicationFee) ?? "—"} />
      <Fact label="Jury" value={show.juryProcess ? show.juryProcess.replaceAll("_", " ") : "—"} />
      <Fact
        label="Apply by"
        value={show.applicationDeadline ? formatDate(show.applicationDeadline) ?? "See official site" : "See official site"}
      />
      {show.directorName || show.directorEmail ? (
        <Fact
          label="Director"
          value={[show.directorName, show.directorEmail].filter(Boolean).join(" · ")}
        />
      ) : null}
      {show.attendance != null ? (
        <Fact label="Attendance" value={show.attendance.toLocaleString()} />
      ) : null}

      <Pressable
        onPress={() => void WebBrowser.openBrowserAsync(show.officialWebsiteUrl)}
        style={[styles.button, { backgroundColor: colors.masthead }]}
      >
        <Text style={styles.buttonLabel}>Official site</Text>
      </Pressable>
      <Pressable
        onPress={() => void WebBrowser.openBrowserAsync(show.officialApplyUrl)}
        style={[styles.button, styles.ghost]}
      >
        <Text style={[styles.ghostLabel, { color: colors.text }]}>Apply on official site</Text>
      </Pressable>
    </ScrollView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const colors = Colors[useColorScheme() ?? "light"];
  return (
    <View style={styles.fact}>
      <Text style={[styles.factLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.factValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: "center" },
  content: { padding: 20, paddingBottom: 48, gap: 10 },
  city: { fontSize: 16, fontWeight: "700" },
  title: { fontSize: 32, fontWeight: "700", lineHeight: 36 },
  body: { fontSize: 18, lineHeight: 24 },
  fact: { marginTop: 10 },
  factLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  factValue: { marginTop: 4, fontSize: 18, fontWeight: "600" },
  button: { minHeight: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 12 },
  ghost: { borderWidth: 1, borderColor: "#C9D2CC", backgroundColor: "transparent" },
  buttonLabel: { color: "#F4F0E6", fontSize: 16, fontWeight: "700" },
  ghostLabel: { fontSize: 16, fontWeight: "700" },
  error: { color: "#8B2E2E", fontSize: 16, textAlign: "center" },
});
