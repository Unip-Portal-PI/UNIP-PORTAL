// src/services/authService.ts

import { MOCK_USUARIOS } from "@/src/data/mockUsers";
import { ResultadoLogin, UsuarioSessao } from "@/src/types/user";
import {
  extrairMatriculaDoToken,
  gerarToken,
  simularLatencia,
  toUsuarioSessao,
  validarToken,
} from "@/src/utils/authHelpers";

const TOKEN_KEY = "avp_token";

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function salvarToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function removerToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

function obterToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Service / Controller de Autenticação
// ---------------------------------------------------------------------------

export const AuthService = {
  /**
   * Simula uma requisição POST /auth/login
   * Busca o usuário no mock, valida a senha e gera o token de sessão
   */
  async login(matricula: string, senha: string): Promise<ResultadoLogin> {
    await simularLatencia(); // simula round-trip de rede

    if (!matricula || !senha) {
      return { sucesso: false, mensagem: "Matrícula e senha são obrigatórios." };
    }

    const usuario = MOCK_USUARIOS.find(
      (u) => u.matricula === matricula && u.senha === senha
    );

    if (!usuario) {
      return { sucesso: false, mensagem: "Matrícula ou senha inválidos." };
    }

    const token = gerarToken(usuario.matricula);
    salvarToken(token);

    return {
      sucesso: true,
      mensagem: `Bem-vindo, ${usuario.apelido}!`,
      usuario: toUsuarioSessao(usuario),
    };
  },

  /**
   * Encerra a sessão removendo o token
   */
  logout(): void {
    removerToken();
  },

  /**
   * Verifica se existe um token válido na sessão (português)
   */
  isAutenticado(): boolean {
    const token = obterToken();
    if (!token) return false;
    return validarToken(token);
  },

  /**
   * Alias em inglês para compatibilidade com AuthGuard e PublicGuard
   */
  isAuthenticated(): boolean {
    return this.isAutenticado();
  },

  /**
   * Retorna os dados do usuário autenticado a partir do token + mock
   * Retorna null se não houver sessão válida
   */
  getUsuarioAtual(): UsuarioSessao | null {
    if (!this.isAutenticado()) return null;

    const token = obterToken()!;
    const matricula = extrairMatriculaDoToken(token);
    if (!matricula) return null;

    const usuario = MOCK_USUARIOS.find((u) => u.matricula === matricula);
    if (!usuario) return null;

    return toUsuarioSessao(usuario);
  },

  /**
   * Alias mantido para compatibilidade com o código legado (useAuth anterior)
   */
  getUser(): UsuarioSessao | null {
    return this.getUsuarioAtual();
  },
};

// ---------------------------------------------------------------------------
// Alias legado – mantém compatibilidade com `import { Auth } from ...`
// ---------------------------------------------------------------------------
export const Auth = AuthService;