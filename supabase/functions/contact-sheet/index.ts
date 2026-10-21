// Folha de contato: miniaturas de vários arquivos do bucket numa imagem só,
// para revisar fotos e artes de uma vez antes de publicar.
// body: { paths: [...], cols?, tw?, th?, quality? }
import { createClient } from "jsr:@supabase/supabase-js@2";
import { decode, Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

const R =
  "https://rplnjrqpzqznbxfascqs.supabase.co/storage/v1/render/image/public/linkedin-artes/";

Deno.serve(async (req: Request) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: ok } = await admin.rpc("verify_automation_secret", {
    p_secret: req.headers.get("x-automation-secret") ?? "",
  });
  if (ok !== true) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
    });
  }
  const { paths, cols = 6, tw = 150, th = 150, quality = 60 } = await req
    .json();
  const rows = Math.ceil(paths.length / cols);
  const sheet = new Image(cols * tw, rows * th);
  sheet.fill(0x111111ff);
  const failed: string[] = [];
  await Promise.all(paths.map(async (p: string, i: number) => {
    try {
      const r = await fetch(
        `${R}${p}?width=${tw}&height=${th}&resize=cover&quality=70`,
      );
      if (!r.ok) throw new Error(String(r.status));
      let im = await decode(new Uint8Array(await r.arrayBuffer())) as Image;
      if (im.width !== tw || im.height !== th) im = im.cover(tw, th);
      sheet.composite(im, (i % cols) * tw, Math.floor(i / cols) * th);
    } catch (e) {
      failed.push(`${p}: ${(e as Error).message}`);
    }
  }));
  const jpg = await sheet.encodeJPEG(quality);
  return new Response(
    JSON.stringify({ bytes: jpg.length, failed, b64: encodeBase64(jpg) }),
    { headers: { "Content-Type": "application/json" } },
  );
});
