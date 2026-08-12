/**
 * measure-door-box — Hero görselindeki KAPI DELİĞİNİ ölçer ve EntranceDoorLab.vue'nun
 * beklediği doorBox değerlerini (yüzde) üretir.
 *
 * ── Neden iki aşamalı ──────────────────────────────────────────────────────
 * doorBox, deliğin HAM ölçüsü DEĞİLDİR. Canvas, sprite karesinin tamamını
 * (480×720) doorBox kutusuna stretch eder; ama karedeki gerçek opak kanat
 * yalnızca 380×701'lik bir alandır — kenarlarda şeffaf taşıma payı vardır.
 * Kutu ham delik kadar verilirse kanat delikten DAR kalır ve kenarda ince bir
 * şeffaf çizgi görünür (iki temada da). Bu yüzden kutu, sprite payını telafi
 * edecek kadar büyütülür:
 *
 *     doorBox.width  = delik.width  × (frameW / panelW) × SAFETY
 *     doorBox.height = delik.height × (frameH / panelH) × SAFETY
 *
 * Telafi oranları sprite'ın KAPALI karesinden (kare 1) otomatik ölçülür, elle
 * girilmez. SAFETY, sıkıştırma kenarındaki yarı saydam pikseller için küçük bir
 * emniyet payıdır; mevcut üretim değerleri bu payla türetilmiştir (bkz. --verify).
 *
 * ── Kullanım ───────────────────────────────────────────────────────────────
 *   node scripts/measure-door-box.cjs --verify
 *       Mevcut 12 varyantı koddaki değerlerle karşılaştırır (regresyon testi).
 *
 *   node scripts/measure-door-box.cjs <gorsel...>
 *       Yeni hero görsellerini ölçer, yapıştırmaya hazır doorBox basar.
 *
 *   node scripts/measure-door-box.cjs --raw <gorsel...>
 *       Telafi uygulamadan ham delik ölçüsünü gösterir (teşhis için).
 *
 *   node scripts/measure-door-box.cjs --json <gorsel...>
 *       Ham JSON çıktı (başka araca boru ile bağlamak için).
 *
 * Örnek:
 *   node scripts/measure-door-box.cjs nuxt/public/hero-day-16x9.avif
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const PUBLIC = path.join(REPO, "nuxt", "public");

// Bir pikselin şeffaf/opak sayılma eşiği. Sıkıştırma (AVIF/WebP) kenarlarda
// alpha'yı tam 0/255'ten kaydırdığı için tolerans bırakıyoruz.
const ALPHA_THRESHOLD = 8;

// Deliğin geçerli sayılması için görselin en az bu kadarını kaplaması gerekir.
// Kenardaki tek tük şeffaf artıkları eler.
const MIN_AREA_RATIO = 0.002;

// Emniyet payı — kanat delikten bir tık taşsın diye. Mevcut üretim değerleri
// bu payla türetilmiştir: ölçülen oran 1.281 / teorik 1.263 = 1.0143 (genişlik),
// 1.041 / 1.027 = 1.0136 (yükseklik). Ortalaması alınıp tek katsayı kullanılır.
const SAFETY = 1.014;

// Kapalı kapı karesi (1-tabanlı). Sprite'ın ilk karesi kapı TAM KAPALI halidir.
const CLOSED_FRAME = 1;

/**
 * Alpha maskesindeki en büyük bağlantılı ŞEFFAF bölgeyi bulur (flood fill).
 * Kapı deliği dışındaki küçük şeffaf artıklar böylece hesaba katılmaz.
 */
