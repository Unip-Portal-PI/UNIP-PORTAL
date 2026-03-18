// src/utils/evento.helpers.ts

import { Evento } from "@/src/types/evento";
import { UserRole } from "@/src/types/user";
// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const CURSOS = [
    "Todos",
    "Administração",
    "Biomedicina",
    "Ciência da Computação",
    "Ciências Contábeis",
    "Direito",
    "Educação Física",
    "Enfermagem",
    "Engenharia Civil",
    "Farmácia",
    "Fisioterapia",
    "Pedagogia",
    "Psicologia",
    "Recursos Humanos",
    "Tecnologia da Informação",
  ];
  
  export const TURNOS = ["Todos", "Manhã", "Tarde", "Noite"];
  
  export function getStatusVaga(evento: Evento): "disponivel" | "quase_esgotado" | "esgotado" {
    const livre = evento.vagas - evento.vagasOcupadas;
    if (livre <= 0) return "esgotado";
    if (livre <= evento.vagas * 0.15) return "quase_esgotado";
    return "disponivel";
  }
  
  export function isInscricaoEncerrada(evento: Evento): boolean {
    return new Date() > new Date(evento.dataLimiteInscricao);
  }
  
  export function canEdit(role: UserRole): boolean {
    return role === "colaborador" || role === "adm";
  }
  
  export function canDelete(role: UserRole): boolean {
    return role === "adm";
  }
  
  export function canInscricao(role: UserRole): boolean {
    return role === "aluno";
  }