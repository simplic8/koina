import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { listThreadMessages, sendDirectMessage } from "@/lib/inbox";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const withUser = new URL(request.url).searchParams.get("with")?.trim() || "";
  if (!withUser) {
    return NextResponse.json(
      { error: "Missing conversation partner." },
      { status: 400 },
    );
  }

  try {
    const messages = await listThreadMessages(
      auth.supabase,
      auth.user.id,
      withUser,
    );
    return NextResponse.json({ messages });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not load messages.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { userId?: string; body?: string };
  try {
    body = (await request.json()) as { userId?: string; body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const text = typeof body.body === "string" ? body.body : "";
  const result = await sendDirectMessage(
    auth.supabase,
    auth.user.id,
    userId,
    text,
  );
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
