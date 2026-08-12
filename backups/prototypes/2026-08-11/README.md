# Kapı prototipleri arşivi — 2026-08-11

İki prototip ana ağaçtan çıkarıldı. İkisi de **hiçbir zaman commit edilmemişti**
(git'te `??` untracked durumundaydı), bu yüzden geri dönüşün tek yolu bu klasör.
Silmeyin.

Klasör yapısı `nuxt/app/` köküne göre birebir korundu; geri getirmek düz kopyalama.

## Ne arşivlendi

### 1. `pages/prototypes/door-modeler.vue` + `components/prototypes/door-modeler/`
Kapının kendisini koddan çizme denemesi. Tek sayfa, dört varyant arasında geçiş
yapan bir picker ile:

| Varyant | Dosya | Fikir |
|---|---|---|
| Cinema | `DoorModelerCinema.vue` | sinematik sunum |
| Draft | `DoorModelerDraft.vue` | teknik çizim / blueprint dili |
| Assembly | `DoorModelerAssembly.vue` | parçaların monte olması |
| Editor | `DoorModelerEditor.vue` | panel/kulp/menteşe düzenleyici |

Ortak katman: `DoorBlueprint.vue`, `DoorModelStage.vue`, `doorDefinitions.ts`
(kapı tanımları), `doorCatalogFactory.ts` (katalogdan model üretimi),
`doorModelTypes.ts`. Toplam ~3.600 satır.

**Neden çıkarıldı:** doğru çalışmadı ve ana ağaçta duran ölü ağırlık haline geldi.
Teşhis yapılmadı — çalışmadığı tespit edildiği anda arşive alındı.

### 2. `pages/prototypes/door-3d.vue`
"Door Prism · WebGL Prototype", tek dosya 1.661 satır. `three`'yi **dinamik**
import ediyordu (`await import("three")` + `three/examples/jsm/.../RoomEnvironment.js`),
kapı görsellerinden OffscreenCanvas ile maske/derinlik üretip 3B sahne kuruyordu.
`useImage().collectionsSpecimen` presetini kullanıyordu (o gün adı `museumSpecimen`'di) — preset `nuxt.config.ts`'te
duruyor, çünkü `CollectionsIndex.vue` de kullanıyor.

## Ana ağaçta yapılan yan temizlikler

- `nuxt/package.json`'dan `three` ve `@types/three` çıkarıldı. Repoda başka hiçbir
  dosya three'ye dokunmuyordu (tam repo taraması ile doğrulandı); tek tüketici
  door-3d.vue idi. Bu iki satır zaten commit edilmemiş çalışmanın parçasıydı,
  çıkarmak package.json'ı commit'li haline döndürdü.
- `nuxt.config.ts` → `components` taramasına `ignore: ["prototypes/**"]` eklendi.
  `pathPrefix: false` tüm ağacı öneksiz global bileşene çeviriyordu; prototipler
  bileşenlerini zaten explicit import ediyor.
- `nuxt.config.ts` → `pages:extend` hook'una `/prototypes/*` rotalarını
  production build'den düşüren kural eklendi. Dev'de aynen çalışıyorlar.

**CSS 3B'ye dokunulmadı.** `perspective` / `transform-style: preserve-3d`
kullanan yerler (`home-team.css`, `home-footer.css`, `company.css`,
`HomeReviews.vue`) prototip değil, canlı tasarımın parçası.

## Ana ağaçta kalan prototip

`nuxt/app/pages/prototypes/catalog-desktop.vue` → `/prototypes/catalog-desktop`
(Museum Index). `components/prototypes/catalog/` ile birlikte duruyor, kasıtlı.

## Geri getirme

```bash
cd <repo kökü>
cp -r backups/prototypes/2026-08-11/pages/prototypes/door-modeler.vue nuxt/app/pages/prototypes/
cp -r backups/prototypes/2026-08-11/components/prototypes/door-modeler nuxt/app/components/prototypes/
# door-3d ayrıca three istiyor:
cp backups/prototypes/2026-08-11/pages/prototypes/door-3d.vue nuxt/app/pages/prototypes/
cd nuxt && npm i three@^0.185.1 && npm i -D @types/three@^0.185.4
```

Rota dev'de kendiliğinden geri gelir. Production'da da görünmesi isteniyorsa
`nuxt.config.ts`'teki `shipPrototypes` kuralı gevşetilmeli.
