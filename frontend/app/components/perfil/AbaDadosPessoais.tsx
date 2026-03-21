// app/components/perfil/AbaDadosPessoais.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconBook,
  IconCamera,
  IconCheck,
  IconAlertCircle,
  IconLock,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { Usuario } from "@/src/types/user";
import { PerfilService } from "@/src/service/perfil.service";
import { CURSOS } from "@/src/utils/cursos.helpers";
import { useFotoPerfil } from "@/src/context/FotoPerfilContext";

interface Props {
  usuario: Usuario;
  matricula: string;
  onAtualizado: () => void;
}

const inputCls =
  "w-full px-3 py-2.5 border rounded-xl text-sm bg-slate-50 dark:bg-[#2a2a2a] text-slate-800 dark:text-slate-200 focus:outline-none transition-colors";

function borda(erro?: string) {
  return erro
    ? "border-red-400 dark:border-red-600"
    : "border-slate-200 dark:border-[#404040] focus:border-[#FFDE00]";
}

interface CampoProps {
  label: string;
  erro?: string;
  children: React.ReactNode;
}

function Campo({ label, erro, children }: CampoProps) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      {children}
      {erro && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <IconAlertCircle size={12} /> {erro}
        </p>
      )}
    </div>
  );
}

export function AbaDadosPessoais({ usuario, matricula, onAtualizado }: Props) {
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Formulário de dados
  const [nome, setNome] = useState(usuario.nome);
  const [apelido, setApelido] = useState(usuario.apelido);
  const [email, setEmail] = useState(usuario.email);
  const [telefone, setTelefone] = useState(usuario.telefone);
  const [dataNasc, setDataNasc] = useState(usuario.dataNascimento);
  const [area, setArea] = useState(usuario.area);
  const { atualizarFoto } = useFotoPerfil();
  const [foto, setFoto] = useState<string | null>(PerfilService.getFoto(matricula));
  const [fotoTemp, setFotoTemp] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [feedbackDados, setFeedbackDados] = useState<"sucesso" | "erro" | null>(null);
  const [erroGeral, setErroGeral] = useState("");

  // Formulário de senha
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [errosSenha, setErrosSenha] = useState<Record<string, string>>({});
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [feedbackSenha, setFeedbackSenha] = useState<"sucesso" | "erro" | null>(null);
  const [erroSenhaGeral, setErroSenhaGeral] = useState("");

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataURL = ev.target?.result as string;
      setFoto(dataURL);       // atualiza preview na tela
      setFotoTemp(dataURL);   // guarda para salvar depois
    };
    reader.readAsDataURL(file);
  }

  function validarDados(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Nome é obrigatório.";
    if (!apelido.trim()) e.apelido = "Apelido é obrigatório.";
    if (!email.trim()) e.email = "E-mail é obrigatório.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "E-mail inválido.";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSalvarDados() {
    if (!validarDados()) return;
    setSalvando(true);
    setFeedbackDados(null);
    setErroGeral("");
    try {
      await PerfilService.atualizarDados(matricula, { nome, apelido, email, telefone, dataNascimento: dataNasc, area });

      // Só propaga a foto para a navbar APÓS salvar com sucesso
      if (fotoTemp) {
        atualizarFoto(matricula, fotoTemp);
        setFotoTemp(null);
      }

      setFeedbackDados("sucesso");
      onAtualizado();
      setTimeout(() => setFeedbackDados(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar.";
      setErroGeral(msg);
      setFeedbackDados("erro");
    } finally {
      setSalvando(false);
    }
  }

  function validarSenha(): boolean {
    const e: Record<string, string> = {};
    if (!senhaAtual) e.senhaAtual = "Informe a senha atual.";
    if (!novaSenha) e.novaSenha = "Informe a nova senha.";
    else if (novaSenha.length < 6) e.novaSenha = "Mínimo 6 caracteres.";
    if (novaSenha !== confirmarSenha) e.confirmarSenha = "As senhas não coincidem.";
    setErrosSenha(e);
    return Object.keys(e).length === 0;
  }

  async function handleSalvarSenha() {
    if (!validarSenha()) return;
    setSalvandoSenha(true);
    setFeedbackSenha(null);
    setErroSenhaGeral("");
    try {
      await PerfilService.alterarSenha(matricula, senhaAtual, novaSenha);
      setFeedbackSenha("sucesso");
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      setTimeout(() => setFeedbackSenha(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar senha.";
      setErroSenhaGeral(msg);
      setFeedbackSenha("erro");
    } finally {
      setSalvandoSenha(false);
    }
  }

  const inicial = nome.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">

      {/* Card: foto + dados pessoais */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-6">

        {/* Foto de perfil */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100 dark:border-[#2a2a2a]">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 border-2 border-[#FFDE00]/40 flex items-center justify-center overflow-hidden">
              {foto ? (
                <img src={foto} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-amber-700 dark:text-[#FFDE00]">{inicial}</span>
              )}
            </div>
            <button
              onClick={() => fotoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FFDE00] hover:bg-[#e6c800] rounded-full flex items-center justify-center shadow transition-colors"
            >
              <IconCamera size={14} className="text-[#252525]" />
            </button>
            <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{nome}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{apelido}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{matricula}</p>
          </div>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <Campo label="Nome completo" erro={erros.nome}>
            <div className="relative">
              <IconUser size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text" value={nome} onChange={(e) => { setNome(e.target.value); setErros((p) => ({ ...p, nome: "" })); }}
                className={`${inputCls} pl-8 ${borda(erros.nome)}`}
                placeholder="Nome completo"
              />
            </div>
          </Campo>

          <Campo label="Apelido" erro={erros.apelido}>
            <input
              type="text" value={apelido} onChange={(e) => { setApelido(e.target.value); setErros((p) => ({ ...p, apelido: "" })); }}
              className={`${inputCls} ${borda(erros.apelido)}`}
              placeholder="Como prefere ser chamado(a)"
            />
          </Campo>

          <Campo label="E-mail" erro={erros.email}>
            <div className="relative">
              <IconMail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErros((p) => ({ ...p, email: "" })); }}
                className={`${inputCls} pl-8 ${borda(erros.email)}`}
                placeholder="email@exemplo.com"
              />
            </div>
          </Campo>

          <Campo label="Telefone">
            <div className="relative">
              <IconPhone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)}
                className={`${inputCls} pl-8 ${borda()}`}
                placeholder="(86) 99999-9999"
              />
            </div>
          </Campo>

          <Campo label="Data de nascimento">
            <div className="relative">
              <IconCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)}
                className={`${inputCls} pl-8 ${borda()}`}
              />
            </div>
          </Campo>

          <Campo label="Área / Curso">
            <div className="relative">
              <IconBook size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={area} onChange={(e) => setArea(e.target.value)}
                className={`${inputCls} pl-8 ${borda()} appearance-none`}
              >
                {CURSOS.filter((c) => c !== "Todos").map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </Campo>
        </div>

        {/* Feedback geral */}
        {feedbackDados === "erro" && erroGeral && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
            <IconAlertCircle size={16} /> {erroGeral}
          </div>
        )}
        {feedbackDados === "sucesso" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded-xl">
            <IconCheck size={16} /> Dados atualizados com sucesso!
          </div>
        )}

        {/* Botão salvar */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSalvarDados}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FFDE00] hover:bg-[#e6c800] disabled:opacity-60 text-[#252525] text-sm font-bold rounded-xl transition-colors"
          >
            {salvando ? "Salvando..." : (
              <><IconCheck size={16} /> Salvar alterações</>
            )}
          </button>
        </div>
      </div>

      {/* Card: alterar senha */}
      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-6">
        <div className="flex items-center gap-2 mb-5">
          <IconLock size={18} className="text-slate-500 dark:text-slate-400" />
          <h3 className="font-bold text-slate-900 dark:text-white">Alterar senha</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Campo label="Senha atual" erro={errosSenha.senhaAtual}>
            <div className="relative">
              <input
                type={mostrarSenhas ? "text" : "password"}
                value={senhaAtual}
                onChange={(e) => { setSenhaAtual(e.target.value); setErrosSenha((p) => ({ ...p, senhaAtual: "" })); }}
                className={`${inputCls} pr-9 ${borda(errosSenha.senhaAtual)}`}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setMostrarSenhas((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {mostrarSenhas ? <IconEyeOff size={15} /> : <IconEye size={15} />}
              </button>
            </div>
          </Campo>

          <Campo label="Nova senha" erro={errosSenha.novaSenha}>
            <input
              type={mostrarSenhas ? "text" : "password"}
              value={novaSenha}
              onChange={(e) => { setNovaSenha(e.target.value); setErrosSenha((p) => ({ ...p, novaSenha: "" })); }}
              className={`${inputCls} ${borda(errosSenha.novaSenha)}`}
              placeholder="••••••••"
            />
          </Campo>

          <Campo label="Confirmar nova senha" erro={errosSenha.confirmarSenha}>
            <input
              type={mostrarSenhas ? "text" : "password"}
              value={confirmarSenha}
              onChange={(e) => { setConfirmarSenha(e.target.value); setErrosSenha((p) => ({ ...p, confirmarSenha: "" })); }}
              className={`${inputCls} ${borda(errosSenha.confirmarSenha)}`}
              placeholder="••••••••"
            />
          </Campo>
        </div>

        {feedbackSenha === "erro" && erroSenhaGeral && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
            <IconAlertCircle size={16} /> {erroSenhaGeral}
          </div>
        )}
        {feedbackSenha === "sucesso" && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 rounded-xl">
            <IconCheck size={16} /> Senha alterada com sucesso!
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSalvarSenha}
            disabled={salvandoSenha}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
          >
            {salvandoSenha ? "Alterando..." : (
              <><IconLock size={15} /> Alterar senha</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
