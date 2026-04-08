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
    "/activity/:path*",
    "/create/:path*",
    "/notifications/:path*",
    "/profile/:path*",
  ],
};
