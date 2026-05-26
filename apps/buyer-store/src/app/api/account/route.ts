import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { auth } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const INTERNAL_KEY =
  process.env.INTERNAL_API_KEY ||
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "";

async function resolveEmail(request: Request) {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "aurenza-local-development-secret-change-before-production";

  const token = await getToken({ req: request as never, secret });
  const session = await auth();

  return (
    (typeof token?.email === "string" ? token.email : null) ||
    (typeof session?.user?.email === "string" ? session.user.email : null)
  );
}

export async function GET(request: Request) {
  const email = await resolveEmail(request);
  if (!email) {
    return NextResponse.json({ success: false, message: "Authentication required. Please sign in." }, { status: 401 });
  }

  if (!INTERNAL_KEY) {
    return NextResponse.json(
      {
        success: false,
        message: "Server authentication bridge is not configured.",
      },
      { status: 500 }
    );
  }

  const response = await fetch(`${API_BASE}/auth/internal/buyer?email=${encodeURIComponent(email)}`, {
    method: "GET",
    headers: {
      "x-internal-api-key": INTERNAL_KEY,
    },
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PUT(request: Request) {
  const email = await resolveEmail(request);
  if (!email) {
    return NextResponse.json({ success: false, message: "Authentication required. Please sign in." }, { status: 401 });
  }

  const body = await request.json();
  if (!INTERNAL_KEY) {
    return NextResponse.json(
      {
        success: false,
        message: "Server authentication bridge is not configured.",
      },
      { status: 500 }
    );
  }

  const response = await fetch(`${API_BASE}/auth/internal/buyer?email=${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": INTERNAL_KEY,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
