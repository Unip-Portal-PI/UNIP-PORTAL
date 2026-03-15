"use client"
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: buscar dados do usuário via contexto/sessão
  // Exemplo com next-auth: const { data: session } = useSession();
  const user = {
    name: "Romulo Sousa",
    email: "romulo@unip.br",
    role: "Administrador" as const,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userName={user.name}
        userEmail={user.email}
        userRole={user.role}
        onLogout={async () => {
          // TODO: implementar logout
          console.log("Teste")
        }}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}