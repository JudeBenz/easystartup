import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { Text } from "@/components/Themed";
import { ShowRow } from "@/components/ShowRow";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { formatDate, listShows, type ShowListItem } from "@/lib/api";
import { groupByStartMonth, upcomingDeadlines } from "@/lib/show-filters";

export default function CalendarScreen() {
  const colors = Colors[useColorScheme() ?? "light"];
  const [shows, setShows] = useState<ShowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listShows();
      setShows(data.shows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the calendar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const deadlines = useMemo(() => upcomingDeadlines(shows), [shows]);
  const sections = useMemo(() => groupByStartMonth(shows), [shows]);

  if (loading && !shows.length) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <SectionList
      style={{ backgroundColor: colors.background }}
      sections={sections}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.tint} />}
      ListHeaderComponent={
        <View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={[styles.heading, { color: colors.text }]}>Application deadlines</Text>
          {!deadlines.length ? (
            <Text style={[styles.empty, { color: colors.muted }]}>
              No upcoming deadlines are published on official sites yet.
            </Text>
          ) : (
            deadlines.slice(0, 12).map((item) => (
              <ShowRow
                key={`deadline-${item.id}`}
                item={item}
                extra={item.applicationDeadline ? `Apply by ${formatDate(item.applicationDeadline)}` : null}
              />
            ))
          )}
          <Text style={[styles.heading, { color: colors.text }]}>Show dates</Text>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={[styles.month, { color: colors.tint, backgroundColor: colors.background }]}>{section.title}</Text>
      )}
      renderItem={({ item }) => <ShowRow item={item} />}
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.muted }]}>No dated editions in the directory yet.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center" },
  heading: { fontSize: 22, fontWeight: "700", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  month: { fontSize: 16, fontWeight: "700", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  empty: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  error: { paddingHorizontal: 16, paddingTop: 12, color: "#8B2E2E", fontSize: 16 },
});
