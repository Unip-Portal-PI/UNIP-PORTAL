// src/context/FotoPerfilContext.tsx
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { PerfilService } from "@/src/service/perfil.service";

interface FotoPerfilContextType {
  foto: string | null;
  atualizarFoto: (matricula: string, dataURL: string) => void;
  recarregarFoto: (matricula: string) => void;
}

const FotoPerfilContext = createContext<FotoPerfilContextType>({
  foto: null,
  atualizarFoto: () => {},
  recarregarFoto: () => {},
});

export function FotoPerfilProvider({ matricula, children }: { matricula: string; children: ReactNode }) {
  const [foto, setFoto] = useState<string | null>(PerfilService.getFoto(matricula));

  const atualizarFoto = useCallback((mat: string, dataURL: string) => {
    PerfilService.salvarFoto(mat, dataURL);
    setFoto(dataURL);
  }, []);

  const recarregarFoto = useCallback((mat: string) => {
    setFoto(PerfilService.getFoto(mat));
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