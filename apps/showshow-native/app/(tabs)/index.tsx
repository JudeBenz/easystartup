import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { formatDate, formatMoney, listShows, type ShowListItem } from "@/lib/api";

export default function ShowsScreen() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? "light"];
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [shows, setShows] = useState<ShowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listShows(q);
      setShows(data.shows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load shows.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(query);
    }, [load, query]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.searchRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => setQuery(draft.trim())}
          placeholder="Name, city, or state"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.search, { color: colors.text, borderColor: "#C9D2CC" }]}
        />
        <Pressable
          onPress={() => setQuery(draft.trim())}
          style={[styles.searchBtn, { backgroundColor: colors.masthead }]}
        >
          <Text style={styles.searchBtnLabel}>Search</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !shows.length ? (
        <ActivityIndicator style={styles.spinner} color={colors.tint} />
      ) : (
        <FlatList
          data={shows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void load(query)} tintColor={colors.tint} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              {query ? `No shows match “${query}”.` : "No upcoming fairs in the directory yet."}
            </Text>
          }
          renderItem={({ item }) => {
            const fee = formatMoney(item.boothFeeMin);
            const dates =
              item.startDate && item.endDate
                ? `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`
                : null;
            return (
              <Pressable
                onPress={() => router.push(`/show/${item.slug}`)}
                style={styles.row}
              >
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.meta, { color: colors.muted }]}>
                  {item.city}, {item.region}
                  {dates ? ` · ${dates}` : ""}
                </Text>
                {fee ? (
                  <Text style={[styles.fee, { color: colors.text }]}>
                    Booth {fee}
                    {item.boothFeeMax && item.boothFeeMax !== item.boothFeeMin
                      ? `–${formatMoney(item.boothFeeMax)}`
                      : ""}
                  </Text>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  search: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  searchBtn: { minHeight: 48, justifyContent: "center", paddingHorizontal: 14, borderRadius: 8 },
  searchBtnLabel: { color: "#F4F0E6", fontWeight: "700" },
  spinner: { marginTop: 40 },
  list: { paddingBottom: 32 },
  row: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#D5DDD8" },
  name: { fontSize: 20, fontWeight: "700", lineHeight: 24 },
  meta: { marginTop: 6, fontSize: 16 },
  fee: { marginTop: 6, fontSize: 16, fontWeight: "600" },
  empty: { padding: 24, fontSize: 16 },
  error: { paddingHorizontal: 16, color: "#8B2E2E", fontSize: 16 },
});
