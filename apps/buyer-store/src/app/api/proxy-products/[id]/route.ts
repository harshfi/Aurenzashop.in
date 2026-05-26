import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const identifier = encodeURIComponent(String(id || "").trim());

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Product id is required." },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE}/products/${identifier}`, {
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to fetch product." },
      { status: 500 }
    );
  }
}
