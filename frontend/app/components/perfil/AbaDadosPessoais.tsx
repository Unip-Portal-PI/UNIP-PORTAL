"use client";

import { useState } from "react";
import {
  // IconCamera,
  IconCheck,
  IconAlertCircle,
  IconLock,
} from "@tabler/icons-react";
import { Usuario } from "@/src/types/user";
import { PerfilService } from "@/src/service/perfil.service";
import { CURSOS } from "@/src/utils/cursos.helpers";
// import { useFotoPerfil } from "@/src/context/FotoPerfilContext";
import {
  InputCad,
  SelectCad,
  validateSenha,
  validateTelefone,
  validateBlockedTermsField,
  validateEmail,
} from "@/app/components/inputCad";
import { User, AtSign, Phone, Calendar, BookOpen, Lock } from "lucide-react";

interface Props {
  usuario: Usuario;
  matricula: string;
  onAtualizado: () => void;
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
  // const fotoInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState(usuario.nome ?? "");
  const [apelido, setApelido] = useState(usuario.apelido ?? "");
  const [email, setEmail] = useState(usuario.email ?? "");
  const [telefone, setTelefone] = useState(usuario.telefone ?? "");
  const [dataNasc, setDataNasc] = useState(usuario.dataNascimento ?? "");
  const [area, setArea] = useState(usuario.area ?? "");
  // const { atualizarFoto } = useFotoPerfil();
  // const [foto, setFoto] = useState<string | null>(PerfilService.getFoto(matricula));
  // const [fotoTemp, setFotoTemp] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [feedbackDados, setFeedbackDados] = useState<"sucesso" | "erro" | null>(null);
  const [erroGeral, setErroGeral] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [errosSenha, setErrosSenha] = useState<Record<string, string>>({});
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [feedbackSenha, setFeedbackSenha] = useState<"sucesso" | "erro" | null>(null);
  const [erroSenhaGeral, setErroSenhaGeral] = useState("");

  // function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //
  //   const reader = new FileReader();
  //   reader.onload = (ev) => {
  //     const dataURL = ev.target?.result as string;
  //     setFoto(dataURL);
  //     setFotoTemp(dataURL);
  //   };
  //   reader.readAsDataURL(file);
  // }

