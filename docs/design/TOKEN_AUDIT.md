# Kardoor Token Audit

Documentation-only audit. No CSS, Vue, TS, Nuxt config, package, token, theme, GSAP, Lenis, ScrollTrigger, or component files were changed.

## 1. Audit Scope

Files inspected:

- `docs/design/DESIGN.md`
- `AGENTS.md`
- `nuxt/assets/styles/base/tokens.css`
- `nuxt/assets/styles/main.css`
- `nuxt/public/themes/light.css`
- `nuxt/public/themes/dark.css`
- `nuxt/assets/styles/sections/*.css`
- `nuxt/assets/styles/pages/**/*.css`
- Homepage chain:
  - `nuxt/pages/index.vue`
  - `nuxt/components/home/HomeContentLoader.vue`
  - `nuxt/components/home/HomeExperience.vue`
  - `nuxt/components/home/EntranceDoor.vue`
  - `nuxt/components/home/HomeCatalog.vue`
  - `nuxt/components/home/HomeReferences.vue`
  - `nuxt/components/home/HomeManifesto.vue`
  - `nuxt/components/home/HomeReviews.vue`

Files not modified:

- All existing Vue, CSS, TS, theme, token, Nuxt config, package, GSAP, Lenis, ScrollTrigger, and component files.

Purpose of this audit:

- Map the current design token system.
- Identify repeated hardcoded values.
- Classify token drift risk by file and section.
- Document safe future cleanup phases.

Non-goals:

- No token refactor.
- No hardcoded value replacement.
- No theme cleanup.
- No scroll, animation, or component behavior changes.
- No Tailwind recommendation or migration.

## 2. Current Token Source Map

Current source layers:

- Global source: `nuxt/assets/styles/base/tokens.css`
- Global import entry: `nuxt/assets/styles/main.css`
- Runtime theme override layers: `nuxt/public/themes/light.css`, `nuxt/public/themes/dark.css`
- Section-level variables: `nuxt/assets/styles/sections/*.css`
- Page-level variables: `nuxt/assets/styles/pages/**/*.css`
- Component/theme special variables: header, ambience, catalog, references, team, showroom, footer, entrance geometry.

Current token groups in `tokens.css`:

- Base color tokens: `--bg`, `--panel`, `--panel-soft`, `--line`, `--line-strong`, `--text`, `--muted`, `--soft`, `--accent`, `--accent-blue`, `--warm`
- Header tokens: sizing, glass, link, control, bulb, quote text.
- Typography tokens: `--font-display`, `--font-body`, `--font-serif`
- Motion/easing tokens: `--ease-out`, `--ease-soft`, spring/expo/quint easings.
- Shadow scale: `--shadow-xs` through `--shadow-xl`
- Radius scale: `--radius-xs` through `--radius-full`
- Runtime shell overrides: `.app-shell--day`, `.app-shell--night`
- Ambience tokens: `--ambience-*`

Important current reality:

- `tokens.css` is the declared current token source.
- `light.css` and `dark.css` are active runtime dependencies, but not clean sources of truth.
- Section/page CSS still contains many local variables and hardcoded literals.

## 3. Token Inventory

