import { computed, watch } from "vue";

export const kardoorLocales = ["tr", "en"] as const;

export type KardoorLocale = (typeof kardoorLocales)[number];

export type LocalizedValue<T> = Record<KardoorLocale, T>;

export const localeLabels: Record<KardoorLocale, "TR" | "EN"> = {
  tr: "TR",
  en: "EN"
};

const defaultLocale: KardoorLocale = "tr";

export function normalizeLocale(value: unknown): KardoorLocale {
  return kardoorLocales.includes(value as KardoorLocale)
    ? (value as KardoorLocale)
    : defaultLocale;
}

export function pickLocale<T>(
  value: LocalizedValue<T>,
  locale: KardoorLocale
): T {
  return value[locale] ?? value[defaultLocale];
}

export function useKardoorLocale() {
  const cookie = useCookie<KardoorLocale>("kardoor-locale", {
    default: () => defaultLocale,
    sameSite: "lax"
  });

  const locale = useState<KardoorLocale>("kardoor-locale", () =>
    normalizeLocale(cookie.value)
  );

  const setLocale = (nextLocale: KardoorLocale) => {
    locale.value = normalizeLocale(nextLocale);
  };

  const activeLabel = computed(() => localeLabels[locale.value]);

  watch(
    locale,
    (nextLocale) => {
      cookie.value = nextLocale;

      if (import.meta.client) {
        document.documentElement.lang = nextLocale;
      }
    },
    { immediate: true }
  );

  return {
    locale,
    locales: kardoorLocales,
    localeLabels,
    activeLabel,
    setLocale
  };
}
