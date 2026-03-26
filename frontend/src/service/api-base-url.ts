export function resolveApiBaseUrl(): string {
  console.log("[api-base-url] Iniciando resolveApiBaseUrl");

  const rawConfigured = process.env.NEXT_PUBLIC_API_URL;
  console.log("[api-base-url] NEXT_PUBLIC_API_URL bruto:", rawConfigured);

  const configured = rawConfigured?.trim().replace(/\/$/, "");
  console.log("[api-base-url] NEXT_PUBLIC_API_URL tratado:", configured);

  if (configured) {
    console.log("[api-base-url] Usando URL configurada via env:", configured);
    return configured;
  }

  if (typeof window !== "undefined") {
    console.log("[api-base-url] Executando no browser");
    console.log("[api-base-url] window.location.protocol:", window.location.protocol);
    console.log("[api-base-url] window.location.hostname:", window.location.hostname);

    const protocol = window.location.protocol === "https:" ? "https" : "http";
    const resolved = `${protocol}://${window.location.hostname}:7000`;

    console.log("[api-base-url] URL montada automaticamente:", resolved);
    return resolved;
  }

  console.log("[api-base-url] Executando no servidor/SSR");
  console.log("[api-base-url] Usando fallback local: http://127.0.0.1:7000");

  return "http://127.0.0.1:7000";
}

export const API_BASE_URL = resolveApiBaseUrl();

console.log("[api-base-url] API_BASE_URL final:", API_BASE_URL);