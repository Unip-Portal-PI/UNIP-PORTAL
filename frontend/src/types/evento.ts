// app/types/evento.ts

export type TipoInscricao = "interna" | "externa";
export type Visibilidade = "publica" | "privada";
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
  curso: string;
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
  alunoCurso: string;
  alunoMatricula: string;
  dataInscricao: string;
  presencaConfirmada: boolean;
  qrCode: string;
}

export type UserRole = "aluno" | "colaborador" | "adm";

export interface UserProfile {
  id: string;
  apelido: string;
  nome: string;
  matricula: string;
  curso: string;
  email: string;
  role: UserRole;
}
