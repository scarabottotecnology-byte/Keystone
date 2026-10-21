import { createClient } from "jsr:@supabase/supabase-js@2";
import { PDFDocument } from "npm:pdf-lib@1.17.1";

// Junta PNGs do bucket num PDF (documento/carrossel do LinkedIn). Grátis, sem marca d'água.
// body: { dst: "x.pdf", paths: ["x-01.png", ...], title? }
const BUCKET = "linkedin-artes";
const PUB =
  "https://rplnjrqpzqznbxfascqs.supabase.co/storage/v1/object/public/linkedin-artes/";

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
  try {
    const { dst, paths, title } = await req.json();
    if (
      !dst || !String(dst).endsWith(".pdf") || String(dst).includes("..") ||
      !Array.isArray(paths) || paths.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "dst .pdf e paths obrigatórios" }),
        { status: 400 },
      );
    }
    const pdf = await PDFDocument.create();
    if (title) pdf.setTitle(String(title));
    pdf.setAuthor("Keystone Controladoria");
    for (const p of paths) {
      const r = await fetch(PUB + p + "?v=" + Date.now());
      if (!r.ok) throw new Error(`fetch ${p} ${r.status}`);
      const bytes = new Uint8Array(await r.arrayBuffer());
      const img = String(p).toLowerCase().endsWith(".png")
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
      const page = pdf.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    const out = await pdf.save();
    const { error } = await admin.storage.from(BUCKET).upload(dst, out, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(
      JSON.stringify({ ok: true, dst, pages: paths.length, bytes: out.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error)?.message ?? e) }),
      { status: 500 },
    );
  }
});
