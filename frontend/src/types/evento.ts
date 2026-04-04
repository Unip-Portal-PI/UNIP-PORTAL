// app/types/evento.ts

export type TipoInscricao = "interna" | "externa";
export type Visibilidade = "publica" | "privada";
export type StatusVaga = "disponivel" | "quase_esgotado" | "esgotado";

export interface Anexo {
  id: string;
  nome: string;
  url: string;
}

export interface EventoColaborador {
  id: string;
  nome: string;
  apelido?: string;
  matricula: string;
  email: string;
  area?: string;
  permission: "colaborador";
}

export interface Evento {
  id: string;
  idCriador?: string;
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
  modoEdicao: Visibilidade;
  colaboradores: EventoColaborador[];
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
