import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/src/service/api-base-url";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.sucesso || !data?.token || !data?.usuario) {
      return NextResponse.json(
        { sucesso: false, mensagem: "Matrícula ou senha inválidas." },
        { status: 401 }
      );
    }

    const res = NextResponse.json({
      sucesso: true,
      mensagem: data.mensagem,
      usuario: data.usuario,
    });

    // ✅ Token fica em cookie HttpOnly (mais seguro: não acessível via JS)
    res.cookies.set("token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // ⚠️ NÃO confie neste cookie para autorização no backend.
    // Serve apenas para UX/redirecionamento. A autorização real deve ser validada pelo backend.
    res.cookies.set("role", String(data.usuario.permission ?? ""), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      { sucesso: false, mensagem: "Erro ao fazer login." },
      { status: 500 }
    );
  }
}
