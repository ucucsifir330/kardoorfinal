"""
convert-fonts-woff2.py

public/fonts altindaki .otf dosyalarini .woff2'ye cevirir.

Neden: .otf sikistirilmamis bir konteyner. .woff2 ayni glyph verisini
Brotli ile paketler — tipik olarak %40-50 kucuk, gorsel olarak BIREBIR ayni
font. Tarayici destegi evrensel (IE11 haric).

Orijinal .otf dosyalari SILINMEZ; fallback olarak kalir.

Kullanim: python scripts/convert-fonts-woff2.py
"""
from pathlib import Path
from fontTools.ttLib import TTFont

KAYNAK = Path("public/fonts")

def main() -> None:
    otf_dosyalari = sorted(KAYNAK.rglob("*.otf"))
    if not otf_dosyalari:
        print("public/fonts altinda .otf bulunamadi")
        return

    toplam_once = 0
    toplam_sonra = 0

    print(f"{'DOSYA':<44} {'OTF':>9} {'WOFF2':>9} {'KAZANC':>8}")
    print("-" * 74)

    for otf in otf_dosyalari:
        hedef = otf.with_suffix(".woff2")

        font = TTFont(str(otf))
        font.flavor = "woff2"
        font.save(str(hedef))

        once = otf.stat().st_size
        sonra = hedef.stat().st_size
        toplam_once += once
        toplam_sonra += sonra

        oran = (1 - sonra / once) * 100
        print(f"{otf.name:<44} {once/1024:>8.1f}K {sonra/1024:>8.1f}K {oran:>7.0f}%")

    print("-" * 74)
    kazanc = (1 - toplam_sonra / toplam_once) * 100
    print(f"{'TOPLAM':<44} {toplam_once/1024:>8.1f}K {toplam_sonra/1024:>8.1f}K {kazanc:>7.0f}%")
    print(f"\nKazanilan: {(toplam_once - toplam_sonra)/1024:.1f} KB")

if __name__ == "__main__":
    main()
