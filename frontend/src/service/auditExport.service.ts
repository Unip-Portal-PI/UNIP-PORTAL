"use client";

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Evento } from "@/src/types/evento";
import { Comunicado } from "@/src/types/comunicado";
import { parseAssuntos } from "@/src/utils/comunicado.helpers";

type ExportFileType = "excel" | "pdf";

// ---------------------------------------------------------------------------
// Helpers compartilhados
// ---------------------------------------------------------------------------

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

function slugifyData() {
  return new Date()
    .toLocaleDateString("pt-BR")
    .replace(/\//g, "-");
}

function applyThinBorder(cell: ExcelJS.Cell, color: string) {
  cell.border = {
    top: { style: "thin", color: { argb: color } },
    bottom: { style: "thin", color: { argb: color } },
    left: { style: "thin", color: { argb: color } },
    right: { style: "thin", color: { argb: color } },
  };
}

// ---------------------------------------------------------------------------
// EVENTOS — Excel
// ---------------------------------------------------------------------------

async function exportarEventosExcel(eventos: Evento[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AVP Conecta";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Auditoria de Eventos", {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 20 },
  });

  const amarelo      = "FFF5C518";
  const preto        = "FF2B2B2B";
  const cinzaTexto   = "FF6B6B6B";
  const cinzaLinha   = "FFD9D9D9";
  const cinzaClaro   = "FFF7F7F7";
  const amareloClaro = "FFFFFDE7";
  const branco       = "FFFFFFFF";

  ws.columns = [
    { key: "nome",         width: 36 },
    { key: "data",         width: 14 },
    { key: "horario",      width: 10 },
    { key: "turno",        width: 12 },
    { key: "local",        width: 28 },
    { key: "vagas",        width: 10 },
    { key: "inscritos",    width: 12 },
    { key: "area",         width: 24 },
    { key: "responsavel",  width: 24 },
    { key: "visibilidade", width: 14 },
    { key: "criadoEm",     width: 16 },
  ];

  const COLS = 11;

  ws.getRow(1).height = 8;
  ws.mergeCells("A2:H2");
  ws.mergeCells("I2:K2");
  ws.mergeCells("A3:H3");
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 15;

  ws.getCell("A2").value = "AVP Conecta";
  ws.getCell("A2").font = { name: "Arial", size: 16, bold: true, color: { argb: preto } };
  ws.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };

  ws.getCell("A3").value = "Plataforma de Gestão de Eventos";
  ws.getCell("A3").font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  ws.getCell("A3").alignment = { vertical: "middle", horizontal: "left" };

  ws.getCell("I2").value = `Gerado em: ${formatarDataGeracao()}`;
  ws.getCell("I2").font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  ws.getCell("I2").alignment = { vertical: "middle", horizontal: "right" };

  ws.getRow(5).height = 4;
  ws.getRow(6).height = 6;
  for (let col = 1; col <= COLS; col++) {
    ws.getRow(6).getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: amarelo } };
  }

  ws.mergeCells(`A7:K7`);
  ws.getRow(7).height = 22;
  ws.getCell("A7").value = "Auditoria de Eventos";
  ws.getCell("A7").font = { name: "Arial", size: 14, bold: true, color: { argb: preto } };
  ws.getCell("A7").alignment = { vertical: "middle", horizontal: "left" };

  ws.mergeCells("A8:K8");
  ws.getRow(8).height = 14;
  ws.getCell("A8").value = `Total: ${eventos.length} evento(s)`;
  ws.getCell("A8").font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  ws.getCell("A8").alignment = { vertical: "middle", horizontal: "left" };

  ws.getRow(9).height = 6;

  const headerRow = 10;
  ws.getRow(headerRow).height = 22;
  const headers = ["NOME", "DATA", "HORÁRIO", "TURNO", "LOCAL", "VAGAS", "INSCRITOS", "ÁREA", "RESPONSÁVEL", "VISIBILIDADE", "CRIADO EM"];
  headers.forEach((h, i) => {
    const cell = ws.getRow(headerRow).getCell(i + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: branco } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: preto } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    applyThinBorder(cell, cinzaLinha);
  });

  eventos.forEach((ev, idx) => {
    const rowNum = 11 + idx;
    const row = ws.getRow(rowNum);
    row.height = 22;
    const valores = [
      ev.nome,
      formatarDataCurta(ev.data),
      ev.horario || "-",
      ev.turno || "-",
      ev.local || "-",
      ev.vagas ?? 0,
      ev.vagasOcupadas ?? 0,
      ev.area.filter((a) => a !== "Todos").join(", ") || "Todos",
      ev.responsavel || "-",
      ev.visibilidade === "publica" ? "Pública" : "Privada",
      formatarDataCurta(ev.criadoEm),
    ];
    valores.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.font = { name: "Arial", size: 9, color: { argb: preto } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cinzaClaro } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
      applyThinBorder(cell, cinzaLinha);
    });
  });

  const resumoRow = 11 + eventos.length + 1;
  ws.mergeCells(`A${resumoRow}:K${resumoRow}`);
  ws.getRow(resumoRow).height = 18;
  ws.getCell(`A${resumoRow}`).value = `Total: ${eventos.length} evento(s) exportados em ${formatarDataGeracao()}`;
  ws.getCell(`A${resumoRow}`).font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  ws.getCell(`A${resumoRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: amareloClaro } };
  ws.getCell(`A${resumoRow}`).alignment = { vertical: "middle", horizontal: "left" };

  const footerRow = resumoRow + 3;
  ws.mergeCells(`A${footerRow}:K${footerRow}`);
  ws.getRow(footerRow).height = 14;
  ws.getCell(`A${footerRow}`).value = `AVP Conecta • ${new Date().getFullYear()}`;
  ws.getCell(`A${footerRow}`).font = { name: "Arial", size: 8, color: { argb: cinzaTexto } };
  ws.getCell(`A${footerRow}`).alignment = { vertical: "middle", horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  salvarBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `auditoria_eventos_${slugifyData()}.xlsx`,
  );
}

// ---------------------------------------------------------------------------
// EVENTOS — PDF
// ---------------------------------------------------------------------------

async function exportarEventosPdf(eventos: Evento[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const amarelo:     [number, number, number] = [245, 197, 24];
  const preto:       [number, number, number] = [33, 33, 33];
  const textoEscuro: [number, number, number] = [37, 37, 37];
  const textoSuave:  [number, number, number] = [107, 107, 107];
  const cinzaLinha:  [number, number, number] = [214, 214, 214];
  const branco:      [number, number, number] = [255, 255, 255];

  const marginX = 34;

  // Barras top/bottom
  doc.setFillColor(...amarelo);
  doc.rect(0, 0, pageWidth, 14, "F");
  doc.rect(0, pageHeight - 14, pageWidth, 14, "F");

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...textoEscuro);
  doc.text("AVP Conecta", marginX, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textoSuave);
  doc.text("Plataforma de Gestão de Eventos", marginX, 58);
  doc.text(`Gerado em: ${formatarDataGeracao()}`, pageWidth - marginX, 42, { align: "right" });

  doc.setDrawColor(...amarelo);
  doc.setLineWidth(1);
  doc.line(marginX, 74, pageWidth - marginX, 74);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...textoEscuro);
  doc.text("Auditoria de Eventos", marginX, 106);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textoSuave);
  doc.text(`Total: ${eventos.length} evento(s)`, marginX, 124);

  doc.setDrawColor(...cinzaLinha);
  doc.setLineWidth(0.6);
  doc.line(marginX, 138, pageWidth - marginX, 138);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...textoEscuro);
  doc.text("Lista de Eventos", marginX, 158);

  const body = eventos.map((ev) => [
    ev.nome,
    formatarDataCurta(ev.data),
    ev.horario || "-",
    ev.turno || "-",
    ev.local || "-",
    String(ev.vagas ?? 0),
    String(ev.vagasOcupadas ?? 0),
    ev.area.filter((a) => a !== "Todos").join(", ") || "Todos",
    ev.responsavel || "-",
    ev.visibilidade === "publica" ? "Pública" : "Privada",
    formatarDataCurta(ev.criadoEm),
  ]);

  autoTable(doc, {
    startY: 172,
    head: [["NOME", "DATA", "HORÁRIO", "TURNO", "LOCAL", "VAGAS", "INSCRITOS", "ÁREA", "RESPONSÁVEL", "VISIBILIDADE", "CRIADO EM"]],
    body,
    margin: { left: marginX, right: marginX },
    tableWidth: pageWidth - marginX * 2,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 7,
      textColor: textoEscuro,
      cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
      valign: "middle",
      lineColor: cinzaLinha,
      lineWidth: 0.45,
    },
    headStyles: { fillColor: preto, textColor: branco, fontStyle: "bold", halign: "left" },
    bodyStyles: { fillColor: [255, 255, 255], halign: "left" },
    didDrawCell(data) {
      if (data.section === "head" && data.row.index === 0) {
        doc.setDrawColor(...amarelo);
        doc.setLineWidth(1);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 60 },
      2: { cellWidth: 48 },
      3: { cellWidth: 46 },
      4: { cellWidth: 90 },
      5: { cellWidth: 38 },
      6: { cellWidth: 48 },
      7: { cellWidth: 80 },
      8: { cellWidth: 80 },
      9: { cellWidth: 54 },
      10: { cellWidth: 60 },
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 172;
  const resumoY = finalY + 14;

  doc.setDrawColor(...amarelo);
  doc.setLineWidth(2);
  doc.line(marginX + 2, resumoY - 2, marginX + 2, resumoY + 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...textoEscuro);
  doc.text(`Total: ${eventos.length} evento(s)`, marginX + 10, resumoY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...textoSuave);
  doc.text(`AVP Conecta • ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 20, { align: "center" });

  doc.save(`auditoria_eventos_${slugifyData()}.pdf`);
}

