// src/service/usuarioGestor.service.ts
"use client";

import { UsuarioGestor } from "@/src/types/usuarioGestor";
import { api } from "./api";

type ApiUsuarioGestor = {
  id: string;
  matricula: string;
  nome: string;
  apelido?: string | null;
  email: string;
  area?: string | null;
  permission: UsuarioGestor["permission"];
  ativo: boolean;
  deletedAt?: string | null;
  criadoEm: string;
  atualizadoEm: string;
  criadoPor?: string | null;
};

function mapUsuario(data: ApiUsuarioGestor): UsuarioGestor {
  return {
    id: data.id,
    matricula: data.matricula,
    nome: data.nome,
    apelido: data.apelido ?? "",
    email: data.email,
    area: data.area ?? "",
    permission: data.permission,
    status: data.ativo ? "ativo" : "inativo",
    ativo: data.ativo,
    deletedAt: data.deletedAt ?? undefined,
    criadoEm: data.criadoEm,
    atualizadoEm: data.atualizadoEm,
    criadoPor: data.criadoPor ?? "sistema",
  };
}

export const UsuarioGestorService = {
  async getAll(): Promise<UsuarioGestor[]> {
    const { data, ok, error } = await api.get<ApiUsuarioGestor[]>("/users/");
    if (!ok || !data) throw new Error(error || "Falha ao buscar usuários");
    return data.map(mapUsuario);
  },

  async getById(id: string): Promise<UsuarioGestor | null> {
    const { data, ok, status } = await api.get<ApiUsuarioGestor>(`/users/${id}`);
    if (status === 404) return null;
    if (!ok || !data) return null;
    return mapUsuario(data);
  },

  async criar(dados: Omit<UsuarioGestor, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioGestor> {
    const payload = {
      matricula: dados.matricula,
      nome: dados.nome,
      apelido: dados.apelido,
      email: dados.email,
      senha: dados.senha,
      area: dados.area,
      permission: dados.permission,
      ativo: dados.ativo,
    };

    const { data, ok, error } = await api.post<ApiUsuarioGestor>("/users/", payload);
    if (!ok || !data) throw new Error(error || "Falha ao criar usuário");
    return mapUsuario(data);
  },

  async editar(id: string, dados: Partial<Omit<UsuarioGestor, "id" | "criadoEm">>): Promise<void> {
    const payload = {
      nome: dados.nome,
      apelido: dados.apelido,
      email: dados.email,
      area: dados.area,
      permission: dados.permission,
      ativo: dados.ativo,
    };

    const { ok, error } = await api.put(`/users/${id}`, payload);
    if (!ok) throw new Error(error || "Falha ao editar usuário");
  },

  async excluir(id: string, _adminId: string): Promise<string | null> {
    const { ok, error } = await api.delete(`/users/${id}`);
    if (!ok) return error || "Falha ao excluir usuário.";
    return null;
  },

  async restaurar(id: string): Promise<void> {
    const { ok, error } = await api.post(`/users/${id}/restore`);
    if (!ok) throw new Error(error || "Falha ao restaurar usuário");
  },
};
