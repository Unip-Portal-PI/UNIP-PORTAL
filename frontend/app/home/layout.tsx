// app/home/layout.tsx
import Navbar from "@/app/components/navbar";
import { LoadingProvider } from "@/app/components/LoadingContext";
import { FotoPerfilProvider } from "@/src/context/FotoPerfilContext";
import { Auth } from "@/src/service/auth.service";

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
  "use client";
  const user = Auth.getUser();
  const matricula = user?.matricula ?? "";
  return <FotoPerfilProvider matricula={matricula}>{children}</FotoPerfilProvider>;
}