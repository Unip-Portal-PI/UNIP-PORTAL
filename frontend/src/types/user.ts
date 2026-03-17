// src/types/user.ts

import {UserRole} from "@/src/types/evento";

export interface Usuario {
  matricula: string;
  nome: string;
  apelido: string;
  telefone: string;
  dataNascimento: string; // ISO 8601: "YYYY-MM-DD"
  curso: string;
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
