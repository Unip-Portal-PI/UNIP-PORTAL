// app/home/layout.tsx
"use client";

import { useState } from "react";
import Navbar from "@/app/components/navbar";
import { LoadingProvider } from "@/app/components/LoadingContext";
import { ModalAvisosEventosCancelados } from "@/app/components/eventos/ModalAvisosEventosCancelados";
import { FotoPerfilProvider } from "@/src/context/FotoPerfilContext";
import { Auth } from "@/src/service/auth.service";
import { EventoCanceladoNotificacao } from "@/src/types/user";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <FotoPerfilProviderWrapper>
        <Navbar />
        {children}
      </FotoPerfilProviderWrapper>
    </LoadingProvider>
  );
}

// Wrapper client-side para pegar a matrícula
function FotoPerfilProviderWrapper({ children }: { children: React.ReactNode }) {
  const user = Auth.getUser();
  const matricula = user?.matricula ?? "";
  const [avisosEventosCancelados, setAvisosEventosCancelados] = useState<
    EventoCanceladoNotificacao[]
  >(() => {
    const sessao = Auth.getUser();
    if (!sessao) return [];

    const avisos = Auth.consumePostLoginCancelledEvents();
    if (sessao.permission === "aluno") {
      return avisos;
    }
    return [];
  });

  return (
    <FotoPerfilProvider matricula={matricula}>
      {children}
      {avisosEventosCancelados.length > 0 && (
        <ModalAvisosEventosCancelados
          eventos={avisosEventosCancelados}
          onFechar={() => setAvisosEventosCancelados([])}
        />
      )}
    </FotoPerfilProvider>
  );
}
