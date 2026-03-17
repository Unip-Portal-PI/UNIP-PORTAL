// app/services/eventoService.ts

import { Evento, Inscricao, UserProfile, UserRole } from "@/src/types/evento";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const MOCK_EVENTOS: Evento[] = [
  {
    id: "1",
    banner: "https://picsum.photos/seed/evt1/800/400",
    nome: "Semana de Tecnologia 2025",
    descricaoBreve: "Palestras, workshops e hackathon sobre as últimas tendências em TI.",
    descricaoCompleta:
      "A Semana de Tecnologia 2025 reúne profissionais e estudantes para três dias de imersão em tecnologia. O evento inclui palestras sobre IA, cibersegurança, desenvolvimento mobile e muito mais. Haverá também um hackathon com premiação para as melhores soluções.",
    curso: "Tecnologia da Informação",
    data: "2025-08-15",
    horario: "08:00",
    turno: "Manhã",
    local: "Auditório Principal – Bloco A",
    dataLimiteInscricao: "2025-08-10",
    vagas: 120,
    vagasOcupadas: 110,
    tipoInscricao: "interna",
    visibilidade: "publica",
    anexos: [
      { id: "a1", nome: "Programação completa.pdf", url: "#" },
      { id: "a2", nome: "Regulamento hackathon.pdf", url: "#" },
    ],
    criadoEm: "2025-07-01",
  },
  {
    id: "2",
    banner: "https://picsum.photos/seed/evt2/800/400",
    nome: "Workshop de Design UX/UI",
    descricaoBreve: "Aprenda os fundamentos de design de interfaces com especialistas do mercado.",
    descricaoCompleta:
      "Workshop intensivo de 8 horas focado nos princípios de UX Research, prototipação no Figma e Design System. Ideal para estudantes de TI, Design e áreas correlatas. Vagas limitadas para garantir qualidade no aprendizado.",
    curso: "Design",
    data: "2025-08-22",
    horario: "14:00",
    turno: "Tarde",
    local: "Laboratório de Informática 3 – Bloco C",
    dataLimiteInscricao: "2025-08-18",
    vagas: 30,
    vagasOcupadas: 30,
    tipoInscricao: "interna",
    visibilidade: "publica",
    anexos: [],
    criadoEm: "2025-07-10",
  },
  {
    id: "3",
    banner: "https://picsum.photos/seed/evt3/800/400",
    nome: "Palestra: Mercado Financeiro e Investimentos",
    descricaoBreve: "Entenda como funciona o mercado financeiro e como começar a investir.",
    descricaoCompleta:
      "Palestra com convidado especialista do setor financeiro abordando conceitos básicos de renda fixa, renda variável e planejamento financeiro pessoal. Evento aberto a todos os cursos.",
    curso: "Todos",
    data: "2025-09-05",
    horario: "19:00",
    turno: "Noite",
    local: "Auditório 2 – Bloco B",
    dataLimiteInscricao: "2025-09-03",
    vagas: 200,
    vagasOcupadas: 45,
    tipoInscricao: "interna",
    visibilidade: "publica",
    anexos: [{ id: "a3", nome: "Material de apoio.pdf", url: "#" }],
    criadoEm: "2025-07-15",
  },
  {
    id: "4",
    banner: "https://picsum.photos/seed/evt4/800/400",
    nome: "Feira de Estágios e Empregos",
    descricaoBreve: "Conecte-se com empresas parceiras e descubra oportunidades de carreira.",
    descricaoCompleta:
      "A Feira de Estágios reúne mais de 30 empresas parceiras em busca de talentos. Traga seu currículo atualizado e aproveite para fazer networking. Haverá também palestras de orientação profissional ao longo do dia.",
    curso: "Todos",
    data: "2025-09-20",
    horario: "09:00",
    turno: "Manhã",
    local: "Ginásio Poliesportivo",
    dataLimiteInscricao: "2025-09-15",
    vagas: 500,
    vagasOcupadas: 320,
    tipoInscricao: "externa",
    urlExterna: "https://inscricoes.exemplo.com/feira-estagios",
    visibilidade: "publica",
    anexos: [],
    criadoEm: "2025-07-20",
  },
];

let _eventos = [...MOCK_EVENTOS];

let _inscricoes: Inscricao[] = [
  {
    id: "insc1",
    eventoId: "3",
    alunoId: "user_aluno",
    alunoNome: "João Silva",
    alunoCurso: "Tecnologia da Informação",
    alunoMatricula: "2023001",
    dataInscricao: "2025-07-20",
    presencaConfirmada: false,
    qrCode: "QR_user_aluno_event3",
  },
];

// ─── MOCK USER ────────────────────────────────────────────────────────────────

