"use client";

// app/components/PublicGuard.tsx

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/src/service/auth.service";

export default function PublicGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    if (Auth.isAuthenticated()) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      router.replace(redirect ? decodeURIComponent(redirect) : "/home");
    } else {
      setVerificado(true);
    }
  }, [router]);

  if (!verificado) return null;

  return <>{children}</>;
}
