<template>
  <span
    ref="rootRef"
    class="stroke-text"
    :class="[
      `stroke-text--${align}`,
      { 'stroke-text--ready': isReady }
    ]"
    role="img"
    :aria-label="accessibleText"
  >
    <span
      v-for="(line, lineIndex) in lines"
      :key="`${line}-${lineIndex}`"
      class="stroke-text__line"
      :style="lineStyles[lineIndex]"
    >
      <svg
        class="stroke-text__svg"
        :viewBox.attr="viewBoxes[lineIndex]"
        preserveAspectRatio="xMinYMid meet"
        aria-hidden="true"
      >
        <defs v-if="fillMode === 'wipe'">
          <clipPath :id="`${wipeId}-${lineIndex}`" clipPathUnits="userSpaceOnUse">
            <rect
              :ref="(element) => setWipeRef(element, lineIndex)"
              :x.attr="boxes[lineIndex]?.x ?? 0"
              :y.attr="boxes[lineIndex]?.y ?? 0"
              width="0"
              :height.attr="boxes[lineIndex]?.height ?? 0"
            />
          </clipPath>
        </defs>

        <text
          :ref="(element) => setStrokeRef(element, lineIndex)"
          class="stroke-text__stroke"
          x="0"
          y="0"
          fill="none"
          :stroke="lineStrokeColor(lineIndex)"
          :stroke-width.attr="strokeWidth"
          stroke-linejoin="round"
          stroke-linecap="round"
          xml:space="preserve"
          :style="fontStyle"
        >
          <tspan
            v-for="(character, characterIndex) in characters(line)"
            :key="`stroke-${lineIndex}-${characterIndex}`"
            data-stroke-char
            :style="initialStrokeStyle"
          >{{ character }}</tspan>
        </text>

        <text
          class="stroke-text__fill"
          x="0"
          y="0"
          :fill="lineFillColor(lineIndex)"
          stroke="none"
          xml:space="preserve"
          :clip-path.attr="fillMode === 'wipe' ? `url(#${wipeId}-${lineIndex})` : undefined"
          :style="fontStyle"
        >
          <tspan
            v-for="(character, characterIndex) in characters(line)"
            :key="`fill-${lineIndex}-${characterIndex}`"
            data-fill-char
          >{{ character }}</tspan>
        </text>
      </svg>
    </span>
  </span>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance, CSSProperties } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";

type StrokeTextTrigger = "mount" | "scroll";
type StrokeTextFillMode = "fade" | "wipe" | "none";
type StrokeTextAlign = "left" | "center";

interface TextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const props = withDefaults(
  defineProps<{
    text: string;
    strokeColor?: string;
    fillColor?: string;
    accentColor?: string;
    accentLineIndexes?: number[];
    strokeWidth?: number;
    drawDuration?: number;
    fillDelay?: number;
    stagger?: number;
    ease?: string;
    trigger?: StrokeTextTrigger;
    fillMode?: StrokeTextFillMode;
    fontSize?: number;
    fontWeight?: number | string;
    letterSpacing?: number;
    lineHeight?: number;
    align?: StrokeTextAlign;
    start?: string;
  }>(),
  {
    strokeColor: "currentColor",
    fillColor: "currentColor",
    accentColor: "currentColor",
    accentLineIndexes: () => [],
    strokeWidth: 1.4,
    drawDuration: 1.1,
    fillDelay: 0.08,
    stagger: 0.025,
    ease: "power2.out",
    trigger: "scroll",
    fillMode: "wipe",
    fontSize: 128,
    fontWeight: "inherit",
    letterSpacing: 0,
    lineHeight: 1,
    align: "left",
    start: "top 82%"
  }
);

