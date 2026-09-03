import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import { Text } from "@/components/Themed";
import { ShowRow } from "@/components/ShowRow";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { listShows, formatDate, type ShowListItem } from "@/lib/api";
import { openDeadline, overlappingThisMonth } from "@/lib/show-filters";

type Filter = "all" | "month" | "deadlines";

export default function ShowsScreen() {
  const colors = Colors[useColorScheme() ?? "light"];
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
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

  const visible = useMemo(() => {
    if (filter === "month") return shows.filter((show) => overlappingThisMonth(show));
    if (filter === "deadlines") return shows.filter((show) => openDeadline(show));
    return shows;
  }, [filter, shows]);

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chips}
      >
        {(
          [
            ["all", "All"],
            ["month", "This month"],
            ["deadlines", "Open deadlines"],
          ] as const
        ).map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => setFilter(id)}
            style={[
              styles.chip,
              filter === id
                ? { backgroundColor: colors.masthead }
                : { borderColor: "#C9D2CC", borderWidth: 1 },
            ]}
          >
            <Text style={{ color: filter === id ? "#F4F0E6" : colors.text, fontWeight: "700" }}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !shows.length ? (
        <ActivityIndicator style={styles.spinner} color={colors.tint} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void load(query)} tintColor={colors.tint} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.muted }]}>
              {query
                ? `No shows match “${query}”.`
                : filter === "deadlines"
                  ? "No upcoming application deadlines are published yet."
                  : filter === "month"
                    ? "No fairs listed this month."
                    : "No upcoming fairs in the directory yet."}
            </Text>
          }
          renderItem={({ item }) => (
            <ShowRow
              item={item}
              extra={
                filter === "deadlines" && item.applicationDeadline
                  ? `Apply by ${formatDate(item.applicationDeadline)}`
                  : null
              }
            />
          )}
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
  chipRow: { flexGrow: 0 },
  chips: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, alignItems: "center" },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, justifyContent: "center" },
  spinner: { marginTop: 40 },
  list: { paddingBottom: 32 },
  empty: { padding: 24, fontSize: 16 },
  error: { paddingHorizontal: 16, color: "#8B2E2E", fontSize: 16 },
});
