import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getAppDataSource } from "@/lib/app-config";
import { getActivitySnapshot } from "@/lib/repositories/requests";

export async function GET(request: NextRequest) {
  if (getAppDataSource() !== "supabase") {
    return NextResponse.json({ error: "UNSUPPORTED_DATA_SOURCE" }, { status: 400 });
  }

  const snapshot = await getActivitySnapshot({
    force: request.nextUrl.searchParams.get("force") === "1",
  });

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
