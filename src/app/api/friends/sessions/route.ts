import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { listParticipatedSessions } from "@/lib/friends";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const sessions = await listParticipatedSessions(
      auth.supabase,
      auth.user.id,
      20,
    );
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not load participated sessions.",
      },
      { status: 500 },
    );
  }
}
