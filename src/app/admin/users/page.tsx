"use client";

import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Profile } from "@/lib/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load(query = q) {
    const res = await fetch(
      `/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load users");
      return;
    }
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    await load(q);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    await load();
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl">Users</h1>
      <p className="mb-8 text-ink-70">
        Manage roles and suspension status.
      </p>

      <form onSubmit={onSearch} className="mb-6 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search username or Discord id"
          className="flex-1 rounded-[6px] border border-ink-15 px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm" variant="outline">
          Search
        </Button>
      </form>

      {error && <p className="mb-4 text-sm text-accent-600">{error}</p>}

      <div className="overflow-x-auto rounded-[6px] border border-ink-08 bg-base">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {["User", "Role", "Status", "Joined", "Actions"].map((h) => (
                <th
                  key={h}
                  className="border-b border-ink-15 px-4 py-3 text-left font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.08em] text-ink-40 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border-b border-ink-08 px-4 py-3">
                  <div className="font-semibold">{user.username ?? "—"}</div>
                  <div className="font-[family-name:var(--font-ibm-plex-mono)] text-xs text-ink-40">
                    {user.discord_id ? `discord:${user.discord_id}` : user.id.slice(0, 8)}
                  </div>
                </td>
                <td className="border-b border-ink-08 px-4 py-3">
                  <Badge tone={user.role === "admin" ? "vetted" : "ghost"}>
                    {user.role}
                  </Badge>
                </td>
                <td className="border-b border-ink-08 px-4 py-3">
                  <Badge tone={user.status === "active" ? "live" : "ghost"}>
                    {user.status}
                  </Badge>
                </td>
                <td className="border-b border-ink-08 px-4 py-3 font-[family-name:var(--font-ibm-plex-mono)] text-xs text-ink-40">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="border-b border-ink-08 px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {user.role === "user" ? (
                      <Button
                        size="sm"
                        variant="dark"
                        disabled={busy}
                        onClick={() => patch(user.id, { role: "admin" })}
                      >
                        Make admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => patch(user.id, { role: "user" })}
                      >
                        Make user
                      </Button>
                    )}
                    {user.status === "active" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => patch(user.id, { status: "suspended" })}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => patch(user.id, { status: "active" })}
                      >
                        Reinstate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && (
          <p className="p-4 text-sm text-ink-40">No users found.</p>
        )}
      </div>
    </div>
  );
}
