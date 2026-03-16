export interface EventItem {
    id: string;
    name: string;
    date: number;
    banner: string;
    description: string;
    local: string;
    vagas: number;
    vagasOcupadas: number;
    curso: string;
    turno: "Manhã" | "Noite";
}

export interface Evento {
    id: number;
    titulo: string;
    curso: string;
    descricao: string;
    data: string;
    local: string;
    inscritos: number;
    vagas: number;
    turno: "Manhã" | "Noite" | "Tarde";
    banner?: string;
    esgotado?: boolean;
  }



export const eventItems: EventItem[] = [
    {
        id: "1",
        name: "Semana da Computação 2026",
        date: Date.now() + 1000 * 60 * 60 * 24 * 5,
        banner: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
        description: "Palestras, workshops e hackathon sobre as últimas tendências em tecnologia.",
        local: "Bloco A — Auditório Principal",
        vagas: 200,
        vagasOcupadas: 147,
        curso: "Ciência da Computação",
        turno: "Manhã",
    },
    {
        id: "2",
        name: "Encontro de Administração",
        date: Date.now() + 1000 * 60 * 60 * 24 * 12,
        banner: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
        description: "Debate sobre mercado financeiro e tendências para gestores do futuro.",
        local: "Bloco B — Sala 204",
        vagas: 80,
        vagasOcupadas: 80,
        curso: "Administração",
        turno: "Noite",
    },
    {
        id: "3",
        name: "Simpósio de Direito",
        date: Date.now() + 1000 * 60 * 60 * 24 * 20,
        banner: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
        description: "Discussões sobre reformas legislativas e o papel do advogado no século XXI.",
        local: "Bloco C — Anfiteatro",
        vagas: 150,
        vagasOcupadas: 42,
        curso: "Direito",
        turno: "Manhã",
    },
    {
        id: "4",
        name: "Feira de Engenharia",
        date: Date.now() + 1000 * 60 * 60 * 24 * 30,
        banner: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
        description: "Exposição de projetos inovadores desenvolvidos pelos alunos do curso.",
        local: "Pátio Central",
        vagas: 300,
        vagasOcupadas: 189,
        curso: "Engenharia",
        turno: "Manhã",
    },
    {
        id: "5",
        name: "Jornada de Enfermagem",
        date: Date.now() + 1000 * 60 * 60 * 24 * 8,
        banner: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
        description: "Atualização em protocolos clínicos e cuidados humanizados ao paciente.",
        local: "Bloco D — Lab. Clínico",
        vagas: 60,
        vagasOcupadas: 55,
        curso: "Enfermagem",
        turno: "Noite",
    },
    {
        id: "6",
        name: "Workshop de Fisioterapia",
        date: Date.now() + 1000 * 60 * 60 * 24 * 15,
        banner: "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/docs/demo1.jpg",
        description: "Técnicas modernas de reabilitação e fisioterapia esportiva na prática.",
        local: "Ginásio Esportivo",
        vagas: 40,
        vagasOcupadas: 18,
        curso: "Fisioterapia",
        turno: "Manhã",
    },
];


// ─── Types ────────────────────────────────────────────────────────────────────


