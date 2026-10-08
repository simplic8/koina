"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ForumUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose an HTML file.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("title", title);
      body.set("description", description);
      body.set("file", file);
      const res = await fetch("/api/forum/sessions", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as {
        error?: string;
        session?: { id: string };
      };
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      router.push(`/forum/${data.session!.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-[8px] border border-ink-15 bg-surface p-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Upload a deck</h2>
        <p className="mt-1 text-sm text-ink-70">
          HTML slide decks (like your workshop file). Admins can present; anyone
          with the link can view and join activities.
        </p>
      </div>
      <label className="block text-sm font-medium">
        Title
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
        />
      </label>
      <label className="block text-sm font-medium">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
        />
      </label>
      <label className="block text-sm font-medium">
        HTML file
        <input
          required
          type="file"
          accept=".html,text/html"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1.5 block w-full text-sm"
        />
      </label>
      {error ? <p className="text-sm text-accent-600">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Create forum session"}
      </Button>
    </form>
  );
}
