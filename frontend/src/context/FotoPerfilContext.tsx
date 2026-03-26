// src/context/FotoPerfilContext.tsx
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { PerfilService } from "@/src/service/perfil.service";

interface FotoPerfilContextType {
  foto: string | null;
  atualizarFoto: (matricula: string, dataURL: string) => Promise<void>;
  recarregarFoto: (matricula: string) => Promise<void>;
}

const FotoPerfilContext = createContext<FotoPerfilContextType>({
  foto: null,
  atualizarFoto: async () => {},
  recarregarFoto: async () => {},
});

export function FotoPerfilProvider({ matricula, children }: { matricula: string; children: ReactNode }) {
  const [foto, setFoto] = useState<string | null>(PerfilService.getFoto(matricula));

  const atualizarFoto = useCallback(async (mat: string, dataURL: string) => {
    await PerfilService.salvarFoto(mat, dataURL);
    setFoto(dataURL);
  }, []);

  const recarregarFoto = useCallback(async (mat: string) => {
    const fotoAtual = PerfilService.getFoto(mat) ?? (await PerfilService.carregarFoto(mat));
    setFoto(fotoAtual);
  }, []);

  return (
    <FotoPerfilContext.Provider value={{ foto, atualizarFoto, recarregarFoto }}>
      {children}
    </FotoPerfilContext.Provider>
  );
}

export function useFotoPerfil() {
  return useContext(FotoPerfilContext);
}
