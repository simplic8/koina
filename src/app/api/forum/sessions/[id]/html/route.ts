import { NextResponse } from "next/server";
import { injectForumBridge } from "@/lib/forum/bridge";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  if (!isSupabaseConfigured()) {
    return new NextResponse("Supabase is not configured.", { status: 503 });
  }
  const service = createServiceClient();
  if (!service) {
    return new NextResponse("Supabase is not configured.", { status: 503 });
  }

  const { id } = await params;
  const modeParam = new URL(request.url).searchParams.get("mode");
  const mode = modeParam === "present" ? "present" : "view";

  const { data: session, error } = await service
    .from("forum_sessions")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !session?.storage_path) {
    return new NextResponse("Deck not found.", { status: 404 });
  }

  const { data: file, error: downloadError } = await service.storage
    .from("forum-decks")
    .download(session.storage_path);

  if (downloadError || !file) {
    return new NextResponse(
      downloadError?.message || "Could not load deck HTML.",
      { status: 500 },
    );
  }

  const raw = await file.text();
  const html = injectForumBridge(raw, mode, id);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
