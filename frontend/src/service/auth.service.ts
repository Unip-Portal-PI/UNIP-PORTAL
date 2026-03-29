import { decodeJwt } from "jose";
import { ResultadoLogin, ResultadoPadraoAuth, UsuarioSessao } from "@/src/types/user";
import { api } from "./api";

const TOKEN_KEY = "avp_token";
const USER_KEY = "avp_user";

// ---------------------------------------------------------------------------
// Helpers internos (Storage)
// ---------------------------------------------------------------------------

function salvarToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function salvarUsuario(usuario: UsuarioSessao): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

function removerSessao(): void {
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
    removerSessao();
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

// ---------------------------------------------------------------------------
// Serviço de Autenticação
// ---------------------------------------------------------------------------

export const Auth = {
  async login(matricula: string, senha: string): Promise<ResultadoLogin> {
    if (!matricula || !senha) {
      return { sucesso: false, mensagem: "Matrícula e senha são obrigatórios." };
    }

    const { data, ok, error } = await api.post<{
      sucesso: boolean;
      mensagem: string;
      token?: string;
      usuario?: UsuarioSessao;
    }>("/auth/login", { matricula, senha });

    if (!ok || !data?.sucesso || !data.token || !data.usuario) {
      removerSessao();
      return { sucesso: false, mensagem: error || data?.mensagem || "Falha ao realizar login." };
    }

    salvarToken(data.token);
    salvarUsuario(data.usuario);

    return { sucesso: true, mensagem: data.mensagem, usuario: data.usuario };
  },

  logout(): void {
    removerSessao();
  },

  async register(payload: any): Promise<ResultadoPadraoAuth> {
    const { data, ok, error } = await api.post<ResultadoPadraoAuth>("/auth/cadastro", payload);
    if (!ok || !data) return { sucesso: false, mensagem: error || "Falha ao realizar cadastro." };
    return data;
  },

  async previewPasswordReset(matricula: string) {
    const { data, ok, error } = await api.post<any>("/auth/reset-senha/preview", { matricula });
    if (!ok || !data) return { sucesso: false, mensagem: error || "Falha ao validar e-mail." };
    return data;
  },

  async requestPasswordReset(matricula: string, email: string) {
    const { data, ok, error } = await api.post<ResultadoPadraoAuth>("/auth/reset-senha/solicitar", { matricula, email });
    if (!ok || !data) return { sucesso: false, mensagem: error || "Falha ao solicitar recuperação." };
    return data;
  },

  async validateResetCode(email: string, codigo: string) {
    const { data, ok, error } = await api.post<any>("/auth/reset-senha/validar", { email, codigo });
    if (!ok || !data) return { sucesso: false, mensagem: error || "Código inválido." };
    return data;
  },

  async resetPassword(tokenRedefinicao: string, novaSenha: string) {
    const { data, ok, error } = await api.post<ResultadoPadraoAuth>("/auth/reset-senha/redefinir", { tokenRedefinicao, novaSenha });
    if (!ok || !data) return { sucesso: false, mensagem: error || "Falha ao redefinir senha." };
    return data;
  },

  isAutenticado(): boolean {
    const token = obterToken();
    if (!token || tokenExpirado(token) || !obterUsuario()) {
      return false;
    }
    return true;
  },

  isAuthenticated(): boolean {
    return this.isAutenticado();
  },

  getUser(): UsuarioSessao | null {
    return this.isAutenticado() ? obterUsuario() : null;
  },

  getToken(): string | null {
    return this.isAutenticado() ? obterToken() : null;
  },

  updateStoredUser(user: Partial<UsuarioSessao>): void {
    const current = obterUsuario();
    if (current) {
      salvarUsuario({ ...current, ...user });
    }
  },
};
