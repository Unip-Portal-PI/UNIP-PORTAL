// src/types/comunicado.ts

export type ComunicadoAnexo = {
  id: string;
  nome: string;
  url: string;
  tipo: "pdf" | "jpg" | "png";
  tamanhoMB: number;
};

export type Comunicado = {
  id: string;
  titulo: string;
  assunto: string;
  conteudo: string;
  resumo: string;
  banner: string;
  visibilidade: string[]; // cursos que podem ver, ou ["Todos"]
  anexos: ComunicadoAnexo[];
  dataValidade: string; // ISO date
  criadoEm: string; // ISO datetime
  criadoPor: string; // matricula do autor
  criadoPorNome: string;
  removido?: boolean;
};
