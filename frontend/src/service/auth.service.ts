import { decodeJwt } from "jose";
import {
  EventoCanceladoNotificacao,
  ResultadoLogin,
  ResultadoPadraoAuth,
  UsuarioSessao,
} from "@/src/types/user";
import { api } from "./api";

const TOKEN_KEY = "avp_token";
const USER_KEY = "avp_user";
const CANCELLED_EVENTS_KEY = "avp_cancelled_events";
const RECENT_LOGIN_KEY = "avp_recent_login";

// ---------------------------------------------------------------------------
// Helpers internos (Storage)
// ---------------------------------------------------------------------------

function salvarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function salvarUsuario(usuario: UsuarioSessao): void {
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

function removerSessao(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(CANCELLED_EVENTS_KEY);
  sessionStorage.removeItem(RECENT_LOGIN_KEY);
}

function obterToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function obterUsuario(): UsuarioSessao | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioSessao;
  } catch {
    removerSessao();
    return null;
  }
}

function salvarEventosCancelados(eventos: EventoCanceladoNotificacao[]): void {
  sessionStorage.setItem(CANCELLED_EVENTS_KEY, JSON.stringify(eventos));
}

function marcarLoginRecente(): void {
  sessionStorage.setItem(RECENT_LOGIN_KEY, "1");
}

function consumirLoginRecente(): boolean {
  if (typeof window === "undefined") return false;
  const recente = sessionStorage.getItem(RECENT_LOGIN_KEY) === "1";
  sessionStorage.removeItem(RECENT_LOGIN_KEY);
  return recente;
}

function consumirEventosCancelados(): EventoCanceladoNotificacao[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(CANCELLED_EVENTS_KEY);
  sessionStorage.removeItem(CANCELLED_EVENTS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as EventoCanceladoNotificacao[];
  } catch {
    return [];
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
      eventosCancelados?: EventoCanceladoNotificacao[];
    }>("/auth/login", { matricula, senha });

    if (!ok || !data?.sucesso || !data.token || !data.usuario) {
      removerSessao();
      return { sucesso: false, mensagem: error || data?.mensagem || "Falha ao realizar login." };
    }

    salvarToken(data.token);
    salvarUsuario(data.usuario);
    salvarEventosCancelados(data.eventosCancelados ?? []);
    marcarLoginRecente();

    return {
      sucesso: true,
      mensagem: data.mensagem,
      usuario: data.usuario,
      eventosCancelados: data.eventosCancelados ?? [],
    };
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

  consumeCancelledEvents(): EventoCanceladoNotificacao[] {
    return consumirEventosCancelados();
  },

  consumePostLoginCancelledEvents(): EventoCanceladoNotificacao[] {
    if (!consumirLoginRecente()) return [];
    return consumirEventosCancelados();
  },
};
