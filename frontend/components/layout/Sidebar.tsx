"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Logo from "@/public/logo.svg"
import { Button, Avatar, Tooltip, Separator, Chip, AvatarFallback } from "@heroui/react";
import {
    IconLayoutDashboard,
    IconBell,
    IconCalendarEvent,
    IconUsers,
    IconClipboardList,
    IconSettings,
    IconLogout,
    IconChevronLeft,
    IconChevronRight,
    IconSchool,
    IconSun,
    IconMoon,
} from "@tabler/icons-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    roles?: string[];
    badge?: string | number;
}

const navItems: NavItem[] = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: <IconLayoutDashboard size={20} />,
    },
    {
        label: "Avisos",
        href: "/dashboard/avisos",
        icon: <IconBell size={20} />,
        badge: 3,
    },
    {
        label: "Eventos",
        href: "/dashboard/eventos",
        icon: <IconCalendarEvent size={20} />,
    },
    {
        label: "Usuários",
        href: "/dashboard/usuarios",
        icon: <IconUsers size={20} />,
        roles: ["Administrador", "Colaborador"],
    },
    {
        label: "Auditoria",
        href: "/dashboard/auditoria",
        icon: <IconClipboardList size={20} />,
        roles: ["Administrador"],
    },
    {
        label: "Configurações",
        href: "/dashboard/configuracoes",
        icon: <IconSettings size={20} />,
    },
];

interface SidebarProps {
    userRole?: "Estudante" | "Colaborador" | "Administrador";
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
    onLogout?: () => void;
}

export function Sidebar({
    userRole = "Estudante",
    userName = "Usuário",
    userEmail = "usuario@unip.br",
    userAvatar = "https://avatars.githubusercontent.com/u/55188128?v=4&size=64",
    onLogout,
}: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(true);
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");


    const filteredNavItems = navItems.filter(
        (item) => !item.roles || item.roles.includes(userRole)
    );

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(href);
    };

    return (
        <aside
            className={`
        relative flex flex-col h-screen  border-r border-divider
        transition-all duration-300 ease-in-out shrink-0 bg-surface
        ${collapsed ? "w-[68px]" : "w-[240px]"}
      `}
        >
            {/* Header */}
            <div
                className={`flex items-center h-16 px-4 border-b border-divider gap-3 overflow-hidden`}
            >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0">
                    <Image src={Logo} width={24} height={24} alt="Github" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold truncate text-foreground">
                            AVP Conecta
                        </span>
                        <span className="text-xs text-default-400 truncate">
                            Portal de Informações
                        </span>
                    </div>
                )}
            </div>

            {/* Toggle button */}
            <Button
                isIconOnly
                variant="primary"
                size="sm"
                onPress={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-[45px] z-10 w-8 h-8 min-w-6 border border-divider bg-content1 shadow-sm"
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
                {collapsed ? (
                    <IconChevronRight size={12} />
                ) : (
                    <IconChevronLeft size={12} />
                )}
            </Button>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                {filteredNavItems.map((item) => {
                    const active = isActive(item.href);

                    const linkContent = (
                        <Link
                            href={item.href}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-colors duration-150 cursor-pointer relative group
                ${active
                                    ? "bg-accent text-primary-foreground"
                                    : "text-default-600 hover:bg-default-100 hover:text-foreground"
                                }
                ${collapsed ? "justify-center" : ""}`}
                        >
                            <span className="shrink-0">{item.icon}</span>

                            {!collapsed && (
                                <span className="text-sm font-medium truncate flex-1">
                                    {item.label}
                                </span>
                            )}

                            {collapsed && item.badge && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                            )}
                        </Link>
                    );

                    return collapsed ? (
                        <Tooltip
                            key={item.href}
                            delay={200}
                        >
                            <Tooltip.Trigger>
                                <div>{linkContent}</div>
                            </Tooltip.Trigger>

                            <Tooltip.Content placement="right" showArrow >
                                <p>{item.label}</p>
                            </Tooltip.Content>
                        </Tooltip>
                    ) : (
                        <div key={item.href}>{linkContent}</div>
                    );
                })}
            </nav>
            <Separator />

            {/* Theme toggle */}
            <div className={`px-3 py-2 ${collapsed ? "flex justify-center" : ""}`}>
                {collapsed ? (
                    <Tooltip delay={300}>
                        <Button
                            isIconOnly
                            variant="tertiary"
                            size="md"
                            onPress={toggleTheme}
                            aria-label="Alternar tema"
                        >
                            {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
                        </Button>
                        <Tooltip.Content placement="right">
                            {theme === "dark" ? "Tema claro" : "Tema escuro"}
                        </Tooltip.Content>
                    </Tooltip>
                ) : (
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs text-default-400">
                            {theme === "dark" ? "Tema escuro" : "Tema claro"}
                        </span>
                        <Button
                            isIconOnly
                            variant="tertiary"
                            size="md"
                            onPress={toggleTheme}
                            aria-label="Alternar tema"
                        >
                            {theme === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
                        </Button>
                    </div>
                )}
            </div>


            <Separator />

            {/* User info + logout */}
            <div className={`p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
                {collapsed ? (
                    <>
                        <Tooltip >
                            <Avatar
                                size="sm"
                                color="default"
                                className="cursor-pointer">
                                <Avatar.Image alt={userName} src={userAvatar} />
                                <AvatarFallback>{userName}</AvatarFallback>
                            </Avatar>
                            <Tooltip.Content placement="right">
                                {`${userName} • ${userRole}`}
                            </Tooltip.Content>
                        </Tooltip>
                        <Tooltip delay={300}>
                            <Button
                                isIconOnly
                                variant="danger"
                                size="sm"
                                onPress={onLogout}
                                aria-label="Sair"
                            >
                                <IconLogout size={18} />
                            </Button>
                            <Tooltip.Content placement="right">
                                Sair
                            </Tooltip.Content>
                        </Tooltip>
                    </>
                ) : (
                    <div className="flex items-center gap-3">
                        <Avatar
                            size="sm"
                            color="default"
                            className="shrink-0">
                            <Avatar.Image alt={userName} src={userAvatar} />
                            <AvatarFallback>{userName}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground">
                                {userName}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Chip
                                    size="sm"
                                    variant="soft"
                                    color="default"

                                >
                                    {userRole}
                                </Chip>
                            </div>
                        </div>
                        <Tooltip delay={300}>
                            <Button
                                isIconOnly
                                variant="danger-soft"
                                size="sm"
                                onPress={onLogout}
                                aria-label="Sair"
                            >
                                <IconLogout size={16} />
                            </Button>
                            <Tooltip.Content placement="top" className="mb-2">
                                Sair
                            </Tooltip.Content>
                        </Tooltip>
                    </div>
                )}
            </div>
        </aside>
    );
}