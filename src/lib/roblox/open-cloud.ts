const BASE = "https://apis.roblox.com/cloud/v2";

export type OrderedEntry = {
  path?: string;
  id?: string;
  value?: number;
};

export type ListOrderedEntriesResponse = {
  orderedDataStoreEntries?: OrderedEntry[];
  nextPageToken?: string;
};

export function isRobloxConfigured() {
  return Boolean(process.env.ROBLOX_OPEN_CLOUD_API_KEY);
}

export async function listOrderedEntries(params: {
  universeId: string;
  dataStoreId: string;
  scope?: string;
  pageToken?: string;
  maxPageSize?: number;
}): Promise<ListOrderedEntriesResponse> {
  const apiKey = process.env.ROBLOX_OPEN_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("ROBLOX_OPEN_CLOUD_API_KEY is not set");
  }

  const scope = params.scope ?? "global";
  const url = new URL(
    `${BASE}/universes/${params.universeId}/ordered-data-stores/${encodeURIComponent(params.dataStoreId)}/scopes/${encodeURIComponent(scope)}/entries`,
  );
  url.searchParams.set("orderBy", "value desc");
  url.searchParams.set("maxPageSize", String(params.maxPageSize ?? 100));
  if (params.pageToken) {
    url.searchParams.set("pageToken", params.pageToken);
  }

  const res = await fetch(url, {
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Roblox Open Cloud error (${res.status}): ${text}`);
  }

  return res.json();
}