export const MOCK_USER: UserProfile = {
  id: "user_aluno",
  apelido: "João",
  nome: "João Silva",
  matricula: "2023001",
  curso: "Tecnologia da Informação",
  email: "joao@escola.edu.br",
  role: "aluno", // troque para "colaborador" ou "adm" para testar
};

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export const EventoService = {
  getAll: (): Promise<Evento[]> =>
    new Promise((res) => setTimeout(() => res([..._eventos]), 600)),

  getById: (id: string): Promise<Evento | null> =>
    new Promise((res) =>
      setTimeout(() => res(_eventos.find((e) => e.id === id) ?? null), 400)
    ),

  criar: (dados: Omit<Evento, "id" | "criadoEm" | "vagasOcupadas">): Promise<Evento> =>
    new Promise((res) =>
      setTimeout(() => {
        const novo: Evento = {
          ...dados,
          id: String(Date.now()),
          vagasOcupadas: 0,
          criadoEm: new Date().toISOString(),
        };
        _eventos = [novo, ..._eventos];
        res(novo);
      }, 800)
    ),

  editar: (id: string, dados: Partial<Evento>): Promise<Evento> =>
    new Promise((res, rej) =>
      setTimeout(() => {
        const idx = _eventos.findIndex((e) => e.id === id);
        if (idx === -1) return rej(new Error("Evento não encontrado"));
        _eventos[idx] = { ..._eventos[idx], ...dados };
        res(_eventos[idx]);
      }, 600)
    ),

  excluir: (id: string): Promise<void> =>
    new Promise((res) =>
      setTimeout(() => {
        _eventos = _eventos.filter((e) => e.id !== id);
        res();
      }, 500)
    ),

  inscrever: (eventoId: string, user: UserProfile): Promise<Inscricao> =>
    new Promise((res, rej) =>
      setTimeout(() => {
        const jaInscrito = _inscricoes.find(
          (i) => i.eventoId === eventoId && i.alunoId === user.id
        );
        if (jaInscrito) return rej(new Error("Você já está inscrito neste evento."));

        const evento = _eventos.find((e) => e.id === eventoId);
        if (!evento) return rej(new Error("Evento não encontrado."));
        if (evento.vagasOcupadas >= evento.vagas)
          return rej(new Error("Não há mais vagas disponíveis."));

        if (!user.nome || !user.matricula || !user.curso)
          return rej(
            new Error(
              "Seus dados de perfil estão incompletos. Atualize antes de se inscrever."
            )
          );

        const nova: Inscricao = {
          id: `insc_${Date.now()}`,
          eventoId,
          alunoId: user.id,
          alunoNome: user.nome,
          alunoCurso: user.curso,
          alunoMatricula: user.matricula,
          dataInscricao: new Date().toISOString(),
          presencaConfirmada: false,
          qrCode: `QR_${user.id}_${eventoId}_${Date.now()}`,
        };
        _inscricoes.push(nova);
        const evIdx = _eventos.findIndex((e) => e.id === eventoId);
        if (evIdx !== -1) _eventos[evIdx].vagasOcupadas += 1;
        res(nova);
      }, 700)
    ),

  getMinhaInscricao: (eventoId: string, userId: string): Inscricao | null =>
    _inscricoes.find((i) => i.eventoId === eventoId && i.alunoId === userId) ?? null,

  getInscricoesEvento: (eventoId: string): Inscricao[] =>
    _inscricoes.filter((i) => i.eventoId === eventoId),

  confirmarPresenca: (qrCode: string): Promise<Inscricao> =>
    new Promise((res, rej) =>
      setTimeout(() => {
        const idx = _inscricoes.findIndex((i) => i.qrCode === qrCode);
        if (idx === -1) return rej(new Error("QR Code inválido ou não encontrado."));
        if (_inscricoes[idx].presencaConfirmada)
          return rej(new Error("Presença já confirmada anteriormente."));
        _inscricoes[idx].presencaConfirmada = true;
        res(_inscricoes[idx]);
      }, 500)
    ),
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export const CURSOS = [
  "Todos",
  "Tecnologia da Informação",
  "Design",
  "Administração",
  "Enfermagem",
  "Logística",
];

export const TURNOS = ["Todos", "Manhã", "Tarde", "Noite"];

export function getStatusVaga(evento: Evento): "disponivel" | "quase_esgotado" | "esgotado" {
  const livre = evento.vagas - evento.vagasOcupadas;
  if (livre <= 0) return "esgotado";
  if (livre <= evento.vagas * 0.15) return "quase_esgotado";
  return "disponivel";
}

export function isInscricaoEncerrada(evento: Evento): boolean {
  return new Date() > new Date(evento.dataLimiteInscricao);
}

export function canEdit(role: UserRole): boolean {
  return role === "colaborador" || role === "adm";
}

export function canDelete(role: UserRole): boolean {
  return role === "adm";
}

export function canInscricao(role: UserRole): boolean {
  return role === "aluno";
}
