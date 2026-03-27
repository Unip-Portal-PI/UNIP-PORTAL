import { decodeJwt } from "jose";
import { API_BASE_URL } from "@/src/service/api-base-url";
import { ResultadoLogin, ResultadoPadraoAuth, UsuarioSessao } from "@/src/types/user";

const TOKEN_KEY = "avp_token";
const USER_KEY = "avp_user";

type ParsedResponse<T> = {
  ok: boolean;
  data: T | null;
  message: string;
  status: number;
};

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function salvarToken(token: string): void {
  console.log("[auth.service] Salvando token no sessionStorage");
  sessionStorage.setItem(TOKEN_KEY, token);
}

function salvarUsuario(usuario: UsuarioSessao): void {
  console.log("[auth.service] Salvando usuario no sessionStorage:", usuario);
  sessionStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

function removerToken(): void {
  console.warn("[auth.service] Removendo token e usuario do sessionStorage");
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function obterToken(): string | null {
  if (typeof window === "undefined") {
    console.log("[auth.service] obterToken chamado no SSR, retornando null");
    return null;
  }

  const token = sessionStorage.getItem(TOKEN_KEY);
  console.log("[auth.service] Token obtido do sessionStorage:", token ? "[TOKEN_PRESENTE]" : null);
  return token;
}

function obterUsuario(): UsuarioSessao | null {
  if (typeof window === "undefined") {
    console.log("[auth.service] obterUsuario chamado no SSR, retornando null");
    return null;
  }

  const raw = sessionStorage.getItem(USER_KEY);
  console.log("[auth.service] Usuario bruto no sessionStorage:", raw);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as UsuarioSessao;
    console.log("[auth.service] Usuario parseado com sucesso:", parsed);
    return parsed;
  } catch (error) {
    console.error("[auth.service] Erro ao fazer parse do usuario salvo:", error);
    removerToken();
    return null;
  }
}

function tokenExpirado(token: string): boolean {
  try {
    const payload = decodeJwt(token);
    const exp = payload.exp;

    console.log("[auth.service] Payload do token:", payload);
    console.log("[auth.service] Exp do token:", exp);

    if (!exp) return false;

    const expirado = Date.now() >= exp * 1000;
    console.log("[auth.service] Token expirado?", expirado);

    return expirado;
  } catch (error) {
    console.error("[auth.service] Erro ao decodificar token, assumindo expirado:", error);
    return true;
  }
}

async function parseResponse<T>(response: Response): Promise<ParsedResponse<T>> {
  console.log("[auth.service] parseResponse status:", response.status);
  console.log("[auth.service] parseResponse ok:", response.ok);
  console.log("[auth.service] parseResponse url:", response.url);

  const data = await response.json().catch((error) => {
    console.error("[auth.service] Erro ao fazer response.json():", error);
    return null;
  });

  console.log("[auth.service] parseResponse data:", data);

  if (!response.ok) {
    const message =
      data?.detail || data?.mensagem || "Nao foi possivel concluir a operacao.";

    console.warn("[auth.service] Resposta rejeitada pela API:", message);

    return {
      ok: false,
      data: null,
      message,
      status: response.status,
    };
  }

  return {
    ok: true,
    data: data as T,
    message: "",
    status: response.status,
  };
}

function normalizeRequiredValue(value?: string | null): string {
  return String(value ?? "").trim();
}

// ---------------------------------------------------------------------------
// Service / Controller de Autenticação
// ---------------------------------------------------------------------------

export const authService = {
  async login(matricula: string, senha: string): Promise<ResultadoLogin> {
    console.log("[auth.service] login chamado", {
      matricula,
      senhaPreenchida: !!senha,
      apiBaseUrl: API_BASE_URL,
    });

    if (!matricula || !senha) {
      console.warn("[auth.service] Login bloqueado: matricula ou senha ausentes");
      return { sucesso: false, mensagem: "Matricula e senha sao obrigatorios." };
    }

    try {
      const url = `${API_BASE_URL}/auth/login`;
      console.log("[auth.service] Fazendo POST para:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula, senha }),
      });

      const result = await parseResponse<{
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

      if (!result.ok || !result.data) {
        removerToken();
        return {
          sucesso: false,
          mensagem: result.message || "Falha ao realizar login.",
        };
      }

      const data = result.data;
      console.log("[auth.service] Resposta do login:", data);

      if (!data.sucesso || !data.token || !data.usuario) {
        console.warn("[auth.service] Login sem token ou usuario valido");
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

      console.log("[auth.service] Usuario montado para sessao:", usuario);

      salvarToken(data.token);
      salvarUsuario(usuario);

      return {
        sucesso: true,
        mensagem: data.mensagem,
        usuario,
      };
    } catch (error) {
      console.error("[auth.service] Erro no login:", error);
      removerToken();
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao realizar login.",
      };
    }
  },

  logout(): void {
    console.log("[auth.service] logout chamado");
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
    console.log("[auth.service] register chamado com payload:", payload);

    const matricula = normalizeRequiredValue(payload.matricula);
    const nome = normalizeRequiredValue(payload.nome);
    const apelido = normalizeRequiredValue(payload.apelido);
    const area = normalizeRequiredValue(payload.area);
    const email = normalizeRequiredValue(payload.email);
    const senha = normalizeRequiredValue(payload.senha);

    if (!matricula || !nome || !apelido || !area || !email || !senha) {
      console.warn("[auth.service] Cadastro bloqueado: campos obrigatorios ausentes");
      return {
        sucesso: false,
        mensagem:
          "Preencha os campos obrigatórios: matrícula, nome completo, nome social, área, e-mail e senha.",
      };
    }

    const body = {
      matricula,
      nome,
      apelido,
      area,
      email,
      senha,
      ...(payload.telefone?.trim() ? { telefone: payload.telefone.trim() } : {}),
      ...(payload.dataNascimento?.trim()
        ? { dataNascimento: payload.dataNascimento.trim() }
        : {}),
    };

    try {
      const url = `${API_BASE_URL}/auth/cadastro`;
      console.log("[auth.service] Fazendo POST para:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await parseResponse<ResultadoPadraoAuth>(response);

      if (!result.ok || !result.data) {
        return {
          sucesso: false,
          mensagem: result.message || "Falha ao realizar cadastro.",
        };
      }

      console.log("[auth.service] Resposta do cadastro:", result.data);
      return result.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha ao realizar cadastro.";

      console.warn("[auth.service] Cadastro recusado:", message);

      return {
        sucesso: false,
        mensagem: message,
      };
    }
  },

  async previewPasswordReset(matricula: string): Promise<{
    sucesso: boolean;
    mensagem: string;
    matricula?: string;
    emailPreview?: string;
  }> {
    console.log("[auth.service] previewPasswordReset chamado:", { matricula });

    try {
      const url = `${API_BASE_URL}/auth/reset-senha/preview`;
      console.log("[auth.service] Fazendo POST para:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula }),
      });

      const result = await parseResponse<{
        sucesso: boolean;
        mensagem: string;
        matricula?: string | null;
        emailPreview?: string | null;
      }>(response);

      if (!result.ok || !result.data) {
        return {
          sucesso: false,
          mensagem: result.message || "Falha ao validar e-mail.",
        };
      }

      const data = result.data;
      console.log("[auth.service] Resposta previewPasswordReset:", data);

      return {
        sucesso: data.sucesso,
        mensagem: data.mensagem,
        matricula: data.matricula ?? undefined,
        emailPreview: data.emailPreview ?? undefined,
      };
    } catch (error) {
      console.error("[auth.service] Erro em previewPasswordReset:", error);
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao validar e-mail.",
      };
    }
  },

  async requestPasswordReset(matricula: string, email: string): Promise<ResultadoPadraoAuth> {
    console.log("[auth.service] requestPasswordReset chamado:", { matricula, email });

    try {
      const url = `${API_BASE_URL}/auth/reset-senha/solicitar`;
      console.log("[auth.service] Fazendo POST para:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula, email }),
      });

      const result = await parseResponse<ResultadoPadraoAuth>(response);

      if (!result.ok || !result.data) {
        return {
          sucesso: false,
          mensagem:
            result.message || "Nao foi possivel enviar o e-mail de recuperacao.",
        };
      }

      console.log("[auth.service] Resposta requestPasswordReset:", result.data);
      return result.data;
    } catch (error) {
      console.error("[auth.service] Erro em requestPasswordReset:", error);
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
    console.log("[auth.service] validateResetCode chamado:", { email, codigo });

    try {
      const url = `${API_BASE_URL}/auth/reset-senha/validar`;
      console.log("[auth.service] Fazendo POST para:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });

      const result = await parseResponse<{
        sucesso: boolean;
        tokenRedefinicao: string;
        mensagem?: string;
      }>(response);

      if (!result.ok || !result.data) {
        return {
          sucesso: false,
          mensagem: result.message || "Codigo invalido.",
        };
      }

      console.log("[auth.service] Resposta validateResetCode:", result.data);
      return result.data;
    } catch (error) {
      console.error("[auth.service] Erro em validateResetCode:", error);
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Codigo invalido.",
      };
    }
  },

  async resetPassword(tokenRedefinicao: string, novaSenha: string): Promise<ResultadoPadraoAuth> {
    console.log("[auth.service] resetPassword chamado:", {
      tokenRedefinicaoPresente: !!tokenRedefinicao,
      novaSenhaPreenchida: !!novaSenha,
    });

    try {
      const url = `${API_BASE_URL}/auth/reset-senha/redefinir`;
      console.log("[auth.service] Fazendo POST para:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenRedefinicao, novaSenha }),
      });

      const result = await parseResponse<ResultadoPadraoAuth>(response);

      if (!result.ok || !result.data) {
        return {
          sucesso: false,
          mensagem: result.message || "Falha ao redefinir senha.",
        };
      }

      console.log("[auth.service] Resposta resetPassword:", result.data);
      return result.data;
    } catch (error) {
      console.error("[auth.service] Erro em resetPassword:", error);
      return {
        sucesso: false,
        mensagem: error instanceof Error ? error.message : "Falha ao redefinir senha.",
      };
    }
  },

  isAutenticado(): boolean {
    console.log("[auth.service] isAutenticado chamado");

    const token = obterToken();
    if (!token) {
      console.warn("[auth.service] Usuario nao autenticado: token ausente");
      return false;
    }

    if (tokenExpirado(token)) {
      console.warn("[auth.service] Usuario nao autenticado: token expirado");
      removerToken();
      return false;
    }

    if (!obterUsuario()) {
      console.warn("[auth.service] Usuario nao autenticado: usuario ausente/invalido");
      removerToken();
      return false;
    }

    console.log("[auth.service] Usuario autenticado");
    return true;
  },

  isAuthenticated(): boolean {
    return this.isAutenticado();
  },

  getUsuarioAtual(): UsuarioSessao | null {
    console.log("[auth.service] getUsuarioAtual chamado");

    if (!this.isAutenticado()) return null;

    const usuario = obterUsuario();
    console.log("[auth.service] Usuario atual:", usuario);

    return usuario;
  },

  getUser(): UsuarioSessao | null {
    return this.getUsuarioAtual();
  },

  getToken(): string | null {
    console.log("[auth.service] getToken chamado");

    if (!this.isAutenticado()) return null;

    const token = obterToken();
    console.log("[auth.service] getToken retornando:", token ? "[TOKEN_PRESENTE]" : null);

    return token;
  },

  updateStoredUser(user: Partial<UsuarioSessao>): void {
    console.log("[auth.service] updateStoredUser chamado com:", user);

    const current = obterUsuario();
    if (!current) {
      console.warn("[auth.service] updateStoredUser abortado: usuario atual ausente");
      return;
    }

    const updated = { ...current, ...user };
    console.log("[auth.service] Usuario atualizado:", updated);

    salvarUsuario(updated);
  },
};

export const Auth = authService;