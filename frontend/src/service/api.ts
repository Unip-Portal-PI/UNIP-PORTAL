import { API_BASE_URL } from "./api-base-url";

const TOKEN_KEY = "avp_token";

/**
 * Interface para respostas padronizadas do Middleware
 */
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

/**
 * Cliente de API com Middleware/Interceptor embutido
 */
class ApiClient {
  private get baseUrl() {
    return API_BASE_URL;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(TOKEN_KEY);
  }

  /**
   * Middleware de Resposta: Trata erros globais como 401 (Não autorizado)
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 401) {
      console.error("[API Middleware] Sessão expirada ou inválida. Redirecionando...");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem("avp_user");
        window.location.href = "/auth/login?expired=true";
      }
    }

    let data = null;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
    } catch (e) {
      console.warn("[API Middleware] Erro ao parsear JSON:", e);
    }

    return {
      data,
      error: response.ok ? null : (data?.detail || data?.message || "Erro na requisição"),
      status: response.status,
      ok: response.ok,
    };
  }

  /**
   * Middleware de Requisição: Injeta headers e token automaticamente
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const token = this.getToken();

    const headers = new Headers(options.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    // Define Content-Type apenas se não for FormData (para uploads)
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error("[API Middleware] Erro de rede:", error);
      return {
        data: null,
        error: "Erro de conexão com o servidor",
        status: 500,
        ok: false,
      };
    }
  }

  // Atalhos para os métodos HTTP
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
