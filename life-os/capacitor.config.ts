const config = {
  appId: "com.lifeos.app",
  appName: "Life OS",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
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
