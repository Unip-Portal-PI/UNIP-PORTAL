// app/components/navbar.tsx
// ──────────────────────────────────────────────────────────────────────────────
// ALTERAÇÃO: adicionado <SinoComunicados /> no header desktop (ao lado do avatar)
//            e no drawer mobile (no rodapé, ao lado do botão de logout)
// ──────────────────────────────────────────────────────────────────────────────
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, X, LogOut, User, Sun, Moon, CalendarDays, Megaphone, Settings } from "lucide-react";
import { Auth } from "@/src/service/auth.service";
import { useLoading } from "@/app/components/LoadingContext";
import { UserRole } from "@/src/types/user";
import { PerfilService } from "@/src/service/perfil.service";
import { useFotoPerfil } from "@/src/context/FotoPerfilContext";
const NAV_ITEMS: { label: string; href: string; icon: React.ReactNode; roles?: UserRole[] }[] = [
  { label: "Evento", href: "/home/eventos", icon: <CalendarDays className="w-5 h-5" /> },
  { label: "Comunicado", href: "/home/comunicado", icon: <Megaphone className="w-5 h-5" /> },
  { label: "Gestão", href: "/home/gestor", icon: <Settings className="w-5 h-5" />, roles: ["adm"] },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { foto } = useFotoPerfil();
  useEffect(() => { setMounted(true); }, []);

  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { showLoading } = useLoading();

  const user = Auth.getUser();
  const apelido = user?.apelido ?? "Usuário";
  const role = user?.permission;
  const navItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );

  const initials = apelido
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const outsideDesktop = desktopProfileRef.current && !desktopProfileRef.current.contains(target);
      const outsideMobile = mobileProfileRef.current && !mobileProfileRef.current.contains(target);
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

  const ROLE_LABELS: Record<string, string> = {
    adm: "Administrador",
    colaborador: "Colaborador",
    aluno: "Aluno",
  };

  const isDark = mounted && resolvedTheme === "dark";

  const AvatarImg = ({ size }: { size: number }) => (
    <img
      src={foto ?? `https://ui-avatars.com/api/?name=${initials}&background=0f0f1e&color=fff`}
      alt="Avatar"
      style={{ width: size, height: size }}
      className="rounded-full object-cover border border-[#FFDE00] dark:border-[#FFDE00]"
    />
  );

  const ProfileDropdown = ({ mounted }: { mounted: boolean }) => (
    <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#202020] rounded-xl shadow-xl border border-slate-600 dark:border-slate-600 overflow-hidden z-50">
      <button
        onClick={() => { setProfileOpen(false); router.push("/home/perfil"); }}
        className="flex items-center gap-2 w-full px-4 py-3 text-base text-slate-700 dark:text-slate-200 hover:bg-[#FFDE00]/20 dark:hover:bg-[#FFDE00]/20 transition-colors"
      >
        <User className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        Perfil
      </button>

      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="flex items-center gap-2 w-full px-4 py-3 text-base text-slate-700 dark:text-slate-200 hover:bg-[#FFDE00]/20 dark:hover:bg-[#FFDE00]/20 transition-colors"
      >
        {mounted ? (
          isDark
            ? <Sun className="w-4 h-4 text-slate-700 dark:text-slate-200" />
            : <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        ) : (
          <span className="w-4 h-4" />
        )}
        {mounted
          ? isDark ? "Modo claro" : "Modo escuro"
          : <span className="w-16 h-4 bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 rounded animate-pulse" />
        }
      </button>

      <button
        onClick={() => { setProfileOpen(false); setLogoutModal(true); }}
        className="flex items-center gap-2 w-full px-4 py-3 text-base text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
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
          <>
            <Image src="/img/logo_avp.png" alt="AVP Conecta" width={120} height={40} className="object-contain dark:hidden" />
            <Image src="/img/logo_avp_dark.png" alt="AVP Conecta" width={120} height={40} className="object-contain hidden dark:block" />
          </>
        </Link>

        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-base transition-colors ${pathname === item.href || pathname.startsWith(item.href + "/")
                ? "font-bold text-slate-900 dark:text-white border-b-2 border-[#FFDE00]"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── Direita: sino + avatar ── */}
        <div className="flex items-center gap-3">



          <div className="relative" ref={desktopProfileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 focus:outline-none max-w-[220px] cursor-pointer"
            >
              <span className="text-base text-slate-700 dark:text-slate-300 truncate min-w-0">
                Olá, <strong>{apelido}</strong>
              </span>
              <AvatarImg size={36} />
            </button>
            {profileOpen && <ProfileDropdown mounted={mounted} />}
          </div>
        </div>
      </header>

      {/* ── MOBILE ── */}
      <header className="flex md:hidden items-center justify-between px-4 py-6 shadow-md bg-white dark:bg-[#202020] z-30 relative transition-colors">
        <button onClick={() => setMenuOpen(true)}>
          <Menu className="w-6 cursor-pointer h-6 text-slate-700 dark:text-slate-300" />
        </button>

        <Link href="/home" className="absolute left-1/2 -translate-x-1/2">
          <Image src="/img/logo_avp_vertical.png" alt="AVP Conecta" width={40} height={10} className="object-contain dark:hidden" />
          <Image src="/img/logo_avp_vertical_dark.png" alt="AVP Conecta" width={40} height={10} className="object-contain hidden dark:block" />
        </Link>

      </header>

      {/* ── DRAWER MOBILE ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-[#202020] z-50 flex flex-col shadow-xl transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Topo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#FFDE00] dark:border-[#FFDE00]">
          <Image src="/img/logo_icon.png" alt="AVP Conecta" width={36} height={36} className="object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-slate-900 dark:text-white">AVP Conecta</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">Portal de Informações</span>
          </div>
          <button onClick={() => setMenuOpen(false)} className="ml-auto">
            <X className="w-5 h-5 text-[#FFDE00] cursor-pointer" />
          </button>
        </div>

        {/* Nav principal */}
        <nav className="flex flex-col gap-1 flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active
                  ? "bg-[#FFDE00]/20 dark:bg-[#FFDE00]/20 text-[#4d4d4d] dark:text-white border-l-4 border-[#FFDE00] font-semibold"
                  : "text-slate-400 hover:bg-[#FFDE00]/10 dark:hover:bg-[#FFDE00]/10 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
              >
                <span className={active
                  ? "text-[#4d4d4d] dark:text-white"
                  : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors"
                }>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="border-t border-[#FFDE00] dark:border-[#FFDE00] px-3 py-3 flex flex-col gap-1">
          {/* Toggle de tema */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex cursor-pointer items-center justify-between w-full px-3 py-2 rounded-md text-sm text-slate-600 dark:text-slate-400 hover:bg-[#FFDE00]/10 dark:hover:bg-[#FFDE00]/10 transition-colors"
          >
            <span>{mounted ? (isDark ? "Tema escuro" : "Tema claro") : ""}</span>
            {mounted ? (
              <div className="w-10 h-5 rounded-full bg-[#FFDE00]/30 dark:bg-[#FFDE00]/50 flex items-center px-0.5 transition-colors">
                <div className={`w-4 h-4 rounded-full bg-[#FFDE00] shadow transition-transform ${isDark ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            ) : (
              <div className="w-10 h-5 rounded-full bg-[#FFDE00]/30 dark:bg-[#FFDE00]/50" />
            )}
          </button>

          {/* Perfil + logout */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <AvatarImg size={36} />
            <div className="flex flex-col leading-tight min-w-0 flex-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{apelido}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{ROLE_LABELS[role ?? ""] ?? "Usuário"}</span>
            </div>
            <button
              onClick={() => { setMenuOpen(false); setLogoutModal(true); }}
              className="p-1.5 cursor-pointer rounded-md text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MODAL LOGOUT ── */}
      {logoutModal && (
        <div
          className="fixed rounded-md inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) setLogoutModal(false); }}
        >
          <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl p-6 w-80 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sair da conta</h2>
              <p className="text-base text-slate-500 dark:text-slate-400 text-center">
                Tem certeza que deseja sair?
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 py-2 rounded-md border-2 border-[#252525] dark:border-[#FFFFFF]/50 text-base text-[#252525] dark:text-white hover:bg-[#FFDE00]/10 dark:hover:bg-[#FFDE00]/10 transition-colors"
              >
                Não
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-md bg-[#DD0B0B] text-white text-base font-bold hover:bg-[#AD0000] transition-colors"
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
