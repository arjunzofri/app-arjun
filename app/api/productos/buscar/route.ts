import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) {
    return NextResponse.json([]);
  }

  try {
    const s = neon(process.env.DATABASE_URL!);
    const rows = await s`
      SELECT DISTINCT ON (codunico)
        codunico as codigo, descript as descripcion,
        COALESCE(cantcaja, 1)::int as packing, knumezet
      FROM arjun.inv_sdo
      WHERE codunico ILIKE ${`%${q.trim()}%`}
         OR descript ILIKE ${`%${q.trim()}%`}
      ORDER BY codunico
      LIMIT 20
    `;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al buscar en WinFac" },
      { status: 500 }
    );
  }
}
