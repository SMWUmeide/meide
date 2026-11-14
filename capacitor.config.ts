import type { CapacitorConfig } from "@capacitor/cli";

// Development identity only. Final applicationId is configured in Android Gradle.
const config: CapacitorConfig = {
  appId: process.env.MEIDE_APPLICATION_ID || "app.meide.preview",
  appName: "meide",
  webDir: "dist",
  plugins: { SystemBars: { insetsHandling: "css", initialViewportFitValueHint: "cover", style: "LIGHT" } },
  android: { allowMixedContent: false },
};
export default config;
