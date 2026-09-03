import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Link, useFocusEffect } from "expo-router";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { login, me, type MobileUser } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/session";

export default function AccountScreen() {
  const colors = Colors[useColorScheme() ?? "light"];
  const [user, setUser] = useState<MobileUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const data = await me();
      setUser(data.user);
    } catch {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void restore();
    }, [restore]),
  );

  async function onSignIn() {
    setBusy(true);
    setError(null);
    try {
      const data = await login(email.trim(), password);
      await setToken(data.token);
      setUser(data.user);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    await clearToken();
    setUser(null);
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.tint} />
      </View>
    );
  }

  if (user) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>{user.name}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{user.email}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          {user.roles.length ? user.roles.join(", ") : "showgoer"}
        </Text>
        <Pressable onPress={() => void onSignOut()} style={[styles.button, styles.secondary]}>
          <Text style={[styles.buttonLabel, { color: colors.text }]}>Sign out</Text>
        </Pressable>
        <Link href="/modal" asChild>
          <Pressable style={styles.link}>
            <Text style={[styles.linkLabel, { color: colors.tint }]}>About this app</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Sign in</Text>
      <Text style={[styles.meta, { color: colors.muted }]}>
        Same ShowShow account as the website. Browse shows without signing in.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text }]}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="Password"
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text }]}
      />
      <Pressable
        onPress={() => void onSignIn()}
        disabled={busy}
        style={[styles.button, { backgroundColor: colors.masthead, opacity: busy ? 0.6 : 1 }]}
      >
        <Text style={styles.buttonOnDark}>{busy ? "Signing in…" : "Sign in"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  meta: { fontSize: 16, lineHeight: 22 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#C9D2CC",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  button: { minHeight: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 8 },
  secondary: { borderWidth: 1, borderColor: "#C9D2CC", backgroundColor: "transparent" },
  buttonLabel: { fontSize: 16, fontWeight: "700" },
  buttonOnDark: { color: "#F4F0E6", fontSize: 16, fontWeight: "700" },
  error: { color: "#8B2E2E", fontSize: 16 },
  link: { minHeight: 48, justifyContent: "center" },
  linkLabel: { fontSize: 16, fontWeight: "700" },
});
