// src/types/usuarioGestor.ts
// Tipos específicos do módulo de gestão de usuários
// Compatível com o src/types/user.ts do projeto AVP Conecta

import { UserRole } from "@/src/types/user";

export type StatusUsuario = "ativo" | "inativo";

export interface UsuarioGestor {
  id: string;
  matricula: string;
  nome: string;
  apelido: string;
  email: string;
  area: string;
  permission: UserRole;   // "aluno" | "colaborador" | "adm"
  status: StatusUsuario;
  ativo: boolean;
  deletedAt?: string;     // soft-delete
  criadoEm: string;
  atualizadoEm: string;
  criadoPor: string;
  senha?: string;
}

// Labels e cores mapeados para o padrão do projeto
export const PERMISSION_LABEL: Record<UserRole, string> = {
  aluno: "Aluno",
  colaborador: "Colaborador",
  adm: "Administrador",
};

export const PERMISSION_COR = {
  aluno: "blue",
  colaborador: "purple",
  adm: "yellow",
} as const;

export const STATUS_COR = {
  ativo: "green",
  inativo: "gray",
} as const;
