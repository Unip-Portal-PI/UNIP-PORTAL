// app/hooks/useCameraPermission.ts
"use client";

import { useEffect } from "react";
import { UserRole } from "@/src/types/evento";

export function useCameraPermission(role: UserRole) {
  useEffect(() => {
    if (role !== "colaborador" && role !== "adm") return;

    // Só pede se ainda não foi concedida
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((result) => {
        if (result.state === "prompt") {
          // Abre e fecha o stream só para disparar o popup do browser
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
              stream.getTracks().forEach((t) => t.stop());
            })
            .catch(() => {
              // Usuário negou — tudo bem, tratamos no modal
            });
        }
      })
      .catch(() => {
        // API permissions não disponível (Firefox) — ignora
      });
  }, [role]);
}