// src/service/evento.service.ts

import { Evento, Inscricao } from "@/src/types/evento";
import { Auth } from "@/src/service/auth.service";
import { API_BASE_URL, buildFileUrl, extractFilePath } from "@/src/service/file.service";

type ApiEvento = {
  id: string;
  banner?: string | null;
  nome: string;
  descricaoBreve?: string | null;
  descricaoCompleta?: string | null;
  area?: string | null;
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

function mapTurnoFromApi(turno?: string | null): string {
  if (!turno) return "";
  const map: Record<string, string> = {
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
  };
  return map[turno] ?? turno;
}

function mapTurnoToApi(turno?: string | null): string | null {
  if (!turno) return null;
  const map: Record<string, string> = {
    "Manhã": "manha",
    "Tarde": "tarde",
    "Noite": "noite",
    manha: "manha",
    tarde: "tarde",
    noite: "noite",
  };
  return map[turno] ?? turno.toLowerCase();
}

function getAuthHeaders() {
  const token = Auth.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail || data?.mensagem || "Nao foi possivel concluir a operacao.";
    throw new Error(message);
  }

  return data as T;
}

function mapEvento(evento: ApiEvento): Evento {
  return {
    id: evento.id,
    banner: evento.banner ? buildFileUrl(evento.banner) : undefined,
    nome: evento.nome,
    descricaoBreve: evento.descricaoBreve ?? "",
    descricaoCompleta: evento.descricaoCompleta ?? "",
    area: evento.area ?? "",
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

export const EventoService = {
  async getAll(): Promise<Evento[]> {
    const response = await fetch(`${API_BASE_URL}/events/`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<ApiEvento[]>(response);
    return data.map(mapEvento);
  },

  async getById(id: string): Promise<Evento | null> {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      headers: getAuthHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    const data = await parseResponse<ApiEvento>(response);
    return mapEvento(data);
  },

  async criar(dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">): Promise<Evento> {
    const response = await fetch(`${API_BASE_URL}/events/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        nome: dados.nome,
        descricao: dados.descricaoCompleta,
        descricaoBreve: dados.descricaoBreve,
        bannerUrl: extractFilePath(dados.banner),
        data: dados.data,
        horario: dados.horario || null,
        turno: mapTurnoToApi(dados.turno),
        vagas: dados.vagas,
        dataLimiteInscricao: dados.dataLimiteInscricao || null,
        tipoInscricao: dados.tipoInscricao,
        urlExterna: dados.urlExterna || null,
        visibilidade: dados.visibilidade,
        anexos: (dados.anexos ?? []).map((anexo) => ({
          id: anexo.id,
          nome: anexo.nome,
          url: extractFilePath(anexo.url),
        })),
        cursosIds: [],
        palestrantesIds: [],
        idSala: null,
      }),
    });

    const data = await parseResponse<ApiEvento>(response);
    return mapEvento(data);
  },

  async editar(id: string, dados: Partial<Evento>): Promise<Evento> {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        nome: dados.nome,
        descricao: dados.descricaoCompleta,
        descricaoBreve: dados.descricaoBreve,
        bannerUrl: extractFilePath(dados.banner),
        data: dados.data,
        horario: dados.horario || null,
        turno: mapTurnoToApi(dados.turno),
        vagas: dados.vagas,
        dataLimiteInscricao: dados.dataLimiteInscricao || null,
        tipoInscricao: dados.tipoInscricao,
        urlExterna: dados.urlExterna || null,
        visibilidade: dados.visibilidade,
        anexos: dados.anexos?.map((anexo) => ({
          id: anexo.id,
          nome: anexo.nome,
          url: extractFilePath(anexo.url),
        })),
      }),
    });

    const data = await parseResponse<ApiEvento>(response);
    return mapEvento(data);
  },

  async excluir(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseResponse(response);
    }
  },

  async inscrever(eventoId: string): Promise<Inscricao> {
    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/enroll`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<ApiInscricao>(response);
    return mapInscricao(data);
  },

  async cancelarInscricao(eventoId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/enroll`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseResponse(response);
    }
  },

  async getMinhaInscricao(eventoId: string): Promise<Inscricao | null> {
    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/my-enrollment`, {
      headers: getAuthHeaders(),
    });

    const data = await parseResponse<ApiInscricao | null>(response);
    return data ? mapInscricao(data) : null;
  },

  async getInscricoesEvento(eventoId: string): Promise<Inscricao[]> {
    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/enrollments`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<ApiInscricao[]>(response);
    return data.map(mapInscricao);
  },

  async getMinhasInscricoes(): Promise<Inscricao[]> {
    const response = await fetch(`${API_BASE_URL}/events/mine/enrollments`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<ApiInscricao[]>(response);
    return data.map(mapInscricao);
  },

  async getMeusEventosCriados(): Promise<Evento[]> {
    const response = await fetch(`${API_BASE_URL}/events/mine/created`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<ApiEvento[]>(response);
    return data.map(mapEvento);
  },

  async confirmarPresenca(eventoId: string, qrCode: string): Promise<Inscricao> {
    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/check-in`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ qrCode }),
    });
    const data = await parseResponse<ApiPresencaResponse>(response);

    if (!data.inscricao) {
      throw new Error(data.mensagem || "Nao foi possivel confirmar a presenca.");
    }

    return mapInscricao(data.inscricao);
  },
};
