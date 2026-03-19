// src/utils/comunicado.helpers.ts

import { Comunicado } from "@/src/types/comunicado";
import { UserRole } from "@/src/types/user";

export const CURSOS_COMUNICADO = [
  "Todos",
  "Análise e Desenvolvimento de Sistemas",
  "Gestão Comercial",
  "Gestão de RH",
  "Logística",
  "Marketing",
  "Ciências Contábeis",
];

export function isComunicadoExpirado(c: Comunicado): boolean {
  if (!c.dataValidade) return false;
  const hoje = new Date().toISOString().split("T")[0];
  return c.dataValidade < hoje;
}

export function canEditComunicado(role: UserRole): boolean {
  return role === "colaborador" || role === "adm";
}

export function canDeleteAllComunicados(role: UserRole): boolean {
  return role === "adm";
}

export function isAutor(comunicado: Comunicado, matricula: string): boolean {
  return comunicado.criadoPor === matricula;
}
