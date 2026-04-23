// src/service/evento.service.ts
import { Evento, EventoColaborador, Inscricao } from "@/src/types/evento";
import { buildFileUrl, extractFilePath } from "@/src/service/file.service";
import { api } from "./api";

type ApiEvento = {
  id: string;
  idCriador?: string | null;
  banner?: string | null;
  nome: string;
  descricaoBreve?: string | null;
  descricaoCompleta?: string | null;
  area?: string[] | null;
  data: string;
  horario?: string | null;
  turno?: string | null;
  local?: string | null;
  dataLimiteInscricao?: string | null;
  vagas?: number | null;
  vagasOcupadas?: number | null;
  tipoInscricao: Evento["tipoInscricao"];
  urlExterna?: string | null;
  visibilidade: Evento["visibilidade"];
  modoEdicao: Evento["modoEdicao"];
  responsavel?: string | null;
  colaboradores?: EventoColaborador[];
  anexos?: Evento["anexos"];
  criadoEm?: string | null;
};

type ApiInscricao = {
  id: string;
  eventoId: string;
  alunoId: string;
  alunoNome: string;
  alunoArea?: string | null;
  alunoMatricula: string;
  dataInscricao: string;
  presencaConfirmada: boolean;
  qrCode?: string | null;
};

type ApiPresencaResponse = {
  sucesso: boolean;
  mensagem: string;
  inscricao?: ApiInscricao | null;
};

type ApiEventoCancelResponse = {
  sucesso: boolean;
  mensagem: string;
  eventoId: string;
  inscricoesCanceladas: number;
};

// ---------------------------------------------------------------------------
// Helpers de Mapeamento
// ---------------------------------------------------------------------------

function mapTurnoFromApi(turno?: string | null): string {
  if (!turno) return "";
  const map: Record<string, string> = {
    MANHA: "Manhã",
    TARDE: "Tarde",
    NOITE: "Noite",
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
  };
  return map[turno] ?? turno;
}

function mapTurnoToApi(turno?: string | null): string | null {
  if (!turno) return null;

  const normalized = turno.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const map: Record<string, string> = {
    Manha: "manha",
    Tarde: "tarde",
    Noite: "noite",
    MANHA: "manha",
    TARDE: "tarde",
    NOITE: "noite",
    manha: "manha",
    tarde: "tarde",
    noite: "noite",
  };

  return map[normalized] ?? normalized.toLowerCase();
}

function mapEvento(evento: ApiEvento): Evento {
  return {
    id: evento.id,
    idCriador: evento.idCriador ?? undefined,
    banner: evento.banner ? buildFileUrl(evento.banner) : undefined,
    nome: evento.nome,
    descricaoBreve: evento.descricaoBreve ?? "",
    descricaoCompleta: evento.descricaoCompleta ?? "",
    area: evento.area ?? [],
    data: evento.data,
    horario: evento.horario ? evento.horario.slice(0, 5) : "",
    turno: mapTurnoFromApi(evento.turno),
    local: evento.local ?? "",
    dataLimiteInscricao: evento.dataLimiteInscricao ?? "",
    vagas: evento.vagas ?? 0,
    vagasOcupadas: evento.vagasOcupadas ?? 0,
    tipoInscricao: evento.tipoInscricao,
    urlExterna: evento.urlExterna ?? undefined,
    visibilidade: evento.visibilidade,
    modoEdicao: evento.modoEdicao,
    responsavel: evento.responsavel ?? "",
    colaboradores: evento.colaboradores ?? [],
    anexos: (evento.anexos ?? []).map((anexo) => ({
      ...anexo,
      url: buildFileUrl(anexo.url),
    })),
    criadoEm: evento.criadoEm ?? new Date().toISOString(),
  };
}

function mapInscricao(inscricao: ApiInscricao): Inscricao {
  return {
    id: inscricao.id,
    eventoId: inscricao.eventoId,
    alunoId: inscricao.alunoId,
    alunoNome: inscricao.alunoNome,
    alunoArea: inscricao.alunoArea ?? "",
    alunoMatricula: inscricao.alunoMatricula,
    dataInscricao: inscricao.dataInscricao,
    presencaConfirmada: inscricao.presencaConfirmada,
    qrCode: inscricao.qrCode ?? "",
  };
}

// ---------------------------------------------------------------------------
// Tipos de scroll
// ---------------------------------------------------------------------------

export interface ScrollParams {
  skip: number;
  limit?: number;
  search?: string;
  area?: string;
  turno?: string;
  data?: string;
  sort?: string;
}

export interface ScrollEventos {
  items: Evento[];
  total: number;
  temMais: boolean;
}

type ApiScrollResponse = {
  items: ApiEvento[];
  total: number;
  temMais: boolean;
};

// ---------------------------------------------------------------------------
// Serviço de Eventos
// ---------------------------------------------------------------------------

