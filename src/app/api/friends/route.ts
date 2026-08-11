import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { listFriends, requestFriend } from "@/lib/friends";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const friends = await listFriends(auth.supabase, auth.user.id);
    return NextResponse.json({ friends });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load friends." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { userId?: string };
  try {
    body = (await request.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const result = await requestFriend(auth.supabase, auth.user.id, userId);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    userId,
    status: result.friendshipStatus ?? "outgoing",
  });
}
