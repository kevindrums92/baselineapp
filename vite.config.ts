import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";
import { execSync } from "child_process";

// Get git commit hash at build time
function getGitHash(): string {
  // Heroku provides SOURCE_VERSION env var with full commit hash
  if (process.env.SOURCE_VERSION) {
    return process.env.SOURCE_VERSION.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

export default defineConfig(({ mode }) => {
  // Load ALL env vars from .env files (not just VITE_* prefixed)
  // This makes SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT available
  const env = loadEnv(mode, process.cwd(), "");

  return {
  build: {
    sourcemap: true, // Required for Sentry source maps
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || "0.0.0"),
    __GIT_HASH__: JSON.stringify(getGitHash()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: "autoUpdate",

      // Estos archivos deben existir en /public (en este caso /public/icons/*)
      includeAssets: [
        "icons/icon-16.png",
        "icons/icon-32.png",
        "icons/icon-180.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-192.png",
        "icons/maskable-512.png",
      ],

      manifest: {
        name: "BaselineApp",
        short_name: "BaselineApp",
        description: "Your baseline app template.",
        theme_color: "#3ED598",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        // App shell + assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
    }),

    // Sentry source maps upload (must be last plugin)
    // Only runs when SENTRY_AUTH_TOKEN is set (in .env.local or CI/CD)
    env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          authToken: env.SENTRY_AUTH_TOKEN,
          release: {
            name: `baselineapp@${process.env.npm_package_version || "0.0.0"}`,
          },
          sourcemaps: {
            filesToDeleteAfterUpload: ["./dist/**/*.map"],
          },
        })
      : null,
  ].filter(Boolean),
};
});
