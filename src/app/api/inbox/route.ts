import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import {
  getUnreadInboxCount,
  listConversations,
  listNotifications,
} from "@/lib/inbox";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [notifications, conversations, unread] = await Promise.all([
      listNotifications(auth.supabase, auth.user.id),
      listConversations(auth.supabase, auth.user.id),
      getUnreadInboxCount(auth.supabase, auth.user.id),
    ]);
    return NextResponse.json({ notifications, conversations, unread });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load inbox." },
      { status: 500 },
    );
  }
}
