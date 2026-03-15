"use client";
// app/page.tsx

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Auth } from "@/app/lib/useAuth";
 
export default function RootPage() {
  const router = useRouter();
 
  useEffect(() => {
    // Pequeno delay para mostrar o splash antes de redirecionar
    const timer = setTimeout(() => {
      if (Auth.isAuthenticated()) {
        router.replace("/home");
      } else {
        router.replace("/auth/login");
      }
    }, 1200);
 
    return () => clearTimeout(timer);
  }, [router]);
 
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-8">
      {/* Logo */}
      <Image
        src="/img/logo_avp.png"
        alt="AVP Conecta"
        width={160}
        height={100}
        className="object-contain"
      />
 
      {/* Spinner */}
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0f0f1e] rounded-full animate-spin" />
    </main>
  );
}