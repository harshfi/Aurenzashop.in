import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids") || "";
  const limit = url.searchParams.get("limit") || "12";

  const upstream = new URL(`${API_BASE}/products`);
  if (ids) upstream.searchParams.set("ids", ids);
  upstream.searchParams.set("limit", limit);
  upstream.searchParams.set("sort", "newest");

  const response = await fetch(upstream.toString(), { cache: "no-store" });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
