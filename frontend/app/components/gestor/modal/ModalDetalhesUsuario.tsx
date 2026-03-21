// app/components/gestor/usuarios/modal/ModalDetalhesUsuario.tsx
"use client";

import {
  IconX,
  IconEdit,
  IconUser,
  IconMail,
  IconId,
  IconBook,
  IconShield,
  IconCalendar,
  IconUserCheck,
} from "@tabler/icons-react";
import { UsuarioGestor, PERMISSION_LABEL, PERMISSION_COR } from "@/src/types/usuarioGestor";
import { BadgeUsuario } from "./BadgeUsuario";

interface ModalDetalhesUsuarioProps {
  usuario: UsuarioGestor | null;
  onFechar: () => void;
  onEditar: (u: UsuarioGestor) => void;
}

interface LinhaProps {
  icone: React.ReactNode;
  label: string;
  valor: string;
}

function Linha({ icone, label, valor }: LinhaProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-[#2a2a2a] last:border-0">
      <span className="text-slate-400 mt-0.5 shrink-0">{icone}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5 break-all">{valor}</p>
      </div>
    </div>
  );
}

export function ModalDetalhesUsuario({
  usuario,
  onFechar,
  onEditar,
}: ModalDetalhesUsuarioProps) {
  if (!usuario) return null;

  const statusCor = usuario.deletedAt ? "red" : usuario.ativo ? "green" : "gray";
  const statusLabel = usuario.deletedAt ? "Excluído" : usuario.ativo ? "Ativo" : "Inativo";
  const inicial = usuario.nome.charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div className="bg-white dark:bg-[#202020] rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#303030] shrink-0">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg">Detalhes do usuário</h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Avatar e nome */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 border-2 border-[#FFDE00]/40 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-amber-700 dark:text-[#FFDE00]">{inicial}</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-base">{usuario.nome}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{usuario.apelido}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <BadgeUsuario label={PERMISSION_LABEL[usuario.permission]} cor={PERMISSION_COR[usuario.permission]} />
                <BadgeUsuario label={statusLabel} cor={statusCor} />
              </div>
            </div>
          </div>

          {/* Dados cadastrais */}
          <div className="bg-slate-50 dark:bg-[#2a2a2a] rounded-xl px-4 py-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-3 pb-1">
              Dados cadastrais
            </p>
            <Linha icone={<IconUser size={15} />} label="Nome completo" valor={usuario.nome} />
            <Linha icone={<IconMail size={15} />} label="E-mail" valor={usuario.email} />
            <Linha icone={<IconId size={15} />} label="Matrícula" valor={usuario.matricula} />
            <Linha icone={<IconBook size={15} />} label="Área / Curso" valor={usuario.area} />
            <Linha icone={<IconShield size={15} />} label="Perfil" valor={PERMISSION_LABEL[usuario.permission]} />
          </div>

          {/* Auditoria */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl px-4 py-1 border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs font-bold text-blue-400 dark:text-blue-500 uppercase tracking-widest pt-3 pb-1">
              Auditoria
            </p>
            <Linha
              icone={<IconCalendar size={15} />}
              label="Criado em"
              valor={new Date(usuario.criadoEm).toLocaleString("pt-BR")}
            />
            <Linha icone={<IconUserCheck size={15} />} label="Criado por" valor={usuario.criadoPor} />
            <Linha
              icone={<IconCalendar size={15} />}
              label="Atualizado em"
              valor={new Date(usuario.atualizadoEm).toLocaleString("pt-BR")}
            />
            {usuario.deletedAt && (
              <Linha
                icone={<IconCalendar size={15} />}
                label="Excluído em"
                valor={new Date(usuario.deletedAt).toLocaleString("pt-BR")}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-[#303030] shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-[#404040] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            Fechar
          </button>
          {!usuario.deletedAt && (
            <button
              onClick={() => { onFechar(); onEditar(usuario); }}
              className="flex-1 py-3 rounded-xl bg-[#FFDE00] hover:bg-[#e6c800] text-[#252525] text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <IconEdit size={15} />
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
