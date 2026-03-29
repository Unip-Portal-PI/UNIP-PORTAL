// src/service/perfil.service.ts
"use client";

import { Usuario } from "@/src/types/user";
import { Auth } from "@/src/service/auth.service";
import { api } from "./api";

// Fotos de perfil em memória (matricula → dataURL)
const _fotos: Record<string, string> = {};

// Listeners para mudança de foto
type FotoListener = (matricula: string, dataURL: string | null) => void;
const _listeners: Set<FotoListener> = new Set();

type ApiUsuario = {
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
};

function mapUsuario(data: ApiUsuario): Usuario {
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
    const { data, ok, error } = await api.get<ApiUsuario>("/users/me");
    if (!ok || !data) throw new Error(error || "Falha ao buscar dados do perfil");
    return mapUsuario(data);
  },

  async atualizarDados(
    _matricula: string,
    dados: Partial<Pick<Usuario, "nome" | "apelido" | "email" | "telefone" | "dataNascimento" | "area">>
  ): Promise<void> {
    const payload = {
      nome: dados.nome,
      apelido: dados.apelido,
      email: dados.email,
      telefone: dados.telefone,
      dataNascimento: dados.dataNascimento || null,
      area: dados.area,
    };

    const { data, ok, error } = await api.put<ApiUsuario>("/users/me", payload);
    if (!ok || !data) throw new Error(error || "Falha ao atualizar dados");
    mapUsuario(data);
  },

  async alterarSenha(_matricula: string, senha_atual: string, nova_senha: string): Promise<void> {
    const { ok, error } = await api.put("/users/me/password", {
      senha_atual,
      nova_senha,
    });
    if (!ok) throw new Error(error || "Falha ao alterar senha");
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
    const { ok, error } = await api.put("/users/me/photo", { foto_url: dataURL });
    if (!ok) throw new Error(error || "Falha ao salvar foto");

    _fotos[matricula] = dataURL;
    Auth.updateStoredUser({ fotoUrl: dataURL });
    _listeners.forEach((fn) => fn(matricula, dataURL));
  },

  async carregarFoto(matricula: string): Promise<string | null> {
    const dados = await this.getDadosCompletos(matricula);
    return dados?.fotoUrl ?? null;
  },

  onFotoAtualizada(listener: FotoListener): () => void {
    _listeners.add(listener);
    return () => _listeners.delete(listener);
  },
};
