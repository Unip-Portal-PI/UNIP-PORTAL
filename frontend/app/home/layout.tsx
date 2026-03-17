// app/home/layout.tsx
import Navbar from "@/app/components/navbar";
import AuthGuard from "@/app/components/login/guard/AuthGuard";
 
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#303030] transition-colors">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
