"use client";

import { EventoColaborador } from "@/src/types/evento";
import { api } from "./api";

type ApiUsuarioColaborador = EventoColaborador;

export const UsuarioColaboradorService = {
  async getAll(): Promise<EventoColaborador[]> {
    const { data, ok, error } = await api.get<ApiUsuarioColaborador[]>("/users/collaborators");
    if (!ok || !data) throw new Error(error || "Falha ao buscar colaboradores");
    return data;
  },
};
