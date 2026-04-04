import { Inscricao, Evento } from "@/src/types/evento";

// ─────────────────────────────────────────────────────────────────────────────
// Configuração dos templates por prefixo de matrícula
// ─────────────────────────────────────────────────────────────────────────────

interface TemplateCertificado {
  bgImagem: string;
  nomeInstituicao: string;
  corTitulo: string;       // "SEMANA ACADÊMICA"
  corSubtitulo: string;    // "CERTIFICADO DE PARTICIPAÇÃO"
  corLinha: string;        // linha sob o subtítulo
  corNomeEvento: string;   // nome do evento em negrito no corpo
}

/**
 * Prefixos → Template
 *
 * UG                        → UNIGRANDE
 * UP, PI, CL, AD (demais)   → AESPI/UNIFAPI
 */
const TEMPLATES: Record<string, TemplateCertificado> = {
  UG: {
    bgImagem: "/img/bg_certificado_unigrande.png",
    nomeInstituicao: "Centro Universitário UNIGRANDE",
    corTitulo: "#1a6bbf",      // azul UNIGRANDE
    corSubtitulo: "#2e2e2e",
    corLinha: "#E07A3A",       // laranja UNIGRANDE
    corNomeEvento: "#2e2e2e",
  },
};

const TEMPLATE_PADRAO: TemplateCertificado = {
  bgImagem: "/img/bg_certificado_aespi.png",
  nomeInstituicao: "AESPI/UNIFAPI",
  corTitulo: "#1a1a4e",        // azul escuro AESPI
  corSubtitulo: "#2e2e2e",
  corLinha: "#1a1a4e",
  corNomeEvento: "#2e2e2e",
};