const findLargestTransparentRegion = (data, W, H, C) => {
  const isHole = (x, y) => data[(y * W + x) * C + 3] < ALPHA_THRESHOLD;
  const visited = new Uint8Array(W * H);
  const stack = new Int32Array(W * H);
  let best = null;

  for (let sy = 0; sy < H; sy += 1) {
    for (let sx = 0; sx < W; sx += 1) {
      const startIdx = sy * W + sx;
      if (visited[startIdx] || !isHole(sx, sy)) continue;

      let top = 0;
      stack[top++] = startIdx;
      visited[startIdx] = 1;

      let count = 0;
      let minX = W;
      let maxX = -1;
      let minY = H;
      let maxY = -1;

      while (top > 0) {
        const idx = stack[--top];
        const x = idx % W;
        const y = (idx - x) / W;

        count += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        if (x > 0) {
          const n = idx - 1;
          if (!visited[n] && isHole(x - 1, y)) { visited[n] = 1; stack[top++] = n; }
        }
        if (x < W - 1) {
          const n = idx + 1;
          if (!visited[n] && isHole(x + 1, y)) { visited[n] = 1; stack[top++] = n; }
        }
        if (y > 0) {
          const n = idx - W;
          if (!visited[n] && isHole(x, y - 1)) { visited[n] = 1; stack[top++] = n; }
        }
        if (y < H - 1) {
          const n = idx + W;
          if (!visited[n] && isHole(x, y + 1)) { visited[n] = 1; stack[top++] = n; }
        }
      }

      if (!best || count > best.count) best = { count, minX, maxX, minY, maxY };
    }
  }

  return best;
};

/**
 * Sprite'ın KAPALI karesindeki gerçek opak kanat alanını ölçer ve kareye göre
 * telafi oranlarını döndürür. Sprite değişirse bu değerler kendiliğinden
 * güncellenir — kodda sabit tutmuyoruz.
 */
