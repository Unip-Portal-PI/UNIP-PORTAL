// src/utils/comunicado.helpers.ts

import { Comunicado } from "@/src/types/comunicado";
import { UserRole } from "@/src/types/user";

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

export function parseAssuntos(assunto: string | null | undefined): string[] {
  return Array.from(
    new Set(
      String(assunto ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

export function normalizeAssuntos(assunto: string | null | undefined): string {
  return parseAssuntos(assunto).join(", ");
}

export function conteudoToPlainText(conteudo: string | null | undefined): string {
  if (!conteudo) return "";
  return conteudo
    .replace(/@(\S+)/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getResumoComunicado(comunicado: Comunicado, max = 180): string {
  const base = conteudoToPlainText(comunicado.conteudo);
  if (base.length <= max) return base;
  return `${base.slice(0, max).trim()}...`;
}