| Token | Value | Category | Current Usage | Risk / Note |
| --- | --- | --- | --- | --- |
| `--bg` | `#050505` | Color | App shell default background | Core graphite token; day/night override changes value. |
| `--panel` | `#101114` | Color | General panel surface | Good global candidate, but local panel values also exist. |
| `--panel-soft` | `rgba(18, 19, 23, 0.76)` | Color | Soft panel surface | Could absorb repeated translucent dark panels later. |
| `--line` | `rgba(255, 255, 255, 0.14)` | Color | General divider | Many section-specific line rgba values still bypass it. |
| `--line-strong` | `rgba(255, 255, 255, 0.28)` | Color | Strong divider | Useful, but not consistently used. |
| `--text` | `#f7f7f2` | Color | App shell text | Day/night override affects it. |
| `--muted` | `#b5b8bf` | Color | Muted text | Many hardcoded muted rgba alternatives exist. |
| `--soft` | `#737780` | Color | Soft text | Similar drift as `--muted`. |
| `--accent` | `#2ce3ff` | Color | Cool cyan accent | Legacy/technical accent; should not become brand emotion. |
| `--accent-blue` | `#006cff` | Color | Blue accent | Technical/link/focus only. |
| `--warm` | `#a77a55` | Color | Warm metal accent | Better aligned with material-led brand than cyan. |
| `--header` | `82px` | Component/Layout | Header height | Used as global layout constraint. |
| `--header-max-width` | `1800px` | Component/Layout | Header width | Header-local, not general layout token. |
| `--header-offset-x` | `clamp(24px, 2.6vw, 50px)` | Component/Layout | Header positioning | Header-local; do not generalize blindly. |
| `--header-offset-y` | `clamp(18px, 2.2vw, 34px)` | Component/Layout | Header positioning | Header-local. |
| `--header-pill-height` | `72px` | Component/Layout | Header pill | Header-local. |
| `--header-pill-radius` | `999px` | Radius | Header pill | Duplicates `--radius-full` concept. |
| `--header-control-radius` | `999px` | Radius | Header controls | Duplicates `--radius-full` concept. |
| `--header-blur` | `24px` | Component/Effect | Header glass blur | Header-local dependency. |
| `--header-brand-text` | `#f7f7f2` | Component/Color | Brand mark/header | Overridden by themes and site-header CSS. |
| `--header-brand-shadow` | `0 16px 32px rgba(0, 0, 0, 0.26)` | Shadow | Header brand | Header-local. |
| `--header-glass` | `rgba(230, 232, 230, 0.62)` | Component/Color | Header glass | Header-local; many related glass tokens. |
| `--header-glass-strong` | `rgba(238, 240, 239, 0.72)` | Component/Color | Header glass | Header-local. |
| `--header-glass-sheen` | `rgba(255, 255, 255, 0.56)` | Component/Color | Header glass | Header-local. |
| `--header-glass-line` | `rgba(255, 255, 255, 0.42)` | Component/Color | Header glass border | Header-local. |
| `--header-glass-highlight` | `rgba(255, 255, 255, 0.72)` | Component/Color | Header glass highlight | Header-local. |
| `--header-glass-shadow` | `rgba(0, 0, 0, 0.18)` | Component/Shadow | Header glass | Header-local. |
| `--header-link` | `rgba(7, 16, 24, 0.72)` | Component/Color | Header links | Theme-sensitive. |
| `--header-link-hover` | `rgba(7, 16, 24, 0.96)` | Component/Color | Header links | Theme-sensitive. |
| `--header-link-active` | `#071018` | Component/Color | Header active state | Repeated with day/night values. |
| `--header-control-hover` | `rgba(255, 255, 255, 0.34)` | Component/Color | Header controls | Header-local. |
| `--header-control-active` | `rgba(255, 255, 255, 0.78)` | Component/Color | Header controls | Header-local. |
| `--header-control-highlight` | `rgba(255, 255, 255, 0.88)` | Component/Color | Header controls | Header-local. |
| `--header-control-shadow` | `rgba(0, 0, 0, 0.1)` | Component/Shadow | Header controls | Header-local. |
| `--header-language-track` | `rgba(255, 255, 255, 0.16)` | Component/Color | Header language toggle | Header-local. |
| `--header-bulb-fill` | `rgba(255, 255, 255, 0.16)` | Component/Color | Header bulb | Header-local. |
| `--header-bulb-glow` | `0 0 0 rgba(44, 227, 255, 0)` | Component/Shadow | Header bulb | Cyan dependency; keep local. |
| `--header-quote-text` | `#00121a` | Component/Color | Header CTA text | Header-local. |
| `--font-display` | `"Barlow Condensed", "Arial Narrow", sans-serif` | Typography | Display headings | Approved token entry point. |
| `--font-body` | `Inter, system-ui, sans-serif` | Typography | Body/reset/sections | Approved token entry point. |
| `--font-serif` | `"Instrument Serif", Georgia, "Times New Roman", serif` | Typography | Serif accent | Rare editorial accent only. |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Motion | General easing | Repeated as `--expo-out`; can align later. |
| `--ease-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Motion | General easing | Repeated as `--quint-out`; can align later. |
| `--spring-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Motion | Spring-like UI | Use cautiously; brand motion should feel heavy. |
| `--spring-snappy` | `cubic-bezier(0.2, 1.4, 0.4, 1)` | Motion | Snappy UI | Potentially too playful for core pages. |
| `--expo-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Motion | Expo easing | Duplicate value with `--ease-out`. |
| `--expo-in-out` | `cubic-bezier(0.87, 0, 0.13, 1)` | Motion | Slow in/out | Useful for mechanical motion. |
| `--quint-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Motion | Quint easing | Duplicate value with `--ease-soft`. |
| `--shadow-xs` | `0 1px 2px..., 0 1px 4px...` | Shadow | Global scale | Existing but hardcoded shadows still dominate. |
| `--shadow-sm` | `0 2px 8px..., 0 1px 3px...` | Shadow | Global scale | Existing but underused. |
| `--shadow-md` | `0 4px 16px..., 0 2px 6px...` | Shadow | Global scale | Existing but underused. |
| `--shadow-lg` | `0 8px 32px..., 0 4px 12px...` | Shadow | Global scale | Existing but underused. |
| `--shadow-xl` | `0 16px 48px..., 0 6px 18px...` | Shadow | Global scale | Existing but underused. |
| `--radius-xs` | `4px` | Radius | Global scale | Existing but local radii still common. |
| `--radius-sm` | `6px` | Radius | Global scale | Existing but local radii still common. |
| `--radius-md` | `10px` | Radius | Global scale | Existing but local radii still common. |
| `--radius-lg` | `14px` | Radius | Global scale | Existing but local radii still common. |
| `--radius-xl` | `20px` | Radius | Global scale | Existing but local radii still common. |
| `--radius-full` | `999px` | Radius | Pill/circle | Duplicate with header pill/control tokens. |
| `--ambience-*` | Mixed colors/filters/shadows | Theme/Component | Entrance/showroom ambience | High-risk because tied to day/night visual state. |

