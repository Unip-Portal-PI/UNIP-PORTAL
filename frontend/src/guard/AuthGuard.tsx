// app/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Auth } from "@/src/service/auth.service";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verificado, setVerificado] = useState(false);

  useEffect(() => {
    if (!Auth.isAuthenticated()) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/auth/login?redirect=${redirect}`);
    } else {
      setVerificado(true);
    }
  }, [router, pathname]);

  if (!verificado) return null;

  return <>{children}</>;
}