const rootRef = ref<HTMLElement | null>(null);
const boxes = ref<TextBox[]>([]);
const isReady = ref(false);
const wipeId = `stroke-text-wipe-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
const strokeRefs: Array<SVGTextElement | null> = [];
const wipeRefs: Array<SVGRectElement | null> = [];

let animationCleanup: (() => void) | null = null;
let setupVersion = 0;
let cancelled = false;

const lines = computed(() => String(props.text ?? "").split("\n"));
const accessibleText = computed(() => lines.value.join(" "));
const dash = computed(() => Math.max(props.fontSize * 7, 200));

const fontStyle = computed<CSSProperties>(() => ({
  fontFamily: "inherit",
  fontSize: `${props.fontSize}px`,
  fontWeight: props.fontWeight,
  letterSpacing: `${props.letterSpacing}px`
}));

const initialStrokeStyle = computed<CSSProperties>(() => ({
  strokeDasharray: dash.value,
  strokeDashoffset: dash.value
}));

const viewBoxes = computed(() =>
  lines.value.map((_, index) => {
    const box = boxes.value[index];
    return box ? `${box.x} ${box.y} ${box.width} ${box.height}` : `0 ${-props.fontSize} 1 ${props.fontSize}`;
  })
);

const lineStyles = computed<CSSProperties[]>(() =>
  lines.value.map((_, index) => {
    const box = boxes.value[index];
    if (!box?.height) return {};

    return {
      width: `${box.width / props.fontSize}em`,
      height: `${props.lineHeight}em`
    };
  })
);

const characters = (line: string) => Array.from(line);
const isAccentLine = (index: number) => props.accentLineIndexes.includes(index);
const lineStrokeColor = (index: number) =>
  isAccentLine(index) ? props.accentColor : props.strokeColor;
const lineFillColor = (index: number) =>
  isAccentLine(index) ? props.accentColor : props.fillColor;

const setStrokeRef = (element: Element | ComponentPublicInstance | null, index: number) => {
  strokeRefs[index] = element instanceof SVGTextElement ? element : null;
};

const setWipeRef = (element: Element | ComponentPublicInstance | null, index: number) => {
  wipeRefs[index] = element instanceof SVGRectElement ? element : null;
};

const clearAnimation = () => {
  setupVersion += 1;
  animationCleanup?.();
  animationCleanup = null;
};

const setupAnimation = async () => {
  const root = rootRef.value;
  if (!root || boxes.value.length !== lines.value.length || boxes.value.some((box) => !box.width)) return;

  clearAnimation();
  isReady.value = false;
  const version = setupVersion;
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger")
  ]);

  if (cancelled || version !== setupVersion || !rootRef.value) return;

  gsap.registerPlugin(ScrollTrigger);

  const context = gsap.context(() => {
    const strokes = gsap.utils.toArray<SVGTSpanElement>("[data-stroke-char]", root);
    const fills = gsap.utils.toArray<SVGTSpanElement>("[data-fill-char]", root);
    const wipes = wipeRefs.filter((wipe): wipe is SVGRectElement => Boolean(wipe));
    const fillEnabled = props.fillMode !== "none";
    const useWipe = fillEnabled && props.fillMode === "wipe";
    const targets = [...strokes, ...fills, ...wipes];

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash.value, strokeDashoffset: dash.value });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      gsap.set(wipes, { attr: { width: 0 } });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash.value, strokeDashoffset: 0 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      wipes.forEach((wipe, index) => {
        gsap.set(wipe, { attr: { width: fillEnabled ? boxes.value[index]?.width ?? 0 : 0 } });
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEnd();
      isReady.value = true;
      return;
    }

    setStart();

    const timeline = gsap.timeline({ paused: true, defaults: { overwrite: "auto" } });
    timeline.to(
      strokes,
      {
        strokeDashoffset: 0,
        duration: props.drawDuration,
        ease: props.ease,
        stagger: props.stagger
      },
      0
    );

    const fillStart = props.drawDuration + props.fillDelay;
    const fillDuration = Math.max(0.4, props.drawDuration * 0.5);

    if (useWipe) {
      wipes.forEach((wipe, index) => {
        timeline.to(
          wipe,
          {
            attr: { width: boxes.value[index]?.width ?? 0 },
            duration: fillDuration,
            ease: "power2.inOut"
          },
          fillStart + index * 0.08
        );
      });
    } else if (fillEnabled) {
      timeline.to(
        fills,
        {
          opacity: 1,
          duration: fillDuration,
          ease: "power2.out",
          stagger: props.stagger
        },
        fillStart
      );
    }

    isReady.value = true;

    if (props.trigger === "mount") {
      timeline.play(0);
      return;
    }

    const scrollTrigger = ScrollTrigger.create({
      trigger: root,
      start: props.start,
      once: true,
      onEnter: () => timeline.play(0)
    });

    if (scrollTrigger.progress > 0) timeline.play(0);
  }, root);

  animationCleanup = () => context.revert();
};

const measure = async () => {
  await nextTick();
  if (cancelled) return;

  const nextBoxes = lines.value.map((_, index) => {
    const node = strokeRefs[index];
    if (!node) return null;

    try {
      const bbox = node.getBBox();
      if (!bbox.width || !bbox.height) return null;

      const pad = Math.max(props.strokeWidth, props.fontSize * 0.04);
      return {
        x: bbox.x - pad,
        y: bbox.y - pad,
        width: bbox.width + pad * 2,
        height: bbox.height + pad * 2
      };
    } catch {
      return null;
    }
  });

  if (nextBoxes.some((box) => !box)) return;

  boxes.value = nextBoxes as TextBox[];
  await nextTick();
  await setupAnimation();
};

onMounted(() => {
  measure();
  document.fonts?.ready.then(() => measure()).catch(() => undefined);
});

watch(
  () => [props.text, props.fontSize, props.fontWeight, props.letterSpacing, props.strokeWidth],
  () => {
    boxes.value = [];
    clearAnimation();
    isReady.value = false;
    measure();
  },
  { flush: "post" }
);

onBeforeUnmount(() => {
  cancelled = true;
  clearAnimation();
});
</script>

<style scoped>
.stroke-text {
  display: flex;
  width: max-content;
  max-width: 100%;
  flex-direction: column;
  visibility: hidden;
  line-height: 0;
}

.stroke-text--ready {
  visibility: visible;
}

.stroke-text--left {
  align-items: flex-start;
}

.stroke-text--center {
  align-items: center;
}

.stroke-text__line {
  display: block;
  max-width: 100%;
}

.stroke-text__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.stroke-text__stroke,
.stroke-text__fill {
  user-select: none;
  text-rendering: geometricPrecision;
}
</style>
