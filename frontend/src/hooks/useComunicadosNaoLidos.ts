// src/hooks/useComunicadosNaoLidos.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { Comunicado } from "@/src/types/comunicado";
import { ComunicadoService } from "@/src/service/comunicado.service";
import { isComunicadoExpirado } from "@/src/utils/comunicado.helpers";

export interface ComunicadoNotificacao {
  id: string;
  titulo: string;
  assunto: string;
  criadoEm: string;
  lido: boolean;
}

export function useComunicadosNaoLidos() {
  const [notificacoes, setNotificacoes] = useState<ComunicadoNotificacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const todos = await ComunicadoService.getAll();
      const ativos = todos.filter((c) => !isComunicadoExpirado(c) && !c.removido);
      const lista: ComunicadoNotificacao[] = ativos.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        assunto: c.assunto,
        criadoEm: c.criadoEm,
        lido: ComunicadoService.isLido(c.id),
      }));
      // Ordena: não lidos primeiro, depois por data decrescente
      lista.sort((a, b) => {
        if (a.lido !== b.lido) return a.lido ? 1 : -1;
        return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
      });
      setNotificacoes(lista);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    // Recarrega ao focar a aba (usuário volta de outra página)
    const onFocus = () => carregar();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [carregar]);

  const totalNaoLidos = notificacoes.filter((n) => !n.lido).length;

  function marcarLido(id: string) {
    ComunicadoService.marcarLido(id);
    setNotificacoes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lido: true } : n))
    );
  }

  function marcarTodosLidos() {
    notificacoes.forEach((n) => ComunicadoService.marcarLido(n.id));
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lido: true })));
  }

  return { notificacoes, totalNaoLidos, carregando, marcarLido, marcarTodosLidos, recarregar: carregar };
}
