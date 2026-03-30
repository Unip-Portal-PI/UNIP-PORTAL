import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/src/service/api-base-url";

type RouteContext = { params: Promise<{ path: string[] }> };

function joinPath(segments: string[]) {
  // evita "//" e evita segment vazio
  return segments.filter(Boolean).map(encodeURIComponent).join("/");
}

function buildTargetUrl(segments: string[], requestUrl: string) {
  const url = new URL(requestUrl);
  const targetPath = joinPath(segments);
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}/${targetPath}${url.search}`;
}

async function getForwardBody(request: Request, headers: Headers) {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD") return undefined;

  const contentType = headers.get("content-type") || "";

  // JSON
  if (contentType.includes("application/json")) {
    return await request.text();
  }

  // FormData / upload
  if (contentType.includes("multipart/form-data")) {
    // deixa o fetch setar o boundary automaticamente
    headers.delete("content-type");
    return await request.formData();
  }

  // URL encoded
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return await request.text();
  }

  // fallback binário/texto
  const buf = await request.arrayBuffer();
  return buf;
}

function filterResponseHeaders(headers: Headers) {
  const out = new Headers();
  headers.forEach((value, key) => {
    const k = key.toLowerCase();
    // evita headers que podem quebrar o response no Next/Edge
    if (k === "set-cookie") return;
    if (k === "content-encoding") return;
    if (k === "transfer-encoding") return;
    out.set(key, value);
  });
  return out;
}

async function proxy(request: Request, ctx: RouteContext) {
  const token = (await cookies()).get("token")?.value;
  const { path } = await ctx.params;
  const targetUrl = buildTargetUrl(path ?? [], request.url);

  const headers = new Headers(request.headers);

  // não encaminhar cookies do browser para o backend
  headers.delete("cookie");
  headers.delete("host");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const body = await getForwardBody(request, headers);

  const upstream = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: body as any,
    cache: "no-store",
    // @ts-expect-error - necessário quando body é stream em Node (e seguro aqui)
    duplex: "half",
  });

  // passa o status e o conteúdo (inclui binário)
  const resHeaders = filterResponseHeaders(upstream.headers);
  const arrayBuffer = await upstream.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export async function GET(request: Request, ctx: RouteContext) {
  return proxy(request, ctx);
}

export async function POST(request: Request, ctx: RouteContext) {
  return proxy(request, ctx);
}

export async function PUT(request: Request, ctx: RouteContext) {
  return proxy(request, ctx);
}

export async function PATCH(request: Request, ctx: RouteContext) {
  return proxy(request, ctx);
}

export async function DELETE(request: Request, ctx: RouteContext) {
  return proxy(request, ctx);
}