export const EventoService = {
  async getScroll(params: ScrollParams): Promise<ScrollEventos> {
    const qp = new URLSearchParams();
    qp.set("skip", String(params.skip));
    qp.set("limit", String(params.limit ?? 12));
    if (params.search) qp.set("search", params.search);
    if (params.area) qp.set("area", params.area);
    if (params.turno) qp.set("turno", params.turno);
    if (params.data) qp.set("data", params.data);
    if (params.sort) qp.set("sort", params.sort);

    const { data, ok, error } = await api.get<ApiScrollResponse>(`/events/?${qp}`);
    if (!ok || !data) throw new Error(error || "Falha ao buscar eventos");
    return {
      items: data.items.map(mapEvento),
      total: data.total,
      temMais: data.temMais,
    };
  },

  async getAll(): Promise<Evento[]> {
    const { data, ok, error } = await api.get<ApiScrollResponse>("/events/?skip=0&limit=500");
    if (!ok || !data) throw new Error(error || "Falha ao buscar eventos");
    return data.items.map(mapEvento);
  },

  async getById(id: string): Promise<Evento | null> {
    const { data, ok, status } = await api.get<ApiEvento>(`/events/${id}`);
    if (status === 404) return null;
    if (!ok || !data) return null;
    return mapEvento(data);
  },

  async criar(dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">): Promise<Evento> {
    const payload = {
      nome: dados.nome,
      descricao: dados.descricaoCompleta,
      descricaoBreve: dados.descricaoBreve,
      bannerUrl: extractFilePath(dados.banner),
      data: dados.data,
      horario: dados.horario || null,
      turno: mapTurnoToApi(dados.turno),
      local: dados.local || null,
      vagas: dados.vagas,
      area: dados.area?.length ? dados.area : null,
      dataLimiteInscricao: dados.dataLimiteInscricao || null,
      tipoInscricao: dados.tipoInscricao,
      urlExterna: dados.urlExterna || null,
      responsavel: dados.responsavel || null,
      visibilidade: dados.visibilidade,
      modoEdicao: dados.modoEdicao,
      colaboradoresIds: (dados.colaboradores ?? []).map((colaborador) => colaborador.id),
      anexos: (dados.anexos ?? []).map((anexo) => ({
        id: anexo.id,
        nome: anexo.nome,
        url: extractFilePath(anexo.url),
      })),
      cursosIds: [],
      palestrantesIds: [],
    };

    const { data, ok, error } = await api.post<ApiEvento>("/events/", payload);
    if (!ok || !data) throw new Error(error || "Falha ao criar evento");
    return mapEvento(data);
  },

  async editar(id: string, dados: Partial<Evento>): Promise<Evento> {
    const payload = {
      nome: dados.nome,
      descricao: dados.descricaoCompleta,
      descricaoBreve: dados.descricaoBreve,
      bannerUrl: extractFilePath(dados.banner),
      data: dados.data,
      horario: dados.horario || null,
      turno: mapTurnoToApi(dados.turno),
      local: dados.local || null,
      vagas: dados.vagas,
      area: dados.area?.length ? dados.area : null,
      dataLimiteInscricao: dados.dataLimiteInscricao || null,
      tipoInscricao: dados.tipoInscricao,
      urlExterna: dados.urlExterna || null,
      responsavel: dados.responsavel || null,
      visibilidade: dados.visibilidade,
      modoEdicao: dados.modoEdicao,
      colaboradoresIds: dados.colaboradores?.map((colaborador) => colaborador.id),
      anexos: dados.anexos?.map((anexo) => ({
        id: anexo.id,
        nome: anexo.nome,
        url: extractFilePath(anexo.url),
      })),
    };

    const { data, ok, error } = await api.put<ApiEvento>(`/events/${id}`, payload);
    if (!ok || !data) throw new Error(error || "Falha ao editar evento");
    return mapEvento(data);
  },

  async cancelar(id: string): Promise<ApiEventoCancelResponse> {
    const { data, ok, error } = await api.delete<ApiEventoCancelResponse>(`/events/${id}`);
    if (!ok || !data) throw new Error(error || "Falha ao cancelar evento");
    return data;
  },

  async inscrever(eventoId: string): Promise<Inscricao> {
    const { data, ok, error } = await api.post<ApiInscricao>(`/events/${eventoId}/enroll`);
    if (!ok || !data) throw new Error(error || "Falha ao realizar inscrição");
    return mapInscricao(data);
  },

  async cancelarInscricao(eventoId: string): Promise<void> {
    const { ok, error } = await api.delete(`/events/${eventoId}/enroll`);
    if (!ok) throw new Error(error || "Falha ao cancelar inscrição");
  },

  async getMinhaInscricao(eventoId: string): Promise<Inscricao | null> {
    const { data, ok } = await api.get<ApiInscricao>(`/events/${eventoId}/my-enrollment`);
    if (!ok || !data) return null;
    return mapInscricao(data);
  },

  async getInscricoesEvento(eventoId: string): Promise<Inscricao[]> {
    const { data, ok, error } = await api.get<ApiInscricao[]>(`/events/${eventoId}/enrollments`);
    if (!ok || !data) throw new Error(error || "Falha ao buscar inscritos");
    return data.map(mapInscricao);
  },

  async getMinhasInscricoes(): Promise<Inscricao[]> {
    const { data, ok, error } = await api.get<ApiInscricao[]>("/events/mine/enrollments");
    if (!ok || !data) throw new Error(error || "Falha ao buscar minhas inscrições");
    return data.map(mapInscricao);
  },

  async removerInscricaoAluno(eventoId: string, alunoId: string): Promise<void> {
    const { ok, error } = await api.delete(`/events/${eventoId}/enrollments/${alunoId}`);
    if (!ok) throw new Error(error || "Falha ao remover inscrição do aluno");
  },

  async getMeusEventosCriados(): Promise<Evento[]> {
    const { data, ok, error } = await api.get<ApiEvento[]>("/events/mine/created");
    if (!ok || !data) throw new Error(error || "Falha ao buscar meus eventos");
    return data.map(mapEvento);
  },

  async confirmarPresenca(eventoId: string, qrCode: string): Promise<Inscricao> {
    const { data, ok, error } = await api.post<ApiPresencaResponse>(`/events/${eventoId}/check-in`, { qrCode });
    if (!ok || !data || !data.inscricao) {
      throw new Error(error || data?.mensagem || "Falha ao confirmar presença");
    }
    return mapInscricao(data.inscricao);
  },
};