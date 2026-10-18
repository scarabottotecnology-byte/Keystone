import { createClient } from "jsr:@supabase/supabase-js@2";
import { BlobReader, Uint8ArrayWriter, ZipReader } from "jsr:@zip-js/zip-js@2";

const ALLOWED_HOST = "assets.api.gamma.app";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

Deno.serve(async (req: Request) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const provided = req.headers.get("x-automation-secret");
  if (!provided) return json({ error: "unauthorized" }, 401);
  const { data: valid, error: authError } = await admin.rpc(
    "verify_automation_secret",
    { p_secret: provided },
  );
  if (authError || valid !== true) return json({ error: "unauthorized" }, 401);

  const { source_url, prefix, peek } = await req.json();
  if (!source_url || !prefix || !/^[a-z0-9-]+$/.test(prefix)) {
    return json({ error: "source_url and a slug prefix are required" }, 400);
  }
  if (new URL(source_url).hostname !== ALLOWED_HOST) {
    return json({ error: "host not allowed" }, 400);
  }

  const res = await fetch(source_url);
  if (!res.ok) {
    return json({ error: `failed to fetch zip: ${res.status}` }, 502);
  }
  const reader = new ZipReader(new BlobReader(await res.blob()));
  const entries = (await reader.getEntries()).filter((e) =>
    !e.directory && /\.png$/i.test(e.filename)
  );
  const num = (n: string) =>
    parseInt((n.split("/").pop() ?? n).match(/\d+/)?.[0] ?? "0", 10);
  entries.sort((a, b) => num(a.filename) - num(b.filename));
  const peekSet = new Set<number>(Array.isArray(peek) ? peek : []);

  const files: unknown[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.directory) continue; // já filtrado acima; estreita o tipo
    const bytes = await entry.getData(new Uint8ArrayWriter());
    const path = `${prefix}-${String(i + 1).padStart(2, "0")}.png`;
    if (peekSet.size === 0) {
      const { error } = await admin.storage.from("linkedin-artes").upload(
        path,
        bytes,
        { contentType: "image/png", upsert: true },
      );
      if (error) return json({ error: error.message, path }, 500);
    }
    files.push({
      path,
      source: entries[i].filename,
      bytes: bytes.length,
      ...(peekSet.has(i + 1) ? { b64: toBase64(bytes) } : {}),
    });
  }
  await reader.close();
  return json({ ok: true, count: files.length, files });
});