## 4. Hardcoded Color Inventory

| Value | Approx Family | Files Found In | Should Become Token? | Note |
| --- | --- | --- | --- | --- |
| `#14151D` | Graphite / black | `entrance-door.css`, `home-team.css`, `light.css`, `dark.css` | Already effectively tokenized as `--catalog-stage-bg` and related values; consolidate later | Repeated core graphite. Do not replace globally without theme audit. |
| `#EAE8E8` | Mineral / light surface | `home-reviews.css`, `home-team.css`, `light.css`, `dark.css` | Yes, later as material/paper token | Most repeated light surface. |
| `#EBE8E8` | Mineral / light surface | `light.css`, `dark.css` | Maybe | Similar to `#EAE8E8`; likely typo/drift candidate. |
| `#050505` | Graphite / black | `tokens.css`, `content-pages.css`, `entrance-door.css`, `home-catalog.css`, `home-team.css` | Already `--bg` default | Treat as deep-black token family. |
| `#0D1012` | Graphite / black | `dark.css` | Maybe | Dark theme mineral executive background. |
| `#111417` | Graphite / black | `company.css`, `home-catalog.css`, `light.css` | Yes, after theme decision | Current light theme final palette uses it heavily. |
| `#171B1F` | Graphite / black | `dark.css` | Yes, after theme decision | Dark theme surface/background. |
| `#006cff` | Cool blue / technical accent | `tokens.css` | Already `--accent-blue` | Keep technical/link/focus only. |
| `#2ce3ff` | Cool cyan / technical accent | `tokens.css` | Already `--accent` | Legacy/technical. Do not promote as brand emotion. |
| `#3a83ff` | Cool blue / technical accent | `references.css`, `home-references.css` | Maybe component-local | References accent; audit before globalizing. |
| `#B88A44` | Warm metal accent | `light.css`, `dark.css` | Yes, likely metal accent token | Better aligned with material-led brand. |
| `#a77a55` | Warm metal accent | `tokens.css` | Already `--warm` | Similar role to `#B88A44`; consolidation candidate. |
| `#242929` | Graphite / black | `home-catalog.css`, `catalog.css`, theme-adjacent catalog UI | Maybe catalog text token | High repeat in catalog surfaces. |
| `#E6E7EB` | Mineral / light surface | `home-footer.css`, theme mobile footer rules | Maybe footer surface/text token | Footer-specific repeated value. |
| `#F4F1EA` | Mineral / light surface | `light.css`, `dark.css` | Yes, after theme decision | Current mineral palette surface. |
| `#171821` | Graphite / black | `dark.css`, catalog overrides | Maybe dark catalog token | Theme override dependency. |
| `rgba(20, 21, 29, ...)` | Border / divider rgba | `light.css`, `dark.css`, `home-team.css`, catalog theme rules | Yes, as graphite alpha scale | Many variants: `.08`, `.12`, `.18`, `.24`, `.28`, `.48`, `.72`, `.78`. |
| `rgba(234, 232, 232, ...)` | Text/border rgba | `light.css`, `dark.css`, `home-team.css`, `home-footer.css` | Yes, as mineral alpha scale | Many variants: `.08`, `.12`, `.18`, `.42`, `.58`, `.82`, `.96`, `.98`. |
| `rgba(255, 255, 255, ...)` | Glass/highlight rgba | `site-header.css`, themes, reviews | Maybe local glass/highlight scale | Header glass depends on it heavily. |
| `rgba(0, 0, 0, ...)` | Shadow/overlay rgba | Most CSS files | Maybe shadow/overlay scale | Too many shadow-specific values to globalize in one pass. |
| `linear-gradient(...)` | Gradients | `site-header.css`, `home-catalog.css`, `home-team.css`, `light.css`, `dark.css`, `home-reviews.css` | No broad token yet | Many are layout/section-specific. Avoid new decorative gradients. |
| `radial-gradient(...)` | Gradients | `home-team.css`, `home-reviews.css`, `showroom-turntable.css`, themes | No broad token yet | Some are component visual effects; cleanup risky. |

