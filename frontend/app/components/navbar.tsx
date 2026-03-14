"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, User } from "lucide-react";

const navItems = [
  { label: "Evento", href: "/home/evento" },
  { label: "Comunicado", href: "/home/comunicado" },
  { label: "Gestão", href: "/home/gestor" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const nome = "Ramon Vaz";
  const initials = nome
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

  const AvatarImg = ({ size }: { size: number }) => (
    <img
      src={`https://ui-avatars.com/api/?name=${initials}&background=0f0f1e&color=fff`}
      alt="Avatar"
      style={{ width: size, height: size }}
      className="rounded-full object-cover border border-slate-200"
    />
  );

  const ProfileDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
      <button
        onClick={() => { setProfileOpen(false); router.push("/home/perfil"); }}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <User className="w-4 h-4 text-slate-400" />
        Perfil
      </button>
      <button
        onClick={() => { setProfileOpen(false); setLogoutModal(true); }}
        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP ── */}
      <header className="hidden md:flex items-center justify-between px-8 py-3 shadow-md bg-white z-30 relative">
        <Link href="/home">
          <Image src="/img/logo_avp.png" alt="AVP Conecta" width={120} height={40} className="object-contain" />
        </Link>

        {/* Nav sempre centralizado */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${pathname === item.href
                ? "font-bold text-slate-900"
                : "text-slate-500 hover:text-slate-900"
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
            <span className="text-sm text-slate-700 truncate min-w-0">Olá, <strong>{nome}</strong></span>
            <AvatarImg size={36} />
          </button>
          {profileOpen && <ProfileDropdown />}
        </div>
      </header>

      {/* ── MOBILE ── */}
      <header className="flex md:hidden items-center justify-between px-4 py-6 shadow-md bg-white z-30 relative">
        <button onClick={() => setMenuOpen(true)}>
          <Menu className="w-6 h-6 text-slate-700" />
        </button>

        {/* Logo sempre centralizada */}
        <Link href="/home" className="absolute left-1/2 -translate-x-1/2">
          <Image src="/img/logo_avp_vertical.png" alt="AVP Conecta" width={40} height={10} className="object-contain" />
        </Link>

        <div className="relative" ref={mobileProfileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 focus:outline-none max-w-[140px]"
          >
            <span className="text-sm text-slate-700 truncate min-w-0">
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
        className={`fixed top-0 left-0 h-full w-64 bg-white z-50 flex flex-col p-6 shadow-xl transition-transform duration-300 md:hidden ${menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <button onClick={() => setMenuOpen(false)} className="self-end mb-4">
          <X className="w-5 h-5 text-slate-600" />
        </button>

        <Image src="/img/logo_avp_vertical.png" alt="AVP Conecta" width={100} height={100} className="object-contain mx-auto mb-6" />

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2 rounded-md text-sm transition-colors ${pathname === item.href
                ? "bg-slate-100 font-bold text-slate-900"
                : "text-slate-600 hover:bg-slate-50"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => { setMenuOpen(false); setLogoutModal(true); }}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors mt-4"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* ── MODAL LOGOUT ── */}
      {logoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setLogoutModal(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-4 w-80 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">

              <h2 className="text-lg font-bold text-slate-900">Sair da conta</h2>
              <p className="text-sm text-slate-500 text-center">
                Tem certeza que deseja sair?
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 py-2 rounded-lg border-2 border-[#8D8D8D] text-sm text-[#252525] hover:bg-[#E2E2E2] transition-colors"
              >
                Não
              </button>
              <button
                onClick={() => { setLogoutModal(false); router.push("/auth/cadastro"); }}
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