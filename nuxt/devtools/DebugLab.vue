<script setup lang="ts">
// Dev-only Debug Lab v3. ?debug=1 etkinleştirir (kalıcı), ?debug=0 kapatır.
// Temiz profilde (snapshot araçları) DOM'a hiçbir şey eklemez — kapıyı kaldırma.
// Kısayollar: Ctrl+Shift+D panel, F = A/B flip, ESC = inceleme kapat.
import { gsap } from "gsap";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { useShowroomAmbience } from "~/composables/useShowroomAmbience";

type Vars = {
  themeCss: boolean;
  anim: boolean;
  catalogLayout: "auto" | "grid" | "flex";
  cardRadius: number;
  fontScale: number;
  outline: boolean;
  grid: boolean;
};
const DEFAULTS: Vars = { themeCss: true, anim: true, catalogLayout: "auto", cardRadius: -1, fontScale: 100, outline: false, grid: false };
const LS = "kardoor-debug-lab-v3";

const { theme, setTheme } = useShowroomAmbience();
const enabled = ref(false);
const open = ref(false);
const vars = reactive<Vars>({ ...DEFAULTS });
const slotA = ref<Vars | null>(null);
const slotB = ref<Vars | null>(null);
const active = ref<"A" | "B" | "-">("-");
const vw = ref(0);
const vh = ref(0);
const fps = ref(0);
const domCount = ref(0);
const copied = ref("");
const pos = reactive({ x: 0, y: 0 });

// ---------- CSS dosyaları (vite dev style tag'leri) ----------
const cssFiles = ref<{ id: string; name: string; on: boolean; rules: number; imp: number }[]>([]);
const cssFilter = ref("");
function sheetStats(sheet: CSSStyleSheet | null) {
  let rules = 0;
  let imp = 0;
  const walk = (list: CSSRuleList) => {
    for (const r of Array.from(list)) {
      if ((r as CSSMediaRule).cssRules) walk((r as CSSMediaRule).cssRules);
      else if ((r as CSSStyleRule).style) {
        rules++;
        const s = (r as CSSStyleRule).style;
        for (let i = 0; i < s.length; i++) if (s.getPropertyPriority(s[i]!)) { imp++; break; }
      }
    }
  };
  try { if (sheet) walk(sheet.cssRules); } catch {}
  return { rules, imp };
}
function scanCss() {
  const seen = new Set<string>();
  const list: typeof cssFiles.value = [];
  document.querySelectorAll<HTMLStyleElement>("style[data-vite-dev-id]").forEach((t) => {
    const id = t.dataset.viteDevId || "";
    if (!/\.css/.test(id) || seen.has(id)) return;
    seen.add(id);
    const { rules, imp } = sheetStats(t.sheet);
    list.push({ id, name: id.split(/[\\/]/).slice(-2).join("/").replace(/\?.*$/, ""), on: !t.disabled, rules, imp });
  });
  cssFiles.value = list.sort((a, b) => b.rules - a.rules);
}
function toggleCss(file: { id: string; on: boolean }) {
  file.on = !file.on;
  document.querySelectorAll<HTMLStyleElement>("style[data-vite-dev-id]").forEach((t) => {
    if (t.dataset.viteDevId === file.id) t.disabled = !file.on;
  });
}
const filteredCss = computed(() => cssFiles.value.filter((f) => f.name.toLowerCase().includes(cssFilter.value.toLowerCase())));

