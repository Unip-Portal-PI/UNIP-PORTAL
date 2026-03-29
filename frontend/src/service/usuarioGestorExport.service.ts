// src/service/usuarioGestorExport.service.ts
"use client";

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { UsuarioGestor, PERMISSION_LABEL } from "@/src/types/usuarioGestor";
import { UserRole } from "@/src/types/user";
import {
  ExportFileType,
  ExportStatusOption,
} from "@/app/components/gestor/modal/ModalExportarUsuarios";

type UsuarioStatusNormalizado = ExportStatusOption;

interface ExportarUsuariosPayload {
  usuarios: UsuarioGestor[];
  perfis: UserRole[];
  status: ExportStatusOption[];
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

function obterStatusUsuario(usuario: UsuarioGestor): UsuarioStatusNormalizado {
  if (usuario.deletedAt) return "excluido";
  return usuario.ativo ? "ativo" : "inativo";
}

function labelStatus(status: UsuarioStatusNormalizado) {
  if (status === "ativo") return "Ativo";
  if (status === "inativo") return "Inativo";
  return "Excluído";
}

function filtrarUsuarios(
  usuarios: UsuarioGestor[],
  perfis: UserRole[],
  status: ExportStatusOption[]
) {
  return usuarios.filter((usuario) => {
    const statusUsuario = obterStatusUsuario(usuario);
    return perfis.includes(usuario.permission) && status.includes(statusUsuario);
  });
}

function buildResumoPartes(usuarios: UsuarioGestor[]) {
  const administradores = usuarios.filter((u) => u.permission === "adm").length;
  const colaboradores = usuarios.filter((u) => u.permission === "colaborador").length;
  const alunos = usuarios.filter((u) => u.permission === "aluno").length;
  const ativos = usuarios.filter((u) => !u.deletedAt && u.ativo).length;
  const inativos = usuarios.filter((u) => !u.deletedAt && !u.ativo).length;
  const excluidos = usuarios.filter((u) => !!u.deletedAt).length;

  return {
    total: usuarios.length,
    administradores,
    colaboradores,
    alunos,
    ativos,
    inativos,
    excluidos,
  };
}

function buildResumo(usuarios: UsuarioGestor[]) {
  const resumo = buildResumoPartes(usuarios);

  const partes = [
    `Total: ${resumo.total} usuário${resumo.total === 1 ? "" : "s"}`,
    `Administradores: ${resumo.administradores}`,
  ];

  if (resumo.colaboradores > 0) partes.push(`Colaboradores: ${resumo.colaboradores}`);
  if (resumo.alunos > 0) partes.push(`Alunos: ${resumo.alunos}`);
  if (resumo.ativos > 0) partes.push(`Ativos: ${resumo.ativos}`);
  if (resumo.inativos > 0) partes.push(`Inativos: ${resumo.inativos}`);
  if (resumo.excluidos > 0) partes.push(`Excluídos: ${resumo.excluidos}`);

  return partes.join("   •   ");
}

async function exportarExcel(usuarios: UsuarioGestor[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Gestão de Usuários", {
    views: [{ showGridLines: false }],
  });

  const amarelo = "FFF5C518";
  const preto = "FF2B2B2B";
  const cinzaTexto = "FF6B6B6B";
  const cinzaLinha = "FFD2D2D2";
  const cinzaMuitoClaro = "FFF7F7F7";
  const branco = "FFFFFFFF";

  worksheet.columns = [
    { key: "nome", width: 30 },
    { key: "social", width: 14 },
    { key: "email", width: 32 },
    { key: "matricula", width: 15 },
    { key: "perfil", width: 18 },
    { key: "status", width: 14 },
    { key: "espaco", width: 4 },
  ];

