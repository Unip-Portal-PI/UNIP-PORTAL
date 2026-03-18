// app/components/RoleGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/src/service/auth.service";
import { UserRole } from "@/src/types/user";

interface RoleGuardProps {
  /** Roles que têm permissão para acessar a página */
  allow: UserRole[];
  /** Para onde redirecionar se não tiver permissão (padrão: /home) */
  redirectTo?: string;
  children: React.ReactNode;
}

/**
 * Protege rotas por role.
 * Uso: envolva o conteúdo da página ou layout com <RoleGuard allow={["adm"]}>
 */
export default function RoleGuard({
  allow,
  redirectTo = "/home",
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    const user = Auth.getUser();

    // Sem sessão válida → AuthGuard já cuida, mas por segurança redireciona
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Role não permitida → redireciona
    if (!allow.includes(user.permission)) {
      router.replace(redirectTo);
      return;
    }

    setVerificado(true);
  }, []);

  if (!verificado) return null;

  return <>{children}</>;
}