// ---------- CSS değişkenleri (tokens) ----------
const cssVars = ref<{ name: string; value: string; source: string; edit: string }[]>([]);
const varFilter = ref("");
function scanVars() {
  const found = new Map<string, { value: string; source: string }>();
  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    if (devDupLink(sheet)) continue;
    let srcName = "inline";
    const node = sheet.ownerNode as HTMLElement | null;
    if (node?.dataset?.viteDevId) srcName = node.dataset.viteDevId.split(/[\\/]/).slice(-1)[0]!.replace(/\?.*$/, "");
    else if ((node as HTMLLinkElement)?.href) srcName = (node as HTMLLinkElement).href.split("/").slice(-1)[0]!;
    try {
      for (const r of Array.from(sheet.cssRules)) {
        const sr = r as CSSStyleRule;
        if (!sr.selectorText || !/(^|,)\s*(:root|html)\b/.test(sr.selectorText)) continue;
        for (let i = 0; i < sr.style.length; i++) {
          const p = sr.style[i]!;
          if (p.startsWith("--")) found.set(p, { value: sr.style.getPropertyValue(p).trim(), source: srcName });
        }
      }
    } catch {}
  }
  cssVars.value = Array.from(found, ([name, v]) => ({ name, value: v.value, source: v.source, edit: v.value }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function applyVar(v: { name: string; edit: string }) { document.documentElement.style.setProperty(v.name, v.edit); }
function resetVar(v: { name: string; value: string; edit: string }) { document.documentElement.style.removeProperty(v.name); v.edit = v.value; }
const isColor = (val: string) => /^#|^rgb|^hsl/.test(val.trim());
const filteredVars = computed(() => cssVars.value.filter((v) => v.name.includes(varFilter.value)));

// ---------- İnceleme (inspector) ----------
const inspect = ref(false);
const pinned = ref<HTMLElement | null>(null);
const pinInfo = ref<{ desc: string; size: string; impCount: number; deadCount: number; computed: [string, string][]; rules: MRule[] } | null>(null);
const hoverBox = reactive({ show: false, x: 0, y: 0, w: 0, h: 0, m: [0, 0, 0, 0], p: [0, 0, 0, 0] });
const viewMode = ref<"win" | "dead" | "all">("win"); // örümcek ağı yerine net görünümler
const winnersList = computed(() => {
  if (!pinInfo.value) return [];
  const rows: { p: string; val: string; imp: boolean; from: string }[] = [];
  for (const r of pinInfo.value.rules) {
    for (const d of r.decls) {
      if (d.win) rows.push({ p: d.p, val: d.val, imp: d.imp, from: `${r.sel.length > 44 ? r.sel.slice(0, 44) + "…" : r.sel} · ${r.file}` });
    }
  }
  return rows.sort((a, b) => a.p.localeCompare(b.p));
});
// TEMİZLİK LİSTESİ: ölü declaration içeren kurallar; tamamen ölüler önce
const deadList = computed(() => {
  if (!pinInfo.value) return [];
  return pinInfo.value.rules
    .map((r) => ({
      sel: r.sel, file: r.file, media: r.media,
      dead: r.decls.filter((d) => d.deadBy),
      total: r.decls.length
    }))
    .filter((r) => r.dead.length)
    .map((r) => ({ ...r, full: r.dead.length === r.total }))
    .sort((a, b) => Number(b.full) - Number(a.full) || b.dead.length - a.dead.length);
});
async function copyDead() {
  const el = pinInfo.value;
  if (!el) return;
  const txt = [
    `TEMİZLİK LİSTESİ — ${el.desc} (dikkat: SADECE şu anki tema+viewport için geçerli!)`,
    ...deadList.value.map((r) =>
      `${r.full ? "[TAMAMEN ÖLÜ] " : `[${r.dead.length}/${r.total} ölü] `}[${r.file}]${r.media ? ` @media ${r.media}` : ""} ${r.sel}\n` +
      r.dead.map((d) => `    ${d.p}: ${d.val}${d.imp ? " !imp" : ""}  ← EZEN: ${d.deadBy}`).join("\n"))
  ].join("\n");
  await navigator.clipboard.writeText(txt);
  flash("dead");
}
let rafPending = false;

function describe(el: HTMLElement) {
  const cls = typeof el.className === "string" ? el.className : (el as any).className?.baseVal || "";
  return `<${el.tagName.toLowerCase()}>${cls.split(/\s+/).filter(Boolean).map((c: string) => "." + c).join("")}`;
}
function updateHover(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  Object.assign(hoverBox, {
    show: true, x: r.left, y: r.top, w: r.width, h: r.height,
    m: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(parseFloat),
    p: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(parseFloat)
  });
}
function onMove(e: MouseEvent) {
  if (!inspect.value || pinned.value || rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    if (!el || el.closest(".dlab")) { hoverBox.show = false; return; }
    updateHover(el);
  });
}
// Nuxt dev, css'i hem SSR <link> hem vite <style> olarak basar (prod'da tek).
// Link kopyasını ele: vite style id'siyle aynı dosyaya işaret eden linkleri atla.
function devDupLink(sheet: CSSStyleSheet) {
  const node = sheet.ownerNode as HTMLElement | null;
  const href = (node as HTMLLinkElement)?.href;
  if (!node || node.tagName !== "LINK" || !href) return false;
  const tail = href.split("?")[0]!.split("/").slice(-3).join("/");
  return Array.from(document.querySelectorAll<HTMLStyleElement>("style[data-vite-dev-id]"))
    .some((s) => (s.dataset.viteDevId || "").split("?")[0]!.replace(/\\/g, "/").endsWith(tail));
}
// Kaba ama iş gören specificity: [id, class/attr/pseudo-class, tag/pseudo-el]
function specOf(sel: string): [number, number, number] {
  const s = sel.replace(/:(not|is|where)\(([^)]*)\)/g, " $2 ");
  return [
    (s.match(/#[\w-]+/g) || []).length,
    (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length,
    (s.match(/(^|[\s>+~,(])[a-zA-Z][\w-]*/g) || []).length + (s.match(/::[\w-]+/g) || []).length
  ];
}
const SHORTHANDS: Record<string, string[]> = {
  margin: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
  padding: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
  background: ["background-color", "background-image", "background-position", "background-size", "background-repeat"],
  border: ["border-color", "border-width", "border-style"],
  inset: ["top", "right", "bottom", "left"],
  gap: ["row-gap", "column-gap"],
  overflow: ["overflow-x", "overflow-y"],
  flex: ["flex-grow", "flex-shrink", "flex-basis"],
  "border-radius": ["border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius"]
};
const covers = (winner: string, loser: string) => winner === loser || (SHORTHANDS[winner] || []).includes(loser);

type Decl = { p: string; val: string; imp: boolean; win: boolean; deadBy: string };
type MRule = { sel: string; file: string; media: string; spec: [number, number, number]; order: number; inline: boolean; decls: Decl[] };

function matchedRules(el: HTMLElement): MRule[] {
  const out: MRule[] = [];
  let order = 0;
  for (const sheet of Array.from(document.styleSheets)) {
    if (devDupLink(sheet)) continue;
    let file = "inline";
    const node = sheet.ownerNode as HTMLElement | null;
    if (node?.dataset?.viteDevId) file = node.dataset.viteDevId.split(/[\\/]/).slice(-2).join("/").replace(/\?.*$/, "");
    else if ((node as HTMLLinkElement)?.href) file = (node as HTMLLinkElement).href.split("/").slice(-2).join("/").split("?")[0]!;
    const walk = (rules: CSSRuleList, media: string) => {
      for (const r of Array.from(rules)) {
        const mr = r as CSSMediaRule;
        if (mr.media && mr.cssRules) {
          if (window.matchMedia(mr.media.mediaText).matches) walk(mr.cssRules, mr.media.mediaText);
          continue;
        }
        const sr = r as CSSStyleRule;
        if (!sr.selectorText || !sr.style) continue;
        try { if (!el.matches(sr.selectorText)) continue; } catch { continue; }
        // birleşik selector'da eşleşen parçaların en yüksek specificity'si geçerli
        let spec: [number, number, number] = [0, 0, 0];
        for (const part of sr.selectorText.split(",")) {
          try {
            if (el.matches(part.trim())) {
              const ps = specOf(part);
              if (ps[0] - spec[0] || ps[1] - spec[1] || ps[2] - spec[2]) {
                if (ps[0] > spec[0] || (ps[0] === spec[0] && (ps[1] > spec[1] || (ps[1] === spec[1] && ps[2] > spec[2])))) spec = ps;
              }
            }
          } catch {}
        }
        const decls: Decl[] = [];
        for (let i = 0; i < sr.style.length; i++) {
          const p = sr.style[i]!;
          if (p.startsWith("--") && sr.style.length > 8) continue;
          const val = sr.style.getPropertyValue(p).trim();
          if (!val) continue; // var() shorthand artefaktı
          decls.push({ p, val, imp: !!sr.style.getPropertyPriority(p), win: false, deadBy: "" });
        }
        if (decls.length) out.push({ sel: sr.selectorText, file, media, spec, order: order++, inline: false, decls });
      }
    };
    try { walk(sheet.cssRules, ""); } catch {}
  }
  // inline style de yarışır
  if (el.style.length) {
    const decls: Decl[] = [];
    for (let i = 0; i < el.style.length; i++) {
      const p = el.style[i]!;
      const val = el.style.getPropertyValue(p).trim();
      if (val) decls.push({ p, val, imp: !!el.style.getPropertyPriority(p), win: false, deadBy: "" });
    }
    if (decls.length) out.push({ sel: "style=\"...\"", file: "inline", media: "", spec: [99, 0, 0], order: order++, inline: true, decls });
  }
  // ÇAKIŞMA ANALİZİ: her declaration için kazananı bul (imp > specificity > sıra)
  const beats = (A: MRule, a: Decl, B: MRule, b: Decl) => {
    if (a.imp !== b.imp) return a.imp;
    const s = A.spec[0] - B.spec[0] || A.spec[1] - B.spec[1] || A.spec[2] - B.spec[2];
    if (s) return s > 0;
    return A.order > B.order;
  };
  for (const R of out) {
    for (const d of R.decls) {
      let winner: { R: MRule; d: Decl } | null = null;
      for (const R2 of out) {
        for (const d2 of R2.decls) {
          if (!covers(d2.p, d.p) && !covers(d.p, d2.p)) continue;
          if (R2 === R && d2 === d) { if (!winner) winner = { R: R2, d: d2 }; continue; }
          if (!winner || beats(R2, d2, winner.R, winner.d)) winner = { R: R2, d: d2 };
        }
      }
      if (winner && (winner.R !== R || winner.d !== d)) {
        d.deadBy = `${winner.R.sel.slice(0, 60)} (${winner.R.file}${winner.d.imp ? " ❗" : ""})`;
      } else {
        d.win = true;
      }
    }
  }
  return out;
}
function pinElement(el: HTMLElement) {
  pinned.value = el;
  updateHover(el);
  const cs = getComputedStyle(el);
  const keys = ["display", "position", "z-index", "width", "height", "font-size", "line-height", "color", "background-color", "margin", "padding", "border-radius", "box-shadow"];
  const rules = matchedRules(el).reverse(); // en güçlü/son gelen üstte
  const all = rules.flatMap((r) => r.decls);
  pinInfo.value = {
    desc: describe(el),
    size: `${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`,
    impCount: all.filter((d) => d.imp).length,
    deadCount: all.filter((d) => d.deadBy).length,
    computed: keys.map((k) => [k, cs.getPropertyValue(k)]),
    rules
  };
}
function onClickCapture(e: MouseEvent) {
  if (!inspect.value) return;
  const el = e.target as HTMLElement;
  if (el.closest(".dlab")) return;
  e.preventDefault();
  e.stopPropagation();
  pinElement(el);
}
function stopInspect() { inspect.value = false; pinned.value = null; pinInfo.value = null; hoverBox.show = false; }
async function copyReport() {
  if (!pinInfo.value) return;
  const p = pinInfo.value;
  const txt = [
    `ELEMENT ${p.desc} (${p.size}) · ${p.impCount} !important · ${p.deadCount} ezilen`,
    `COMPUTED: ${p.computed.map(([k, v]) => `${k}=${v}`).join("; ")}`,
    `MATCHED RULES (güçlüden zayıfa; [EZİK ← kim] işaretli):`,
    ...p.rules.map((r) => `  [${r.file}]${r.media ? ` @media ${r.media}` : ""} ${r.sel} { ${r.decls.map((d) => `${d.p}: ${d.val}${d.imp ? " !imp" : ""}${d.deadBy ? ` [EZİK ← ${d.deadBy}]` : ""}`).join("; ")} }`)
  ].join("\n");
  await navigator.clipboard.writeText(txt);
  flash("rapor");
}

// ---------- uygulama ----------
function apply() {
  const link = document.getElementById("kardoor-theme") as HTMLLinkElement | null;
  if (link) link.disabled = !vars.themeCss;
  try { vars.anim ? gsap.globalTimeline.play() : gsap.globalTimeline.pause(); } catch {}
  document.querySelectorAll("*").forEach((el) => {
    (el as any).getAnimations?.().forEach((a: Animation) => { try { vars.anim ? a.play() : a.pause(); } catch {} });
  });
  let css = "";
  if (!vars.anim) css += "*,*::before,*::after{animation-play-state:paused!important;transition:none!important}";
  if (vars.catalogLayout !== "auto") css += `.home-page .catalog-row,.catalog-row{display:${vars.catalogLayout}!important}`;
  if (vars.cardRadius >= 0) css += `.catalog-card,.card{border-radius:${vars.cardRadius}px!important}`;
  if (vars.fontScale !== 100) css += `html{font-size:${vars.fontScale}%!important}`;
  if (vars.outline) css += "*{outline:1px solid rgba(255,0,90,.28)!important}";
  if (vars.grid) css += "body::after{content:'';position:fixed;inset:0;z-index:99998;pointer-events:none;background:repeating-linear-gradient(90deg,rgba(0,180,255,.07) 0,rgba(0,180,255,.07) calc(100%/12 - 1px),rgba(0,180,255,.4) calc(100%/12 - 1px),rgba(0,180,255,.4) calc(100%/12))}";
  let tag = document.getElementById("debug-lab-style");
  if (!tag) { tag = document.createElement("style"); tag.id = "debug-lab-style"; document.head.appendChild(tag); }
  tag.textContent = css;
  localStorage.setItem(LS, JSON.stringify({ vars, slotA: slotA.value, slotB: slotB.value }));
}
function flash(what: string) { copied.value = what; setTimeout(() => { copied.value = ""; }, 1200); }
function save(slot: "A" | "B") { (slot === "A" ? slotA : slotB).value = { ...vars }; active.value = slot; apply(); flash(slot); }
function load(slot: "A" | "B") { const s = (slot === "A" ? slotA : slotB).value; if (s) { Object.assign(vars, s); active.value = slot; } }
function flip() { if (slotA.value && slotB.value) load(active.value === "A" ? "B" : "A"); }
const abDiff = computed(() => {
  if (!slotA.value || !slotB.value) return [];
  return (Object.keys(DEFAULTS) as (keyof Vars)[])
    .filter((k) => slotA.value![k] !== slotB.value![k])
    .map((k) => `${k}: A=${slotA.value![k]} / B=${slotB.value![k]}`);
});
function reset() {
  Object.assign(vars, DEFAULTS);
  active.value = "-";
  cssFiles.value.forEach((f) => { if (!f.on) toggleCss(f); });
  cssVars.value.forEach((v) => document.documentElement.style.removeProperty(v.name));
  stopInspect();
}
async function copySettings() {
  await navigator.clipboard.writeText(JSON.stringify({ theme: theme.value, ...vars, disabledCss: cssFiles.value.filter((f) => !f.on).map((f) => f.name) }, null, 2));
  flash("ayar");
}

// ---------- sürükleme / kısayol / ölçümler ----------
let drag: { sx: number; sy: number; ox: number; oy: number } | null = null;
function dragStart(e: PointerEvent) { drag = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y }; }
function dragMove(e: PointerEvent) { if (drag) { pos.x = drag.ox + e.clientX - drag.sx; pos.y = drag.oy + e.clientY - drag.sy; } }
function dragEnd() { drag = null; }
function onKey(e: KeyboardEvent) {
  if (!enabled.value) return;
  if (e.ctrlKey && e.shiftKey && e.code === "KeyD") { e.preventDefault(); open.value = !open.value; if (open.value) { scanCss(); scanVars(); } }
  if (e.code === "Escape" && inspect.value) stopInspect();
  const t = e.target as HTMLElement;
  if (e.code === "KeyF" && !e.ctrlKey && t.tagName !== "INPUT" && t.tagName !== "TEXTAREA") flip();
}
let rafId = 0;
let frames = 0;
let last = 0;
function fpsLoop(ts: number) {
  frames++;
  if (ts - last >= 500) {
    fps.value = Math.round((frames * 1000) / (ts - last));
    frames = 0;
    last = ts;
    domCount.value = document.getElementsByTagName("*").length;
  }
  rafId = requestAnimationFrame(fpsLoop);
}

onMounted(() => {
  const q = new URLSearchParams(location.search).get("debug");
  if (q === "1") localStorage.setItem(LS + "-on", "1");
  if (q === "0") localStorage.removeItem(LS + "-on");
  enabled.value = localStorage.getItem(LS + "-on") === "1";
  if (!enabled.value) return;
  try {
    const saved = JSON.parse(localStorage.getItem(LS) || "null");
    if (saved) { Object.assign(vars, saved.vars); slotA.value = saved.slotA; slotB.value = saved.slotB; }
  } catch {}
  const size = () => { vw.value = window.innerWidth; vh.value = window.innerHeight; };
  size();
  window.addEventListener("resize", size);
  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("click", onClickCapture, true);
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointermove", dragMove);
  window.addEventListener("pointerup", dragEnd);
  rafId = requestAnimationFrame(fpsLoop);
  setTimeout(() => { scanCss(); scanVars(); }, 1500);
  apply();
});
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMove);
  window.removeEventListener("click", onClickCapture, true);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("pointermove", dragMove);
  window.removeEventListener("pointerup", dragEnd);
  cancelAnimationFrame(rafId);
});
watch(vars, apply, { deep: true });
const bp = computed(() => (vw.value <= 560 ? "≤560" : vw.value <= 760 ? "≤760" : vw.value <= 920 ? "≤920" : vw.value <= 1180 ? "≤1180" : vw.value <= 1600 ? "≤1600" : ">1600"));
</script>

