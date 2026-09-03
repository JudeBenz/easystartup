# ShowShow native app

Expo app for the ShowShow art-fair directory. Native screens talk to JSON APIs on the website. This is not a WebView of `showshow.vercel.app`.

## Run on a phone (Expo Go)

1. Website APIs must be live at `https://showshow.vercel.app/api/v1/shows`.
2. From this folder: `pnpm start` (or `npx expo start`).
3. Scan the QR code with Expo Go (Android) or the Camera app (iOS, with Expo Go installed).
4. Optional: `EXPO_PUBLIC_API_URL=https://showshow.vercel.app` (that is the default).

Windows can run Expo Go against a phone on the same Wi-Fi. `pnpm run ios` needs macOS.

## App Store / TestFlight

Apple will not accept Expo Go. You need:

1. An **Active** Apple Developer Program membership ($99/year), enrolled on a Mac or in the Apple Developer iOS app.
2. An EAS build that produces a real `.ipa`, then TestFlight.

```sh
npx eas-cli login
npx eas-cli build --platform ios --profile preview
```

Do not wrap the Vercel site in WKWebView/Capacitor and submit that as the app.