  function validarDados(): boolean {
    const e: Record<string, string> = {};

    if (!nome.trim()) e.nome = "Nome é obrigatório.";
    else {
      const msg = validateBlockedTermsField("O nome completo", nome);
      if (msg) e.nome = msg;
    }

    if (!apelido.trim()) e.apelido = "Nome Social é obrigatório.";
    else {
      const msg = validateBlockedTermsField("O nome social", apelido);
      if (msg) e.apelido = msg;
    }

    if (!email.trim()) e.email = "E-mail é obrigatório.";
    else {
      const msg = validateEmail(email);
      if (msg) e.email = msg;
    }

    if (telefone.trim()) {
      const msg = validateTelefone(telefone);
      if (msg) e.telefone = msg;
    }

    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSalvarDados() {
    if (!validarDados()) return;

    setSalvando(true);
    setFeedbackDados(null);
    setErroGeral("");

    try {
      await PerfilService.atualizarDados(matricula, {
        nome: nome.trim(),
        apelido: apelido.trim(),
        email: email.trim(),
        telefone,
        dataNascimento: dataNasc,
        area,
      });

      // if (fotoTemp) {
      //   await atualizarFoto(matricula, fotoTemp);
      //   setFotoTemp(null);
      // }

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

    if (!senhaAtual.trim()) e.senhaAtual = "Informe a senha atual.";

    if (!novaSenha.trim()) e.novaSenha = "Informe a nova senha.";
    else {
      const msg = validateSenha(novaSenha);
      if (msg) e.novaSenha = msg;
      else if (novaSenha.length < 6) e.novaSenha = "Mínimo 6 caracteres.";
    }

    if (!confirmarSenha.trim()) e.confirmarSenha = "Confirme a nova senha.";
    else if (novaSenha !== confirmarSenha) e.confirmarSenha = "As senhas não coincidem.";

    setErrosSenha(e);
    return Object.keys(e).length === 0;
  }

  async function handleSalvarSenha() {
    if (!validarSenha()) return;

    setSalvandoSenha(true);
    setFeedbackSenha(null);
    setErroSenhaGeral("");

    try {
      await PerfilService.alterarSenha(
        matricula,
        senhaAtual.trim(),
        novaSenha.trim()
      );
      setFeedbackSenha("sucesso");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setTimeout(() => setFeedbackSenha(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar senha.";
      setErroSenhaGeral(msg);
      setFeedbackSenha("erro");
    } finally {
      setSalvandoSenha(false);
    }
  }

  const inicial = nome.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-6">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100 dark:border-[#2a2a2a]">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 border-2 border-[#FFDE00]/40 flex items-center justify-center overflow-hidden">
              {/* {foto ? (
                <img src={foto} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : ( */}
              <span className="text-3xl font-black text-amber-700 dark:text-[#FFDE00]">
                {inicial}
              </span>
              {/* )} */}
            </div>

            {/* <button
              onClick={() => fotoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FFDE00] hover:bg-[#e6c800] rounded-full flex items-center justify-center shadow transition-colors"
            >
              <IconCamera size={14} className="text-[#252525]" />
            </button>

            <input
              ref={fotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFoto}
            /> */}
          </div>

          <div>
            <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{nome}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{apelido}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{matricula}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Campo label="Nome completo" erro={erros.nome}>
            <InputCad
              id="nome"
              label=""
              type="text"
              placeholder="Nome completo"
              Icon={User}
              defaultValue={nome}
              autoComplete="name"
              validator={(value) => {
                if (!value.trim()) return "";
                return validateBlockedTermsField("O nome completo", value);
              }}
              onValidatedChange={(_, message, value) => {
                setNome(value);
                setErros((p) => ({ ...p, nome: message }));
              }}
            />
          </Campo>

          <Campo label="Nome Social" erro={erros.apelido}>
            <InputCad
              id="apelido"
              label=""
              type="text"
              placeholder="Como prefere ser chamado(a)"
              Icon={User}
              defaultValue={apelido}
              autoComplete="nickname"
              validator={(value) => {
                if (!value.trim()) return "";
                return validateBlockedTermsField("O nome social", value);
              }}
              onValidatedChange={(_, message, value) => {
                setApelido(value);
                setErros((p) => ({ ...p, apelido: message }));
              }}
            />
          </Campo>

          <Campo label="E-mail" erro={erros.email}>
            <InputCad
              id="email"
              label=""
              type="email"
              placeholder="email@exemplo.com"
              Icon={AtSign}
              defaultValue={email}
              autoComplete="email"
              validator={(value) => {
                if (!value.trim()) return "";
                return validateEmail(value);
              }}
              onValidatedChange={(_, message, value) => {
                setEmail(value);
                setErros((p) => ({ ...p, email: message }));
              }}
            />
          </Campo>

          <Campo label="Telefone" erro={erros.telefone}>
            <InputCad
              id="telefone"
              label=""
              type="tel"
              placeholder="(86) 99999-9999"
              Icon={Phone}
              defaultValue={telefone}
              autoComplete="tel"
              validator={(value) => {
                if (!value.trim()) return "";
                return validateTelefone(value);
              }}
              onValidatedChange={(_, message, value) => {
                setTelefone(value);
                setErros((p) => ({ ...p, telefone: message }));
              }}
            />
          </Campo>

          <Campo label="Data de nascimento">
            <div className="relative">
              <InputCad
                id="data_nasc"
                label=""
                type="date"
                placeholder=""
                Icon={Calendar}
                defaultValue={dataNasc}
                autoComplete="bday"
                onValidatedChange={(_, __, value) => {
                  setDataNasc(value);
                }}
              />
            </div>
          </Campo>

          <Campo label="Área / Curso">
            <SelectCad
              id="area"
              label=""
              placeholder="Selecione sua Área"
              options={CURSOS.filter((c) => c !== "Todos")}
              Icon={BookOpen}
              erro={false}
              value={area}
              onChange={setArea}
            />
          </Campo>
        </div>

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

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSalvarDados}
            disabled={salvando}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#FFDE00] hover:bg-[#e6c800] disabled:opacity-60 text-[#252525] text-sm font-bold rounded-xl transition-colors"
          >
            {salvando ? "Salvando..." : (
              <>
                <IconCheck size={16} /> Salvar alterações
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-6">
        <div className="flex items-center gap-2 mb-5">
          <IconLock size={18} className="text-slate-500 dark:text-slate-400" />
          <h3 className="font-bold text-slate-900 dark:text-white">Alterar senha</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Campo label="Senha atual" erro={errosSenha.senhaAtual}>
            <InputCad
              id="senha_atual"
              label=""
              type="password"
              placeholder="••••••••"
              Icon={Lock}
              defaultValue={senhaAtual}
              autoComplete="current-password"
              validator={(value) => {
                if (!value.trim()) return "";
                return validateSenha(value);
              }}
              onValidatedChange={(_, message, value) => {
                setSenhaAtual(value);
                setErrosSenha((p) => ({ ...p, senhaAtual: message }));
              }}
            />
          </Campo>

          <Campo label="Nova senha" erro={errosSenha.novaSenha}>
            <InputCad
              id="senha"
              label=""
              type="password"
              placeholder="••••••••"
              Icon={Lock}
              defaultValue={novaSenha}
              autoComplete="new-password"
              validator={(value) => {
                if (!value.trim()) return "";
                const msg = validateSenha(value);
                if (msg) return msg;
                if (value.length < 6) return "Mínimo 6 caracteres.";
                return "";
              }}
              onValidatedChange={(_, message, value) => {
                setNovaSenha(value);
                setErrosSenha((p) => ({ ...p, novaSenha: message }));
              }}
            />
          </Campo>

          <Campo label="Confirmar nova senha" erro={errosSenha.confirmarSenha}>
            <InputCad
              id="confirmar"
              label=""
              type="password"
              placeholder="••••••••"
              Icon={Lock}
              defaultValue={confirmarSenha}
              autoComplete="new-password"
              validator={(value) => {
                if (!value.trim()) return "";
                if (novaSenha && value !== novaSenha) return "As senhas não coincidem.";
                return "";
              }}
              onValidatedChange={(_, message, value) => {
                setConfirmarSenha(value);
                setErrosSenha((p) => ({ ...p, confirmarSenha: message }));
              }}
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
              <>
                <IconLock size={15} /> Alterar senha
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}