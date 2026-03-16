// app/components/navbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, X, LogOut, User, Sun, Moon } from "lucide-react";
import { Auth } from "@/lib/api/useAuth";
import { useLoading } from "@/app/context/LoadingContext";

const navItems = [
  { label: "Evento",     href: "/home/eventos" },
  { label: "Comunicado", href: "/home/comunicado" },
  { label: "Gestão",     href: "/home/gestor" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef  = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router   = useRouter();
  const isDark = theme === "dark";
  const { showLoading } = useLoading();

  const user = Auth.getUser();
  const nome = user?.nome ?? "Usuário";

  const initials = nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const outsideDesktop = desktopProfileRef.current && !desktopProfileRef.current.contains(target);
      const outsideMobile  = mobileProfileRef.current  && !mobileProfileRef.current.contains(target);
      if (outsideDesktop && outsideMobile) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    Auth.logout();
    setLogoutModal(false);
    showLoading();
    router.push("/auth/login");
  }

  const AvatarImg = ({ size }: { size: number }) => (
    <img
      src={`https://ui-avatars.com/api/?name=${initials}&background=0f0f1e&color=fff`}
      alt="Avatar"
      style={{ width: size, height: size }}
      className="rounded-full object-cover border border-slate-200 dark:border-slate-600"
    />
  );

  const ProfileDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
      <button
        onClick={() => { setProfileOpen(false); router.push("/home/perfil"); }}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        Perfil
      </button>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {theme === "dark"
          ? <Sun className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          : <Moon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        }
        {theme === "dark" ? "Modo claro" : "Modo escuro"}
      </button>

      <button
        onClick={() => { setProfileOpen(false); setLogoutModal(true); }}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP ── */}
      <header className="hidden md:flex items-center justify-between px-8 py-3 shadow-md bg-white dark:bg-[#202020] z-30 relative transition-colors">
        <Link href="/home">
          <Image src={isDark ? "/img/logo_avp_dark.png" : "/img/logo_avp.png"} alt="AVP Conecta" width={120} height={40} className="object-contain" />
        </Link>

        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                pathname === item.href
                  ? "font-bold text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative" ref={desktopProfileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 focus:outline-none max-w-[220px]"
          >
            <span className="text-sm text-slate-700 dark:text-slate-300 truncate min-w-0">
              Olá, <strong>{nome}</strong>
            </span>
            <AvatarImg size={36} />
          </button>
          {profileOpen && <ProfileDropdown />}
        </div>
      </header>

      {/* ── MOBILE ── */}
      <header className="flex md:hidden items-center justify-between px-4 py-6 shadow-md bg-white dark:bg-[#202020] z-30 relative transition-colors">
        <button onClick={() => setMenuOpen(true)}>
          <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </button>

        <Link href="/home" className="absolute left-1/2 -translate-x-1/2">
          <Image src={isDark ? "/img/logo_avp_vertical_dark.png" : "/img/logo_avp_vertical.png"} alt="AVP Conecta" width={40} height={10} className="object-contain" />
        </Link>

        <div className="relative" ref={mobileProfileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 focus:outline-none max-w-[140px]"
          >
            <span className="text-sm text-slate-700 dark:text-slate-300 truncate min-w-0">
              Olá, <strong>{nome}</strong>
            </span>
            <AvatarImg size={32} />
          </button>
          {profileOpen && <ProfileDropdown />}
        </div>
      </header>

      {/* ── DRAWER MOBILE ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white dark:bg-[#202020] z-50 flex flex-col px-4 py-6 shadow-xl transition-transform duration-300 md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button onClick={() => setMenuOpen(false)} className="self-end mb-4">
          <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

        <Image src={isDark ? "/img/logo_avp_vertical_dark.png" : "/img/logo_avp_vertical.png"} alt="AVP Conecta" width={100} height={100} className="object-contain mx-auto mb-6" />

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${
                pathname === item.href
                  ? "bg-slate-100 dark:bg-slate-700 font-bold text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => { setMenuOpen(false); setLogoutModal(true); }}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-4"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* ── MODAL LOGOUT ── */}
      {logoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setLogoutModal(false); }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-80 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sair da conta</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                Tem certeza que deseja sair?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 py-2 rounded-lg border-2 border-[#8D8D8D] dark:border-slate-600 text-sm text-[#252525] dark:text-slate-300 hover:bg-[#E2E2E2] dark:hover:bg-slate-700 transition-colors"
              >
                Não
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-lg bg-[#DD0B0B] text-white text-sm font-bold hover:bg-[#AD0000] transition-colors"
              >
                Sim, sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}