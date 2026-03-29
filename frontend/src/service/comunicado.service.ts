// src/service/comunicado.service.ts
"use client";

import { Comunicado } from "@/src/types/comunicado";
import { buildFileUrl, extractFilePath } from "@/src/service/file.service";
import { api } from "./api";

type ApiComunicado = {
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
};

function mapComunicado(data: ApiComunicado): Comunicado {
  return {
    id: data.id,
    titulo: data.titulo,
    assunto: data.assunto ?? "",
    conteudo: data.conteudo,
    resumo: data.resumo ?? "",
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
    const { data, ok, error } = await api.get<ApiComunicado[]>("/announcements/");
    if (!ok || !data) throw new Error(error || "Falha ao buscar comunicados");
    return data.map(mapComunicado);
  },

  async getMine(): Promise<Comunicado[]> {
    const { data, ok, error } = await api.get<ApiComunicado[]>("/announcements/mine");
    if (!ok || !data) throw new Error(error || "Falha ao buscar comunicados");
    return data.map(mapComunicado);
  },

  async getById(id: string): Promise<Comunicado | null> {
    const { data, ok, status } = await api.get<ApiComunicado>(`/announcements/${id}`);
    if (status === 404) return null;
    if (!ok || !data) return null;
    return mapComunicado(data);
  },

  async criar(dados: Omit<Comunicado, "id" | "criadoEm">): Promise<Comunicado> {
    const payload = {
      titulo: dados.titulo,
      assunto: dados.assunto,
      conteudo: dados.conteudo,
      resumo: dados.resumo ?? "",
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
    };

    const { data, ok, error } = await api.post<ApiComunicado>("/announcements/", payload);
    if (!ok || !data) throw new Error(error || "Falha ao criar comunicado");
    return mapComunicado(data);
  },

  async editar(id: string, dados: Partial<Omit<Comunicado, "id" | "criadoEm">>): Promise<void> {
    const payload = {
      titulo: dados.titulo,
      assunto: dados.assunto,
      conteudo: dados.conteudo,
      resumo: dados.resumo ?? "",
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
    };

    const { ok, error } = await api.put(`/announcements/${id}`, payload);
    if (!ok) throw new Error(error || "Falha ao editar comunicado");
  },

  async excluir(id: string): Promise<void> {
    const { ok, error } = await api.delete(`/announcements/${id}`);
    if (!ok) throw new Error(error || "Falha ao excluir comunicado");
  },
};
