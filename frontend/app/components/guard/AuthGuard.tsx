// app/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/lib/api/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    if (!Auth.isAuthenticated()) {
      router.replace("/auth/login");
    } else {
      setVerificado(true);
    }
  }, [router]);

  if (!verificado) return null; // Não renderiza nada enquanto verifica

  return <>{children}</>;
}
