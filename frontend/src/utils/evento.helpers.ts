// src/utils/evento.helpers.ts

import { Evento } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const TURNOS = ["Todos", "Manhã", "Tarde", "Noite"];

export function getStatusVaga(
  evento: Evento
): "disponivel" | "quase_esgotado" | "esgotado" {
  const livre = evento.vagas - evento.vagasOcupadas;
  if (livre <= 0) return "esgotado";
  if (livre <= evento.vagas * 0.15) return "quase_esgotado";
  return "disponivel";
}

function parseDateOnly(value?: string | null): Date | null {
  if (!value) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0
  );
}

function parseTime(value?: string | null): { hours: number; minutes: number } | null {
  if (!value) return null;

  const normalized = String(value).trim();
  if (!normalized) return null;

  const match = normalized.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildEventStartDateTime(evento: Evento): Date | null {
  const eventDate = parseDateOnly(evento.data);
  if (!eventDate) return null;

  const time = parseTime(evento.horario);

  if (!time) {
    return new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      23,
      59,
      59,
      999
    );
  }

  return new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
    time.hours,
    time.minutes,
    0,
    0
  );
}

function buildEnrollmentDeadline(evento: Evento): Date | null {
  const eventStart = buildEventStartDateTime(evento);
  if (!eventStart) return null;

  // Regra padrão: 30 minutos DEPOIS do início
  const defaultDeadline = new Date(eventStart.getTime() + 30 * 60 * 1000);

  const limiteDate = parseDateOnly(evento.dataLimiteInscricao);
  if (!limiteDate) return defaultDeadline;

  const eventDate = parseDateOnly(evento.data);
  
  // Se a data limite for o próprio dia do evento ou posterior, usa a regra de 1h antes
  if (eventDate && limiteDate.getTime() >= eventDate.getTime()) {
    return defaultDeadline;
  }

  // Se for uma data anterior, encerra no final desse dia anterior
  return new Date(
    limiteDate.getFullYear(),
    limiteDate.getMonth(),
    limiteDate.getDate(),
    23,
    59,
    59,
    999
  );
}

export function isInscricaoEncerrada(evento: Evento): boolean {
  const vagas = Number(evento.vagas ?? 0);
  const vagasOcupadas = Number(evento.vagasOcupadas ?? 0);

  if (vagas > 0 && vagasOcupadas >= vagas) {
    return true;
  }

  const deadline = buildEnrollmentDeadline(evento);
  if (!deadline) return false;

  return new Date().getTime() > deadline.getTime();
}

export function canEdit(role: UserRole): boolean {
  return role === "colaborador" || role === "adm";
}

export function canEditEvent(
  evento: Evento,
  role: UserRole,
  currentUserId?: string | null
): boolean {
  if (!canEdit(role)) return false;
  if (role === "adm") return true;
  if (evento.modoEdicao === "publica") return true;
  if (!!currentUserId && evento.idCriador === currentUserId) return true;
  return !!currentUserId && (evento.colaboradores ?? []).some((colaborador) => colaborador.id === currentUserId);
}

export function canDelete(role: UserRole): boolean {
  return role === "adm";
}

export function canInscricao(role: UserRole): boolean {
  return role === "aluno";
}


export function isAcontecendoAgora(evento: Evento): boolean {
  const eventDate = parseDateOnly(evento.data);
  if (!eventDate) return false;

  const time = parseTime(evento.horario);
  const agora = new Date();

  const inicio = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
    time?.hours ?? 0,
    time?.minutes ?? 0,
    0,
    0
  );

  const fim = new Date(inicio.getTime() + 30 * 60 * 1000); // +30min após início

  return agora >= inicio && agora <= fim;
}