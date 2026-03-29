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

  console.log("[EventoService.parseResponse] status:", response.status);
  console.log("[EventoService.parseResponse] ok:", response.ok);
  console.log("[EventoService.parseResponse] data:", data);

  if (!response.ok) {
    const message =
      data?.detail || data?.mensagem || "Nao foi possivel concluir a operacao.";
    throw new Error(message);
  }

  return data as T;
}

function mapEvento(evento: ApiEvento): Evento {
  console.log("[EventoService.mapEvento] evento recebido da API:", evento);
  console.log("[EventoService.mapEvento] local recebido da API:", evento.local);

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
    console.log("[EventoService.getAll] GET", `${API_BASE_URL}/events/`);

    const response = await fetch(`${API_BASE_URL}/events/`, {
      headers: getAuthHeaders(),
    });

    const data = await parseResponse<ApiEvento[]>(response);
    console.log("[EventoService.getAll] eventos recebidos:", data);

    return data.map(mapEvento);
  },

  async getById(id: string): Promise<Evento | null> {
    console.log("[EventoService.getById] id:", id);
    console.log("[EventoService.getById] GET", `${API_BASE_URL}/events/${id}`);

    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      headers: getAuthHeaders(),
    });

    if (response.status === 404) {
      console.log("[EventoService.getById] evento não encontrado");
      return null;
    }

    const data = await parseResponse<ApiEvento>(response);
    console.log("[EventoService.getById] evento bruto:", data);

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
    };

    try {
      console.log("[EventoService.criar] API_BASE_URL:", API_BASE_URL);
      console.log("[EventoService.criar] dados recebidos do formulário:", dados);
      console.log("[EventoService.criar] local recebido do formulário:", dados.local);
      console.log("[EventoService.criar] payload enviado:", payload);
      console.log("[EventoService.criar] payload.local:", payload.local);

      const response = await fetch(`${API_BASE_URL}/events/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log("[EventoService.criar] response status:", response.status);

      const data = await parseResponse<ApiEvento>(response);
      console.log("[EventoService.criar] resposta da API:", data);
      console.log("[EventoService.criar] local na resposta:", data.local);

      return mapEvento(data);
    } catch (error) {
      console.error("[EventoService.criar] Erro ao criar evento");
      console.error("[EventoService.criar] API_BASE_URL:", API_BASE_URL);
      console.error("[EventoService.criar] Erro bruto:", error);

      if (error instanceof Error) {
        console.error("[EventoService.criar] Nome:", error.name);
        console.error("[EventoService.criar] Mensagem:", error.message);
        console.error("[EventoService.criar] Stack:", error.stack);
      }

      throw new Error(
        "Nao foi possivel conectar com a API para criar o evento. Verifique a URL da API, CORS, proxy e se o backend esta online."
      );
    }
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
      dataLimiteInscricao: dados.dataLimiteInscricao || null,
      tipoInscricao: dados.tipoInscricao,
      urlExterna: dados.urlExterna || null,
      visibilidade: dados.visibilidade,
      anexos: dados.anexos?.map((anexo) => ({
        id: anexo.id,
        nome: anexo.nome,
        url: extractFilePath(anexo.url),
      })),
    };

    console.log("[EventoService.editar] id:", id);
    console.log("[EventoService.editar] dados recebidos do formulário:", dados);
    console.log("[EventoService.editar] local recebido do formulário:", dados.local);
    console.log("[EventoService.editar] payload enviado:", payload);
    console.log("[EventoService.editar] payload.local:", payload.local);

    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    console.log("[EventoService.editar] response status:", response.status);

    const data = await parseResponse<ApiEvento>(response);
    console.log("[EventoService.editar] resposta da API:", data);
    console.log("[EventoService.editar] local na resposta:", data.local);

    return mapEvento(data);
  },

  async excluir(id: string): Promise<void> {
    console.log("[EventoService.excluir] id:", id);

    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    console.log("[EventoService.excluir] response status:", response.status);

    if (!response.ok) {
      await parseResponse(response);
    }
  },

  async inscrever(eventoId: string): Promise<Inscricao> {
    console.log("[EventoService.inscrever] eventoId:", eventoId);

    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/enroll`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    const data = await parseResponse<ApiInscricao>(response);
    console.log("[EventoService.inscrever] resposta:", data);

    return mapInscricao(data);
  },

  async cancelarInscricao(eventoId: string): Promise<void> {
    console.log("[EventoService.cancelarInscricao] eventoId:", eventoId);

    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/enroll`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    console.log("[EventoService.cancelarInscricao] response status:", response.status);

    if (!response.ok) {
      await parseResponse(response);
    }
  },

  async getMinhaInscricao(eventoId: string): Promise<Inscricao | null> {
    console.log("[EventoService.getMinhaInscricao] eventoId:", eventoId);

    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/my-enrollment`, {
      headers: getAuthHeaders(),
    });

    const data = await parseResponse<ApiInscricao | null>(response);
    console.log("[EventoService.getMinhaInscricao] resposta:", data);

    return data ? mapInscricao(data) : null;
  },

  async getInscricoesEvento(eventoId: string): Promise<Inscricao[]> {
    console.log("[EventoService.getInscricoesEvento] eventoId:", eventoId);

    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/enrollments`, {
      headers: getAuthHeaders(),
    });

    const data = await parseResponse<ApiInscricao[]>(response);
    console.log("[EventoService.getInscricoesEvento] resposta:", data);

    return data.map(mapInscricao);
  },

  async getMinhasInscricoes(): Promise<Inscricao[]> {
    console.log("[EventoService.getMinhasInscricoes] GET", `${API_BASE_URL}/events/mine/enrollments`);

    const response = await fetch(`${API_BASE_URL}/events/mine/enrollments`, {
      headers: getAuthHeaders(),
    });

    const data = await parseResponse<ApiInscricao[]>(response);
    console.log("[EventoService.getMinhasInscricoes] resposta:", data);

    return data.map(mapInscricao);
  },

  async getMeusEventosCriados(): Promise<Evento[]> {
    console.log("[EventoService.getMeusEventosCriados] GET", `${API_BASE_URL}/events/mine/created`);

    const response = await fetch(`${API_BASE_URL}/events/mine/created`, {
      headers: getAuthHeaders(),
    });

    const data = await parseResponse<ApiEvento[]>(response);
    console.log("[EventoService.getMeusEventosCriados] resposta:", data);

    return data.map(mapEvento);
  },

  async confirmarPresenca(eventoId: string, qrCode: string): Promise<Inscricao> {
    console.log("[EventoService.confirmarPresenca] eventoId:", eventoId);
    console.log("[EventoService.confirmarPresenca] qrCode:", qrCode);

    const response = await fetch(`${API_BASE_URL}/events/${eventoId}/check-in`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ qrCode }),
    });

    const data = await parseResponse<ApiPresencaResponse>(response);
    console.log("[EventoService.confirmarPresenca] resposta:", data);

    if (!data.inscricao) {
      throw new Error(data.mensagem || "Nao foi possivel confirmar a presenca.");
    }

    return mapInscricao(data.inscricao);
  },
};