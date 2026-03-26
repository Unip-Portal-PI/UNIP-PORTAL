// src/utils/authHelpers.ts

import { PayloadToken, UsuarioPublico, UsuarioSessao } from "@/src/types/user";

const PREFIXO_TOKEN = "avp";
const SUFIXO_TOKEN = "mock";
const DURACAO_TOKEN_MS = 1000 * 60 * 60 * 8; // 8 horas

/**
 * Gera um token mock no formato: avp.<payload_base64>.mock
 */
export function gerarToken(matricula: string): string {
  const payload: PayloadToken = {
    matricula,
    exp: Date.now() + DURACAO_TOKEN_MS,
  };
  const encoded = btoa(JSON.stringify(payload));
  return `${PREFIXO_TOKEN}.${encoded}.${SUFIXO_TOKEN}`;
}

/**
 * Valida estrutura e expiração do token mock
 */
export function validarToken(token: string): boolean {
  try {
    const partes = token.split(".");
    if (partes.length !== 3) return false;
    if (partes[0] !== PREFIXO_TOKEN || partes[2] !== SUFIXO_TOKEN) return false;

    const payload: PayloadToken = JSON.parse(atob(partes[1]));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Extrai a matrícula do token sem validar expiração
 */
export function extrairMatriculaDoToken(token: string): string | null {
  try {
    const partes = token.split(".");
    if (partes.length !== 3) return null;
    const payload: PayloadToken = JSON.parse(atob(partes[1]));
    return payload.matricula ?? null;
  } catch {
    return null;
  }
}

/**
 * Simula um delay de rede para deixar mais realista (ex: 300–700ms)
 */
export function simularLatencia(minMs = 300, maxMs = 700): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Remove dados sensíveis do usuário antes de expor na sessão
 */
export function toUsuarioPublico(usuario: {
  matricula: string;
  nome: string;
  apelido: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  area: string;
  permission: UsuarioPublico["permission"];
}): UsuarioPublico {
  return {
    matricula: usuario.matricula,
    nome: usuario.nome,
    apelido: usuario.apelido,
    email: usuario.email,
    telefone: usuario.telefone,
    dataNascimento: usuario.dataNascimento,
    area: usuario.area,
    permission: usuario.permission,
  };
}

/**
 * Mapeia usuário completo para o formato de sessão (mínimo necessário no token)
 */
export function toUsuarioSessao(usuario: {
  id: string;
  matricula: string;
  nome: string;
  apelido: string;
  email: string;
  area: string
  permission: UsuarioSessao["permission"];
}): UsuarioSessao {
  return {
    id: usuario.id,
    matricula: usuario.matricula,
    nome: usuario.nome,
    apelido: usuario.apelido,
    email: usuario.email,
    area: usuario.area,
    permission: usuario.permission,
  };
}

/**
 * Valida formato básico de matrícula (ex: "CC20230456")
 */
export function validarFormatoMatricula(matricula: string): boolean {
  return /^[A-Z]{2}\d{8}$/.test(matricula);
}

