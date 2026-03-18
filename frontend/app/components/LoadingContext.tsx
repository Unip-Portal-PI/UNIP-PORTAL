// app/context/LoadingContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";
import LoadingOverlay from "@/app/components/LoadingOverlay";

const LoadingContext = createContext({
  showLoading: () => {},
  hideLoading: () => {},
});

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  // Esconde o overlay automaticamente quando a rota muda
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{
      showLoading: () => setLoading(true),
      hideLoading: () => setLoading(false),
    }}>
      {loading && <LoadingOverlay />}
      {children}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);