import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { declineOrCancelFriend } from "@/lib/friends";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId } = await context.params;
  const result = await declineOrCancelFriend(
    auth.supabase,
    auth.user.id,
    userId,
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, userId, status: "none" });
}
