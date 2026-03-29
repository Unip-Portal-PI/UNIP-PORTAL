// app/home/gestor/page.tsx
"use client";

import { TabelaUsuarios } from "@/app/components/gestor/TabelaUsuarios";
import RoleGuard from "@/src/guard/RoleGuard";

export default function GestorPage() {
  return (
    <RoleGuard allow={["adm", "colaborador"]}>
      <TabelaUsuarios />
    </RoleGuard>
  );
}