  worksheet.getRow(1).height = 14;
  for (let col = 1; col <= 7; col++) {
    worksheet.getRow(1).getCell(col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: amarelo },
    };
  }

  worksheet.mergeCells("A3:D3");
  worksheet.mergeCells("E3:G3");
  worksheet.mergeCells("A4:D4");

  worksheet.getRow(3).height = 24;
  worksheet.getRow(4).height = 18;

  const tituloTop = worksheet.getCell("A3");
  tituloTop.value = "AVP Conecta";
  tituloTop.font = { name: "Arial", size: 16, bold: true, color: { argb: preto } };
  tituloTop.alignment = { vertical: "middle", horizontal: "left" };

  const subtituloTop = worksheet.getCell("A4");
  subtituloTop.value = "Plataforma de Gestão de Eventos";
  subtituloTop.font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  subtituloTop.alignment = { vertical: "middle", horizontal: "left" };

  const dataGeracao = worksheet.getCell("E3");
  dataGeracao.value = `Gerado em: ${formatarDataGeracao()}`;
  dataGeracao.font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  dataGeracao.alignment = { vertical: "middle", horizontal: "right" };

  worksheet.getRow(6).height = 4;
  for (let col = 1; col <= 7; col++) {
    worksheet.getRow(6).getCell(col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: amarelo },
    };
  }

  worksheet.mergeCells("A8:G8");
  worksheet.mergeCells("A9:G9");
  worksheet.getRow(8).height = 22;
  worksheet.getRow(9).height = 18;

  const titulo = worksheet.getCell("A8");
  titulo.value = "Gestão de Usuários";
  titulo.font = { name: "Arial", size: 14, bold: true, color: { argb: preto } };
  titulo.alignment = { vertical: "middle", horizontal: "left" };

  const descricao = worksheet.getCell("A9");
  descricao.value = "Lista completa de usuários cadastrados na plataforma";
  descricao.font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  descricao.alignment = { vertical: "middle", horizontal: "left" };

  const headerRowNumber = 11;
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.height = 24;

  const headers = ["NOME COMPLETO", "NOME SOCIAL", "E-MAIL", "MATRÍCULA", "PERFIL", "STATUS"];
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: branco } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: preto } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin", color: { argb: cinzaLinha } },
      bottom: { style: "thin", color: { argb: cinzaLinha } },
      left: { style: "thin", color: { argb: cinzaLinha } },
      right: { style: "thin", color: { argb: cinzaLinha } },
    };
  });

  const firstDataRow = headerRowNumber + 1;

  usuarios.forEach((usuario, index) => {
    const rowNumber = firstDataRow + index;
    const row = worksheet.getRow(rowNumber);
    row.height = 24;

    const status = obterStatusUsuario(usuario);

    const values = [
      usuario.nome,
      usuario.apelido ? `@${usuario.apelido.replace(/^@/, "")}` : "-",
      usuario.email,
      usuario.matricula,
      PERMISSION_LABEL[usuario.permission],
      labelStatus(status),
    ];

    values.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      cell.font = { name: "Arial", size: 9, color: { argb: preto } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cinzaMuitoClaro } };
      cell.alignment = {
        vertical: "middle",
        horizontal: colIndex >= 3 ? "center" : "left",
      };
      cell.border = {
        top: { style: "thin", color: { argb: cinzaLinha } },
        bottom: { style: "thin", color: { argb: cinzaLinha } },
        left: { style: "thin", color: { argb: cinzaLinha } },
        right: { style: "thin", color: { argb: cinzaLinha } },
      };
    });
  });

  const resumoPartes = buildResumoPartes(usuarios);
  const resumoTituloRow = firstDataRow + usuarios.length + 2;
  const resumoDetalheRow = resumoTituloRow + 1;

  worksheet.getRow(resumoTituloRow).height = 20;
  worksheet.getRow(resumoDetalheRow).height = 18;

  worksheet.getCell(`A${resumoTituloRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: amarelo },
  };
  worksheet.getCell(`A${resumoDetalheRow}`).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: amarelo },
  };

  worksheet.mergeCells(`B${resumoTituloRow}:G${resumoTituloRow}`);
  const resumoTitulo = worksheet.getCell(`B${resumoTituloRow}`);
  resumoTitulo.value = `Total: ${resumoPartes.total} usuário${resumoPartes.total === 1 ? "" : "s"}`;
  resumoTitulo.font = { name: "Arial", size: 10, bold: true, color: { argb: preto } };
  resumoTitulo.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.mergeCells(`B${resumoDetalheRow}:G${resumoDetalheRow}`);
  const resumoDesc = worksheet.getCell(`B${resumoDetalheRow}`);
  resumoDesc.value = buildResumo(usuarios).replace(
    `Total: ${resumoPartes.total} usuário${resumoPartes.total === 1 ? "" : "s"}   •   `,
    ""
  );
  resumoDesc.font = { name: "Arial", size: 9, color: { argb: cinzaTexto } };
  resumoDesc.alignment = { vertical: "middle", horizontal: "left" };

  const footerRowNumber = resumoDetalheRow + 3;
  worksheet.mergeCells(`A${footerRowNumber}:G${footerRowNumber}`);
  const footerCell = worksheet.getCell(`A${footerRowNumber}`);
  footerCell.value = `AVP Conecta  •  ${new Date().getFullYear()}`;
  footerCell.font = { name: "Arial", size: 8, color: { argb: cinzaTexto } };
  footerCell.alignment = { vertical: "middle", horizontal: "center" };

  const barraInferiorRow = footerRowNumber + 1;
  worksheet.getRow(barraInferiorRow).height = 14;
  for (let col = 1; col <= 7; col++) {
    worksheet.getRow(barraInferiorRow).getCell(col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: amarelo },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  salvarBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "gestao_usuarios_avp.xlsx"
  );
}

async function exportarPdf(usuarios: UsuarioGestor[]) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const amarelo: [number, number, number] = [245, 197, 24];
  const textoEscuro: [number, number, number] = [43, 43, 43];
  const textoSuave: [number, number, number] = [107, 107, 107];
  const linhaClara: [number, number, number] = [210, 210, 210];

  doc.setFillColor(...amarelo);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.rect(0, pageHeight - 18, pageWidth, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...textoEscuro);
  doc.text("AVP Conecta", 40, 68);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textoSuave);
  doc.text("Plataforma de Gestão de Eventos", 40, 88);
  doc.text(`Gerado em: ${formatarDataGeracao()}`, pageWidth - 40, 68, { align: "right" });

  doc.setFillColor(...amarelo);
  doc.rect(40, 108, pageWidth - 80, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...textoEscuro);
  doc.text("Gestão de Usuários", 40, 145);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textoSuave);
  doc.text("Lista completa de usuários cadastrados na plataforma", 40, 164);

  const body = usuarios.map((usuario) => {
    const status = obterStatusUsuario(usuario);
    return [
      usuario.nome,
      usuario.apelido ? `@${usuario.apelido.replace(/^@/, "")}` : "-",
      usuario.email,
      usuario.matricula,
      PERMISSION_LABEL[usuario.permission],
      labelStatus(status),
    ];
  });

  autoTable(doc, {
    startY: 190,
    head: [["NOME COMPLETO", "NOME SOCIAL", "E-MAIL", "MATRÍCULA", "PERFIL", "STATUS"]],
    body,
    margin: { left: 60, right: 60 },
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: textoEscuro,
      cellPadding: { top: 10, right: 8, bottom: 10, left: 8 },
      valign: "middle",
      lineColor: linhaClara,
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [43, 43, 43],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 150 },
      1: { cellWidth: 70 },
      2: { cellWidth: 170 },
      3: { cellWidth: 75 },
      4: { cellWidth: 80 },
      5: { cellWidth: 60 },
    },
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 190;

  const resumoX = 60;
  const resumoY = finalY + 18;
  const resumo = buildResumoPartes(usuarios);

  doc.setFillColor(...amarelo);
  doc.rect(resumoX, resumoY - 10, 3, 34, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textoEscuro);
  doc.text(
    `Total: ${resumo.total} usuário${resumo.total === 1 ? "" : "s"}`,
    resumoX + 12,
    resumoY
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...textoSuave);
  doc.text(
    `Administradores: ${resumo.administradores}   •   Colaboradores: ${resumo.colaboradores}   •   Alunos: ${resumo.alunos}   •   Ativos: ${resumo.ativos}`,
    resumoX + 12,
    resumoY + 18
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textoSuave);
  doc.text(`AVP Conecta  •  ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 26, {
    align: "center",
  });

  doc.save("gestao_usuarios_avp.pdf");
}

export const UsuarioGestorExportService = {
  async exportar({
    usuarios,
    perfis,
    status,
    tipoArquivo,
  }: ExportarUsuariosPayload) {
    const usuariosFiltrados = filtrarUsuarios(usuarios, perfis, status);

    if (tipoArquivo === "excel") {
      await exportarExcel(usuariosFiltrados);
      return;
    }

    await exportarPdf(usuariosFiltrados);
  },
};