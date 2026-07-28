/**
 * class-ownership.mjs
 *
 * "Hangi CSS sinifi kac ayri dosyadan yaziliyor?"
 *
 * Amac: bir sinifin stil sahipligi dagilmissa (ornegin .catalog-card hem
 * home-catalog.css'te hem themes/dark.css'te hem de bir .vue scoped style'da
 * taniml0ysa) o sinif catisma adayidir — tasima/temizlik oncesi bilinmeli.
 *
 * Kullanim: node scripts/class-ownership.mjs [--min 2] [--filter catalog]
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const getArg = (n, d) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i+1] ? args[i+1] : d; };
const MIN = Number(getArg("min", 3));
const FILTER = getArg("filter", "");

const files = [];
const walk = (p, ext) => {
  for (const f of readdirSync(p)) {
    const fp = join(p, f);
    if (statSync(fp).isDirectory()) walk(fp, ext);
    else if (ext.some((e) => f.endsWith(e))) files.push(fp);
  }
};
walk("app/assets/styles", [".css"]);
walk("public/themes", [".css"]);
walk("app/components", [".vue"]);
walk("app/pages", [".vue"]);

const shorten = (p) =>
  p.split(/[\\/]/).join("/")
    .replace("app/assets/styles/", "")
    .replace("app/components/", "")
    .replace("public/themes/", "themes/")
    .replace("app/pages/", "pages/");

/** sinif -> { dosya -> kural sayisi } */
const owners = {};

for (const file of files) {
  let css = readFileSync(file, "utf8");
  if (file.endsWith(".vue")) {
    const blocks = css.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
    css = blocks ? blocks.join("\n") : "";
    if (!css) continue;
  }
  const rules = [...css.matchAll(/^\s*([^{@}\n][^{}\n]*?)\s*\{/gm)].map((m) => m[1]);
  for (const rule of rules) {
    for (const m of rule.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
      const cls = m[1];
      if (FILTER && !cls.includes(FILTER)) continue;
      owners[cls] = owners[cls] || {};
      const key = shorten(file);
      owners[cls][key] = (owners[cls][key] || 0) + 1;
    }
  }
}

const conflicts = Object.entries(owners)
  .filter(([, d]) => Object.keys(d).length >= MIN)
  .sort((a, b) => Object.keys(b[1]).length - Object.keys(a[1]).length);

console.log(`${MIN}+ DOSYADAN YAZILAN SINIFLAR: ${conflicts.length}\n`);

for (const [cls, dosyalar] of conflicts) {
  const sorted = Object.entries(dosyalar).sort((a, b) => b[1] - a[1]);
  const toplam = sorted.reduce((s, x) => s + x[1], 0);
  console.log(`.${cls}  (${sorted.length} dosya, ${toplam} kural)`);
  for (const [f, n] of sorted) console.log(`      ${String(n).padStart(3)}  ${f}`);
}