High-repeat families observed:

- `#EAE8E8` appeared as the largest repeated light surface.
- `#14151D`, `#050505`, `#111417`, `#171B1F`, and `#0D1012` form an overlapping graphite set.
- Cool accents are tokenized but should remain technical/legacy.
- Warm accents are split between `--warm: #a77a55` and theme-local `#B88A44`.

## 5. Theme Override Audit

### `nuxt/public/themes/light.css`

Observed metrics:

- Approx. variable declarations: 41
- Approx. selector blocks: 203
- Approx. `!important` uses: 452
- Approx. hex colors: 83
- Approx. `rgb/rgba` values: 103

Override logic clusters:

1. Root theme variables and catalog variables.
2. Global `html`, `body`, `#app` background/font overrides.
3. Testimonial/review layout and shadow overrides.
4. Gradient mask and rotating title overrides.
5. Manifesto/team reveal and modal helper overrides.
6. Footer positioning, dome, mobile footer, and form overrides.
7. Catalog section/sidebar/main/card mobile and desktop overrides.
8. Final "Mineral Executive palette pass" overriding earlier light theme assumptions.

Affected sections/components:

- Catalog section and embedded catalog surfaces.
- Testimonial/reviews area.
- Footer wrapper/dome/forms/socials.
- Team/manifesto reveal pieces.
- Global shell background.

Risky rules:

- Heavy `!important` usage makes source-of-truth unclear.
- Several repeated blocks override earlier rules in the same file.
- Mobile footer and catalog rules are highly specific and could break layout if moved casually.
- Gradient masks and catalog line rules interact with scroll progress variables.

Runtime dependencies to keep for now:

- `--catalog-stage-*`
- `--catalog-product-scrollbar-*`
- `--entrance-handoff-bg`
- Final mineral palette root values.
- Mobile footer/catolog guard rules.

### `nuxt/public/themes/dark.css`

Observed metrics:

- Approx. variable declarations: 44
- Approx. selector blocks: 236
- Approx. `!important` uses: 496
- Approx. hex colors: 109
- Approx. `rgb/rgba` values: 123

Override logic clusters:

1. Root dark/catalog variable overrides.
2. Global dark body/app shell background overrides.
3. Dark catalog sidebar/main/card/product overrides.
4. Dark testimonial/review color and shadow overrides.
5. Footer and mobile footer overrides.
6. Dark row text readability patch.
7. Final "Mineral Executive dark palette pass".

Affected sections/components:

