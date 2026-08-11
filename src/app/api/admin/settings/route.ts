import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { setSiteSetting } from "@/lib/site-settings";
import {
  CHAT_REFRESH_INTERVAL_KEY,
  clampChatRefreshInterval,
  DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
  MAX_CHAT_REFRESH_INTERVAL_SECONDS,
  MIN_CHAT_REFRESH_INTERVAL_SECONDS,
} from "@/lib/site-settings-constants";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const service = createServiceClient() ?? admin.supabase;
  const { data, error } = await service
    .from("site_settings")
    .select("key, value, updated_at")
    .eq("key", CHAT_REFRESH_INTERVAL_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    chatRefreshIntervalSeconds: clampChatRefreshInterval(
      data?.value ?? DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
    ),
    min: MIN_CHAT_REFRESH_INTERVAL_SECONDS,
    max: MAX_CHAT_REFRESH_INTERVAL_SECONDS,
    updatedAt: data?.updated_at ?? null,
  });
}

type PatchBody = {
  chatRefreshIntervalSeconds?: number | string;
};

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const seconds = clampChatRefreshInterval(body.chatRefreshIntervalSeconds);
  const result = await setSiteSetting(
    CHAT_REFRESH_INTERVAL_KEY,
    String(seconds),
  );
  if ("error" in result && result.error) {
    // Fallback: try with admin client if service role missing.
    const { error } = await admin.supabase.from("site_settings").upsert(
      {
        key: CHAT_REFRESH_INTERVAL_KEY,
        value: String(seconds),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    chatRefreshIntervalSeconds: seconds,
  });
}