// ---------------------------------------------------------------------------
// COMUNICADOS — Excel
// ---------------------------------------------------------------------------

async function exportarComunicadosExcel(comunicados: Comunicado[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AVP Conecta";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Auditoria de Comunicados", {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 20 },
  });

  const amarelo      = "FFF5C518";
  const preto        = "FF2B2B2B";
  const cinzaTexto   = "FF6B6B6B";
  const cinzaLinha   = "FFD9D9D9";
  const cinzaClaro   = "FFF7F7F7";
  const amareloClaro = "FFFFFDE7";
  const branco       = "FFFFFFFF";

  ws.columns = [
    { key: "titulo",       width: 36 },
    { key: "assunto",      width: 24 },
    { key: "visibilidade", width: 28 },
    { key: "criadoPorNome",width: 28 },
    { key: "matricula",    width: 16 },
    { key: "criadoEm",     width: 16 },
    { key: "validade",     width: 14 },
  ];

  const COLS = 7;

  ws.getRow(1).height = 8;
  ws.mergeCells("A2:E2");
  ws.mergeCells("F2:G2");
  ws.mergeCells("A3:E3");
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 15;

  ws.getCell("A2").value = "AVP Conecta";
  ws.getCell("A2").font = { name: "Arial", size: 16, bold: true, color: { argb: preto } };
  ws.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };

  ws.getCell("A3").value = "Plataforma de Gestão de Comunicados";
  ws.getCell("A3").font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  ws.getCell("A3").alignment = { vertical: "middle", horizontal: "left" };

  ws.getCell("F2").value = `Gerado em: ${formatarDataGeracao()}`;
  ws.getCell("F2").font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  ws.getCell("F2").alignment = { vertical: "middle", horizontal: "right" };

  ws.getRow(5).height = 4;
  ws.getRow(6).height = 6;
  for (let col = 1; col <= COLS; col++) {
    ws.getRow(6).getCell(col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: amarelo } };
  }

  ws.mergeCells("A7:G7");
  ws.getRow(7).height = 22;
  ws.getCell("A7").value = "Auditoria de Comunicados";
  ws.getCell("A7").font = { name: "Arial", size: 14, bold: true, color: { argb: preto } };
  ws.getCell("A7").alignment = { vertical: "middle", horizontal: "left" };

  ws.mergeCells("A8:G8");
  ws.getRow(8).height = 14;
  ws.getCell("A8").value = `Total: ${comunicados.length} comunicado(s)`;
  ws.getCell("A8").font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  ws.getCell("A8").alignment = { vertical: "middle", horizontal: "left" };

  ws.getRow(9).height = 6;

  const headerRow = 10;
  ws.getRow(headerRow).height = 22;
  const headers = ["TÍTULO", "ASSUNTO", "VISIBILIDADE", "CRIADO POR", "MATRÍCULA", "CRIADO EM", "VALIDADE"];
  headers.forEach((h, i) => {
    const cell = ws.getRow(headerRow).getCell(i + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: branco } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: preto } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    applyThinBorder(cell, cinzaLinha);
  });

  comunicados.forEach((c, idx) => {
    const rowNum = 11 + idx;
    const row = ws.getRow(rowNum);
    row.height = 22;
    const assuntoParsed = parseAssuntos(c.assunto).join(", ") || "-";
    const visib = c.visibilidade.includes("Todos") ? "Todos" : c.visibilidade.join(", ");
    const valores = [
      c.titulo,
      assuntoParsed,
      visib,
      c.criadoPorNome || "-",
      c.criadoPor || "-",
      formatarDataCurta(c.criadoEm),
      formatarDataCurta(c.dataValidade),
    ];
    valores.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      cell.font = { name: "Arial", size: 9, color: { argb: preto } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cinzaClaro } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
      applyThinBorder(cell, cinzaLinha);
    });
  });

  const resumoRow = 11 + comunicados.length + 1;
  ws.mergeCells(`A${resumoRow}:G${resumoRow}`);
  ws.getRow(resumoRow).height = 18;
  ws.getCell(`A${resumoRow}`).value = `Total: ${comunicados.length} comunicado(s) exportados em ${formatarDataGeracao()}`;
  ws.getCell(`A${resumoRow}`).font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  ws.getCell(`A${resumoRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: amareloClaro } };
  ws.getCell(`A${resumoRow}`).alignment = { vertical: "middle", horizontal: "left" };

  const footerRow = resumoRow + 3;
  ws.mergeCells(`A${footerRow}:G${footerRow}`);
  ws.getRow(footerRow).height = 14;
  ws.getCell(`A${footerRow}`).value = `AVP Conecta • ${new Date().getFullYear()}`;
  ws.getCell(`A${footerRow}`).font = { name: "Arial", size: 8, color: { argb: cinzaTexto } };
  ws.getCell(`A${footerRow}`).alignment = { vertical: "middle", horizontal: "center" };

  const buffer = await workbook.xlsx.writeBuffer();
  salvarBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `auditoria_comunicados_${slugifyData()}.xlsx`,
  );
}

// ---------------------------------------------------------------------------
// COMUNICADOS — PDF
// ---------------------------------------------------------------------------

async function exportarComunicadosPdf(comunicados: Comunicado[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const amarelo:     [number, number, number] = [245, 197, 24];
  const preto:       [number, number, number] = [33, 33, 33];
  const textoEscuro: [number, number, number] = [37, 37, 37];
  const textoSuave:  [number, number, number] = [107, 107, 107];
  const cinzaLinha:  [number, number, number] = [214, 214, 214];
  const branco:      [number, number, number] = [255, 255, 255];

  const marginX = 34;

  doc.setFillColor(...amarelo);
  doc.rect(0, 0, pageWidth, 14, "F");
  doc.rect(0, pageHeight - 14, pageWidth, 14, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...textoEscuro);
  doc.text("AVP Conecta", marginX, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textoSuave);
  doc.text("Plataforma de Gestão de Comunicados", marginX, 58);
  doc.text(`Gerado em: ${formatarDataGeracao()}`, pageWidth - marginX, 42, { align: "right" });

  doc.setDrawColor(...amarelo);
  doc.setLineWidth(1);
  doc.line(marginX, 74, pageWidth - marginX, 74);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...textoEscuro);
  doc.text("Auditoria de Comunicados", marginX, 106);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textoSuave);
  doc.text(`Total: ${comunicados.length} comunicado(s)`, marginX, 124);

  doc.setDrawColor(...cinzaLinha);
  doc.setLineWidth(0.6);
  doc.line(marginX, 138, pageWidth - marginX, 138);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...textoEscuro);
  doc.text("Lista de Comunicados", marginX, 158);

  const body = comunicados.map((c) => {
    const assunto = parseAssuntos(c.assunto).join(", ") || "-";
    const visib = c.visibilidade.includes("Todos") ? "Todos" : c.visibilidade.join(", ");
    return [
      c.titulo,
      assunto,
      visib,
      c.criadoPorNome || "-",
      c.criadoPor || "-",
      formatarDataCurta(c.criadoEm),
      formatarDataCurta(c.dataValidade),
    ];
  });

  autoTable(doc, {
    startY: 172,
    head: [["TÍTULO", "ASSUNTO", "VISIBILIDADE", "CRIADO POR", "MATRÍCULA", "CRIADO EM", "VALIDADE"]],
    body,
    margin: { left: marginX, right: marginX },
    tableWidth: pageWidth - marginX * 2,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      textColor: textoEscuro,
      cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
      valign: "middle",
      lineColor: cinzaLinha,
      lineWidth: 0.45,
    },
    headStyles: { fillColor: preto, textColor: branco, fontStyle: "bold", halign: "left" },
    bodyStyles: { fillColor: [255, 255, 255], halign: "left" },
    didDrawCell(data) {
      if (data.section === "head" && data.row.index === 0) {
        doc.setDrawColor(...amarelo);
        doc.setLineWidth(1);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    },
    columnStyles: {
      0: { cellWidth: 180 },
      1: { cellWidth: 110 },
      2: { cellWidth: 120 },
      3: { cellWidth: 130 },
      4: { cellWidth: 80 },
      5: { cellWidth: 70 },
      6: { cellWidth: 64 },
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 172;
  const resumoY = finalY + 14;

  doc.setDrawColor(...amarelo);
  doc.setLineWidth(2);
  doc.line(marginX + 2, resumoY - 2, marginX + 2, resumoY + 18);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...textoEscuro);
  doc.text(`Total: ${comunicados.length} comunicado(s)`, marginX + 10, resumoY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...textoSuave);
  doc.text(`AVP Conecta • ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 20, { align: "center" });

  doc.save(`auditoria_comunicados_${slugifyData()}.pdf`);
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export const AuditExportService = {
  async exportarEventos({
    eventos,
    tipoArquivo,
  }: {
    eventos: Evento[];
    tipoArquivo: ExportFileType;
  }) {
    if (tipoArquivo === "excel") {
      await exportarEventosExcel(eventos);
      return;
    }
    await exportarEventosPdf(eventos);
  },

  async exportarComunicados({
    comunicados,
    tipoArquivo,
  }: {
    comunicados: Comunicado[];
    tipoArquivo: ExportFileType;
  }) {
    if (tipoArquivo === "excel") {
      await exportarComunicadosExcel(comunicados);
      return;
    }
    await exportarComunicadosPdf(comunicados);
  },
};
