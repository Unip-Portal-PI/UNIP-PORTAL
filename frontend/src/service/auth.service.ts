// src/services/auth.service.ts

import { decodeJwt } from "jose";
import { API_BASE_URL } from "@/src/service/api-base-url";
import { ResultadoLogin, ResultadoPadraoAuth, UsuarioSessao } from "@/src/types/user";

const TOKEN_KEY = "avp_token";
const USER_KEY = "avp_user";
// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function salvarToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function salvarUsuario(usuario: UsuarioSessao): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

function removerToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function obterToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

function obterUsuario(): UsuarioSessao | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as UsuarioSessao;
  } catch {
    removerToken();
    return null;
  }
}

function tokenExpirado(token: string): boolean {
  try {
    const payload = decodeJwt(token);
    const exp = payload.exp;
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail || data?.mensagem || "Nao foi possivel concluir a operacao.";
    throw new Error(message);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Service / Controller de Autenticação
// ---------------------------------------------------------------------------

export const authService = {
  async login(matricula: string, senha: string): Promise<ResultadoLogin> {
    if (!matricula || !senha) {
      return { sucesso: false, mensagem: "Matricula e senha sao obrigatorios." };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula, senha }),
      });

      const data = await parseResponse<{
        sucesso: boolean;
        mensagem: string;
        token?: string | null;
        usuario?: {
          id: string;
          nome: string;
          apelido?: string | null;
          matricula: string;
          email: string;
          area?: string | null;
          fotoUrl?: string | null;
          permission: string;
        } | null;
      }>(response);

      if (!data.sucesso || !data.token || !data.usuario) {
        removerToken();
        return { sucesso: false, mensagem: data.mensagem || "Falha no login." };
      }

      const usuario: UsuarioSessao = {
        id: data.usuario.id,
        nome: data.usuario.nome,
        apelido: data.usuario.apelido ?? "",
        email: data.usuario.email,
        matricula: data.usuario.matricula,
        area: data.usuario.area ?? "",
        fotoUrl: data.usuario.fotoUrl ?? null,
        permission: data.usuario.permission as UsuarioSessao["permission"],
      };

      salvarToken(data.token);
      salvarUsuario(usuario);

      return {
        sucesso: true,
        mensagem: data.mensagem,
        usuario,
      };
    } catch (error) {
      removerToken();
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao realizar login.",
      };
    }
  },

  logout(): void {
    removerToken();
  },

  async register(payload: {
    matricula: string;
    nome: string;
    apelido?: string;
    telefone?: string;
    dataNascimento?: string;
    area: string;
    email: string;
    senha: string;
  }): Promise<ResultadoPadraoAuth> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseResponse<ResultadoPadraoAuth>(response);
      return data;
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao realizar cadastro.",
      };
    }
  },

  async requestPasswordReset(email: string): Promise<ResultadoPadraoAuth> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-senha/solicitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return await parseResponse<ResultadoPadraoAuth>(response);
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao solicitar recuperacao.",
      };
    }
  },

  async validateResetCode(email: string, codigo: string): Promise<{
    sucesso: boolean;
    tokenRedefinicao?: string;
    mensagem?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-senha/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });
      const data = await parseResponse<{ sucesso: boolean; tokenRedefinicao: string }>(response);
      return data;
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Codigo invalido.",
      };
    }
  },

  async resetPassword(tokenRedefinicao: string, novaSenha: string): Promise<ResultadoPadraoAuth> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-senha/redefinir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenRedefinicao, novaSenha }),
      });
      return await parseResponse<ResultadoPadraoAuth>(response);
    } catch (error) {
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao redefinir senha.",
      };
    }
  },

  isAutenticado(): boolean {
    const token = obterToken();
    if (!token) return false;
    if (tokenExpirado(token)) {
      removerToken();
      return false;
    }
    if (!obterUsuario()) {
      removerToken();
      return false;
    }
    return true;
  },

  isAuthenticated(): boolean {
    return this.isAutenticado();
  },

  getUsuarioAtual(): UsuarioSessao | null {
    if (!this.isAutenticado()) return null;
    return obterUsuario();
  },

  getUser(): UsuarioSessao | null {
    return this.getUsuarioAtual();
  },

  getToken(): string | null {
    if (!this.isAutenticado()) return null;
    return obterToken();
  },

  updateStoredUser(user: Partial<UsuarioSessao>): void {
    const current = obterUsuario();
    if (!current) return;
    salvarUsuario({ ...current, ...user });
  },
};

export const Auth = authService;
