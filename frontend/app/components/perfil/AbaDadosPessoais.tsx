"use client";

import { useState } from "react";
import {
  IconCheck,
  IconAlertCircle,
  IconLock,
  IconRotate,
} from "@tabler/icons-react";
import { Usuario } from "@/src/types/user";
import { PerfilService } from "@/src/service/perfil.service";
import { CURSOS } from "@/src/utils/cursos.helpers";
import {
  InputCad,
  SelectCad,
  validateSenha,
  validateTelefone,
  validateBlockedTermsField,
  validateEmail,
} from "@/app/components/inputCad";
import { User, AtSign, Phone, Calendar, BookOpen, Lock } from "lucide-react";
import { ModalFeedbackPerfil } from "@/app/components/perfil/ModalFeedbackPerfil";

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

// ─── Campo wrapper ─────────────────────────────────────────────────────────────
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

// ─── Componente principal ──────────────────────────────────────────────────────
export function AbaDadosPessoais({ usuario, matricula, onAtualizado }: Props) {
  // ── Estado dos dados pessoais ──
  const [nome, setNome] = useState(usuario.nome ?? "");
  const [apelido, setApelido] = useState(usuario.apelido ?? "");
  const [email, setEmail] = useState(usuario.email ?? "");
  const [telefone, setTelefone] = useState(usuario.telefone ?? "");
  const [dataNasc, setDataNasc] = useState(usuario.dataNascimento ?? "");
  const [area, setArea] = useState(usuario.area ?? "");

  // ── Snapshot dos valores salvos (para desfazer) ──
  const [savedSnapshot, setSavedSnapshot] = useState({
    nome: usuario.nome ?? "",
    apelido: usuario.apelido ?? "",
    email: usuario.email ?? "",
    telefone: usuario.telefone ?? "",
    dataNasc: usuario.dataNascimento ?? "",
    area: usuario.area ?? "",
  });

  // ── Chave de reset dos inputs (força remontagem ao desfazer) ──
  const [resetKeyDados, setResetKeyDados] = useState(0);
  const [resetKeySenha, setResetKeySenha] = useState(0);

  // ── Detecta se há alteração nos dados pessoais ──
  const temAlteracaoDados =
    nome !== savedSnapshot.nome ||
    apelido !== savedSnapshot.apelido ||
    email !== savedSnapshot.email ||
    telefone !== savedSnapshot.telefone ||
    dataNasc !== savedSnapshot.dataNasc ||
    area !== savedSnapshot.area;

  // ── Estado da senha ──
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const temAlteracaoSenha =
    senhaAtual.trim() !== "" ||
    novaSenha.trim() !== "" ||
    confirmarSenha.trim() !== "";

  // ── Modal ──
  const [modal, setModal] = useState<{
    visivel: boolean;
    tipo: "sucesso" | "erro";
    mensagem: string;
    refreshAoFechar?: boolean;
  }>({ visivel: false, tipo: "sucesso", mensagem: "" });

  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  // ── Validação dados ──
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

  // ── Salvar dados ──
  async function handleSalvarDados() {
    if (!validarDados()) return;

    setSalvando(true);

    try {
      await PerfilService.atualizarDados(matricula, {
        nome: nome.trim(),
        apelido: apelido.trim(),
        email: email.trim(),
        telefone,
        dataNascimento: dataNasc,
        area,
      });

      // Atualiza snapshot após salvar com sucesso
      setSavedSnapshot({ nome, apelido, email, telefone, dataNasc, area });

      setModal({
        visivel: true,
        tipo: "sucesso",
        mensagem: "Seus dados foram atualizados com sucesso!",
        refreshAoFechar: true,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar os dados.";
      setModal({ visivel: true, tipo: "erro", mensagem: msg });
    } finally {
      setSalvando(false);
    }
  }

  // ── Desfazer dados ──
  function handleDesfazerDados() {
    setNome(savedSnapshot.nome);
    setApelido(savedSnapshot.apelido);
    setEmail(savedSnapshot.email);
    setTelefone(savedSnapshot.telefone);
    setDataNasc(savedSnapshot.dataNasc);
    setArea(savedSnapshot.area);
    setErros({});
    setResetKeyDados((k) => k + 1);
  }

  // ── Desfazer senha ──
  function handleDesfazerSenha() {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setResetKeySenha((k) => k + 1);
  }

  // ── Validação senha ──
  function validarSenha(): string | null {
    if (!senhaAtual.trim()) return "Informe a senha atual.";
    if (!novaSenha.trim()) return "Informe a nova senha.";
    if (novaSenha.length < 6) return "A nova senha deve ter pelo menos 6 caracteres.";
    const msgSenha = validateSenha(novaSenha);
    if (msgSenha) return msgSenha;
    if (!confirmarSenha.trim()) return "Confirme a nova senha.";
    if (novaSenha !== confirmarSenha) return "As senhas não coincidem.";
    return null;
  }

  // ── Salvar senha ──
  async function handleSalvarSenha() {
    const erroValidacao = validarSenha();
    if (erroValidacao) {
      setModal({ visivel: true, tipo: "erro", mensagem: erroValidacao });
      return;
    }

    setSalvandoSenha(true);

    try {
      await PerfilService.alterarSenha(matricula, senhaAtual.trim(), novaSenha.trim());

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");

      setModal({
        visivel: true,
        tipo: "sucesso",
        mensagem: "Sua senha foi alterada com sucesso!",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar senha.";
      setModal({ visivel: true, tipo: "erro", mensagem: msg });
    } finally {
      setSalvandoSenha(false);
    }
  }

  const inicial = nome.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      {/* ── Modal de feedback ── */}
      {modal.visivel && (
        <ModalFeedbackPerfil
          tipo={modal.tipo}
          titulo={modal.tipo === "sucesso" ? "Tudo certo!" : "Algo deu errado"}
          mensagem={modal.mensagem}
          onFechar={() => {
            const shouldRefresh = modal.refreshAoFechar;
            setModal((m) => ({ ...m, visivel: false, refreshAoFechar: false }));
            if (shouldRefresh) onAtualizado();
          }}
        />
      )}

      <div className="space-y-6">
        {/* ── Card dados pessoais ── */}
        <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-6">
          {/* Avatar + nome */}
          <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100 dark:border-[#2a2a2a]">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-[#FFDE00]/20 dark:bg-[#FFDE00]/10 border-2 border-[#FFDE00]/40 flex items-center justify-center overflow-hidden">
                <span className="text-3xl font-black text-amber-700 dark:text-[#FFDE00]">
                  {inicial}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <p
                title={nome}
                className="font-bold text-slate-900 dark:text-white text-lg leading-tight truncate max-w-[550px]"
              >
                {nome}
              </p>
              <p
                title={`@${apelido}`}
                className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[220px]"
              >
                @{apelido}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{matricula}</p>
            </div>
          </div>

          {/* Campos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Nome completo" erro={erros.nome}>
              <InputCad
                key={`nome-${resetKeyDados}`}
                id="nome"
                label=""
                type="text"
                placeholder="Nome completo"
                Icon={User}
                defaultValue={nome}
                validator={(v) =>
                  !v.trim() ? "Nome é obrigatório." : validateBlockedTermsField("O nome completo", v)
                }
                onValidatedChange={(_, __, value) => setNome(value)}
              />
            </Campo>

            <Campo label="Nome Social" erro={erros.apelido}>
              <InputCad
                key={`apelido-${resetKeyDados}`}
                id="apelido"
                label=""
                type="text"
                placeholder="Nome social"
                Icon={User}
                defaultValue={apelido}
                validator={(v) =>
                  !v.trim() ? "Nome social é obrigatório." : validateBlockedTermsField("O nome social", v)
                }
                onValidatedChange={(_, __, value) => setApelido(value)}
              />
            </Campo>

            <Campo label="E-mail" erro={erros.email}>
              <InputCad
                key={`email-${resetKeyDados}`}
                id="email"
                label=""
                type="email"
                placeholder="email@exemplo.com"
                Icon={AtSign}
                defaultValue={email}
                validator={(v) =>
                  !v.trim() ? "E-mail é obrigatório." : validateEmail(v)
                }
                onValidatedChange={(_, __, value) => setEmail(value)}
              />
            </Campo>

            <Campo label="Telefone" erro={erros.telefone}>
              <InputCad
                key={`telefone-${resetKeyDados}`}
                id="telefone"
                label=""
                type="tel"
                placeholder="(86) 99999-9999"
                Icon={Phone}
                defaultValue={telefone}
                validator={validateTelefone}
                onValidatedChange={(_, __, value) => setTelefone(value)}
              />
            </Campo>

            <Campo label="Data de nascimento">
              <InputCad
                key={`dataNasc-${resetKeyDados}`}
                id="data_nasc"
                placeholder="dd/mm/aaaa"
                label=""
                type="date"
                Icon={Calendar}
                defaultValue={dataNasc}
                onValidatedChange={(_, __, value) => setDataNasc(value)}
              />
            </Campo>

            <Campo label="Área / Curso">
              <SelectCad
                key={`area-${resetKeyDados}`}
                id="area"
                label=""
                placeholder="Selecione"
                options={CURSOS.filter((c) => c !== "Todos")}
                Icon={BookOpen}
                value={area}
                onChange={setArea}
              />
            </Campo>
          </div>

          {/* Botões */}
          <div className="mt-5 flex items-center justify-end gap-3">
            {/* Botão desfazer — só aparece se houver alteração */}
            {temAlteracaoDados && (
              <button
                onClick={handleDesfazerDados}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333] text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors"
              >
                <IconRotate size={15} />
                Desfazer
              </button>
            )}

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

        {/* ── Card alterar senha ── */}
        <div className="bg-white dark:bg-[#202020] rounded-2xl border border-slate-100 dark:border-[#303030] p-6">
          <div className="flex items-center gap-2 mb-5">
            <IconLock size={18} className="text-slate-500 dark:text-slate-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">Alterar senha</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Campo label="Senha atual">
              <InputCad
                key={`senhaAtual-${resetKeySenha}`}
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
                onValidatedChange={(_, __, value) => {
                  setSenhaAtual(value);
                }}
              />
            </Campo>

            <Campo label="Nova senha">
              <InputCad
                key={`novaSenha-${resetKeySenha}`}
                id="senha"
                label=""
                type="password"
                placeholder="••••••••"
                Icon={Lock}
                defaultValue={novaSenha}
                autoComplete="new-password"
                validator={(value) => {
                  if (!value.trim()) return "";
                  return validateSenha(value);
                }}
                onValidatedChange={(_, __, value) => {
                  setNovaSenha(value);
                }}
              />
            </Campo>

            <Campo label="Confirmar nova senha">
              <InputCad
                key={`confirmarSenha-${resetKeySenha}`}
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
                onValidatedChange={(_, __, value) => {
                  setConfirmarSenha(value);
                }}
              />
            </Campo>
          </div>

          {/* Botões senha */}
          <div className="mt-5 flex items-center justify-end gap-3">
            {/* Botão desfazer senha — só aparece se houver alteração */}
            {temAlteracaoSenha && (
              <button
                onClick={handleDesfazerSenha}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#2a2a2a] dark:hover:bg-[#333] text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors"
              >
                <IconRotate size={15} />
                Desfazer
              </button>
            )}

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
    </>
  );
}