// src/service/perfil.service.ts
"use client";

import { MOCK_USUARIOS } from "@/src/data/usersMock";
import { Usuario } from "@/src/types/user";

// Fotos de perfil em memória (matricula → dataURL)
const _fotos: Record<string, string> = {};

// Listeners para mudança de foto
type FotoListener = (matricula: string, dataURL: string | null) => void;
const _listeners: Set<FotoListener> = new Set();

export const PerfilService = {
  getDadosCompletos(matricula: string): Promise<Usuario | null> {
    return new Promise((resolve) =>
      setTimeout(() => {
        const u = MOCK_USUARIOS.find((u) => u.matricula === matricula) ?? null;
        resolve(u ? { ...u } : null);
      }, 400)
    );
  },

  emailEmUso(email: string, ignorarMatricula: string): boolean {
    return MOCK_USUARIOS.some(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.matricula !== ignorarMatricula
    );
  },

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

  getFoto(matricula: string): string | null {
    return _fotos[matricula] ?? null;
  },

  // Salva a foto E notifica todos os listeners (navbar, perfil, etc.)
  salvarFoto(matricula: string, dataURL: string): void {
    _fotos[matricula] = dataURL;
    _listeners.forEach((fn) => fn(matricula, dataURL));
  },

  // Inscreve um componente para receber atualizações de foto
  // Retorna função de cancelamento para usar no cleanup do useEffect
  onFotoAtualizada(listener: FotoListener): () => void {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },
};