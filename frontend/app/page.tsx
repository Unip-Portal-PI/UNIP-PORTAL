"use client";
// app/home/page.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/lib/api/useAuth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (Auth.isAuthenticated()) {
      router.replace("/home");
    } else {
      router.replace("/auth/login");
    }
  }, [router]);

  return null; // Não precisa renderizar nada, só redireciona
}