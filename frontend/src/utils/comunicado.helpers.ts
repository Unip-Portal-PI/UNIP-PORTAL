// src/utils/comunicado.helpers.ts
import { Comunicado } from "@/src/types/comunicado";
import { UserRole } from "@/src/types/user";

export function isComunicadoExpirado(comunicado: Comunicado): boolean {
  if (!comunicado?.dataValidade) return false;

  const [ano, mes, dia] = comunicado.dataValidade.split("-").map(Number);
  if (!ano || !mes || !dia) return false;

  // Ex.: validade em 2026-03-29
  // aparece até 2026-03-29 23:59:59
  // em 2026-03-30 00:00 já some
  const limiteVisibilidade = new Date(ano, mes - 1, dia + 1, 0, 0, 0, 0);

  return Date.now() >= limiteVisibilidade.getTime();
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
  const conteudo = String(comunicado.conteudo ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!conteudo) return "";

  if (conteudo.length <= max) return conteudo;

  let resumo = conteudo.slice(0, max).trim();

  const quantidadeAsteriscos = (resumo.match(/\*/g) ?? []).length;
  if (quantidadeAsteriscos % 2 !== 0) {
    resumo = resumo.replace(/\*[^*]*$/, "").trim();
  }

  resumo = resumo.replace(/@\S*$/, "").trim();

  return `${resumo}...`;
}