/**
 * Kicks off first-paint loading at app init, before any component mounts.
 *
 * WHY A PLUGIN AND NOT THE CURTAIN
 *
 * `WelcomeScreen` used to call `plan()` from its own `onMounted`. Measured in
 * dev on `/`: the curtain itself did not appear until 3142ms, so the downloads
 * it was supposedly covering had not even started for the first three seconds —
 * the page sat hidden with nothing on top of it.
 *
 * Nuxt client plugins run during app creation, well before hydration finishes,
 * so starting here means the sprite and font requests are already in flight
 * while Vue is still building the tree. The hero image is earlier still: the
 * inline head script in `nuxt.config.ts` preloads it before any bundle parses.
 *
 * The curtain then only reports progress; it never initiates work.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { plan } = useAppBoot();

  // `useRoute()` is not reliable this early in the plugin lifecycle, and the
  // boot plan only depends on the entry path, so read it from the location.
  const path = window.location?.pathname ?? "/";
  plan(path);

  // Nothing is exposed: the curtain reads the same `useState` slice.
  void nuxtApp;
});
