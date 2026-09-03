import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";

import { Text } from "@/components/Themed";
import { ShowRow } from "@/components/ShowRow";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { listShows, type ShowListItem } from "@/lib/api";
import { listSavedSlugs } from "@/lib/saved";

export default function SavedScreen() {
  const colors = Colors[useColorScheme() ?? "light"];
  const [shows, setShows] = useState<ShowListItem[]>([]);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, saved] = await Promise.all([listShows(), listSavedSlugs()]);
      setShows(data.shows);
      setSlugs(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load saved shows.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const savedShows = useMemo(
    () => slugs.map((slug) => shows.find((show) => show.slug === slug)).filter((show): show is ShowListItem => Boolean(show)),
    [shows, slugs],
  );

  if (loading && !shows.length) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      data={savedShows}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.tint} />}
      ListHeaderComponent={
        error ? <Text style={styles.error}>{error}</Text> : null
      }
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.muted }]}>
          Heart a fair on its page and it stays on this phone. We do not invent a season for you.
        </Text>
      }
      renderItem={({ item }) => <ShowRow item={item} />}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center" },
  empty: { padding: 24, fontSize: 16, lineHeight: 22 },
  error: { paddingHorizontal: 16, paddingTop: 12, color: "#8B2E2E", fontSize: 16 },
});
