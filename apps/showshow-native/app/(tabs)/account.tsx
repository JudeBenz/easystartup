import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Link, useFocusEffect } from "expo-router";

import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { login, me, register, type MobileUser } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/session";

type Mode = "signin" | "join";

export default function AccountScreen() {
  const colors = Colors[useColorScheme() ?? "light"];
  const [user, setUser] = useState<MobileUser | null>(null);
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("artist");
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

  async function onJoin() {
    setBusy(true);
    setError(null);
    try {
      const data = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      await setToken(data.token);
      setUser(data.user);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>{mode === "join" ? "Join ShowShow" : "Sign in"}</Text>
        <Text style={[styles.meta, { color: colors.muted }]}>
          Same account as the website. Browse the directory without signing in.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mode === "join" ? (
          <TextInput
            value={name}
            onChangeText={setName}
            autoComplete="name"
            placeholder="Full name"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.text }]}
          />
        ) : null}
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
          autoComplete={mode === "join" ? "new-password" : "password"}
          placeholder={mode === "join" ? "Password (8+ characters)" : "Password"}
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
        />
        {mode === "join" ? (
          <View style={styles.roles}>
            {(
              [
                ["artist", "Artist"],
                ["director", "Director"],
                ["showgoer", "Showgoer"],
              ] as const
            ).map(([id, label]) => (
              <Pressable
                key={id}
                onPress={() => setRole(id)}
                style={[
                  styles.role,
                  role === id
                    ? { backgroundColor: colors.masthead }
                    : { borderColor: "#C9D2CC", borderWidth: 1 },
                ]}
              >
                <Text style={{ color: role === id ? "#F4F0E6" : colors.text, fontWeight: "700" }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Pressable
          onPress={() => void (mode === "join" ? onJoin() : onSignIn())}
          disabled={busy}
          style={[styles.button, { backgroundColor: colors.masthead, opacity: busy ? 0.6 : 1 }]}
        >
          <Text style={styles.buttonOnDark}>
            {busy ? "Working…" : mode === "join" ? "Create account" : "Sign in"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setMode(mode === "join" ? "signin" : "join");
            setError(null);
          }}
          style={styles.link}
        >
          <Text style={[styles.linkLabel, { color: colors.tint }]}>
            {mode === "join" ? "Already have an account? Sign in" : "Need an account? Join"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, padding: 20, gap: 12 },
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
  roles: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  role: { minHeight: 40, paddingHorizontal: 12, borderRadius: 8, justifyContent: "center" },
  button: { minHeight: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 8 },
  secondary: { borderWidth: 1, borderColor: "#C9D2CC", backgroundColor: "transparent" },
  buttonLabel: { fontSize: 16, fontWeight: "700" },
  buttonOnDark: { color: "#F4F0E6", fontSize: 16, fontWeight: "700" },
  error: { color: "#8B2E2E", fontSize: 16 },
  link: { minHeight: 48, justifyContent: "center" },
  linkLabel: { fontSize: 16, fontWeight: "700" },
});
