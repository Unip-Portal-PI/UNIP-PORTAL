"use client";

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Evento, Inscricao } from "@/src/types/evento";

type ExportFileType = "excel" | "pdf";

interface ExportarInscricoesPayload {
  evento: Evento;
  inscricoes: Inscricao[];
  tipoArquivo: ExportFileType;
}

function salvarBlob(blob: Blob, nomeArquivo: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatarDataGeracao(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatarDataCurta(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";

  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarDataLonga(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";

  const texto = dt.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function getPresencaLabel(inscricao: Inscricao) {
  return inscricao.presencaConfirmada ? "Confirmada" : "Pendente";
}

function getPresencaPdfColor(inscricao: Inscricao): [number, number, number] {
  return inscricao.presencaConfirmada ? [46, 125, 50] : [230, 81, 0];
}

function buildResumo(inscricoes: Inscricao[]) {
  const total = inscricoes.length;
  const confirmados = inscricoes.filter((i) => i.presencaConfirmada).length;
  const pendentes = total - confirmados;

  return {
    total,
    confirmados,
    pendentes,
  };
}

function buildLinhaDataEvento(evento: Evento) {
  const data = formatarDataLonga(evento.data);
  const turno = evento.turno?.trim() ? evento.turno.trim() : "";
  const horario = evento.horario?.trim() ? evento.horario.trim() : "";

  if (turno && horario) return `${data} • ${turno} - ${horario}`;
  if (turno) return `${data} • ${turno}`;
  if (horario) return `${data} • ${horario}`;
  return data;
}

function buildLinhaInscricoes(evento: Evento) {
  const dataLimite = formatarDataCurta(evento.dataLimiteInscricao);
  const encerradas = evento.dataLimiteInscricao
    ? new Date(evento.dataLimiteInscricao).getTime() < Date.now()
    : false;

  return encerradas ? `Inscrições encerradas em ${dataLimite}` : `Inscrições até ${dataLimite}`;
}

function buildLinhaVagas(evento: Evento) {
  const vagas = Number(evento.vagas ?? 0);
  const ocupadas = Number(evento.vagasOcupadas ?? 0);
  const restantes = Math.max(vagas - ocupadas, 0);

  return `Vagas: ${ocupadas}/${vagas} • ${restantes} restantes`;
}

function applyThinBorder(cell: ExcelJS.Cell, color: string) {
  cell.border = {
    top: { style: "thin", color: { argb: color } },
    bottom: { style: "thin", color: { argb: color } },
    left: { style: "thin", color: { argb: color } },
    right: { style: "thin", color: { argb: color } },
  };
}

async function exportarExcel(evento: Evento, inscricoes: Inscricao[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ChatGPT";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Lista de Inscritos", {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 20 },
  });

  const amarelo = "FFF5C518";
  const preto = "FF2B2B2B";
  const cinzaTexto = "FF6B6B6B";
  const cinzaLinha = "FFD9D9D9";
  const cinzaMuitoClaro = "FFF7F7F7";
  const amareloClaro = "FFFFFDE7";
  const branco = "FFFFFFFF";
  const laranja = "FFE65100";
  const verde = "FF2E7D32";

  worksheet.columns = [
    { key: "nome", width: 34 },
    { key: "matricula", width: 16 },
    { key: "area", width: 24 },
    { key: "inscritoEm", width: 14 },
    { key: "presenca", width: 14 },
    { key: "assinatura", width: 24 },
  ];

  worksheet.getRow(1).height = 8;

  worksheet.mergeCells("A2:D2");
  worksheet.mergeCells("E2:F2");
  worksheet.mergeCells("A3:D3");

  worksheet.getRow(2).height = 22;
  worksheet.getRow(3).height = 15;

  worksheet.getCell("A2").value = "AVP Conecta";
  worksheet.getCell("A2").font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: preto },
  };
  worksheet.getCell("A2").alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  worksheet.getCell("A3").value = "Plataforma de Gestão de Eventos";
  worksheet.getCell("A3").font = {
    name: "Arial",
    size: 9,
    color: { argb: cinzaTexto },
  };
  worksheet.getCell("A3").alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  worksheet.getCell("E2").value = `Gerado em: ${formatarDataGeracao()}`;
  worksheet.getCell("E2").font = {
    name: "Arial",
    size: 9,
    color: { argb: cinzaTexto },
  };
  worksheet.getCell("E2").alignment = {
    vertical: "middle",
    horizontal: "right",
  };

  worksheet.getRow(5).height = 4;
  worksheet.getRow(6).height = 6;

  for (let col = 1; col <= 6; col++) {
    worksheet.getRow(6).getCell(col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: amarelo },
    };
  }

  worksheet.mergeCells("A7:F7");
  worksheet.getRow(7).height = 22;
  worksheet.getCell("A7").value = evento.nome;
  worksheet.getCell("A7").font = {
    name: "Arial",
    size: 14,
    bold: true,
    color: { argb: preto },
  };
  worksheet.getCell("A7").alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  const infoBlocks = [
    {
      titleCell: "A8",
      valueCell: "A9",
      mergeTitle: "A8:B8",
      mergeValue: "A9:B9",
      title: "Data",
      value: buildLinhaDataEvento(evento),
    },
    {
      titleCell: "C8",
      valueCell: "C9",
      mergeTitle: "C8:D8",
      mergeValue: "C9:D9",
      title: "Local",
      value: evento.local || "-",
    },
    {
      titleCell: "E8",
      valueCell: "E9",
      mergeTitle: "E8:F8",
      mergeValue: "E9:F9",
      title: "Inscrições",
      value: buildLinhaInscricoes(evento),
    },
  ];

  worksheet.getRow(8).height = 16;
  worksheet.getRow(9).height = 18;

  infoBlocks.forEach((block) => {
    worksheet.mergeCells(block.mergeTitle);
    worksheet.mergeCells(block.mergeValue);

    worksheet.getCell(block.titleCell).value = block.title;
    worksheet.getCell(block.titleCell).font = {
      name: "Arial",
      size: 9,
      bold: true,
      color: { argb: preto },
    };
    worksheet.getCell(block.titleCell).alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    worksheet.getCell(block.valueCell).value = block.value;
    worksheet.getCell(block.valueCell).font = {
      name: "Arial",
      size: 9,
      color: { argb: cinzaTexto },
    };
    worksheet.getCell(block.valueCell).alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    };
  });

  worksheet.mergeCells("A10:F10");
  worksheet.getRow(10).height = 18;
  worksheet.getCell("A10").value = buildLinhaVagas(evento);
  worksheet.getCell("A10").font = {
    name: "Arial",
    size: 9,
    color: { argb: cinzaTexto },
  };
  worksheet.getCell("A10").alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  worksheet.getRow(11).height = 6;

  worksheet.mergeCells("A12:F12");
  worksheet.getRow(12).height = 18;
  worksheet.getCell("A12").value = "Lista de Inscritos";
  worksheet.getCell("A12").font = {
    name: "Arial",
    size: 11,
    bold: true,
    color: { argb: preto },
  };
  worksheet.getCell("A12").alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  const headerRowNumber = 13;
  worksheet.getRow(headerRowNumber).height = 22;

  const headers = [
    "NOME",
    "MATRÍCULA",
    "ÁREA",
    "INSCRITO EM",
    "PRESENÇA",
    "ASSINATURA",
  ];

  headers.forEach((header, index) => {
    const cell = worksheet.getRow(headerRowNumber).getCell(index + 1);
    cell.value = header;
    cell.font = {
      name: "Arial",
      size: 9,
      bold: true,
      color: { argb: branco },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: preto },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: index === 4 ? "center" : "left",
    };
    applyThinBorder(cell, cinzaLinha);
  });

  const firstDataRow = 14;

  inscricoes.forEach((inscricao, index) => {
    const rowNumber = firstDataRow + index;
    const row = worksheet.getRow(rowNumber);
    row.height = 22;

    const values = [
      inscricao.alunoNome,
      inscricao.alunoMatricula,
      inscricao.alunoArea || "-",
      formatarDataCurta(inscricao.dataInscricao),
      getPresencaLabel(inscricao),
      "",
    ];

    values.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      cell.font = {
        name: "Arial",
        size: 9,
        bold: colIndex === 4,
        color: {
          argb:
            colIndex === 4
              ? inscricao.presencaConfirmada
                ? verde
                : laranja
              : preto,
        },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: cinzaMuitoClaro },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: colIndex === 4 ? "center" : "left",
      };
      applyThinBorder(cell, cinzaLinha);
    });
  });

  const resumo = buildResumo(inscricoes);
  const resumoRow = firstDataRow + inscricoes.length + 1;

  worksheet.mergeCells(`A${resumoRow}:F${resumoRow}`);
  worksheet.getRow(resumoRow).height = 18;
  worksheet.getCell(`A${resumoRow}`).value =
    `Total: ${resumo.total} inscritos   •   Confirmados: ${resumo.confirmados}   •   Pendentes: ${resumo.pendentes}`;
  worksheet.getCell(`A${resumoRow}`).font = {
    name: "Arial",
    size: 9,
    color: { argb: cinzaTexto },
  };
  worksheet.getCell(`A${resumoRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: amareloClaro },
  };
  worksheet.getCell(`A${resumoRow}`).alignment = {
    vertical: "middle",
    horizontal: "left",
  };

  const footerRow = resumoRow + 3;
  worksheet.mergeCells(`A${footerRow}:F${footerRow}`);
  worksheet.getRow(footerRow).height = 14;
  worksheet.getCell(`A${footerRow}`).value = `AVP Conecta • ${new Date().getFullYear()}`;
  worksheet.getCell(`A${footerRow}`).font = {
    name: "Arial",
    size: 8,
    color: { argb: cinzaTexto },
  };
  worksheet.getCell(`A${footerRow}`).alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  const buffer = await workbook.xlsx.writeBuffer();

  salvarBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `lista_inscritos_${slugify(evento.nome || "evento")}.xlsx`
  );
}

async function exportarPdf(evento: Evento, inscricoes: Inscricao[]) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const amarelo: [number, number, number] = [245, 197, 24];
  const preto: [number, number, number] = [33, 33, 33];
  const textoEscuro: [number, number, number] = [37, 37, 37];
  const textoSuave: [number, number, number] = [107, 107, 107];
  const cinzaLinha: [number, number, number] = [214, 214, 214];
  const branco: [number, number, number] = [255, 255, 255];

  const marginX = 34;
  const topBarHeight = 14;
  const bottomBarHeight = 14;

  const resumo = buildResumo(inscricoes);

  const vagas = Number(evento.vagas ?? 0);
  const ocupadas = Number(evento.vagasOcupadas ?? 0);
  const restantes = Math.max(vagas - ocupadas, 0);

  const dataEvento = formatarDataLonga(evento.data);
  const turnoHorario = [evento.turno?.trim(), evento.horario?.trim()]
    .filter(Boolean)
    .join(" - ");

  const dataLimite = formatarDataCurta(evento.dataLimiteInscricao);
  const encerradas = evento.dataLimiteInscricao
    ? new Date(evento.dataLimiteInscricao).getTime() < Date.now()
    : false;

  const linhaInscricao2 = encerradas ? "Inscrições encerradas" : "Inscrições abertas";

  doc.setFillColor(...amarelo);
  doc.rect(0, 0, pageWidth, topBarHeight, "F");
  doc.rect(0, pageHeight - bottomBarHeight, pageWidth, bottomBarHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...textoEscuro);
  doc.text("AVP Conecta", marginX, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textoSuave);
  doc.text("Plataforma de Gestão de Eventos", marginX, 58);
  doc.text(`Gerado em: ${formatarDataGeracao()}`, pageWidth - marginX, 42, {
    align: "right",
  });

  doc.setDrawColor(...amarelo);
  doc.setLineWidth(1);
  doc.line(marginX, 74, pageWidth - marginX, 74);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...textoEscuro);
  doc.text(evento.nome || "-", marginX, 106);

  const infoTopY = 132;
  const totalWidth = pageWidth - marginX * 2;
  const gap = 12;
  const colWidth = (totalWidth - gap * 3) / 4;

  const cols = [
    {
      x: marginX,
      title: dataEvento,
      line1: turnoHorario || "-",
      accentLine1: false,
    },
    {
      x: marginX + (colWidth + gap) * 1,
      title: "Local",
      line1: evento.local || "-",
      accentLine1: false,
    },
    {
      x: marginX + (colWidth + gap) * 2,
      title: `Inscrições até ${dataLimite}`,
      line1: linhaInscricao2,
      accentLine1: true,
    },
    {
      x: marginX + (colWidth + gap) * 3,
      title: `Vagas: ${ocupadas}/${vagas}`,
      line1: `${restantes} vagas restantes`,
      accentLine1: false,
    },
  ];

  cols.forEach((col) => {
    doc.setFillColor(...amarelo);
    doc.rect(col.x, infoTopY - 6, 6, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...textoEscuro);
    doc.text(col.title, col.x + 10, infoTopY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const corLinha: [number, number, number] = col.accentLine1
      ? [209, 76, 0]
      : textoSuave;

    doc.setTextColor(...corLinha);
    doc.text(col.line1 || "", col.x + 10, infoTopY + 13);
  });

  doc.setDrawColor(...cinzaLinha);
  doc.setLineWidth(0.6);
  doc.line(marginX, 158, pageWidth - marginX, 158);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...textoEscuro);
  doc.text("Lista de Inscritos", marginX, 178);

  const body = inscricoes.map((inscricao) => [
    inscricao.alunoNome,
    inscricao.alunoMatricula,
    inscricao.alunoArea || "-",
    formatarDataCurta(inscricao.dataInscricao),
    getPresencaLabel(inscricao),
    "",
  ]);

  autoTable(doc, {
    startY: 192,
    head: [[
      "NOME",
      "MATRÍCULA",
      "ÁREA",
      "INSCRITO EM",
      "PRESENÇA",
      "ASSINATURA",
    ]],
    body,
    margin: { left: marginX, right: marginX },
    tableWidth: pageWidth - marginX * 2,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 7.8,
      textColor: textoEscuro,
      cellPadding: { top: 7, right: 6, bottom: 7, left: 6 },
      valign: "middle",
      lineColor: cinzaLinha,
      lineWidth: 0.45,
    },
    headStyles: {
      fillColor: preto,
      textColor: branco,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      halign: "left",
    },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 4) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = getPresencaPdfColor(inscricoes[data.row.index]);
      }
    },
    didDrawCell(data) {
      if (data.section === "head" && data.row.index === 0) {
        doc.setDrawColor(...amarelo);
        doc.setLineWidth(1);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
    columnStyles: {
      0: { cellWidth: 210 },
      1: { cellWidth: 98 },
      2: { cellWidth: 140 },
      3: { cellWidth: 88 },
      4: { cellWidth: 80 },
      5: { cellWidth: 160 },
    },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 192;

  const resumoY = finalY + 14;

  doc.setDrawColor(...amarelo);
  doc.setLineWidth(2);
  doc.line(marginX + 2, resumoY - 2, marginX + 2, resumoY + 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...textoEscuro);
  doc.text(`Total: ${resumo.total} inscritos`, marginX + 10, resumoY + 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textoSuave);
  doc.text(
    `Confirmados: ${resumo.confirmados}  •  Pendentes: ${resumo.pendentes}`,
    marginX + 10,
    resumoY + 19
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...textoSuave);
  doc.text(`AVP Conecta • ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 20, {
    align: "center",
  });

  doc.save(`lista_inscritos_${slugify(evento.nome || "evento")}.pdf`);
}

export const EventoInscricoesExportService = {
  async exportar({
    evento,
    inscricoes,
    tipoArquivo,
  }: ExportarInscricoesPayload) {
    if (tipoArquivo === "excel") {
      await exportarExcel(evento, inscricoes);
      return;
    }

    await exportarPdf(evento, inscricoes);
  },
};