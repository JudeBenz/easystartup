import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { formatDate, formatMoney, getShow, type ShowDetail } from "@/lib/api";
import { isSaved, toggleSaved } from "@/lib/saved";

export default function ShowDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const colors = Colors[useColorScheme() ?? "light"];
  const [show, setShow] = useState<ShowDetail | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setError(null);
    try {
      const [data, heart] = await Promise.all([getShow(slug), isSaved(slug)]);
      setShow(data.show);
      setSaved(heart);
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
  const mapsQuery =
    show.lat != null && show.lng != null
      ? `${show.lat},${show.lng}`
      : encodeURIComponent(show.fullAddress || `${show.city}, ${show.region}`);
  const shareMessage = `${show.name} — ${show.city}, ${show.region}\n${dates}\n${show.officialWebsiteUrl}`;

  async function onToggleSave() {
    if (!slug) return;
    setSaved(await toggleSaved(slug));
  }

  async function onShare() {
    await Share.share({ message: shareMessage });
  }

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
      <Text style={[styles.body, { color: colors.muted }]}>{show.fullAddress}</Text>

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
      {show.directorPhone ? <Fact label="Phone" value={show.directorPhone} /> : null}
      {show.attendance != null ? (
        <Fact label="Attendance" value={show.attendance.toLocaleString()} />
      ) : null}

      {show.editions?.length ? (
        <View style={styles.block}>
          <Text style={[styles.factLabel, { color: colors.muted }]}>Year over year</Text>
          {show.editions.map((edition) => (
            <Text key={`${edition.year}-${edition.startDate}`} style={[styles.body, { color: colors.text }]}>
              {edition.year}: {formatDate(edition.startDate)} – {formatDate(edition.endDate)}
              {edition.boothFeeMin != null ? ` · booth from ${formatMoney(edition.boothFeeMin)}` : ""}
            </Text>
          ))}
        </View>
      ) : null}

      <Pressable onPress={() => void onToggleSave()} style={[styles.button, { backgroundColor: colors.masthead }]}>
        <Text style={styles.buttonLabel}>{saved ? "Saved to this phone" : "Save to this phone"}</Text>
      </Pressable>
      <Pressable
        onPress={() => void WebBrowser.openBrowserAsync(show.officialWebsiteUrl)}
        style={[styles.button, styles.ghost]}
      >
        <Text style={[styles.ghostLabel, { color: colors.text }]}>Official site</Text>
      </Pressable>
      <Pressable
        onPress={() => void WebBrowser.openBrowserAsync(show.officialApplyUrl)}
        style={[styles.button, styles.ghost]}
      >
        <Text style={[styles.ghostLabel, { color: colors.text }]}>Apply on official site</Text>
      </Pressable>
      <Pressable
        onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`)}
        style={[styles.button, styles.ghost]}
      >
        <Text style={[styles.ghostLabel, { color: colors.text }]}>Open in maps</Text>
      </Pressable>
      {show.directorEmail ? (
        <Pressable
          onPress={() => void Linking.openURL(`mailto:${show.directorEmail}`)}
          style={[styles.button, styles.ghost]}
        >
          <Text style={[styles.ghostLabel, { color: colors.text }]}>Email director</Text>
        </Pressable>
      ) : null}
      {show.directorPhone ? (
        <Pressable
          onPress={() => void Linking.openURL(`tel:${show.directorPhone}`)}
          style={[styles.button, styles.ghost]}
        >
          <Text style={[styles.ghostLabel, { color: colors.text }]}>Call director</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={() => void onShare()} style={[styles.button, styles.ghost]}>
        <Text style={[styles.ghostLabel, { color: colors.text }]}>Share this fair</Text>
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
  block: { marginTop: 12, gap: 6 },
  fact: { marginTop: 10 },
  factLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase" },
  factValue: { marginTop: 4, fontSize: 18, fontWeight: "600" },
  button: { minHeight: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 12 },
  ghost: { borderWidth: 1, borderColor: "#C9D2CC", backgroundColor: "transparent" },
  buttonLabel: { color: "#F4F0E6", fontSize: 16, fontWeight: "700" },
  ghostLabel: { fontSize: 16, fontWeight: "700" },
  error: { color: "#8B2E2E", fontSize: 16, textAlign: "center" },
});