- Catalog surfaces and filter UI.
- Reviews/testimonial cards.
- Footer wrapper/dome.
- Global shell day/night state.
- Catalog progress line and gradient mask.

Risky rules:

- Even denser `!important` use than light theme.
- Multiple dark palettes coexist in the same file.
- Catalog and testimonial overrides are interleaved with footer/mobile behavior.
- `#EAE8E8`, `#14151D`, `#171B1F`, `#0D1012`, and `#B88A44` function as active runtime palette values.

Runtime dependencies to keep for now:

- Dark catalog stage variables.
- Dark scrollbar values.
- Dark testimonial/readability patches.
- Final mineral dark palette rules.
- Mobile footer lock rules.

Theme conclusion:

- Do not clean these files during normal feature work.
- Treat them as active override layers until a dedicated theme dependency audit is approved.

## 6. Typography Audit

| Font / Token | Files Found In | Approved Usage? | Note |
| --- | --- | --- | --- |
| `--font-display` | `tokens.css`, `content-pages.css`, `door-selector.css`, `showroom-turntable.css`, `company.css` | Yes | Approved display entry point. |
| `--font-body` | `tokens.css`, `reset.css`, `entrance-door.css`, `showroom-turntable.css` | Yes | Approved body entry point. |
| `--font-serif` | `tokens.css`, `entrance-door.css`, `showroom-turntable.css`, `home-team.css` | Yes, rare | Editorial accent only. |
| `Inter, system-ui, sans-serif` | `tokens.css`, `home-team.css`, resets/components | Yes through token preferred | Direct use exists; future work should prefer `--font-body`. |
| `"Instrument Serif", Georgia, serif` | `home-team.css`, showroom | Approved only as rare serif accent | Avoid expanding. |
| `"PP Neue Montreal"` | `fonts.css`, `entrance-door.css` | Existing target-specific usage | Imported locally; do not use in new UI unless target already uses it. |
| `Gotham`, `Gotham SSm` | `home-references.css`, `home-team.css`, `home-footer.css`, themes | Existing legacy usage | Not approved as new general UI font. |
| `Montserrat` | `home-catalog.css`, `catalog.css`, `references.css`, `home-team.css` | Existing only | Imported/used legacy. Do not introduce in new UI unless target already uses it. |
| `General Sans` | `entrance-door.css`, `home-references.css`, `references.css` | Existing only | Do not expand unless target component already uses it. |
| `Plus Jakarta Sans` | `main.css` import, `site-header.css` via `--header-font` | Header-specific existing usage | Do not use as new UI default. |
| `Gotham`, `Helvetica Neue`, `Arial` | `light.css`, `dark.css`, `home-footer.css` | Theme/legacy only | Theme files override global body font; risk for typography authority. |
| `Arial, Helvetica, sans-serif` | `company.css` | Existing page-specific | Candidate for later alignment, low priority. |

Typography conclusion:

- Imported fonts are not automatically approved.
- New UI should use `--font-display`, `--font-body`, and `--font-serif` only.
- Serif remains rare and editorial.

## 7. Radius / Shadow / Border Audit

| Value | Type | Files Found In | Repeated? | Token Candidate? | Risk |
| --- | --- | --- | --- | --- | --- |
| `999px` | Radius | `tokens.css`, `site-header.css`, `home-catalog.css`, themes | High | Already `--radius-full` | Pill usage can be overused; avoid new pill CTAs. |
| `50%` | Radius | Many circular controls/logos | High | No | Usually shape-specific; do not globalize. |
| `8px` | Radius | Catalog/pages/buttons | Medium | Already close to `--radius-sm/md` | Could align later in low-risk sections. |
| `14px` | Radius | Reviews/cards/mobile | Medium | `--radius-lg` exists | Candidate for local alignment. |
| `20px` | Radius | Cards/panels | Medium | `--radius-xl` exists | Candidate for local alignment. |
| `6px 6px 46px 6px` | Radius | Catalog cards/themes | Medium | Component-local token only | Catalog identity; do not flatten globally. |
| `50% var(--dome-radius)` | Radius | Footer dome/themes | High | No | Footer-specific, layout-sensitive. |
| `0` / `0 !important` | Radius | Themes/catalog/mobile | High | No | Override dependency. |
| `0 10px 30px rgba(...)` | Shadow | Reviews/themes | High | Maybe review shadow token | Active visual dependency. |
| `0 2px 10px rgba(...)` | Shadow | Catalog/theme | Medium | Maybe component token | Repeated but context differs. |
| `0 -12px 42px rgba(...)` | Shadow | Footer dome/themes | Medium | No global token | Footer-specific. |
| `drop-shadow(...)` | Shadow/Filter | Footer/logo/catalog line | Medium | No global token | Often asset-specific. |
| Header glass inset shadows | Shadow | `site-header.css` | High | Header-local only | Do not consolidate into global shadow scale. |
| `rgba(20, 21, 29, 0.08/0.18/0.28)` | Border | Themes/team/catalog | High | Graphite alpha scale | Good later token candidate. |
| `rgba(234, 232, 232, 0.08/0.16/0.18)` | Border | Themes/footer/team | High | Mineral alpha scale | Good later token candidate. |
| `rgba(255,255,255,...)` | Border/Highlight | Header/reviews/themes | High | Glass/highlight local scale | Keep header-local first. |

