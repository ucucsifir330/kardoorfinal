import { computed } from "vue";
import { useKardoorLocale } from "~/composables/useKardoorLocale";

/**
 * Giriş sahnesinin ORTAK metni — hero başlığı, alt başlık ve CTA.
 *
 * Neden ayrı dosya: aynı altı alan hem EntranceDoorLab hem EntranceDoorMobile
 * içinde birebir kopyalanmıştı. SSR açıldıktan sonra bu metin sunucudan
 * basılıyor (HomeEntranceCopy), yani artık ÜÇ yerde tekrar edecekti.
 * Tek kaynak: metin değişince tek yer güncellenir, varyantlar ayrışamaz.
 *
 * Cihaza özgü ipucu metinleri (scrollCue / enterCue / showroomCue / exitCue)
 * burada DEĞİL, ilgili bileşende kalır — onlar gerçekten cihaza bağlı.
 */
export interface EntranceCopy {
  line1: string;
  accent: string;
  line2: string;
  subtitleLead: string;
  subtitleAccent: string;
  ctaLabel: string;
}

export const useEntranceCopy = () => {
  const { locale } = useKardoorLocale();

  const copy = computed<EntranceCopy>(() =>
    locale.value === "tr"
      ? {
          line1: "Hayallerinize",
          accent: "Açılan",
          line2: "Kapı",
          subtitleLead: "Güven kapının ardında",
          subtitleAccent: "yaşar.",
          ctaLabel: "Koleksiyonları Keşfet"
        }
      : {
          line1: "The Door",
          accent: "to Your",
          line2: "Dreams",
          subtitleLead: "Confidence lives behind the door",
          subtitleAccent: "",
          ctaLabel: "Explore Collections"
        }
  );

  return { copy };
};
