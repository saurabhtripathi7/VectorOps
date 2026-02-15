const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export function buildApiUrl(path: string) {
  if (!API_BASE_URL) {
    return path;
  }

  const base = API_BASE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