<template>
  <div v-if="enabled" class="dlab" :style="{ transform: `translate(${pos.x}px, ${pos.y}px)` }">
    <!-- inspector overlay -->
    <div v-if="hoverBox.show" class="dlab-hl" :style="{ left: hoverBox.x + 'px', top: hoverBox.y + 'px', width: hoverBox.w + 'px', height: hoverBox.h + 'px' }">
      <div class="dlab-hl__m" :style="{ inset: `${-hoverBox.m[0]}px ${-hoverBox.m[1]}px ${-hoverBox.m[2]}px ${-hoverBox.m[3]}px` }" />
      <div class="dlab-hl__p" :style="{ inset: `${hoverBox.p[0]}px ${hoverBox.p[1]}px ${hoverBox.p[2]}px ${hoverBox.p[3]}px` }" />
    </div>

    <button class="dlab__fab" @click="open = !open; open && (scanCss(), scanVars())">{{ open ? "×" : "⚙ DEBUG" }}</button>

    <div v-if="open" class="dlab__panel">
      <div class="dlab__head" @pointerdown="dragStart">
        <strong>Debug Lab</strong>
        <span>{{ vw }}×{{ vh }} · bp {{ bp }} · {{ fps }}fps · {{ domCount }} el</span>
      </div>

      <details open>
        <summary>Tema</summary>
        <div class="dlab__row">
          <button :class="{ on: theme === 'light' }" @click="setTheme('light')">Light</button>
          <button :class="{ on: theme === 'dark' }" @click="setTheme('dark')">Dark</button>
          <button :class="{ on: !vars.themeCss }" @click="vars.themeCss = !vars.themeCss">tema CSS {{ vars.themeCss ? "açık" : "KAPALI" }}</button>
        </div>
      </details>

      <details>
        <summary>CSS dosyaları <em>({{ cssFiles.length }})</em></summary>
        <input v-model="cssFilter" class="dlab__search" placeholder="filtrele...">
        <div class="dlab__files">
          <button v-for="f in filteredCss" :key="f.id" :class="{ off: !f.on }" :title="f.id" @click="toggleCss(f)">
            {{ f.name }} <em>{{ f.rules }} kural{{ f.imp ? " · " + f.imp + "❗" : "" }}</em>
          </button>
        </div>
      </details>

      <details>
        <summary>Değişkenler <em>({{ cssVars.length }})</em></summary>
        <input v-model="varFilter" class="dlab__search" placeholder="--catalog...">
        <div class="dlab__vars">
          <div v-for="v in filteredVars.slice(0, 40)" :key="v.name" class="dlab__var">
            <label :title="v.source">{{ v.name }}</label>
            <input v-if="isColor(v.value)" type="color" :value="v.edit.startsWith('#') ? v.edit : '#888888'" @input="v.edit = ($event.target as HTMLInputElement).value; applyVar(v)">
            <input v-model="v.edit" class="dlab__varval" @change="applyVar(v)">
            <button v-if="v.edit !== v.value" @click="resetVar(v)">↺</button>
          </div>
        </div>
      </details>

      <details open>
        <summary>İnceleme</summary>
        <div class="dlab__row">
          <button :class="{ on: inspect }" @click="inspect ? stopInspect() : (inspect = true)">{{ inspect ? "İnceleme AÇIK (ESC)" : "İncele" }}</button>
          <button v-if="pinInfo" @click="copyReport">{{ copied === "rapor" ? "✓" : "raporu kopyala" }}</button>
          <button v-if="pinned" @click="pinned = null; pinInfo = null">bırak</button>
        </div>
        <div v-if="pinInfo" class="dlab__pin">
          <div class="dlab__pindesc">{{ pinInfo.desc }} · {{ pinInfo.size }}</div>
          <div class="dlab__stats">
            <span class="dlab__chip dlab__chip--imp">❗ {{ pinInfo.impCount }} !important</span>
            <span class="dlab__chip dlab__chip--dead">✂ {{ pinInfo.deadCount }} ezilen</span>
            <button :class="{ on: viewMode === 'win' }" @click="viewMode = 'win'">KAZANANLAR</button>
            <button :class="{ on: viewMode === 'dead' }" @click="viewMode = 'dead'">ÖLÜLER</button>
            <button :class="{ on: viewMode === 'all' }" @click="viewMode = 'all'">savaş</button>
          </div>
          <!-- NET SONUÇ: property başına tek satır — ekranda gerçekten renderlanan değer ve kaynağı -->
          <div v-if="viewMode === 'win'" class="dlab__winners">
            <div v-for="w in winnersList" :key="w.p + w.from" class="dlab__winner">
              <b>{{ w.p }}</b><span class="dlab__wval">{{ w.val }}<i v-if="w.imp">❗</i></span>
              <em :title="w.from">{{ w.from }}</em>
            </div>
          </div>
          <!-- TEMİZLİK LİSTESİ: ölü declaration'lar, tamamen ölü kurallar önce -->
          <div v-else-if="viewMode === 'dead'" class="dlab__deadview">
            <div class="dlab__deadwarn">⚠ sadece ŞU ANKİ tema+viewport için ölü — silmeden önce diğer temada da bak</div>
            <button @click="copyDead">{{ copied === "dead" ? "✓ kopyalandı" : "temizlik listesini kopyala" }}</button>
            <div v-for="(r, i) in deadList" :key="i" class="dlab__rule" :class="{ fulldead: r.full }">
              <div class="dlab__rulehead">
                <span v-if="r.full" class="dlab__chip dlab__chip--kill">TAMAMEN ÖLÜ</span>
                <span v-else class="dlab__chip dlab__chip--dead">{{ r.dead.length }}/{{ r.total }} ölü</span>
                <b>{{ r.sel }}</b> <em>{{ r.file }}{{ r.media ? " @" + r.media : "" }}</em>
              </div>
              <div class="dlab__ruleprops">
                <span v-for="(d, j) in r.dead" :key="j" class="dlab__prop dead" :title="'EZEN → ' + d.deadBy">{{ d.p }}: {{ d.val }}<b v-if="d.imp">❗</b></span>
              </div>
            </div>
            <div v-if="!deadList.length" class="dlab__hint">bu elementte ölü declaration yok 🎉</div>
          </div>
          <template v-else>
          <div class="dlab__computed">
            <span v-for="[k, v] in pinInfo.computed" :key="k"><b>{{ k }}</b> {{ v }}</span>
          </div>
          <div class="dlab__rules">
            <div v-for="(r, i) in pinInfo.rules.slice(0, 14)" :key="i" class="dlab__rule">
              <div class="dlab__rulehead"><b>{{ r.sel }}</b> <em>{{ r.file }}{{ r.media ? " @" + r.media : "" }}</em></div>
              <div class="dlab__ruleprops">
                <span
                  v-for="(d, j) in r.decls" :key="j"
                  class="dlab__prop" :class="{ win: d.win, dead: !!d.deadBy, imp: d.imp }"
                  :title="d.deadBy ? 'EZEN → ' + d.deadBy : (d.win ? 'kazanan' : '')"
                >{{ d.p }}: {{ d.val }}<b v-if="d.imp">❗</b></span>
              </div>
            </div>
            <div v-if="pinInfo.rules.length > 14" class="dlab__rulemore">+{{ pinInfo.rules.length - 14 }} kural daha (raporu kopyala)</div>
          </div>
          </template>
        </div>
        <div v-else-if="inspect" class="dlab__hint">fareyi gezdir, elemente TIKLA → kurallar burada</div>
      </details>

      <details>
        <summary>Deney</summary>
        <div class="dlab__row">
          <label>Animasyon</label>
          <button :class="{ on: vars.anim }" @click="vars.anim = !vars.anim">{{ vars.anim ? "Çalışıyor" : "Donduruldu" }}</button>
        </div>
        <div class="dlab__row">
          <label>Katalog satırı</label>
          <button v-for="m in (['auto', 'grid', 'flex'] as const)" :key="m" :class="{ on: vars.catalogLayout === m }" @click="vars.catalogLayout = m">{{ m }}</button>
        </div>
        <div class="dlab__row">
          <label>Kart radius: {{ vars.cardRadius < 0 ? "orijinal" : vars.cardRadius + "px" }}</label>
          <input v-model.number="vars.cardRadius" type="range" min="-1" max="48">
          <label>Font ölçeği: {{ vars.fontScale }}%</label>
          <input v-model.number="vars.fontScale" type="range" min="80" max="120">
        </div>
        <div class="dlab__row">
          <button :class="{ on: vars.outline }" @click="vars.outline = !vars.outline">Outline</button>
          <button :class="{ on: vars.grid }" @click="vars.grid = !vars.grid">12-kolon</button>
        </div>
      </details>

      <details open>
        <summary>A/B testi <em v-if="abDiff.length">({{ abDiff.length }} fark)</em></summary>
        <div class="dlab__row">
          <button @click="save('A')">{{ copied === "A" ? "✓" : "Kaydet→A" }}</button>
          <button @click="save('B')">{{ copied === "B" ? "✓" : "Kaydet→B" }}</button>
          <button :disabled="!slotA" :class="{ on: active === 'A' }" @click="load('A')">A</button>
          <button :disabled="!slotB" :class="{ on: active === 'B' }" @click="load('B')">B</button>
          <button class="dlab__flip" :disabled="!slotA || !slotB" @click="flip">FLIP (F)</button>
        </div>
        <div v-if="abDiff.length" class="dlab__abdiff">
          <div v-for="d in abDiff" :key="d">{{ d }}</div>
        </div>
      </details>

      <div class="dlab__row dlab__foot">
        <button @click="copySettings">{{ copied === "ayar" ? "✓ kopyalandı" : "Ayarları kopyala" }}</button>
        <button class="dlab__reset" @click="reset">Sıfırla</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dlab { position: fixed; right: 16px; bottom: 16px; z-index: 99999; font: 12px/1.45 monospace; }
