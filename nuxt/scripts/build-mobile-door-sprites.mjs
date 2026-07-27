import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frameWidth = 240;
const frameHeight = 360;
const columns = 6;
const rows = 4;
const frameCount = columns * rows;
const sourceColumns = 10;
const sourceFrameWidth = 480;
const sourceFrameHeight = 720;

const sampledFrameIndices = Array.from({ length: frameCount }, (_, index) =>
  Math.round((index * 119) / (frameCount - 1))
);

const buildSprite = async (name) => {
  const input = path.join(root, "public", `kardoor-door-${name}.webp`);
  const output = path.join(root, "public", `mobile-door-${name}.webp`);
  const layers = await Promise.all(
    sampledFrameIndices.map(async (frameIndex, index) => {
      const sourceX = (frameIndex % sourceColumns) * sourceFrameWidth;
      const sourceY = Math.floor(frameIndex / sourceColumns) * sourceFrameHeight;
      const left = (index % columns) * frameWidth;
      const top = Math.floor(index / columns) * frameHeight;
      const inputBuffer = await sharp(input)
        .extract({
          left: sourceX,
          top: sourceY,
          width: sourceFrameWidth,
          height: sourceFrameHeight
        })
        .resize(frameWidth, frameHeight)
        .png()
        .toBuffer();

      return { input: inputBuffer, left, top };
    })
  );

  await sharp({
    create: {
      width: frameWidth * columns,
      height: frameHeight * rows,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(layers)
    .webp({ quality: 82, alphaQuality: 100, effort: 6 })
    .toFile(output);
};

await Promise.all([buildSprite("light"), buildSprite("night")]);
