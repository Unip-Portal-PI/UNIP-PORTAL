export function resolveApiBaseUrl(): string {
  const rawConfigured = process.env.NEXT_PUBLIC_API_URL;
  const configured = rawConfigured?.trim().replace(/\/+$/, "");

  if (configured) {
    return configured;
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "https" : "http";
    const hostname = window.location.hostname;

    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0";

    return isLocalhost
      ? `${protocol}://${hostname}:7000`
      : `${protocol}://api.${hostname}`;
  }

  return process.env.NODE_ENV === "production"
    ? "https://api.avpconecta.com.br"
    : "http://127.0.0.1:7000";
}

export const API_BASE_URL = resolveApiBaseUrl();