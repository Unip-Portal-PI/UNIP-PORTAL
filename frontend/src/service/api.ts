import { API_BASE_URL } from "./api-base-url";

const TOKEN_KEY = "avp_token";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

class ApiClient {
  private get baseUrl() {
    return API_BASE_URL;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") {
      console.log("[API Middleware] getToken() em SSR: sem acesso ao sessionStorage");
      return null;
    }

    const token = sessionStorage.getItem(TOKEN_KEY);
    console.log("[API Middleware] getToken() token encontrado:", !!token);
    if (token) {
      console.log("[API Middleware] getToken() tamanho do token:", token.length);
    }
    return token;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    console.groupCollapsed("[API Middleware] handleResponse()");
    console.log("[API Middleware] status:", response.status);
    console.log("[API Middleware] ok:", response.ok);
    console.log("[API Middleware] url final da resposta:", response.url);
    console.log(
      "[API Middleware] content-type:",
      response.headers.get("content-type")
    );

    if (response.status === 401) {
      console.error("[API Middleware] Sessão expirada ou inválida. Redirecionando...");

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem("avp_user");
        window.location.href = "/auth/login?expired=true";
      }
    }

    let data: any = null;

    try {
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("[API Middleware] JSON recebido:", data);
      } else {
        const text = await response.text();
        console.log("[API Middleware] Resposta texto recebida:", text);
        data = text ? { message: text } : null;
      }
    } catch (e) {
      console.warn("[API Middleware] Erro ao parsear resposta:", e);
    }

    const result = {
      data,
      error: response.ok
        ? null
        : (data?.detail || data?.message || "Erro na requisição"),
      status: response.status,
      ok: response.ok,
    };

    console.log("[API Middleware] Resultado final tratado:", result);
    console.groupEnd();

    return result;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${this.baseUrl}${normalizedPath}`;
    const token = this.getToken();

    const headers = new Headers(options.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const headersObject = Object.fromEntries(headers.entries());

    console.groupCollapsed(`[API Middleware] ${config.method || "GET"} ${url}`);
    console.log("[API Middleware] baseUrl:", this.baseUrl);
    console.log("[API Middleware] path recebido:", path);
    console.log("[API Middleware] normalizedPath:", normalizedPath);
    console.log("[API Middleware] url final:", url);
    console.log("[API Middleware] method:", config.method || "GET");
    console.log("[API Middleware] headers:", headersObject);
    console.log("[API Middleware] possui token:", !!token);
    console.log(
      "[API Middleware] body é FormData:",
      options.body instanceof FormData
    );

    if (typeof window !== "undefined") {
      console.log("[API Middleware] ambiente: browser");
      console.log("[API Middleware] window.location.href:", window.location.href);
      console.log("[API Middleware] window.location.origin:", window.location.origin);
      console.log("[API Middleware] window.location.protocol:", window.location.protocol);
      console.log("[API Middleware] navigator.onLine:", navigator.onLine);

      if (window.location.protocol === "https:" && url.startsWith("http://")) {
        console.warn(
          "[API Middleware] Possível bloqueio por mixed content: front HTTPS tentando acessar API HTTP"
        );
      }
    } else {
      console.log("[API Middleware] ambiente: SSR/servidor");
    }

    try {
      const response = await fetch(url, config);
      console.log("[API Middleware] fetch executado com sucesso, status bruto:", response.status);
      console.groupEnd();
      return this.handleResponse<T>(response);
    } catch (error: any) {
      console.error("[API Middleware] Erro de rede:", error);
      console.error("[API Middleware] name:", error?.name);
      console.error("[API Middleware] message:", error?.message);
      console.error("[API Middleware] stack:", error?.stack);
      console.error("[API Middleware] URL que falhou:", url);
      console.error("[API Middleware] Config usada:", {
        method: config.method,
        headers: headersObject,
        hasBody: !!config.body,
      });

      if (typeof window !== "undefined") {
        console.error("[API Middleware] Diagnóstico rápido:");
        console.error("- Front origin:", window.location.origin);
        console.error("- API URL:", url);
        console.error("- Front protocol:", window.location.protocol);
        console.error("- Browser online:", navigator.onLine);
      }

      console.groupEnd();

      return {
        data: null,
        error: "Erro de conexão com o servidor",
        status: 500,
        ok: false,
      };
    }
  }

  async get<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T>(path: string, body?: any, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async put<T>(path: string, body?: any, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  async delete<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();