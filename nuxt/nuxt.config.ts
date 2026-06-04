import process from "node:process";

const assetBaseUrl = process.env.NUXT_PUBLIC_ASSET_BASE_URL || "";
const appCdnUrl = process.env.NUXT_APP_CDN_URL || "";

export default defineNuxtConfig({
  compatibilityDate: "2026-05-02",
  devtools: { enabled: false },
  hooks: {
    "pages:extend"(pages) {
      const disabledRoutes = new Set(["/doors", "/doors/:slug", "/contact"]);

      const removeDisabledRoutes = (routes: typeof pages) => {
        for (let index = routes.length - 1; index >= 0; index -= 1) {
          const route = routes[index];

          if (!route) continue;

          if (disabledRoutes.has(route.path)) {
            routes.splice(index, 1);
            continue;
          }

          if (route.children) {
            removeDisabledRoutes(route.children);
          }
        }
      };

      removeDisabledRoutes(pages);
    }
  },
  modules: ["@nuxt/image"],
  components: [{ path: "~/components", pathPrefix: false }],
  css: ["~/assets/styles/main.css"],
  app: {
    cdnURL: appCdnUrl,
    head: {
      titleTemplate: "%s | Ege Kardoor",
      htmlAttrs: { lang: "en" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { charset: "utf-8" },
        { name: "theme-color", content: "#050505" },
        {
          name: "description",
          content:
            "Ege Kardoor manufactures steel doors in Turkiye for international buyers, dealers and project supply."
        }
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "preconnect", href: "https://api.fontshare.com" },
        {
          rel: "stylesheet",
          href: "https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700,800&display=swap"
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&family=Montserrat:wght@400;500;700&display=swap"
        },
        { id: "kardoor-theme", rel: "stylesheet", href: "/themes/light.css" }
      ]
    },
    pageTransition: { name: "page", mode: "out-in" }
  },
  image: {
    domains: ["i.hizliresim.com", "ik.imagekit.io"],
    quality: 82,
    format: ["webp", "avif"],
    screens: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    }
  },
  runtimeConfig: {
    public: {
      assetBaseUrl
    }
  },
  nitro: {
    compressPublicAssets: true
  },
  typescript: {
    strict: false,
    typeCheck: false
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag: string) => tag === "dotlottie-player"
    }
  }
});
