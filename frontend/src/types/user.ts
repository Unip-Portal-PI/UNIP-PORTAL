// src/types/user.ts


export interface Usuario {
  id?: string;
  matricula: string;
  nome: string;
  apelido: string;
  telefone: string;
  dataNascimento: string; // ISO 8601: "YYYY-MM-DD"
  area: string;
  permission: UserRole;
  email: string;
  senha: string;
  fotoUrl?: string | null;
  ativo?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export type UsuarioPublico = Omit<Usuario, "senha">;

export interface UsuarioSessao {
  id?: string;
  nome: string;
  apelido: string;
  email: string;
  matricula: string;
  area: string;
  permission: UserRole;
  fotoUrl?: string | null;
}

export interface PayloadToken {
  matricula: string;
  exp: number;
}

export interface ResultadoLogin {
  sucesso: boolean;
  mensagem: string;
  usuario?: UsuarioSessao;
}

export interface ResultadoPadraoAuth {
  sucesso: boolean;
  mensagem: string;
}


export type UserRole = "aluno" | "colaborador" | "adm";

export interface UserProfile {
  id: string;
  apelido: string;
  nome: string;
  matricula: string;
  area: string;
  email: string;
  role: UserRole;
}
