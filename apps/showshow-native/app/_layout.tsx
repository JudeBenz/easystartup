import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const park = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: "#1E3D32",
      background: "#F4F0E6",
      card: "#1E3D32",
      text: "#F4F0E6",
      border: "#2A4F42",
      notification: "#1E3D32",
    },
  };
  const parkDark = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: "#C5D5C8",
      background: "#10241C",
      card: "#152920",
      text: "#F4F0E6",
      border: "#2A4F42",
    },
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? parkDark : park}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="show/[slug]" options={{ title: "Show", headerBackTitle: "Shows" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "About" }} />
      </Stack>
    </ThemeProvider>
  );
}
