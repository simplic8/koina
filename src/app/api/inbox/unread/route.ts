import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { getUnreadInboxCount } from "@/lib/inbox";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const unread = await getUnreadInboxCount(auth.supabase, auth.user.id);
    return NextResponse.json({ unread });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not load unread count.",
      },
      { status: 500 },
    );
  }
}
