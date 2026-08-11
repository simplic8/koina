import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { markNotificationsRead } from "@/lib/inbox";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let ids: string[] | undefined;
  try {
    const body = (await request.json()) as { ids?: string[] };
    if (Array.isArray(body.ids)) {
      ids = body.ids.filter((id) => typeof id === "string");
    }
  } catch {
    // Mark all unread when body is empty/invalid.
  }

  try {
    await markNotificationsRead(auth.supabase, auth.user.id, ids);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not mark notifications read.",
      },
      { status: 500 },
    );
  }
}
