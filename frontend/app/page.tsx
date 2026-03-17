"use client";
// app/page.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Auth } from "@/src/service/authService";

export default function Splash() {
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