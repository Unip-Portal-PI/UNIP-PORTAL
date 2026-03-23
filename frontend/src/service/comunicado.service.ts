// src/service/comunicado.service.ts
"use client";

import { Comunicado } from "@/src/types/comunicado";
import { Auth } from "@/src/service/auth.service";
import { API_BASE_URL, buildFileUrl, extractFilePath } from "@/src/service/file.service";

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

function mapComunicado(data: {
  id: string;
  titulo: string;
  assunto?: string | null;
  conteudo: string;
  resumo: string;
  banner?: string | null;
  visibilidade: string[];
  anexos: Array<{
    id: string;
    nome: string;
    url: string;
    tipo: "pdf" | "jpg" | "png";
    tamanhoMb?: number;
    tamanhoMB?: number;
  }>;
  dataValidade?: string | null;
  criadoEm: string;
  criadoPor: string;
  criadoPorNome: string;
  removido?: boolean;
}): Comunicado {
  return {
    id: data.id,
    titulo: data.titulo,
    assunto: data.assunto ?? "",
    conteudo: data.conteudo,
    resumo: data.resumo,
    banner: data.banner ? buildFileUrl(data.banner) : "",
    visibilidade: data.visibilidade ?? [],
    anexos: (data.anexos ?? []).map((anexo) => ({
      ...anexo,
      url: buildFileUrl(anexo.url),
      tamanhoMB: anexo.tamanhoMB ?? anexo.tamanhoMb ?? 0,
    })),
    dataValidade: data.dataValidade ?? "",
    criadoEm: data.criadoEm,
    criadoPor: data.criadoPor,
    criadoPorNome: data.criadoPorNome,
    removido: data.removido,
  };
}

export const ComunicadoService = {
  async getAll(): Promise<Comunicado[]> {
    const response = await fetch(`${API_BASE_URL}/announcements/`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<
      Array<{
        id: string;
        titulo: string;
        assunto?: string | null;
        conteudo: string;
        resumo: string;
        banner?: string | null;
        visibilidade: string[];
        anexos: Comunicado["anexos"];
        dataValidade?: string | null;
        criadoEm: string;
        criadoPor: string;
        criadoPorNome: string;
        removido?: boolean;
      }>
    >(response);
    return data.map(mapComunicado);
  },

  async getMine(): Promise<Comunicado[]> {
    const response = await fetch(`${API_BASE_URL}/announcements/mine`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<
      Array<{
        id: string;
        titulo: string;
        assunto?: string | null;
        conteudo: string;
        resumo: string;
        banner?: string | null;
        visibilidade: string[];
        anexos: Comunicado["anexos"];
        dataValidade?: string | null;
        criadoEm: string;
        criadoPor: string;
        criadoPorNome: string;
        removido?: boolean;
      }>
    >(response);
    return data.map(mapComunicado);
  },

  async getById(id: string): Promise<Comunicado | null> {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    const data = await parseResponse<{
      id: string;
      titulo: string;
      assunto?: string | null;
      conteudo: string;
      resumo: string;
      banner?: string | null;
      visibilidade: string[];
      anexos: Comunicado["anexos"];
      dataValidade?: string | null;
      criadoEm: string;
      criadoPor: string;
      criadoPorNome: string;
      removido?: boolean;
    }>(response);
    return mapComunicado(data);
  },

  async criar(
    dados: Omit<Comunicado, "id" | "criadoEm">
  ): Promise<Comunicado> {
    const response = await fetch(`${API_BASE_URL}/announcements/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        titulo: dados.titulo,
        assunto: dados.assunto,
        conteudo: dados.conteudo,
        resumo: dados.resumo,
        banner: extractFilePath(dados.banner),
        visibilidade: dados.visibilidade,
        anexos: dados.anexos.map((anexo) => ({
          id: anexo.id,
          nome: anexo.nome,
          url: extractFilePath(anexo.url),
          tipo: anexo.tipo,
          tamanhoMb: anexo.tamanhoMB,
        })),
        dataValidade: dados.dataValidade || null,
      }),
    });
    const data = await parseResponse<{
      id: string;
      titulo: string;
      assunto?: string | null;
      conteudo: string;
      resumo: string;
      banner?: string | null;
      visibilidade: string[];
      anexos: Comunicado["anexos"];
      dataValidade?: string | null;
      criadoEm: string;
      criadoPor: string;
      criadoPorNome: string;
      removido?: boolean;
    }>(response);
    return mapComunicado(data);
  },

  async editar(
    id: string,
    dados: Partial<Omit<Comunicado, "id" | "criadoEm">>
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        titulo: dados.titulo,
        assunto: dados.assunto,
        conteudo: dados.conteudo,
        resumo: dados.resumo,
        banner: extractFilePath(dados.banner),
        visibilidade: dados.visibilidade,
        anexos: dados.anexos?.map((anexo) => ({
          id: anexo.id,
          nome: anexo.nome,
          url: extractFilePath(anexo.url),
          tipo: anexo.tipo,
          tamanhoMb: anexo.tamanhoMB,
        })),
        dataValidade: dados.dataValidade,
      }),
    });
    await parseResponse(response);
  },

  async excluir(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      await parseResponse(response);
    }
  },
};
