import { createClient } from "jsr:@supabase/supabase-js@2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const BASE =
  "https://rplnjrqpzqznbxfascqs.supabase.co/storage/v1/object/public/linkedin-artes/";

Deno.serve(async (req: Request) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const secret = req.headers.get("x-automation-secret") ?? "";
  const { data: ok } = await admin.rpc("verify_automation_secret", {
    p_secret: secret,
  });
  if (!ok) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
    });
  }
  const { path, width = 600, height = 750, original = false } = await req
    .json();
  if (!path || typeof path !== "string" || path.includes("..")) {
    return new Response(JSON.stringify({ error: "bad path" }), { status: 400 });
  }
  let r: Response;
  let mode = "original";
  if (original) {
    r = await fetch(BASE + path);
  } else {
    mode = "render";
    r = await fetch(
      `https://rplnjrqpzqznbxfascqs.supabase.co/storage/v1/render/image/public/linkedin-artes/${path}?width=${width}&height=${height}&resize=contain&quality=70&format=origin`,
    );
    if (!r.ok) {
      r = await fetch(BASE + path);
      mode = "original";
    }
  }
  if (!r.ok) {
    return new Response(JSON.stringify({ error: `fetch ${r.status}` }), {
      status: 502,
    });
  }
  const bytes = new Uint8Array(await r.arrayBuffer());
  return new Response(
    JSON.stringify({
      path,
      mode,
      type: r.headers.get("content-type"),
      bytes: bytes.length,
      b64: encodeBase64(bytes),
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
