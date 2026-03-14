// app/home/layout.tsx
import Navbar from "@/app/components/navbar";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}