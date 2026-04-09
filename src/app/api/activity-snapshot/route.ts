import { NextResponse } from "next/server";

import { getAppDataSource } from "@/lib/app-config";
import { getActivitySnapshot } from "@/lib/repositories/requests";

export async function GET() {
  if (getAppDataSource() !== "supabase") {
    return NextResponse.json({ error: "UNSUPPORTED_DATA_SOURCE" }, { status: 400 });
  }

  const snapshot = await getActivitySnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