Conclusion:

- Radius and shadow token scales already exist, but many sections bypass them.
- Do not mass-replace; align only low-risk sections first.

## 8. Spacing / Layout Value Audit

Observed repeated patterns:

- `clamp(...)` values for header offsets, hero geometry, catalog spacing, manifesto CTA geometry, review padding, footer mobile layout.
- Section padding values such as `clamp(92px, 10vw, 148px) 0 clamp(150px, 15vw, 240px)`.
- Mobile repeated gaps: `18px`, `24px`, `34px`, `42px`, `44px`, `52px`, `56px`, `72px`.
- Catalog content variables: `--catalog-content-left`, `--catalog-content-right`, `--catalog-stage-top-radius`, `--kardoor-line-left`.
- Entrance geometry variables: `--hero-door-*`, `--hero-opening-*`, `--hero-copy-*`, `--showroom-*`.
- Manifesto/team CTA geometry variables: `--cta-*`.

Risk notes:

- `EntranceDoor` spacing is tied to image geometry and scroll handoff; do not normalize during token cleanup.
- `HomeExperience` spacing participates in catalog handoff pin/height calculation; high risk.
- Catalog layout has many `!important` guards and scroll line values; cleanup needs a dedicated pass.
- Footer mobile layout uses strong positional overrides in theme files; do not move casually.

Suggested spacing approach:

- Document repeated values first.
- Align only low-risk static pages or isolated components.
- Do not introduce a global spacing system yet.

## 9. Motion Token Audit

Existing motion tokens:

- `--ease-out`
- `--ease-soft`
- `--spring-bounce`
- `--spring-snappy`
- `--expo-out`
- `--expo-in-out`
- `--quint-out`
- Theme transition vars: `--transition-smooth`, `--title-pill-transition-smooth`, `--word-transition-smooth`, `--transition-tilt`

Observed hardcoded motion values:

- `4s cubic-bezier(0.16, 1, 0.3, 1)`
- `0.8s cubic-bezier(0.23, 1, 0.32, 1)`
- `transform 800ms cubic-bezier(0.165, 0.84, 0.44, 1)`
- `opacity 720ms var(--ease-soft)`
- `transform 0.28s ease`
- `opacity 0.24s ease`
- `box-shadow 0.3s ease`

Observed keyframes:

- `shine`
- `adaBrandGradientCharMove`
- `mobileCatalogLineSweep`
- `gradientBG`
- `phoneSmoothShake`
- `home-references-arrow-drift`

CSS/GSAP conflict risk:

- `HomeExperience.vue`, `EntranceDoor.vue`, `HomeCatalog.vue`, `HomeReferences.vue`, `HomeManifesto.vue`, and `HomeContentLoader.vue` all include GSAP/ScrollTrigger/RAF/resize or scroll logic.
- CSS transition cleanup could change timing assumptions without touching JS.
- Motion token cleanup must not include GSAP, Lenis, ScrollTrigger setup, pin behavior, RAF loops, resize observers, or scroll listeners.

Conclusion:

- Motion token cleanup should be documentation-first.
- CSS-only motion alignment may be safe in static pages later.
- Scroll-linked sections require special tasks only.

