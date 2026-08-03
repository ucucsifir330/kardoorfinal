import process from "node:process";
import tailwindcss from "@tailwindcss/vite";
import VueDevTools from "vite-plugin-vue-devtools";

const assetBaseUrl = process.env.NUXT_PUBLIC_ASSET_BASE_URL || "";
const appCdnUrl = process.env.NUXT_APP_CDN_URL || "";
const brevoApiKey = process.env.BREVO_API_KEY || "";
const contactToEmail = process.env.NUXT_CONTACT_TO_EMAIL || "ucucsifir@gmail.com";
const contactFromEmail = process.env.NUXT_CONTACT_FROM_EMAIL || "";
const contactFromName = process.env.NUXT_CONTACT_FROM_NAME || "Kardoor Website";

export default defineNuxtConfig({
  compatibilityDate: "2026-05-02",
  debug: true,
  devtools: { enabled: true },
  vite: {
    plugins: [tailwindcss(), VueDevTools()]
  },
  hooks: {
    "pages:extend"(pages) {
      const disabledRoutes = new Set(["/doors/:code"]);

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
  css: ["~/assets/styles/main.css", "~/assets/styles/tailwind.css"],
  app: {
    cdnURL: appCdnUrl,
    head: {
      titleTemplate: "%s | Ege Kardoor",
      htmlAttrs: { lang: "tr" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { charset: "utf-8" },
        { name: "theme-color", content: "#050505" },
        {
          name: "description",
          content:
            "Ege Kardoor; çelik, alüminyum, ahşap, PVC ve cam kapıları dijital showroom deneyimiyle sergiler. Mimarlar ve son kullanıcılar için katalog, teklif ve iletişim."
        }
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "preconnect", href: "https://api.fontshare.com" },
        // Yerel PP fontları dev CSS zinciri tamamlanmadan indirilmeye başlasın.
        // Böylece ilk boyamada fallback yazı tipi görünmez.
        //
        // SADECE ilk ekranda GERÇEKTEN kullanılan ağırlıklar preload edilir.
        // Ölçüm (canlı, 1440x900 ilk ekran): PP Telegraf 500, PP Mori 400,
        // PP Mori 600 kullanılıyor. PPTelegraf-Ultrabold (800) ilk ekranda YOK —
        // preload'dan çıkarıldı, normal @font-face zinciriyle gerektiğinde iner.
        //
        // Sebep: preload'lar hero görseliyle AYNI ANDA başlıyordu (font 3017ms,
        // hero 3032ms) ve aynı bant genişliği için yarışıyorlardı. Hero LCP
        // elemanı olduğu için önceliği o almalı.
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/pp-telegraf/PPTelegraf-Regular.woff2", crossorigin: "" },
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/pp-mori/PPMori-Regular.woff2", crossorigin: "" },
        { rel: "preload", as: "font", type: "font/woff2", href: "/fonts/pp-mori/PPMori-Semibold.woff2", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700,800&display=swap"
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&family=Montserrat:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Science+Gothic:wght@300;400;500;700&display=swap"
        },
        { id: "kardoor-theme", rel: "stylesheet", href: "/themes/light.css" }
      ],
      style: [
        {
          // Perde altındaki içeriği İLK BOYAMADA gizle.
          //
          // Aynı kural transitions.css'te de var ama o harici dosya; indirilene
          // kadar hero kabuğu + navbar bir kare opak görünüyordu (650ms
          // ölçüldü). WelcomeScreen SSR'da hiç basılmadığı için o karede sayfa
          // açıkta kalıyor. Kritik yol olduğundan burada inline.
          key: "kardoor-startup-veil",
          innerHTML:
            ".app-shell--content-hidden>*:not(.welcome-screen):not(.page-transition-overlay)" +
            "{visibility:hidden;pointer-events:none}" +
            // showroom kendi .is-revealed kuralıyla visibility:visible yazıp
            // miras alınan gizlemeyi eziyor; perde varken o iptal edilir.
            ".app-shell--content-hidden .entrance-lab__showroom.is-revealed" +
            "{visibility:hidden}",
          tagPosition: "head"
        }
      ],
      script: [
        {
          // LCP hero'sunu erken keşfet: doğru varyant viewport oranına, doğru
          // tema localStorage'a bağlı — ikisi de SSR'da bilinemez, bu yüzden
          // <img :src> hydration'a kadar (~3.4s) belirsiz kalıyordu. Bu senkron
          // inline script <head>'de çalışıp DOĞRU URL'i preload eder; tarayıcı
          // JS bundle'ını beklemeden LCP görselini çeker. Varyant tablosu
          // EntranceDoorLab.vue ile BİREBİR aynı olmalı (yoksa çift indirme).
          key: "kardoor-hero-preload",
          innerHTML: `(function(){try{
var UW={d:"/L-21X9.webp",n:"/N-21X9.webp",a:3134/1344};
var V=[{d:"/hero-day-16x9.avif",n:"/hero-night-16x9.avif",a:16/9},
{d:"/hero-day-4x3.avif",n:"/hero-night-4x3.avif",a:4/3},
{d:"/hero-day-1x1.avif",n:"/hero-night-1x1.avif",a:1},
{d:"/hero-day-3x4.avif",n:"/hero-night-3x4.avif",a:3/4},
{d:"/hero-day-9x16.avif",n:"/hero-night-9x16.avif",a:9/16}];
var va=window.innerWidth/window.innerHeight;
var pick;
if(va>=(21/9-0.15)){pick=UW;}else{var best=V[0],bd=Infinity;
for(var i=0;i<V.length;i++){var dl=Math.abs(Math.log(va/V[i].a));if(dl<bd){bd=dl;best=V[i];}}pick=best;}
var night=false;try{night=window.localStorage.getItem("kardoor-showroom-ambience")==="night";}catch(e){}
var href=night?pick.n:pick.d;
window.__kardoorHero={aspect:pick.a,night:night,href:href};
var l=document.createElement("link");
l.rel="preload";l.as="image";l.href=href;l.setAttribute("fetchpriority","high");
document.head.appendChild(l);
}catch(e){}})();`,
          tagPosition: "head"
        }
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
    brevoApiKey,
    contactToEmail,
    contactFromEmail,
    contactFromName,
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
