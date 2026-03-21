// src/service/perfil.service.ts
"use client";

import { MOCK_USUARIOS } from "@/src/data/usersMock";
import { Usuario, UsuarioSessao } from "@/src/types/user";
import { simularLatencia } from "@/src/utils/auth.helpers";

// Fotos de perfil em memória (matricula → dataURL)
const _fotos: Record<string, string> = {};

export const PerfilService = {
  // Busca dados completos do usuário logado (incluindo campos não presentes na sessão)
  getDadosCompletos(matricula: string): Promise<Usuario | null> {
    return new Promise((resolve) =>
      setTimeout(() => {
        const u = MOCK_USUARIOS.find((u) => u.matricula === matricula) ?? null;
        resolve(u ? { ...u } : null);
      }, 400)
    );
  },

  // Verifica se e-mail já está em uso por outro usuário
  emailEmUso(email: string, ignorarMatricula: string): boolean {
    return MOCK_USUARIOS.some(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.matricula !== ignorarMatricula
    );
  },

  // Atualiza dados pessoais
  atualizarDados(
    matricula: string,
    dados: Partial<Pick<Usuario, "nome" | "apelido" | "email" | "telefone" | "dataNascimento" | "area">>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const idx = MOCK_USUARIOS.findIndex((u) => u.matricula === matricula);
        if (idx === -1) { reject(new Error("Usuário não encontrado.")); return; }
        if (dados.email && PerfilService.emailEmUso(dados.email, matricula)) {
          reject(new Error("Este e-mail já está sendo usado por outra conta.")); return;
        }
        Object.assign(MOCK_USUARIOS[idx], dados);
        resolve();
      }, 600);
    });
  },

  // Altera senha
  alterarSenha(matricula: string, senhaAtual: string, novaSenha: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const idx = MOCK_USUARIOS.findIndex((u) => u.matricula === matricula);
        if (idx === -1) { reject(new Error("Usuário não encontrado.")); return; }
        if (MOCK_USUARIOS[idx].senha !== senhaAtual) {
          reject(new Error("Senha atual incorreta.")); return;
        }
        MOCK_USUARIOS[idx].senha = novaSenha;
        resolve();
      }, 600);
    });
  },

  // Foto de perfil (em memória — simulação)
  getFoto(matricula: string): string | null {
    return _fotos[matricula] ?? null;
  },

  salvarFoto(matricula: string, dataURL: string): void {
    _fotos[matricula] = dataURL;
  },
};
