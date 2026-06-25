/**
 * pack-door-sprite — Render_light / Render_night kare dizilerini, EntranceDoor
 * canvas motorunun beklediği TEK paket sprite sheet + JSON metadata'ya çevirir.
 *
 * Kaynak : nuxt/public/Render_{light,night}/0001.png … 0120.png  (1800×2700, RGBA)
 * Çıktı  : nuxt/public/kardoor-door-{light,night}.webp  +  .json
 *
 * Metadata formatı, mevcut kardoor-door-sprite.json ile birebir aynıdır
 * (frameWidth/frameHeight/columns/rows/frames[]), böylece taşıma sırasında
 * canvas source-rect çizim kodu hiç değişmeden bu sprite'larla çalışır.
 *
 * Çalıştırma:  node scripts/pack-door-sprite.cjs [frameWidth] [columns]
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// ── Ayarlar (CLI ile geçersiz kılınabilir) ───────────────────────────────
// Kaynak 1800×2700 = 2:3. Aynı oranı koruyoruz; sadece ölçek düşürüyoruz.
const FRAME_W = Number(process.argv[2]) || 480; // her karenin sheet'teki genişliği
const FRAME_H = Math.round((FRAME_W * 2700) / 1800); // 2:3 oranı → 720
const COLUMNS = Number(process.argv[3]) || 10;
const WEBP = { quality: 80, alphaQuality: 90, effort: 6 };

const PUBLIC = path.resolve(__dirname, "..", "nuxt", "public");

const SETS = [
  { src: "Render_light", out: "kardoor-door-light" },
  { src: "Render_night", out: "kardoor-door-night" }
];

const human = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function pack({ src, out }) {
  const srcDir = path.join(PUBLIC, src);
  const files = fs
    .readdirSync(srcDir)
    .filter((f) => /^\d+\.png$/i.test(f))
    .sort(); // sıfır-dolgulu isimler leksikografik = sayısal sıra

  if (!files.length) throw new Error(`Kare bulunamadı: ${srcDir}`);

  const rows = Math.ceil(files.length / COLUMNS);
  const sheetW = FRAME_W * COLUMNS;
  const sheetH = FRAME_H * rows;

  const composites = [];
  const frames = [];

  for (let i = 0; i < files.length; i += 1) {
    const col = i % COLUMNS;
    const row = Math.floor(i / COLUMNS);
    const left = col * FRAME_W;
    const top = row * FRAME_H;

    // 1800×2700 → FRAME_W×FRAME_H, aynı oran olduğu için 'fill' bozmaz.
    const buf = await sharp(path.join(srcDir, files[i]))
      .resize(FRAME_W, FRAME_H, { fit: "fill" })
      .png()
      .toBuffer();

    composites.push({ input: buf, left, top });
    frames.push({ frame: i + 1, x: left, y: top, width: FRAME_W, height: FRAME_H });
  }

  const webpPath = path.join(PUBLIC, `${out}.webp`);
  const jsonPath = path.join(PUBLIC, `${out}.json`);

  await sharp({
    create: {
      width: sheetW,
      height: sheetH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 } // şeffaf zemin
    }
  })
    .composite(composites)
    .webp(WEBP)
    .toFile(webpPath);

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        sprite: `/${out}.webp`,
        frameWidth: FRAME_W,
        frameHeight: FRAME_H,
        columns: COLUMNS,
        rows,
        frameCount: files.length,
        frames
      },
      null,
      2
    )
  );

  const size = fs.statSync(webpPath).size;
  console.log(
    `✓ ${out}: ${files.length} kare → ${sheetW}×${sheetH} sheet · ${human(size)}  (${COLUMNS}×${rows} @ ${FRAME_W}×${FRAME_H})`
  );
}

(async () => {
  console.log(`Paketleme: ${FRAME_W}×${FRAME_H}/kare, ${COLUMNS} sütun, webp q${WEBP.quality}\n`);
  for (const set of SETS) await pack(set);
  console.log("\nBitti. Çıktılar nuxt/public/ altında.");
})().catch((err) => {
  console.error("HATA:", err.message);
  process.exit(1);
});
