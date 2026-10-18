import { createClient } from "jsr:@supabase/supabase-js@2";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const secret = req.headers.get("x-automation-secret") ?? "";
  const { data: authorized, error: authError } = await supabaseAdmin.rpc(
    "verify_automation_secret",
    { p_secret: secret },
  );
  if (authError || authorized !== true) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
    });
  }

  let body: {
    source_url?: string;
    base64?: string;
    path?: string;
    content_type?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json body" }), {
      status: 400,
    });
  }

  const { source_url, base64, path, content_type } = body;
  if (!path || (!source_url && !base64)) {
    return new Response(
      JSON.stringify({
        error: "path and one of source_url/base64 are required",
      }),
      { status: 400 },
    );
  }
  if (path.includes("..") || path.startsWith("/")) {
    return new Response(JSON.stringify({ error: "invalid path" }), {
      status: 400,
    });
  }

  let bytes: Uint8Array;
  if (base64) {
    bytes = base64ToBytes(base64);
  } else {
    let url: URL;
    try {
      url = new URL(source_url!);
    } catch {
      return new Response(JSON.stringify({ error: "invalid source_url" }), {
        status: 400,
      });
    }
    if (url.protocol !== "https:") {
      return new Response(
        JSON.stringify({ error: "source_url must be https" }),
        { status: 400 },
      );
    }
    const sourceResponse = await fetch(url);
    if (!sourceResponse.ok) {
      return new Response(
        JSON.stringify({
          error: `failed to fetch source_url: ${sourceResponse.status}`,
        }),
        { status: 502 },
      );
    }
    bytes = new Uint8Array(await sourceResponse.arrayBuffer());
  }

  const { error } = await supabaseAdmin.storage
    .from("linkedin-artes")
    .upload(path, bytes, {
      contentType: content_type ?? "image/png",
      upsert: true,
    });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({ ok: true, path, bytes: bytes.length }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
