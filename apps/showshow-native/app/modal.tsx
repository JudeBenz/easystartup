import { StatusBar } from "expo-status-bar";
import { Platform, Pressable, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";

import { Text, View } from "@/components/Themed";
import { API_URL } from "@/lib/config";

export default function AboutModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ShowShow</Text>
      <Text style={styles.body}>
        Native directory of US art fairs from official show sites. This is not a website wrapper. Join and
        manage applications on the public site if you need the full artist tools.
      </Text>
      <Pressable onPress={() => void WebBrowser.openBrowserAsync(API_URL)} style={styles.link}>
        <Text style={styles.linkLabel}>Open showshow.vercel.app</Text>
      </Pressable>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  body: { fontSize: 17, lineHeight: 24 },
  link: { minHeight: 48, justifyContent: "center" },
  linkLabel: { fontSize: 16, fontWeight: "700", color: "#1E3D32" },
});
