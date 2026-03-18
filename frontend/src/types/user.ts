// src/types/user.ts


export interface Usuario {
  matricula: string;
  nome: string;
  apelido: string;
  telefone: string;
  dataNascimento: string; // ISO 8601: "YYYY-MM-DD"
  area: string;
  permission: UserRole;
  email: string;
  senha: string;
}

export type UsuarioPublico = Omit<Usuario, "senha">;

export interface UsuarioSessao {
  nome: string;
  apelido: string;
  email: string;
  matricula: string;
  area: string;
  permission: UserRole;
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
