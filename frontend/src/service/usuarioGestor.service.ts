// src/service/usuarioGestor.service.ts
"use client";

import { UsuarioGestor } from "@/src/types/usuarioGestor";
import { MOCK_USUARIOS } from "@/src/data/usersMock";

// ── Converte Usuario → UsuarioGestor na inicialização ────────────────────────
const agora = new Date().toISOString();

const dadosIniciais: UsuarioGestor[] = MOCK_USUARIOS.map((u) => ({
  id: u.matricula,
  matricula: u.matricula,
  nome: u.nome,
  apelido: u.apelido,
  email: u.email,
  area: u.area,
  permission: u.permission,
  status: "ativo",
  ativo: true,
  criadoEm: agora,
  atualizadoEm: agora,
  criadoPor: "sistema",
}));

let _dados = [...dadosIniciais];

export const UsuarioGestorService = {
  getAll(): Promise<UsuarioGestor[]> {
    return new Promise((resolve) => setTimeout(() => resolve([..._dados]), 300));
  },

  getById(id: string): Promise<UsuarioGestor | null> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(_dados.find((u) => u.id === id) ?? null), 200)
    );
  },

  criar(dados: Omit<UsuarioGestor, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioGestor> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = new Date().toISOString();
        const novo: UsuarioGestor = { ...dados, id: dados.matricula, criadoEm: now, atualizadoEm: now };
        _dados = [novo, ..._dados];
        resolve(novo);
      }, 400);
    });
  },

  editar(id: string, dados: Partial<Omit<UsuarioGestor, "id" | "criadoEm">>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        _dados = _dados.map((u) =>
          u.id === id ? { ...u, ...dados, atualizadoEm: new Date().toISOString() } : u
        );
        resolve();
      }, 400);
    });
  },

  excluir(id: string, adminId: string): Promise<string | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (id === adminId) { resolve("Você não pode excluir sua própria conta."); return; }
        const alvo = _dados.find((u) => u.id === id);
        if (!alvo) { resolve("Usuário não encontrado."); return; }
        if (alvo.permission === "adm") { resolve("Não é permitido excluir administradores."); return; }
        _dados = _dados.map((u) => u.id === id ? { ...u, deletedAt: new Date().toISOString() } : u);
        resolve(null);
      }, 400);
    });
  },

  restaurar(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        _dados = _dados.map((u) => u.id === id ? { ...u, deletedAt: undefined } : u);
        resolve();
      }, 300);
    });
  },

  emailEmUso(email: string, ignorarId?: string): boolean {
    return _dados.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== ignorarId);
  },

  matriculaEmUso(matricula: string, ignorarId?: string): boolean {
    return _dados.some((u) => u.matricula === matricula && u.id !== ignorarId);
  },
};