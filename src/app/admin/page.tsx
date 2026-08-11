import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

async function getStats() {
  if (!isSupabaseConfigured()) {
    return {
      users: 0,
      users7d: 0,
      active: 0,
      suspended: 0,
      signups: [] as { day: string; count: number }[],
      usingSeed: true,
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000).toISOString();

  const [users, users7d, active, suspended, recentProfiles] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", d7),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "suspended"),
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", new Date(now - 14 * 86400000).toISOString())
      .order("created_at", { ascending: true }),
  ]);

  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of recentProfiles.data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }

  return {
    users: users.count ?? 0,
    users7d: users7d.count ?? 0,
    active: active.count ?? 0,
    suspended: suspended.count ?? 0,
    signups: Array.from(buckets.entries()).map(([day, count]) => ({
      day,
      count,
    })),
    usingSeed: false,
  };
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-[6px] border border-ink-08 bg-base p-5">
      <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.08em] text-ink-40 uppercase">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-40">{hint}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  if (!stats) {
    return <p>Unable to load stats.</p>;
  }

  const maxSignup = Math.max(1, ...stats.signups.map((s) => s.count));

  return (
    <div>
      <h1 className="mb-2 text-3xl">Dashboard</h1>
      <p className="mb-8 text-ink-70">
        Usage overview for KOINA.
        {stats.usingSeed &&
          " Showing seed placeholders until Supabase is connected."}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Users"
          value={stats.users}
          hint={`+${stats.users7d} in 7d`}
        />
        <StatCard
          label="Active"
          value={stats.active}
          hint={`${stats.suspended} suspended`}
        />
      </div>

      <div className="rounded-[6px] border border-ink-08 bg-base p-5">
        <h2 className="mb-4 text-lg">Signups · last 14 days</h2>
        <div className="flex h-32 items-end gap-1.5">
          {stats.signups.map((s) => (
            <div key={s.day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-accent-500"
                style={{
                  height: `${Math.max(4, (s.count / maxSignup) * 100)}%`,
                }}
                title={`${s.day}: ${s.count}`}
              />
              <span className="font-[family-name:var(--font-ibm-plex-mono)] text-[9px] text-ink-40">
                {s.day.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