function resolverTemplate(matricula: string): TemplateCertificado {
  const prefixo = matricula.slice(0, 2).toUpperCase();
  return TEMPLATES[prefixo] ?? TEMPLATE_PADRAO;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidade: quebrar texto em linhas respeitando largura máxima (canvas)
// ─────────────────────────────────────────────────────────────────────────────

function quebrarTexto(
  ctx: CanvasRenderingContext2D,
  texto: string,
  maxWidth: number
): string[] {
  const palavras = texto.split(" ");
  const linhas: string[] = [];
  let atual = "";

  for (const palavra of palavras) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > maxWidth && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderiza parágrafo com partes em estilos diferentes (normal + negrito)
// Suporta segmentos: { texto, negrito?, cor? }
// Retorna o Y final após renderizar
// ─────────────────────────────────────────────────────────────────────────────

interface Segmento {
  texto: string;
  negrito?: boolean;
  cor?: string;
}

function renderizarParagrafo(
  ctx: CanvasRenderingContext2D,
  segmentos: Segmento[],
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  corPadrao: string,
  lineHeight: number
): number {
  // Monta tokens com estilo de cada palavra
  interface Token {
    word: string;
    negrito: boolean;
    cor: string;
  }
  const tokens: Token[] = [];
  for (const seg of segmentos) {
    const palavras = seg.texto.split(/(\s+)/);
    for (const p of palavras) {
      tokens.push({ word: p, negrito: !!seg.negrito, cor: seg.cor ?? corPadrao });
    }
  }

  // Agrupa tokens em linhas respeitando maxWidth
  interface LinhaToken {
    tokens: Token[];
    width: number;
  }
  const linhas: LinhaToken[] = [];
  let linhaAtual: Token[] = [];
  let larguraAtual = 0;

  for (const token of tokens) {
    if (token.word.trim() === "") {
      if (linhaAtual.length > 0) {
        const spaceFont = `${token.negrito ? "bold " : ""}${fontSize}px ${fontFamily}`;
        ctx.font = spaceFont;
        larguraAtual += ctx.measureText(" ").width;
      }
      continue;
    }
    const font = `${token.negrito ? "bold " : ""}${fontSize}px ${fontFamily}`;
    ctx.font = font;
    const w = ctx.measureText(token.word).width;
    const spaceFont = `${fontSize}px ${fontFamily}`;
    ctx.font = spaceFont;
    const spaceW = linhaAtual.length > 0 ? ctx.measureText(" ").width : 0;

    if (larguraAtual + spaceW + w > maxWidth && linhaAtual.length > 0) {
      linhas.push({ tokens: [...linhaAtual], width: larguraAtual });
      linhaAtual = [token];
      larguraAtual = w;
    } else {
      larguraAtual += spaceW + w;
      linhaAtual.push(token);
    }
  }
  if (linhaAtual.length > 0) {
    linhas.push({ tokens: linhaAtual, width: larguraAtual });
  }

  // Renderiza cada linha com justify (exceto a última)
  let curY = y;
  for (let li = 0; li < linhas.length; li++) {
    const linha = linhas[li];
    const isUltima = li === linhas.length - 1;

    if (isUltima || linha.tokens.length === 1) {
      // Sem justify — alinha à esquerda a partir de x
      let curX = x;
      for (let ti = 0; ti < linha.tokens.length; ti++) {
        const t = linha.tokens[ti];
        ctx.font = `${t.negrito ? "bold " : ""}${fontSize}px ${fontFamily}`;
        ctx.fillStyle = t.cor;
        ctx.fillText(t.word, curX, curY);
        curX += ctx.measureText(t.word).width;
        if (ti < linha.tokens.length - 1) {
          ctx.font = `${fontSize}px ${fontFamily}`;
          curX += ctx.measureText(" ").width;
        }
      }
    } else {
      // Justify: distribui espaço extra entre palavras
      const totalPalavraW = linha.tokens.reduce((acc, t) => {
        ctx.font = `${t.negrito ? "bold " : ""}${fontSize}px ${fontFamily}`;
        return acc + ctx.measureText(t.word).width;
      }, 0);
      const espacos = linha.tokens.length - 1;
      const espacoExtra = espacos > 0 ? (maxWidth - totalPalavraW) / espacos : 0;

      let curX = x;
      for (let ti = 0; ti < linha.tokens.length; ti++) {
        const t = linha.tokens[ti];
        ctx.font = `${t.negrito ? "bold " : ""}${fontSize}px ${fontFamily}`;
        ctx.fillStyle = t.cor;
        ctx.fillText(t.word, curX, curY);
        const wPalavra = ctx.measureText(t.word).width;
        if (ti < linha.tokens.length - 1) {
          ctx.font = `${fontSize}px ${fontFamily}`;
          curX += wPalavra + ctx.measureText(" ").width + espacoExtra;
        }
      }
    }

    curY += lineHeight;
  }

  return curY;
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadCertificado(
  inscricao: Inscricao,
  evento: Evento
): Promise<void> {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default;

  const template = resolverTemplate(inscricao.alunoMatricula);

  const dataEvento = new Date(evento.data + "T00:00:00").toLocaleDateString(
    "pt-BR",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  const dataEmissao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Dimensões exatas das imagens (1121×793 px)
  const W = 1121,
    H = 793;
  const cvs = document.createElement("canvas");
  cvs.width = W;
  cvs.height = H;
  const ctx = cvs.getContext("2d")!;

  function carregarImagem(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Falha ao carregar: ${src}`));
      img.src = src;
    });
  }

  const bg = await carregarImagem(template.bgImagem);

  // ── Fundo ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(bg, 0, 0, W, H);

  // ── Margens da área de texto (espelho do layout real) ─────────────────────
  // Área branca do certificado: margem esquerda ~18%, direita ~18%
  const margemX = Math.round(W * 0.18);  // ~202px
  const textoW = W - margemX * 2;         // ~717px
  const FONTE = "Arial, sans-serif";

  // ── "SEMANA ACADÊMICA" ────────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.font = `bold 36px ${FONTE}`;
  ctx.fillStyle = template.corTitulo;
  ctx.fillText("SEMANA ACADÊMICA", W / 2, 120);

  // ── Linha laranja / azul ──────────────────────────────────────────────────
  ctx.strokeStyle = template.corLinha;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(margemX, 138);
  ctx.lineTo(W - margemX, 138);
  ctx.stroke();

  // ── "CERTIFICADO DE PARTICIPAÇÃO" ─────────────────────────────────────────
  ctx.font = `bold 20px ${FONTE}`;
  ctx.fillStyle = template.corSubtitulo;
  ctx.fillText("CERTIFICADO DE PARTICIPAÇÃO", W / 2, 165);

  // ── Corpo do certificado (texto justificado) ───────────────────────────────
  // Monta segmentos conforme o layout real do docx:
  // "Certificamos que [NOME] participou das atividades realizadas no
  //  dia [DATA], no âmbito da Semana Acadêmica "Protagonismo e Ação:
  //  Inovação, Empreendedorismo e os Desafios da Carreira Contemporânea",
  //  promovida pelo [INSTITUIÇÃO], com carga horária de 3(três) horas."

  const nomeEvento =
    `"Protagonismo e Ação: Inovação, Empreendedorismo e os Desafios da Carreira Contemporânea"`;

  const segmentos: Segmento[] = [
    { texto: "Certificamos que " },
    { texto: `${inscricao.alunoNome} `, negrito: true },
    { texto: `participou das atividades realizadas no dia ${dataEvento}, no âmbito da Semana Acadêmica ` },
    { texto: `${nomeEvento}`, negrito: true },
    { texto: `, promovida pelo ${template.nomeInstituicao}, com carga horária de 3(três) horas.` },
  ];

  ctx.textAlign = "left";
  renderizarParagrafo(
    ctx,
    segmentos,
    margemX,
    230,
    textoW,
    18,
    FONTE,
    "#2e2e2e",
    30
  );

  // ── "COORDENAÇÃO GERAL" ───────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.font = `14px ${FONTE}`;
  ctx.fillStyle = "#4a4a4a";
  ctx.fillText("COORDENAÇÃO GERAL", W / 2, 595);

//   // Linha tracejada da assinatura (como no original)
//   ctx.strokeStyle = "#2e2e2e";
//   ctx.lineWidth = 1;
//   ctx.setLineDash([4, 3]);
//   const linhaAssinaturaX1 = W * 0.30;
//   const linhaAssinaturaX2 = W * 0.70;
//   ctx.beginPath();
//   ctx.moveTo(linhaAssinaturaX1, 560);

//   // pequenas setas nas pontas (como no layout)
//   ctx.moveTo(linhaAssinaturaX1 - 6, 560);
//   ctx.lineTo(linhaAssinaturaX2 + 6, 560);
//   ctx.stroke();
//   ctx.setLineDash([]);

//   // Marcadores de ponta
//   ctx.font = `10px ${FONTE}`;
//   ctx.fillStyle = "#2e2e2e";
//   ctx.textAlign = "left";
//   ctx.fillText("✦", linhaAssinaturaX1 - 10, 563);
//   ctx.textAlign = "right";
//   ctx.fillText("✦", linhaAssinaturaX2 + 10, 563);

  // ── Rodapé: data de emissão ────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.font = `10px ${FONTE}`;
  ctx.fillStyle = "#999999";
  ctx.fillText(
    `Emitido em ${dataEmissao} via Portal AVP Conecta`,
    W / 2,
    615
  );

  // ── Canvas → PDF ──────────────────────────────────────────────────────────
  const imgData = cvs.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [W, H],
  });
  pdf.addImage(imgData, "PNG", 0, 0, W, H);
  pdf.save(
    `certificado_${evento.nome.replace(/\s+/g, "_")}_${inscricao.alunoMatricula}.pdf`
  );
}