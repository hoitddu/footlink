import { NextResponse, type NextRequest } from "next/server";

import { getAppDataSource, isSupabaseConfigured } from "@/lib/app-config";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (getAppDataSource() !== "supabase" || !isSupabaseConfigured()) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
