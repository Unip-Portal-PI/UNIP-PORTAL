// src/service/usuarioGestor.service.ts
"use client";

import { UsuarioGestor } from "@/src/types/usuarioGestor";
import { Auth } from "@/src/service/auth.service";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:7000";

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

function mapUsuario(data: {
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
}): UsuarioGestor {
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
    const response = await fetch(`${API_BASE_URL}/users/`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<
      Array<{
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
      }>
    >(response);
    return data.map(mapUsuario);
  },

  async getById(id: string): Promise<UsuarioGestor | null> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    if (response.status === 404) return null;
    const data = await parseResponse<{
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
    }>(response);
    return mapUsuario(data);
  },

  async criar(dados: Omit<UsuarioGestor, "id" | "criadoEm" | "atualizadoEm">): Promise<UsuarioGestor> {
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        matricula: dados.matricula,
        nome: dados.nome,
        apelido: dados.apelido,
        email: dados.email,
        senha: dados.senha,
        area: dados.area,
        permission: dados.permission,
        ativo: dados.ativo,
      }),
    });
    const data = await parseResponse<{
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
    }>(response);
    return mapUsuario(data);
  },

  async editar(id: string, dados: Partial<Omit<UsuarioGestor, "id" | "criadoEm">>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        nome: dados.nome,
        apelido: dados.apelido,
        email: dados.email,
        area: dados.area,
        permission: dados.permission,
        ativo: dados.ativo,
      }),
    });
    await parseResponse(response);
  },

  async excluir(id: string, _adminId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await parseResponse(response);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Falha ao excluir usuario.";
    }
  },

  async restaurar(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}/restore`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    await parseResponse(response);
  },
};