.dlab__fab { background: #111; color: #7CFC9A; border: 1px solid #333; border-radius: 8px; padding: 8px 12px; cursor: pointer; box-shadow: 0 4px 18px rgba(0, 0, 0, .45); }
.dlab__panel { position: absolute; right: 0; bottom: 44px; width: min(400px, 94vw); background: #111; color: #ddd; border: 1px solid #333; border-radius: 10px; padding: 10px 12px; display: grid; gap: 8px; box-shadow: 0 12px 40px rgba(0, 0, 0, .5); max-height: 82vh; overflow-y: auto; overflow-x: hidden; }
.dlab__head { display: flex; justify-content: space-between; gap: 8px; color: #7CFC9A; cursor: grab; user-select: none; padding-bottom: 4px; border-bottom: 1px solid #222; }
.dlab__head span { color: #888; }
details { border-bottom: 1px solid #1e1e1e; padding-bottom: 8px; }
summary { cursor: pointer; color: #b8f5c9; padding: 4px 0; user-select: none; }
summary em { color: #666; font-style: normal; }
.dlab__row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.dlab__row > label { flex: 1 0 100%; color: #8a8a8a; }
.dlab__panel button { background: #1d1d1d; color: #ccc; border: 1px solid #383838; border-radius: 6px; padding: 4px 9px; cursor: pointer; font: inherit; }
.dlab__panel button.on { background: #234d2c; color: #7CFC9A; border-color: #2f7c40; }
.dlab__panel button.off { background: #3a1d1d; color: #ff9b9b; text-decoration: line-through; }
.dlab__panel button:disabled { opacity: .35; cursor: default; }
.dlab__panel input[type="range"] { width: 100%; accent-color: #7CFC9A; }
.dlab__search { width: 100%; margin-top: 6px; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 6px; color: #ddd; padding: 4px 8px; font: inherit; }
.dlab__files { display: flex; flex-wrap: wrap; gap: 4px; max-height: 140px; overflow-y: auto; margin-top: 6px; }
.dlab__files button { font-size: 10px; padding: 2px 6px; }
.dlab__files em { color: #6a8; font-style: normal; }
.dlab__vars { display: grid; gap: 4px; max-height: 200px; overflow-y: auto; margin-top: 6px; }
.dlab__var { display: flex; align-items: center; gap: 6px; }
.dlab__var label { flex: 0 1 46%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #9ad; }
.dlab__var input[type="color"] { width: 26px; height: 22px; padding: 0; border: 1px solid #333; background: none; }
.dlab__varval { flex: 1; min-width: 60px; background: #0a0a0a; border: 1px solid #2a2a2a; border-radius: 4px; color: #ddd; padding: 2px 6px; font: inherit; font-size: 11px; }
.dlab__pin { margin-top: 6px; display: grid; gap: 6px; }
.dlab__pindesc { color: #7CFC9A; word-break: break-all; }
.dlab__computed { display: flex; flex-wrap: wrap; gap: 4px 10px; color: #999; font-size: 11px; max-height: 80px; overflow-y: auto; }
.dlab__computed b { color: #7a9; font-weight: 400; }
.dlab__rules { display: grid; gap: 5px; max-height: 240px; overflow-y: auto; }
.dlab__rule { background: #0a0a0a; border: 1px solid #232323; border-radius: 6px; padding: 5px 7px; }
.dlab__rulehead b { color: #e8c17a; font-weight: 400; word-break: break-all; }
.dlab__rulehead em { color: #667; font-style: normal; font-size: 10px; }
.dlab__ruleprops { color: #8a8a8a; font-size: 10.5px; word-break: break-all; display: flex; flex-wrap: wrap; gap: 2px 8px; }
.dlab__prop.win { color: #7CFC9A; }
.dlab__prop.dead { color: #666; text-decoration: line-through; text-decoration-color: #c05555; cursor: help; }
.dlab__prop.imp b { color: #ff7b7b; font-weight: 400; }
.dlab__stats { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dlab__chip { border-radius: 999px; padding: 2px 8px; font-size: 10.5px; }
.dlab__chip--imp { background: #3a1d1d; color: #ff9b9b; }
.dlab__chip--dead { background: #2a2a20; color: #d8c87a; }
.dlab__chip--kill { background: #4a1520; color: #ff8fa0; }
.dlab__deadview { display: grid; gap: 5px; max-height: 300px; overflow-y: auto; }
.dlab__deadwarn { color: #d8c87a; font-size: 10.5px; }
.dlab__rule.fulldead { border-color: #5a2030; }
.dlab__legend { color: #667; font-size: 10px; }
.dlab__legend .w { color: #7CFC9A; font-style: normal; }
.dlab__legend .d { color: #888; text-decoration: line-through; font-style: normal; }
.dlab__winners { display: grid; gap: 3px; max-height: 280px; overflow-y: auto; }
.dlab__winner { display: grid; grid-template-columns: minmax(90px, auto) 1fr; gap: 0 10px; background: #0a0a0a; border: 1px solid #1e1e1e; border-radius: 5px; padding: 3px 7px; font-size: 11px; }
.dlab__winner b { color: #9ad; font-weight: 400; }
.dlab__wval { color: #7CFC9A; word-break: break-all; }
.dlab__wval i { color: #ff7b7b; font-style: normal; }
.dlab__winner em { grid-column: 1 / -1; color: #667; font-style: normal; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dlab__rulemore { color: #667; text-align: center; }
.dlab__hint { color: #667; margin-top: 6px; }
.dlab__abdiff { margin-top: 6px; color: #b0a6ff; font-size: 11px; display: grid; gap: 2px; }
.dlab__flip { flex: 1; background: #26224d !important; color: #b0a6ff !important; }
.dlab__foot { border-top: 1px solid #222; padding-top: 8px; }
.dlab__reset { margin-left: auto; background: #3a1d1d !important; color: #ff9b9b !important; }
.dlab-hl { position: fixed; z-index: 99997; pointer-events: none; outline: 1.5px solid #4fc3f7; background: rgba(79, 195, 247, .08); }
.dlab-hl__m { position: absolute; background: rgba(255, 160, 60, .16); z-index: -1; }
.dlab-hl__p { position: absolute; background: rgba(124, 252, 154, .14); }
</style>
