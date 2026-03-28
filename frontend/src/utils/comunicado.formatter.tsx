// src/utils/comunicado.formatter.tsx

import React from "react";

function resolveHref(value: string): string {
  const raw = value.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return `https://${raw}`;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const regex = /(\*[^*]+\*|@\S+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${match.index}`} className="font-bold text-slate-900 dark:text-white">
          {token.slice(1, -1)}
        </strong>
      );
    } else if (token.startsWith("@") && token.length > 1) {
      const label = token.slice(1);
      nodes.push(
        <a
          key={`${keyPrefix}-l-${match.index}`}
          href={resolveHref(label)}
          target="_blank"
          rel="noreferrer noopener"
          className="break-all font-medium text-amber-600 underline underline-offset-2 dark:text-[#FFDE00]"
        >
          {label}
        </a>
      );
    } else {
      nodes.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function renderConteudoFormatado(conteudo: string): React.ReactNode {
  const blocos = conteudo
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim())
    .filter(Boolean);

  return blocos.map((bloco, blocoIndex) => {
    const linhas = bloco.split("\n").filter((linha) => linha.trim().length > 0);

    return (
      <p
        key={`bloco-${blocoIndex}`}
        className="mb-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700 dark:text-slate-300"
      >
        {linhas.map((linha, linhaIndex) => (
          <React.Fragment key={`linha-${blocoIndex}-${linhaIndex}`}>
            {renderInline(linha, `bloco-${blocoIndex}-linha-${linhaIndex}`)}
            {linhaIndex < linhas.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}