const measureSpritePadding = async (metaPath) => {
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const spritePath = path.join(PUBLIC, meta.sprite.replace(/^\//, ""));
  const frame = meta.frames.find((f) => f.frame === CLOSED_FRAME) ?? meta.frames[0];

  const { data, info } = await sharp(spritePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: SW, channels: C } = info;

  let minX = frame.width;
  let maxX = -1;
  let minY = frame.height;
  let maxY = -1;

  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const a = data[((frame.y + y) * SW + (frame.x + x)) * C + 3];
      if (a <= ALPHA_THRESHOLD) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const panelW = maxX - minX + 1;
  const panelH = maxY - minY + 1;

  return {
    sprite: meta.sprite,
    frame: { w: frame.width, h: frame.height },
    panel: { x: minX, y: minY, w: panelW, h: panelH },
    panelAspect: panelW / panelH,
    // Kutu bu oranlarla büyütülür ki stretch sonrası kanat deliği tam doldursun.
    scaleX: frame.width / panelW,
    scaleY: frame.height / panelH,
    // Kanat kare içinde ORTALANMAMIŞ olabilir (mevcut sprite'ta sol 55px /
    // sağ 45px → merkez 5px sağda). Kutu bu kaçıklık kadar ters yöne
    // kaydırılmazsa kanat delikte yana yaslanır. Kare genişliğine oranla.
    offsetXFrac: (minX + panelW / 2 - frame.width / 2) / frame.width,
    offsetYFrac: (minY + panelH / 2 - frame.height / 2) / frame.height
  };
};

const measureHole = async (file) => {
  const abs = path.isAbsolute(file) ? file : path.join(REPO, file);
  const { data, info } = await sharp(abs)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  const region = findLargestTransparentRegion(data, W, H, C);

  if (!region || region.count < W * H * MIN_AREA_RATIO) {
    return {
      file,
      width: W,
      height: H,
      aspect: W / H,
      error: "Kapı deliği bulunamadı — yeterince büyük şeffaf bölge yok."
    };
  }

  const boxW = region.maxX - region.minX + 1;
  const boxH = region.maxY - region.minY + 1;

  return {
    file,
    width: W,
    height: H,
    aspect: W / H,
    pixels: { x: region.minX, y: region.minY, w: boxW, h: boxH },
    // Doluluk: delik gerçekten dikdörtgen mi? Kapı boşluğu için >%99 beklenir.
    fillRatio: region.count / (boxW * boxH),
    holeAspect: boxW / boxH,
    raw: {
      centerX: ((region.minX + boxW / 2) / W) * 100,
      top: (region.minY / H) * 100,
      width: (boxW / W) * 100,
      height: (boxH / H) * 100
    }
  };
};

/** Ham deliğe sprite telafisini uygular → yapıştırmaya hazır doorBox. */
const applyCompensation = (raw, pad) => {
  const width = raw.width * pad.scaleX * SAFETY;
  const height = raw.height * pad.scaleY * SAFETY;
  // Kutu merkezden büyür: üst kenar, yüksekliğin arttığı kadarın yarısı yukarı.
  // Ayrıca kanat kare içinde ortalanmamışsa kutu ters yöne kaydırılır ki
  // stretch sonrası kanadın merkezi deliğin merkeziyle çakışsın.
  return {
    centerX: raw.centerX - width * pad.offsetXFrac,
    top: raw.top - (height - raw.height) / 2 - height * pad.offsetYFrac,
    width,
    height
  };
};

// EntranceDoorLab.vue'daki mevcut üretim değerleri — --verify referansı.
const CURRENT = {
  "L-21X9.webp":          { centerX: 52.19,   top: 28.199, width: 14.95,  height: 48.743 },
  "N-21X9.webp":          { centerX: 52.02,   top: 28.003, width: 15.092, height: 48.617 },
  "hero-day-16x9.avif":   { centerX: 52.177,  top: 34.398, width: 15.414, height: 41.108 },
  "hero-night-16x9.avif": { centerX: 52.17,   top: 34.334, width: 15.496, height: 41.158 },
  "hero-day-4x3.avif":    { centerX: 53.523,  top: 36.697, width: 16.18,  height: 32.448 },
  "hero-night-4x3.avif":  { centerX: 53.578,  top: 36.657, width: 16.179, height: 32.58  },
  "hero-day-1x1.avif":    { centerX: 50.959,  top: 35.688, width: 17.5,   height: 27.537 },
  "hero-night-1x1.avif":  { centerX: 50.936,  top: 35.584, width: 17.514, height: 27.517 },
  "hero-day-3x4.avif":    { centerX: 49.414,  top: 42.347, width: 19.468, height: 22.275 },
  "hero-night-3x4.avif":  { centerX: 49.43,   top: 42.197, width: 19.637, height: 22.514 },
  "hero-day-9x16.avif":   { centerX: 51.388,  top: 43.722, width: 26.608, height: 23.262 },
  "hero-night-9x16.avif": { centerX: 51.368,  top: 43.54,  width: 26.723, height: 23.533 }
};

const boxLiteral = (b) =>
  `{ centerX: ${b.centerX.toFixed(3)}, top: ${b.top.toFixed(3)}, ` +
  `width: ${b.width.toFixed(3)}, height: ${b.height.toFixed(3)} }`;

const fmt = (n) => n.toFixed(3).padStart(8);

(async () => {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const verify = args.includes("--verify");
  const rawOnly = args.includes("--raw");
  let files = args.filter((a) => !a.startsWith("--"));

  if (verify || !files.length) {
    files = Object.keys(CURRENT).map((f) => path.join(PUBLIC, f));
  }

  // Telafi oranları sprite'tan ölçülür. Light ve night sprite'ları aynı
  // geometriye sahip; light'ı referans alıp night'ı doğrulama için ölçüyoruz.
  const padLight = await measureSpritePadding(path.join(PUBLIC, "kardoor-door-light.json"));
  const padNight = await measureSpritePadding(path.join(PUBLIC, "kardoor-door-night.json"));

  if (!asJson) {
    console.log(
      `Sprite telafisi (kapalı kare ${CLOSED_FRAME}): ` +
      `kanat ${padLight.panel.w}×${padLight.panel.h} / kare ${padLight.frame.w}×${padLight.frame.h}  ` +
      `→ ×${padLight.scaleX.toFixed(4)} yatay, ×${padLight.scaleY.toFixed(4)} dikey  ` +
      `(emniyet ×${SAFETY})`
    );
    if (padNight.scaleX !== padLight.scaleX || padNight.scaleY !== padLight.scaleY) {
      console.log(
        `  ⚠ night sprite farklı: ×${padNight.scaleX.toFixed(4)} / ×${padNight.scaleY.toFixed(4)}`
      );
    }
    console.log("");
  }

  const results = [];
  for (const f of files) {
    const abs = path.isAbsolute(f) ? f : path.join(REPO, f);
    if (!fs.existsSync(abs)) {
      console.error(`atlandı (yok): ${f}`);
      continue;
    }
    const r = await measureHole(f);
    const pad = /night|^N-/i.test(path.basename(f)) ? padNight : padLight;
    if (!r.error) r.box = applyCompensation(r.raw, pad);
    results.push(r);
  }

  if (asJson) {
    console.log(JSON.stringify({ padding: { light: padLight, night: padNight }, results }, null, 2));
    return;
  }

  if (verify) {
    console.log("Doğrulama — telafili ölçüm eksi koddaki üretim değeri (yüzde puanı)\n");
    let worstAll = 0;
    for (const r of results) {
      const name = path.basename(r.file);
      const cur = CURRENT[name];
      if (r.error) {
        console.log(`✗ ${name.padEnd(24)} ${r.error}`);
        continue;
      }
      const d = {
        centerX: r.box.centerX - cur.centerX,
        top: r.box.top - cur.top,
        width: r.box.width - cur.width,
        height: r.box.height - cur.height
      };
      const worst = Math.max(...Object.values(d).map(Math.abs));
      worstAll = Math.max(worstAll, worst);
      const flag = worst > 0.25 ? "⚠" : worst > 0.1 ? "·" : "✓";
      console.log(
        `${flag} ${name.padEnd(24)} ΔcX ${fmt(d.centerX)}  Δtop ${fmt(d.top)}  ` +
        `Δw ${fmt(d.width)}  Δh ${fmt(d.height)}   (doluluk ${(r.fillRatio * 100).toFixed(1)}%)`
      );
      if (worst > 0.1) console.log(`  ölçülen → ${boxLiteral(r.box)}`);
    }
    console.log(`\n⚠ >0.25pt  ·  · >0.1pt  ·  ✓ hizalı      en büyük sapma: ${worstAll.toFixed(3)}pt`);
    return;
  }

  for (const r of results) {
    if (r.error) {
      console.log(`✗ ${path.basename(r.file)}  ${r.width}×${r.height} — ${r.error}\n`);
      continue;
    }
    console.log(
      `${path.basename(r.file).padEnd(24)} ${r.width}×${r.height}  aspect ${r.aspect.toFixed(4)}`
    );
    console.log(
      `  delik ${r.pixels.w}×${r.pixels.h}px  oran ${r.holeAspect.toFixed(4)}  ` +
      `doluluk ${(r.fillRatio * 100).toFixed(1)}%`
    );
    if (rawOnly) {
      console.log(`  ham    → ${boxLiteral(r.raw)}`);
    } else {
      console.log(`  doorBox: ${boxLiteral(r.box)}`);
    }
    // Kapı deliğinin oranı sprite kanadının oranından çok saparsa kapı gerilir.
    const drift = Math.abs(r.holeAspect - padLight.panelAspect) / padLight.panelAspect;
    if (drift > 0.06) {
      console.log(
        `  ⚠ delik oranı ${r.holeAspect.toFixed(3)}, sprite kanadı ${padLight.panelAspect.toFixed(3)} ` +
        `→ %${(drift * 100).toFixed(1)} sapma; kapı gerilmiş görünebilir.`
      );
    }
    console.log("");
  }
})().catch((err) => {
  console.error("HATA:", err.message);
  process.exit(1);
});
