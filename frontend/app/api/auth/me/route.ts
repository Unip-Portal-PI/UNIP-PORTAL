import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_BASE_URL } from "@/src/service/api-base-url";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { autenticado: false, usuario: null },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { autenticado: false, usuario: null },
        { status: 401 }
      );
    }

    const usuario = await response.json().catch(() => null);

    return NextResponse.json({
      autenticado: true,
      usuario,
    });
  } catch {
    return NextResponse.json(
      { autenticado: false, usuario: null },
      { status: 401 }
    );
  }
}
