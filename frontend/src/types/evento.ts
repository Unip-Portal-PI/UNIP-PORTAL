// app/types/evento.ts

export type TipoInscricao = "INTERNA" | "EXTERNA";
export type Visibilidade = "PUBLICA" | "PRIVADA";
export type StatusVaga = "disponivel" | "quase_esgotado" | "esgotado";

export interface Anexo {
  id: string;
  nome: string;
  url: string;
}

export interface Evento {
  id: string;
  banner?: string;
  nome: string;
  descricaoBreve: string;
  descricaoCompleta: string;
  area: string;
  data: string; // ISO date
  horario: string;
  turno: string;
  local: string;
  dataLimiteInscricao: string; // ISO date
  vagas: number;
  vagasOcupadas: number;
  tipoInscricao: TipoInscricao;
  urlExterna?: string;
  visibilidade: Visibilidade;
  anexos: Anexo[];
  criadoEm: string;
}

export interface Inscricao {
  id: string;
  eventoId: string;
  alunoId: string;
  alunoNome: string;
  alunoArea: string;
  alunoMatricula: string;
  dataInscricao: string;
  presencaConfirmada: boolean;
  qrCode: string;
}
