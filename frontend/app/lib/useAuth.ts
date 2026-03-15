// app/lib/useAuth.ts

const TOKEN_KEY = "avp_token";

// Mock de usuário
const MOCK_USER = {
  matricula: "PI20100123",
  senha: "avp321",
  nome: "Ramon Vaz",
  email: "ramon.vaz@unip.br",
};

// Gera um token mock simples
function gerarToken(matricula: string): string {
  const payload = btoa(JSON.stringify({ matricula, exp: Date.now() + 1000 * 60 * 60 * 8 }));
  return `avp.${payload}.mock`;
}

// Valida o token (verifica se não expirou)
function validarToken(token: string): boolean {
  try {
    if (!token.startsWith("avp.") || !token.endsWith(".mock")) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

export const Auth = {
  login(matricula: string, senha: string): boolean {
    if (matricula === MOCK_USER.matricula && senha === MOCK_USER.senha) {
      const token = gerarToken(matricula);
      sessionStorage.setItem(TOKEN_KEY, token);
      return true;
    }
    return false;
  },

  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    return validarToken(token);
  },

  getUser() {
    if (!this.isAuthenticated()) return null;
    return {
      nome: MOCK_USER.nome,
      email: MOCK_USER.email,
      matricula: MOCK_USER.matricula,
    };
  },
};