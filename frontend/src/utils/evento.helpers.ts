// src/utils/evento.helpers.ts

import { Evento } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const TURNOS = ["Todos", "Manhã", "Tarde", "Noite"];

export const AREA_GRADIENTS: Record<string, { bg: string; blobs: [string, string, string] }> = {
  "administração": { bg: "linear-gradient(135deg,#1a1a1a,#2d2d2d)", blobs: ["#FFDE00", "#e6c800", "#aaaaaa"] },
  "biomedicina": { bg: "linear-gradient(135deg,#002b1f,#003d2b)", blobs: ["#00897b", "#43a047", "#0097a7"] },
  "ciência da computação": { bg: "linear-gradient(135deg,#040d1a,#0a1e3c)", blobs: ["#00e5ff", "#1565c0", "#7c4dff"] },
  "ciências contábeis": { bg: "linear-gradient(135deg,#0d1f0d,#1a3320)", blobs: ["#2e7d32", "#558b2f", "#f9a825"] },
  "direito": { bg: "linear-gradient(135deg,#180830,#2a1050)", blobs: ["#6a1b9a", "#4527a0", "#880e4f"] },
  "educação física": { bg: "linear-gradient(135deg,#FFDE00,#f59e0b)", blobs: ["#fbbf24", "#f97316", "#ef4444"] },
  "enfermagem": { bg: "linear-gradient(135deg,#0a2540,#0d3b6e)", blobs: ["#1565c0", "#0288d1", "#00897b"] },
  "engenharia civil": { bg: "linear-gradient(135deg,#1c1108,#2e1e0a)", blobs: ["#795548", "#f57f17", "#4e342e"] },
  "farmácia": { bg: "linear-gradient(135deg,#003820,#004d29)", blobs: ["#00c853", "#1b5e20", "#76ff03"] },
  "fisioterapia": { bg: "linear-gradient(135deg,#001f3d,#003366)", blobs: ["#0277bd", "#26c6da", "#80deea"] },
  "pedagogia": { bg: "linear-gradient(135deg,#1a0020,#2d0035)", blobs: ["#e91e8c", "#f06292", "#ffca28"] },
  "psicologia": { bg: "linear-gradient(135deg,#0e0020,#1a0038)", blobs: ["#7b1fa2", "#00bcd4", "#e040fb"] },
  "recursos humanos": { bg: "linear-gradient(135deg,#1a0a00,#2d1500)", blobs: ["#e64a19", "#ff7043", "#ffb300"] },
  "tecnologia da informação": { bg: "linear-gradient(135deg,#000d1a,#001429)", blobs: ["#00e5ff", "#1de9b6", "#7c4dff"] },
  "default": { bg: "linear-gradient(135deg,#251a00,#3d2b00)", blobs: ["#FFDE00", "#f59e0b", "#fde68a"] },
};

export function getAreaGradient(areas: string[]) {
  const area = areas[areas.length - 1]?.toLowerCase() ?? "";
  return AREA_GRADIENTS[area] ?? AREA_GRADIENTS.default;
}

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

export function canCreate(role: UserRole): boolean {
  return role === "adm";
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