/**
 * classify-rules.mjs
 *
 * Bir dosyadaki kurallari SORUMLULUGA gore siniflandirir:
 *   TEMA   — renk/gorsel (background, color, box-shadow, filter, opacity...)
 *   DUZEN  — geometri (display, grid, width, padding, margin, position...)
 *   HAREKET— animasyon/gecis (transition, animation, transform, will-change)
 *   TIPO   — tipografi (font-*, line-height, letter-spacing, text-*)
 *
 * Amac: "tema dosyasinda DUZEN kurali ne isi var?" sorusunu sayilarla sormak.
 * Tema dosyasindaki DUZEN kurallari, bilesen CSS'i ile catisan taraftir.
 *
 * Kullanim: node scripts/classify-rules.mjs <dosya> [--filter catalog]
 */
import { readFileSync } from "node:fs";
import process from "node:process";

const args = process.argv.slice(2);
const file = args[0];
const fi = args.indexOf("--filter");
const FILTER = fi !== -1 && args[fi + 1] ? args[fi + 1] : "";

if (!file) { console.error("kullanim: node scripts/classify-rules.mjs <dosya> [--filter x]"); process.exit(1); }

const TEMA = /^(background|color|border-color|box-shadow|outline|filter|opacity|fill|stroke|backdrop-filter|--[a-z-]*(color|bg|shadow|glass|ink|tint))/;
const HAREKET = /^(transition|animation|transform|will-change|perspective|backface)/;
const TIPO = /^(font|line-height|letter-spacing|text-|white-space|word|writing)/;

const css = readFileSync(file, "utf8");
const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

const say = { TEMA: 0, DUZEN: 0, HAREKET: 0, TIPO: 0 };
const duzenOrnek = [];

for (const b of blocks) {
  const sel = b[1].trim();
  if (sel.startsWith("@")) continue;
  if (FILTER && !sel.includes(FILTER)) continue;

  for (const decl of b[2].split(";")) {
    const d = decl.trim();
    if (!d) continue;
    const prop = d.split(":")[0].trim();
    if (!prop) continue;

    let tur = "DUZEN";
    if (TEMA.test(prop)) tur = "TEMA";
    else if (HAREKET.test(prop)) tur = "HAREKET";
    else if (TIPO.test(prop)) tur = "TIPO";

    say[tur]++;
    if (tur === "DUZEN" && duzenOrnek.length < 25) duzenOrnek.push(`${sel.slice(0, 46)}  {${prop}}`);
  }
}

const toplam = Object.values(say).reduce((a, b) => a + b, 0);
console.log(`${file}${FILTER ? `  (filtre: ${FILTER})` : ""}`);
console.log(`toplam deklarasyon: ${toplam}\n`);
for (const [k, v] of Object.entries(say)) {
  const pct = toplam ? Math.round((v / toplam) * 100) : 0;
  console.log(`  ${k.padEnd(8)} ${String(v).padStart(4)}  ${pct}%`);
}
if (duzenOrnek.length) {
  console.log("\n--- DUZEN ornekleri (tema dosyasinda olmamali) ---");
  duzenOrnek.forEach((x) => console.log("  " + x));
}
