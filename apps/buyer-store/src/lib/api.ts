const DEFAULT_API_BASE_URL = "http://localhost:5003";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!configuredBaseUrl) {
    return DEFAULT_API_BASE_URL;
  }

  return trimTrailingSlash(configuredBaseUrl);
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}
