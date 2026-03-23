// src/service/perfil.service.ts
"use client";

import { Usuario } from "@/src/types/user";
import { Auth } from "@/src/service/auth.service";
import { API_BASE_URL } from "@/src/service/api-base-url";

// Fotos de perfil em memória (matricula → dataURL)
const _fotos: Record<string, string> = {};

// Listeners para mudança de foto
type FotoListener = (matricula: string, dataURL: string | null) => void;
const _listeners: Set<FotoListener> = new Set();
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
  telefone?: string | null;
  dataNascimento?: string | null;
  area?: string | null;
  permission: string;
  fotoUrl?: string | null;
  ativo?: boolean;
  criadoEm?: string | null;
  atualizadoEm?: string | null;
}): Usuario {
  if (data.fotoUrl) {
    _fotos[data.matricula] = data.fotoUrl;
  }

  Auth.updateStoredUser({
    id: data.id,
    matricula: data.matricula,
    nome: data.nome,
    apelido: data.apelido ?? "",
    email: data.email,
    area: data.area ?? "",
    permission: data.permission as Usuario["permission"],
    fotoUrl: data.fotoUrl ?? null,
  });

  return {
    id: data.id,
    matricula: data.matricula,
    nome: data.nome,
    apelido: data.apelido ?? "",
    telefone: data.telefone ?? "",
    dataNascimento: data.dataNascimento ?? "",
    area: data.area ?? "",
    permission: data.permission as Usuario["permission"],
    email: data.email,
    senha: "",
    fotoUrl: data.fotoUrl ?? null,
    ativo: data.ativo,
    criadoEm: data.criadoEm ?? undefined,
    atualizadoEm: data.atualizadoEm ?? undefined,
  };
}

export const PerfilService = {
  async getDadosCompletos(_matricula: string): Promise<Usuario | null> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(),
    });
    const data = await parseResponse<{
      id: string;
      matricula: string;
      nome: string;
      apelido?: string | null;
      email: string;
      telefone?: string | null;
      dataNascimento?: string | null;
      area?: string | null;
      permission: string;
      fotoUrl?: string | null;
      ativo?: boolean;
      criadoEm?: string | null;
      atualizadoEm?: string | null;
    }>(response);
    return mapUsuario(data);
  },

  async atualizarDados(
    _matricula: string,
    dados: Partial<Pick<Usuario, "nome" | "apelido" | "email" | "telefone" | "dataNascimento" | "area">>
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        nome: dados.nome,
        apelido: dados.apelido,
        email: dados.email,
        telefone: dados.telefone,
        dataNascimento: dados.dataNascimento || null,
        area: dados.area,
      }),
    });
    const data = await parseResponse<{
      id: string;
      matricula: string;
      nome: string;
      apelido?: string | null;
      email: string;
      telefone?: string | null;
      dataNascimento?: string | null;
      area?: string | null;
      permission: string;
      fotoUrl?: string | null;
      ativo?: boolean;
      criadoEm?: string | null;
      atualizadoEm?: string | null;
    }>(response);
    mapUsuario(data);
  },

  async alterarSenha(_matricula: string, senhaAtual: string, novaSenha: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/me/password`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        senhaAtual,
        novaSenha,
      }),
    });
    await parseResponse(response);
  },

  getFoto(matricula: string): string | null {
    if (_fotos[matricula]) return _fotos[matricula];
    const user = Auth.getUser();
    if (user?.matricula === matricula && user.fotoUrl) {
      _fotos[matricula] = user.fotoUrl;
      return user.fotoUrl;
    }
    return null;
  },

  async salvarFoto(matricula: string, dataURL: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/me/photo`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ fotoUrl: dataURL }),
    });
    await parseResponse(response);

    _fotos[matricula] = dataURL;
    Auth.updateStoredUser({ fotoUrl: dataURL });
    _listeners.forEach((fn) => fn(matricula, dataURL));
  },

  async carregarFoto(matricula: string): Promise<string | null> {
    const dados = await this.getDadosCompletos(matricula);
    return dados?.fotoUrl ?? null;
  },

  // Inscreve um componente para receber atualizações de foto
  // Retorna função de cancelamento para usar no cleanup do useEffect
  onFotoAtualizada(listener: FotoListener): () => void {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },
};
