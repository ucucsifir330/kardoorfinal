import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

interface SubpageSeo {
  title: string;
  description: string;
}

export function useCatalogSubpageSeo(tr: SubpageSeo, en: SubpageSeo) {
  const { locale } = useKardoorLocale();
  const seo = computed(() => (locale.value === "tr" ? tr : en));

  useSeoMeta({
    title: () => seo.value.title,
    description: () => seo.value.description
  });
}