## 10. Section Risk Matrix

| Area / File | Token Drift Risk | Theme Override Risk | Scroll/Motion Risk | Cleanup Priority | Notes |
| --- | --- | --- | --- | --- | --- |
| EntranceDoor / `EntranceDoor.vue`, `entrance-door.css` | High | Medium | Critical | Special task only | Image geometry, ScrollTrigger, Lenis, RAF, resize, copy reveal. |
| HomeExperience / `HomeExperience.vue` | Medium | Medium | Critical | Special task only | Orchestrates catalog handoff, reviews, manifesto, ScrollTrigger, RAF, ResizeObserver. |
| HomeCatalog / `HomeCatalog.vue`, `home-catalog.css` | Critical | Critical | High | Dedicated catalog pass | Very high `!important`/hardcoded density; scroll line and liquid SVG logic. |
| HomeReferences / `HomeReferences.vue`, `home-references.css` | Medium | Low-Medium | High | Later dedicated pass | GSAP/ScrollTrigger and document scroll logic present. |
| HomeManifesto / `HomeManifesto.vue`, `home-team.css` | High | Medium | High | Later dedicated pass | GSAP SplitText, CTA geometry, serif/type experiments, many local tokens. |
| HomeReviews / `HomeReviews.vue`, `home-reviews.css` | Medium | High | Medium | After catalog | Theme files override reviews heavily. |
| Header / `site-header.css` | High | Medium | Low-Medium | Header/theme audit | Many header-local glass tokens and Plus Jakarta dependency. |
| Footer / `home-footer.css`, theme footer rules | High | Critical | Medium | After reviews | Footer mobile and dome geometry lives partly in theme overrides. |
| Company page / `company.vue`, `company.css` | Medium | Low | Medium | Low-risk after docs | Page has GSAP/ScrollTrigger; CSS token alignment possible only carefully. |
| References page / `references.vue`, `references.css` | Medium | Low | Medium-High | Later page pass | GSAP marquee/drag logic and blue accent use. |
| Theme files / `light.css`, `dark.css` | Critical | Critical | Medium | Separate task only | Active runtime override layers; do not clean during feature work. |
| `tokens.css` | Medium | Medium | Low | Documentation-first | Source token file exists; refactor only when approved. |

## 11. Token Consolidation Opportunities

| Problem | Current Values | Proposed Direction | Safe Phase | Risk |
| --- | --- | --- | --- | --- |
| Graphite family drift | `#050505`, `#0D1012`, `#111417`, `#14151D`, `#171B1F`, `#242929` | Define graphite scale after theme audit | Phase 1 docs, Phase 6 theme audit | High |
| Light surface drift | `#EAE8E8`, `#EBE8E8`, `#F4F1EA`, `#f8f6ef`, `#E6E7EB`, `#FFFFFF` | Define mineral/paper/surface scale | Phase 1 docs, then low-risk sections | Medium-High |
| Warm metal split | `#a77a55`, `#B88A44` | Decide one warm metal token family | Phase 6 theme audit | Medium |
| Blue/cyan accent risk | `#006cff`, `#2ce3ff`, `#3a83ff`, bright cyan gradients | Keep as technical/reference-local; do not brand homepage around it | Phase 1 docs | Medium |
| Border rgba variety | Many `rgba(20,21,29,...)`, `rgba(234,232,232,...)`, `rgba(255,255,255,...)` | Create graphite/mineral alpha line scale later | Phase 2 low-risk CSS | Medium |
| Shadow scale underuse | `--shadow-*` exists, but many bespoke shadows remain | Use shadow scale only in low-risk static components first | Phase 2/4 | Medium |
| Radius scale underuse | `--radius-*` exists, but many local hardcoded radii remain | Align only generic controls/cards; keep identity radii local | Phase 2/3 | Medium |
| Header glass token sprawl | Many `--header-glass-*` and hardcoded rgba | Keep header-local; audit separately | Phase 6 | High |
| Theme files acting as source of truth | `light.css`/`dark.css` final palette blocks override prior rules | Treat as runtime dependency until extracted deliberately | Phase 8 | Critical |
| Section-local token collision | `--catalog-*`, `--team-*`, `--references-*`, `--st-*`, `--cta-*` | Keep local until ownership is documented | Phase 1/2 | Medium |

