const LIVE_URL = process.env.CAPACITOR_SERVER_URL;

/**
 * Phone / tablet native shell.
 *
 * Set CAPACITOR_SERVER_URL=https://your-deploy.vercel.app so the app loads
 * the live website. Deploys update the phone instantly — no store resubmit.
 *
 * Leave unset for a bundled static build (webDir: "out") when you need offline.
 */
const config = {
  appId: "com.lifeos.app",
  appName: "Life OS",
  webDir: "out",
  ...(LIVE_URL
    ? {
        server: {
          url: LIVE_URL,
          cleartext: false,
          androidScheme: "https",
        },
      }
    : {
        server: {
          androidScheme: "https",
        },
      }),
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: "#0c1a3a",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c1a3a",
    },
  },
};

export default config;
