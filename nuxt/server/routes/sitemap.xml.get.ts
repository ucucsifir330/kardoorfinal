// Aktif sayfalar; doors/series route'ları nuxt.config'te kapalı olduğu için listelenmiyor.
const ROUTES = [
  "/",
  "/catalog",
  "/catalog/steel",
  "/catalog/aluminium",
  "/catalog/glass",
  "/catalog/pvc",
  "/catalog/wood",
  "/catalog/architectural",
  "/catalog/technical",
  "/company",
  "/contact",
  "/references"
];

export default defineEventHandler((event) => {
  const origin = getRequestURL(event).origin;
  const urls = ROUTES.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join("\n");

  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
});
