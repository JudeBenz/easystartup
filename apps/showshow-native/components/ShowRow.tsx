import { Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { formatDate, formatMoney, type ShowListItem } from "@/lib/api";

export function ShowRow({
  item,
  extra,
}: {
  item: ShowListItem;
  extra?: string | null;
}) {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? "light"];
  const fee = formatMoney(item.boothFeeMin);
  const dates =
    item.startDate && item.endDate ? `${formatDate(item.startDate)} – ${formatDate(item.endDate)}` : null;

  return (
    <Pressable onPress={() => router.push(`/show/${item.slug}`)} style={styles.row}>
      <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>
        {item.city}, {item.region}
        {dates ? ` · ${dates}` : ""}
      </Text>
      {extra ? <Text style={[styles.meta, { color: colors.muted }]}>{extra}</Text> : null}
      {fee ? (
        <Text style={[styles.fee, { color: colors.text }]}>
          Booth {fee}
          {item.boothFeeMax && item.boothFeeMax !== item.boothFeeMin ? `–${formatMoney(item.boothFeeMax)}` : ""}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D5DDD8",
  },
  name: { fontSize: 20, fontWeight: "700", lineHeight: 24 },
  meta: { marginTop: 6, fontSize: 16 },
  fee: { marginTop: 6, fontSize: 16, fontWeight: "600" },
});
