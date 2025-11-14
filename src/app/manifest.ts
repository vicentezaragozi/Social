import type { MetadataRoute } from "next";

const themeColor = "#03060f";

const manifest = (): MetadataRoute.Manifest => ({
  name: "Social — Nightlife MVP",
  short_name: "Social",
  description:
    "Connect guests, manage the floor, and keep the music flowing in one installable web app.",
  start_url: "/",
  display: "standalone",
  background_color: themeColor,
  theme_color: themeColor,
  lang: "en",
  orientation: "portrait",
  scope: "/",
  id: "/",
  icons: [
    {
      src: "/icons/icon.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: "/icons/icon-maskable.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
  shortcuts: [
    {
      name: "Open Connect Feed",
      short_name: "Connect",
      url: "/app",
      description: "Jump straight into the live connect feed.",
    },
    {
      name: "Admin Dashboard",
      short_name: "Admin",
      url: "/admin",
      description: "View venue KPIs and manage guests.",
    },
  ],
  related_applications: [],
  prefer_related_applications: false,
  display_override: ["standalone", "fullscreen"],
  launch_handler: {
    client_mode: "navigate-new",
  },
  categories: ["social", "lifestyle", "entertainment"],
});

export default manifest;

