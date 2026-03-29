export function resolveApiBaseUrl(): string {
  console.groupCollapsed("[api-base-url] resolveApiBaseUrl()");
  console.log("[api-base-url] Iniciando resolução da base URL");

  const rawConfigured = process.env.NEXT_PUBLIC_API_URL;
  console.log("[api-base-url] NEXT_PUBLIC_API_URL bruto:", rawConfigured);
  console.log("[api-base-url] typeof window:", typeof window);
  console.log("[api-base-url] NODE_ENV:", process.env.NODE_ENV);

  const configured = rawConfigured?.trim().replace(/\/+$/, "");
  console.log("[api-base-url] NEXT_PUBLIC_API_URL tratado:", configured);

  if (configured) {
    try {
      const parsed = new URL(configured);
      console.log("[api-base-url] URL configurada válida");
      console.log("[api-base-url] protocol:", parsed.protocol);
      console.log("[api-base-url] host:", parsed.host);
      console.log("[api-base-url] pathname:", parsed.pathname);
    } catch (error) {
      console.error("[api-base-url] NEXT_PUBLIC_API_URL inválida:", configured, error);
    }

    console.log("[api-base-url] Usando URL configurada via env:", configured);
    console.groupEnd();
    return configured;
  }

  if (typeof window !== "undefined") {
    console.log("[api-base-url] Executando no browser");
    console.log("[api-base-url] href:", window.location.href);
    console.log("[api-base-url] origin:", window.location.origin);
    console.log("[api-base-url] protocol:", window.location.protocol);
    console.log("[api-base-url] hostname:", window.location.hostname);
    console.log("[api-base-url] host:", window.location.host);
    console.log("[api-base-url] port:", window.location.port);
    console.log("[api-base-url] pathname:", window.location.pathname);

    const protocol = window.location.protocol === "https:" ? "https" : "http";
    const resolved = `${protocol}://${window.location.hostname}:7000`;

    console.log("[api-base-url] Protocolo inferido:", protocol);
    console.log("[api-base-url] URL montada automaticamente:", resolved);

    if (window.location.protocol === "https:" && resolved.startsWith("http://")) {
      console.warn("[api-base-url] Possível mixed content: front em HTTPS chamando API em HTTP");
    }

    console.groupEnd();
    return resolved;
  }

  const fallback = "http://127.0.0.1:7000";
  console.log("[api-base-url] Executando no servidor/SSR");
  console.log("[api-base-url] Usando fallback local:", fallback);
  console.groupEnd();

  return fallback;
}

export const API_BASE_URL = resolveApiBaseUrl();

console.log("[api-base-url] API_BASE_URL final:", API_BASE_URL);