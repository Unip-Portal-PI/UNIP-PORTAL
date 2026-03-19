// src/service/comunicado.service.ts
"use client";

import { Comunicado, ComunicadoAnexo } from "@/src/types/comunicado";

// ── Mock local ──────────────────────────────────────────────────────────────
const MOCK: Comunicado[] = [
  {
    id: "1",
    titulo: "Reunião Geral — Resultados Q1",
    assunto: "Institucional",
    conteudo: `<p>Prezados colaboradores,</p><p>Informamos que a <strong>Reunião Geral de Resultados do 1º trimestre</strong> acontecerá na próxima sexta-feira, às 14h, no Auditório Principal.</p><p>A presença é obrigatória para todos os colaboradores e gestores. Em caso de impossibilidade, favor comunicar sua liderança com antecedência.</p><p>A pauta inclui: apresentação dos resultados financeiros, metas para o próximo trimestre e reconhecimento dos destaques do período.</p>`,
    resumo: "Reunião obrigatória na sexta-feira às 14h no Auditório Principal para apresentação dos resultados do Q1.",
    banner: "",
    visibilidade: ["Todos"],
    anexos: [{ id: "a1", nome: "pauta-reuniao-q1.pdf", url: "#", tipo: "pdf", tamanhoMB: 0.8 }],
    dataValidade: "2026-12-31",
    criadoEm: "2026-03-15T10:00:00",
    criadoPor: "COL001",
    criadoPorNome: "Maria Silva",
  },
  {
    id: "2",
    titulo: "Atualização da Política de Home Office",
    assunto: "RH",
    conteudo: `<p>A partir de <strong>1º de abril</strong>, a política de home office será atualizada conforme as novas diretrizes aprovadas pelo Conselho.</p><ul><li>Até 2 dias de home office por semana para cargos elegíveis</li><li>Necessidade de VPN ativa durante o expediente remoto</li><li>Check-in obrigatório às 9h pelo sistema de ponto</li></ul><p>Para mais detalhes, consulte o documento em anexo ou entre em contato com o RH.</p>`,
    resumo: "Nova política de home office entra em vigor em 1º de abril. Confira as novas regras e critérios de elegibilidade.",
    banner: "",
    visibilidade: ["Todos"],
    anexos: [{ id: "a2", nome: "politica-home-office-2026.pdf", url: "#", tipo: "pdf", tamanhoMB: 1.2 }],
    dataValidade: "2026-06-30",
    criadoEm: "2026-03-10T14:30:00",
    criadoPor: "COL002",
    criadoPorNome: "João Oliveira",
  },
  {
    id: "3",
    titulo: "Treinamento Obrigatório: LGPD na Prática",
    assunto: "Treinamento",
    conteudo: `<p>Todos os colaboradores devem concluir o treinamento obrigatório sobre <strong>LGPD na Prática</strong> até o dia 30 de março.</p><p>O treinamento está disponível na plataforma EAD e tem duração aproximada de 2 horas. Ao finalizar, emita seu certificado de conclusão e envie para o RH pelo e-mail rh@avp.com.br.</p>`,
    resumo: "Treinamento LGPD na Prática com prazo até 30 de março. Acesse pela plataforma EAD e emita seu certificado.",
    banner: "",
    visibilidade: ["Todos"],
    anexos: [],
    dataValidade: "2026-03-30",
    criadoEm: "2026-03-05T09:00:00",
    criadoPor: "COL001",
    criadoPorNome: "Maria Silva",
  },
  {
    id: "4",
    titulo: "Novo Sistema de Agendamento — ADS",
    assunto: "Tecnologia",
    conteudo: `<p>O novo sistema de agendamento de salas foi implementado para o curso de <strong>Análise e Desenvolvimento de Sistemas</strong>.</p><p>Acesse pelo link disponível na intranet e realize suas reservas com até 7 dias de antecedência. Dúvidas, entre em contato com o suporte técnico.</p>`,
    resumo: "Sistema de agendamento de salas disponível para ADS. Acesse pela intranet e faça suas reservas.",
    banner: "",
    visibilidade: ["Análise e Desenvolvimento de Sistemas"],
    anexos: [{ id: "a3", nome: "manual-agendamento.pdf", url: "#", tipo: "pdf", tamanhoMB: 0.5 }],
    dataValidade: "2026-12-31",
    criadoEm: "2026-03-18T16:00:00",
    criadoPor: "COL003",
    criadoPorNome: "Carlos Mendes",
  },
];

// Controle de "lidos" (simulado em memória)
const lidos = new Set<string>();

export const ComunicadoService = {
  getAll(): Promise<Comunicado[]> {
    return new Promise((resolve) => setTimeout(() => resolve([...MOCK]), 400));
  },

  getById(id: string): Promise<Comunicado | null> {
    return new Promise((resolve) =>
      setTimeout(() => resolve(MOCK.find((c) => c.id === id) ?? null), 200)
    );
  },

  isLido(id: string): boolean {
    return lidos.has(id);
  },

  marcarLido(id: string): void {
    lidos.add(id);
  },

  async criar(
    dados: Omit<Comunicado, "id" | "criadoEm">
  ): Promise<Comunicado> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const novo: Comunicado = {
          ...dados,
          id: String(Date.now()),
          criadoEm: new Date().toISOString(),
        };
        MOCK.unshift(novo);
        resolve(novo);
      }, 500);
    });
  },

  async editar(
    id: string,
    dados: Partial<Omit<Comunicado, "id" | "criadoEm">>
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = MOCK.findIndex((c) => c.id === id);
        if (idx !== -1) Object.assign(MOCK[idx], dados);
        resolve();
      }, 400);
    });
  },

  async excluir(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = MOCK.findIndex((c) => c.id === id);
        if (idx !== -1) MOCK.splice(idx, 1);
        resolve();
      }, 400);
    });
  },
};
