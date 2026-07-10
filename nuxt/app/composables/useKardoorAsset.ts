export function useKardoorAsset() {
  const config = useRuntimeConfig();
  const assetBaseUrl = computed(() =>
    String(config.public.assetBaseUrl || "").replace(/\/$/, "")
  );

  const withAssetBase = (path: string) => {
    if (!path || /^(?:https?:)?\/\//.test(path) || path.startsWith("data:")) {
      return path;
    }

    const [pathWithoutHash, hash = ""] = path.split("#");
    const [pathname, query = ""] = pathWithoutHash.split("?");
    const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    const suffix = `${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;

    return assetBaseUrl.value
      ? `${assetBaseUrl.value}${normalizedPath}${suffix}`
      : `${normalizedPath}${suffix}`;
  };

  const cdnAssetUrl = (cdnPath: string, localPath = cdnPath) =>
    assetBaseUrl.value ? withAssetBase(cdnPath) : withAssetBase(localPath);

  return {
    assetBaseUrl,
    assetUrl: withAssetBase,
    cdnAssetUrl
  };
}
