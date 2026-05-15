import { computed, onMounted, watch } from "vue";

export type ShowroomAmbienceMode = "day" | "night";
export type ShowroomTheme = "light" | "dark";

const STORAGE_KEY = "kardoor-showroom-ambience";

const isValidMode = (value: unknown): value is ShowroomAmbienceMode =>
  value === "day" || value === "night";

const getStoredMode = (): ShowroomAmbienceMode | null => {
  if (!import.meta.client) return null;

  const storedMode = window.localStorage.getItem(STORAGE_KEY);

  return isValidMode(storedMode) ? storedMode : null;
};

const saveStoredMode = (mode: ShowroomAmbienceMode) => {
  if (!import.meta.client) return;

  window.localStorage.setItem(STORAGE_KEY, mode);
};

const modeToTheme = (mode: ShowroomAmbienceMode): ShowroomTheme =>
  mode === "night" ? "dark" : "light";

const applyDomMode = (mode: ShowroomAmbienceMode) => {
  if (!import.meta.client) return;

  const root = document.documentElement;
  const theme = modeToTheme(mode);

  root.dataset.ambience = mode;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeLink = document.querySelector<HTMLLinkElement>("#kardoor-theme");
  if (themeLink) {
    const nextHref = `/themes/${theme}.css`;

    if (!themeLink.href.endsWith(nextHref)) {
      themeLink.href = nextHref;
    }
  }
};

export const useShowroomAmbience = () => {
  const mode = useState<ShowroomAmbienceMode>(
    "kardoor-showroom-ambience-mode",
    () => "day"
  );

  const isHydrated = useState<boolean>(
    "kardoor-showroom-ambience-hydrated",
    () => false
  );

  const isDay = computed(() => mode.value === "day");
  const isNight = computed(() => mode.value === "night");
  const theme = computed(() => modeToTheme(mode.value));

  const setMode = (nextMode: ShowroomAmbienceMode) => {
    mode.value = nextMode;
  };

  const setTheme = (nextTheme: ShowroomTheme) => {
    mode.value = nextTheme === "dark" ? "night" : "day";
  };

  const toggleMode = () => {
    mode.value = mode.value === "day" ? "night" : "day";
  };

  const syncMode = () => {
    const storedMode = getStoredMode();

    if (storedMode) {
      mode.value = storedMode;
    }

    applyDomMode(mode.value);
    isHydrated.value = true;
  };

  onMounted(() => {
    syncMode();
  });

  watch(
    mode,
    (nextMode) => {
      applyDomMode(nextMode);
      saveStoredMode(nextMode);
    },
    { immediate: import.meta.client }
  );

  return {
    mode,
    isDay,
    isNight,
    theme,
    isHydrated,
    setMode,
    setTheme,
    toggleMode
  };
};
