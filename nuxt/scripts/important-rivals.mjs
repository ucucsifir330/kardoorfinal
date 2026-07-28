/**
 * important-rivals.mjs
 *
 * Her !important icin "rakibi var mi?" sorusunu STATIK olarak yanitlar.
 *
 * Mantik: bir !important ancak AYNI elemana AYNI ozelligi yazan baska bir
 * kural varsa is yapar. Rakibi yoksa islevsizdir ve guvenle sokulebilir.
 *
 * Rakip taramasi TUM CSS kaynaklarinda yapilir:
 *   app/assets/styles/**, public/themes/*.css, *.vue icindeki <style>
 *
 * Cikti: rakipsiz (guvenle sokulebilir) vs rakipli (dokunma) ayrimi.
 *
 * Kullanim: node scripts/important-rivals.mjs [dosya]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const HEDEF = process.argv[2] || "app/assets/styles/sections/home-catalog.css";

/** Tum CSS kaynaklarini topla */
const kaynaklar = [];
const walk = (p, ext) => {
  for (const f of readdirSync(p)) {
    const fp = join(p, f);
    if (statSync(fp).isDirectory()) walk(fp, ext);
    else if (ext.some((e) => f.endsWith(e))) kaynaklar.push(fp);
  }
};
walk("app/assets/styles", [".css"]);
walk("public/themes", [".css"]);
walk("app/components", [".vue"]);
walk("app/pages", [".vue"]);

/** Bir CSS metninden {selector, prop, important, dosya} listesi cikar */
const kurallariCikar = (css, dosya) => {
  const out = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    if (sel.startsWith("@")) continue;
    for (const decl of m[2].split(";")) {
      const d = decl.trim();
      if (!d || !d.includes(":")) continue;
      const prop = d.split(":")[0].trim();
      if (!prop || prop.startsWith("/*")) continue;
      out.push({ sel, prop, imp: /!important/.test(d), dosya });
    }
  }
  return out;
};

/** Selector'un hedefledigi son sinif adi — kaba ama pratik eslesme anahtari */
const anahtar = (sel) => {
  const siniflar = [...sel.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((x) => x[1]);
  return siniflar.length ? siniflar[siniflar.length - 1] : null;
};

const tumKurallar = [];
for (const dosya of kaynaklar) {
  let css = readFileSync(dosya, "utf8");
  if (dosya.endsWith(".vue")) {
    const bloklar = css.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
    css = bloklar ? bloklar.join("\n") : "";
    if (!css) continue;
  }
  tumKurallar.push(...kurallariCikar(css, dosya));
}

// "sinif|ozellik" -> kac ayri kural yaziyor
const yazanSayisi = new Map();
for (const k of tumKurallar) {
  const a = anahtar(k.sel);
  if (!a) continue;
  const key = `${a}|${k.prop}`;
  yazanSayisi.set(key, (yazanSayisi.get(key) || 0) + 1);
}

// Hedef dosyadaki !important'lari degerlendir
const hedefCss = readFileSync(HEDEF, "utf8");
const hedefKurallar = kurallariCikar(hedefCss, HEDEF).filter((k) => k.imp);

const rakipsiz = [];
const rakipli = [];

for (const k of hedefKurallar) {
  const a = anahtar(k.sel);
  if (!a) continue;
  const sayi = yazanSayisi.get(`${a}|${k.prop}`) || 1;
  // 1 = sadece kendisi yaziyor -> rakipsiz
  (sayi <= 1 ? rakipsiz : rakipli).push({ ...k, yazan: sayi });
}

console.log(`${HEDEF}`);
console.log(`toplam !important: ${hedefKurallar.length}\n`);
console.log(`  RAKIPSIZ (guvenle sokulebilir) : ${rakipsiz.length}`);
console.log(`  RAKIPLI  (dokunma)             : ${rakipli.length}\n`);

console.log("--- RAKIPSIZ ornekleri (ilk 20) ---");
for (const r of rakipsiz.slice(0, 20)) {
  console.log(`  ${r.sel.slice(0, 46).padEnd(48)} {${r.prop}}`);
}

console.log("\n--- EN COK RAKIPLI ozellikler ---");
const rakipSayaci = new Map();
for (const r of rakipli) {
  const a = anahtar(r.sel);
  const key = `${a}|${r.prop}`;
  rakipSayaci.set(key, r.yazan);
}
[...rakipSayaci.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .forEach(([k, v]) => console.log(`  ${String(v).padStart(3)} yazan  .${k.replace("|", " {")}}`));
