// app/home/gestor/layout.tsx
import RoleGuard from "@/src/guard/RoleGuard";

export default function GestorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["adm"]}>
      {children}
    </RoleGuard>
  );
}