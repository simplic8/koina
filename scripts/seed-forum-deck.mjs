/**
 * Upload an HTML deck into Supabase Storage + forum_sessions.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-forum-deck.mjs "C:\\path\\to\\deck.html"
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error(
    'Pass an HTML path, e.g. node --env-file=.env.local scripts/seed-forum-deck.mjs "./deck.html"',
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const html = await readFile(path.resolve(filePath), "utf8");
const base = path
  .basename(filePath, path.extname(filePath))
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 40);
const slug = `${base || "forum"}-${Date.now().toString(36)}`;
const storagePath = `seed/${slug}.html`;
const title =
  html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
  path.basename(filePath, path.extname(filePath));

const { error: uploadError } = await supabase.storage
  .from("forum-decks")
  .upload(storagePath, html, {
    contentType: "text/html; charset=utf-8",
    upsert: true,
  });
if (uploadError) {
  console.error("Upload failed:", uploadError.message);
  process.exit(1);
}

const { data, error } = await supabase
  .from("forum_sessions")
  .insert({
    slug,
    title,
    description: "Seeded workshop deck — presenter sync + audience activities.",
    storage_path: storagePath,
    is_live: false,
    presenter_state: {},
  })
  .select("id, slug, title")
  .single();

if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}

console.log("Seeded forum session:");
console.log(`  title:   ${data.title}`);
console.log(`  open:    /forum/${data.id}`);
console.log(`  present: /forum/${data.id}/present`);
console.log(`  view:    /forum/${data.id}/view`);