## 12. Suggested Cleanup Phases

### 1. Documentation-only cleanup

Files:

- `docs/design/DESIGN.md`
- `docs/design/TOKEN_AUDIT.md`
- `AGENTS.md`

Why safe:

- No runtime code changes.

Do:

- Document token authority, risk areas, and reference rules.

Do not:

- Change CSS, Vue, TS, token, theme, or scroll files.

### 2. Low-risk section token alignment

Files:

- Static content/page CSS such as `content-pages.css`, simple catalog subpage CSS, possibly isolated button styles.

Why safer:

- Lower scroll and theme coupling.

Do:

- Replace obvious repeated values with existing tokens only when visually identical.

Do not:

- Introduce new token scale or spacing system.

### 3. Catalog token alignment

Files:

- `home-catalog.css`
- `catalog.css`
- catalog subpage CSS

Why risky:

- High `!important` density and catalog-specific layout identity.

Do:

- Audit component-local variables first.
- Align repeated colors only after screenshot comparison.

Do not:

- Touch catalog scroll line, product modal behavior, or `HomeCatalog.vue` unless explicitly tasked.

### 4. Reviews / footer token alignment

Files:

- `home-reviews.css`
- `home-footer.css`
- related theme override sections

Why risky:

- Theme files override both areas heavily.

Do:

- Document exact theme dependencies before moving values.

Do not:

- Move mobile footer rules casually.

### 5. References / manifesto token alignment

Files:

- `home-references.css`
- `home-team.css`
- `references.css`

Why risky:

- References and manifesto are tied to GSAP/scroll/typographic reveal behavior.

Do:

- Start with color/font documentation.

Do not:

- Touch `HomeReferences.vue`, `HomeManifesto.vue`, or `HomeExperience.vue` during token-only cleanup.

### 6. Header/theme dependency audit

Files:

- `site-header.css`
- `tokens.css`
- theme files

Why risky:

- Header glass variables and theme overrides overlap.

Do:

- Keep header-specific tokens local unless there is a clear shared need.

Do not:

- Globalize header glass effects.

### 7. EntranceDoor / HomeExperience only as special task

Files:

- `EntranceDoor.vue`
- `entrance-door.css`
- `HomeExperience.vue`

Why critical:

- Scroll handoff, image geometry, ScrollTrigger, Lenis, RAF, ResizeObserver.

Do:

- Only change when task explicitly targets these systems.

Do not:

- Include in normal token cleanup.

### 8. Theme override cleanup only as separate task

Files:

- `nuxt/public/themes/light.css`
- `nuxt/public/themes/dark.css`

Why critical:

- Active runtime override layers with hundreds of `!important` declarations.

Do:

- Build dependency map and migrate one section at a time.

Do not:

- Delete, reorder, or rewrite broad theme blocks without visual QA.

## 13. Do-Not-Touch List

Normal token cleanup must not touch:

- GSAP logic.
- Lenis config.
- ScrollTrigger setup.
- Pin behavior.
- RAF loops.
- Resize observers.
- Scroll listeners.
- EntranceDoor scroll handoff.
- HomeExperience orchestration.
- `HomeContentLoader` scroll refresh timing.
- `HomeCatalog` scroll line/liquid SVG/runtime measurement logic.
- `light.css` / `dark.css` bulk cleanup.
- Tailwind addition, config, dependency, or migration.

## 14. Final Recommendation

Should token refactor happen now?

- No. The current system needs documentation and dependency mapping before refactor.

First safe cleanup starting point:

- Documentation-only work, followed by low-risk static CSS alignment using existing tokens only.

Most risky area:

- `HomeExperience` and `EntranceDoor` for scroll/motion behavior.
- `home-catalog.css` and theme files for token/override density.

How theme files should be handled:

- Treat `light.css` and `dark.css` as active runtime override dependencies.
- Do not clean them during normal feature work.
- Audit and extract one section at a time only under a dedicated theme cleanup task.

Should Tailwind be considered?

- No. Tailwind should not be introduced or proposed unless the user explicitly asks for a new component strategy or migration.

Verification:

- Typecheck was not run because this is a documentation-only audit.
