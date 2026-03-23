// src/service/comunicado.service.ts
"use client";

import { Comunicado, ComunicadoAnexo } from "@/src/types/comunicado";
import { MOCK_COMUNICADO } from "@/src/data/comunicadoMock";

export const ComunicadoService = {
  // Só os comunicados que ainda não venceram (ou sem data de validade)
  getAll(): Promise<Comunicado[]> {
    return new Promise((resolve) =>
      setTimeout(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const ativos = MOCK_COMUNICADO.filter((c) => {
          if (!c.dataValidade) return true; // sem validade → sempre aparece
          const validade = new Date(c.dataValidade + "T00:00:00");
          return validade >= hoje;
        });

        resolve([...ativos]);
      }, 400)
    );
  },

  // Busca tudo, incluindo comunicados vencidos
  getAllIncludingExpired(): Promise<Comunicado[]> {
    return new Promise((resolve) =>
      setTimeout(() => resolve([...MOCK_COMUNICADO]), 400)
    );
  },

  getById(id: string): Promise<Comunicado | null> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK_COMUNICADO.find((c) => c.id === id) ?? null), 200)
    );
  },

  async criar(dados: Omit<Comunicado, "id" | "criadoEm">): Promise<Comunicado> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const novo: Comunicado = {
          ...dados,
          id: String(Date.now()),
          criadoEm: new Date().toISOString(),
        };
        MOCK_COMUNICADO.unshift(novo);
        resolve(novo);
      }, 500);
    });
  },

  async editar(
    id: string,
    dados: Partial<Omit<Comunicado, "id" | "criadoEm">>
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = MOCK_COMUNICADO.findIndex((c) => c.id === id);
        if (idx !== -1) Object.assign(MOCK_COMUNICADO[idx], dados);
        resolve();
      }, 400);
    });
  },

  async excluir(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = MOCK_COMUNICADO.findIndex((c) => c.id === id);
        if (idx !== -1) MOCK_COMUNICADO.splice(idx, 1);
        resolve();
      }, 400);
    });
  },
};