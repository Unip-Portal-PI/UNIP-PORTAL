// src/service/evento.service.ts

import { Evento, Inscricao } from "@/src/types/evento";
import { UserProfile } from "@/src/types/user";
import { MOCK_EVENTOS } from "@/src/data/eventoMock";
import { MOCK_INSCRICOES } from "@/src/data/inscricoesMock";

// ─── ESTADO INTERNO (substituído pela API futuramente) ────────────────────────

let _eventos = [...MOCK_EVENTOS];
let _inscricoes: Inscricao[] = [...MOCK_INSCRICOES];

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export const EventoService = {
  getAll: (): Promise<Evento[]> =>
    new Promise((res) =>
      setTimeout(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); // ignora a hora — compara só a data

        const ativos = _eventos.filter((e) => {
          const dataEvento = new Date(e.data + "T00:00:00");
          return dataEvento >= hoje; // hoje ainda aparece, ontem não
        });

        res([...ativos]);
      }, 600)
    ),

  getById: (id: string): Promise<Evento | null> =>
    new Promise((res) =>
      setTimeout(() => res(_eventos.find((e) => e.id === id) ?? null), 400)
    ),

  criar: (dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">): Promise<Evento> =>
    new Promise((res) =>
      setTimeout(() => {
        const novo: Evento = {
          ...dados,
          id: String(Date.now()),
          vagasOcupadas: 0,
          criadoEm: new Date().toISOString(),
        };
        _eventos = [novo, ..._eventos];
        res(novo);
      }, 800)
    ),

  editar: (id: string, dados: Partial<Evento>): Promise<Evento> =>
    new Promise((res, rej) =>
      setTimeout(() => {
        const idx = _eventos.findIndex((e) => e.id === id);
        if (idx === -1) return rej(new Error("Evento não encontrado"));
        _eventos[idx] = { ..._eventos[idx], ...dados };
        res(_eventos[idx]);
      }, 600)
    ),

  excluir: (id: string): Promise<void> =>
    new Promise((res) =>
      setTimeout(() => {
        _eventos = _eventos.filter((e) => e.id !== id);
        res();
      }, 500)
    ),

  inscrever: (eventoId: string, user: UserProfile): Promise<Inscricao> =>
    new Promise((res, rej) =>
      setTimeout(() => {
        const jaInscrito = _inscricoes.find(
          (i) => i.eventoId === eventoId && i.alunoId === user.id
        );
        if (jaInscrito) return rej(new Error("Você já está inscrito neste evento."));

        const evento = _eventos.find((e) => e.id === eventoId);
        if (!evento) return rej(new Error("Evento não encontrado."));
        if (evento.vagasOcupadas >= evento.vagas)
          return rej(new Error("Não há mais vagas disponíveis."));

        if (!user.nome || !user.matricula || !user.area)
          return rej(
            new Error(
              "Seus dados de perfil estão incompletos. Atualize antes de se inscrever."
            )
          );

        const nova: Inscricao = {
          id: `insc_${user.matricula}_${eventoId}_${Date.now()}`,
          eventoId,
          alunoId: user.id,
          alunoNome: user.nome,
          alunoArea: user.area,
          alunoMatricula: user.matricula,
          dataInscricao: new Date().toISOString(),
          presencaConfirmada: false,
          qrCode: `QR_${user.matricula}_${eventoId}`,
        };
        _inscricoes.push(nova);
        const evIdx = _eventos.findIndex((e) => e.id === eventoId);
        if (evIdx !== -1) _eventos[evIdx].vagasOcupadas += 1;
        res(nova);
      }, 700)
    ),

  getMinhaInscricao: (eventoId: string, userId: string): Inscricao | null =>
    _inscricoes.find((i) => i.eventoId === eventoId && i.alunoId === userId) ?? null,

  getInscricoesEvento: (eventoId: string): Inscricao[] =>
    _inscricoes.filter((i) => i.eventoId === eventoId),

  confirmarPresenca: (qrCode: string): Promise<Inscricao> =>
    new Promise((res, rej) =>
      setTimeout(() => {
        const idx = _inscricoes.findIndex((i) => i.qrCode === qrCode);
        if (idx === -1) return rej(new Error("QR Code inválido ou não encontrado."));
        if (_inscricoes[idx].presencaConfirmada)
          return rej(new Error("Presença já confirmada anteriormente."));
        _inscricoes[idx].presencaConfirmada = true;
        res(_inscricoes[idx]);
      }, 500)
    ),
};