import { createClient } from "jsr:@supabase/supabase-js@2";
import satori from "npm:satori@0.12.2";
import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.2";
import { encodeBase64 } from "jsr:@std/encoding@1/base64";

// Keystone post renderer: open-source Satori (layout) + Resvg (rasterizer). Free, no watermark.
// body: { dst, template, w?, h?, photo?, page?, total?, data }
const NAVY = "#0B0F1C";
const NAVY2 = "#131A2E";
const GOLD = "#E9CB81";
const WHITE = "#FFFFFF";
const MUTED = "#AEB4C6";
const BUCKET = "linkedin-artes";
const STORAGE = "https://rplnjrqpzqznbxfascqs.supabase.co/storage/v1";
const FS = "https://cdn.jsdelivr.net/npm";

let wasmReady: Promise<void> | null = null;
// deno-lint-ignore no-explicit-any
let fontsCache: any[] | null = null;

async function fonts() {
  if (fontsCache) return fontsCache;
  const spec = [
    // Display serif with lining numerals (Playfair defaults to old-style figures, which made "80" read like "8o")
    [
      "Playfair",
      700,
      `${FS}/@fontsource/dm-serif-display@5.2.5/files/dm-serif-display-latin-400-normal.woff`,
    ],
    [
      "Inter",
      400,
      `${FS}/@fontsource/inter@5.1.0/files/inter-latin-400-normal.woff`,
    ],
    [
      "Inter",
      600,
      `${FS}/@fontsource/inter@5.1.0/files/inter-latin-600-normal.woff`,
    ],
    [
      "Inter",
      800,
      `${FS}/@fontsource/inter@5.1.0/files/inter-latin-800-normal.woff`,
    ],
  ] as const;
  fontsCache = await Promise.all(spec.map(async ([name, weight, url]) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`font ${url} ${r.status}`);
    return { name, weight, style: "normal", data: await r.arrayBuffer() };
  }));
  return fontsCache;
}

function h(
  type: string,
  style: Record<string, unknown>,
  ...children: unknown[]
) {
  const kids = children.flat(Infinity).filter((c) =>
    c !== null && c !== undefined && c !== false && c !== ""
  );
  return {
    type,
    props: {
      style: { display: "flex", ...style },
      children: kids.length === 1 ? kids[0] : kids,
    },
  };
}
function img(src: string, style: Record<string, unknown>) {
  return { type: "img", props: { src, style } };
}
// "linha branca\n*linha dourada" -> stacked lines, lines starting with * are gold
function lines(text: string, style: Record<string, unknown>, gold = GOLD) {
  return h(
    "div",
    { flexDirection: "column" },
    ...String(text).split("\n").map((l) =>
      h("div", {
        ...style,
        color: l.startsWith("*") ? gold : (style.color ?? WHITE),
      }, l.replace(/^\*/, ""))
    ),
  );
}

function brand(page?: string, top = 64) {
  return h(
    "div",
    {
      position: "absolute",
      top,
      left: 80,
      right: 80,
      justifyContent: "space-between",
      alignItems: "center",
    },
    h(
      "div",
      { alignItems: "center", gap: 16 },
      h("div", {
        width: 22,
        height: 22,
        border: `3px solid ${GOLD}`,
        transform: "rotate(45deg)",
      }),
      h("div", {
        fontFamily: "Inter",
        fontWeight: 600,
        fontSize: 22,
        letterSpacing: 6,
        color: GOLD,
      }, "KEYSTONE CONTROLADORIA"),
    ),
    page
      ? h("div", {
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: 22,
        letterSpacing: 2,
        color: MUTED,
      }, page)
      : null,
  );
}

function progress(n?: number, total?: number) {
  if (!n || !total) return null;
  const segs = [];
  for (let i = 1; i <= total; i++) {
    segs.push(
      h("div", {
        flex: 1,
        height: 4,
        backgroundColor: i <= n ? GOLD : "rgba(233,203,129,0.22)",
      }),
    );
  }
  return h("div", {
    position: "absolute",
    left: 80,
    right: 80,
    bottom: 56,
    gap: 8,
  }, ...segs);
}

function swipe(show: boolean) {
  if (!show) return null;
  return h(
    "div",
    {
      position: "absolute",
      right: 80,
      bottom: 84,
      alignItems: "center",
      gap: 14,
      fontFamily: "Inter",
      fontWeight: 600,
      fontSize: 22,
      letterSpacing: 4,
      color: GOLD,
    },
    "ARRASTE",
    h("div", { width: 46, height: 2, backgroundColor: GOLD }),
  );
}

function photoLayer(
  src: string | null,
  W: number,
  H: number,
  overlay: string,
  opacity = 1,
) {
  if (!src) return null;
  return [
    img(src, {
      position: "absolute",
      top: 0,
      left: 0,
      width: W,
      height: H,
      objectFit: "cover",
      opacity,
    }),
    h("div", {
      position: "absolute",
      top: 0,
      left: 0,
      width: W,
      height: H,
      backgroundImage: overlay,
    }),
  ];
}

function kicker(t?: string) {
  return t
    ? h("div", {
      fontFamily: "Inter",
      fontWeight: 600,
      fontSize: 26,
      letterSpacing: 5,
      color: GOLD,
      marginBottom: 22,
    }, t.toUpperCase())
    : null;
}

function bullets(items: string[], size = 34) {
  return h(
    "div",
    { flexDirection: "column", gap: 22 },
    ...items.map((t) =>
      h(
        "div",
        { alignItems: "flex-start", gap: 22 },
        h("div", {
          width: 12,
          height: 12,
          backgroundColor: GOLD,
          marginTop: size * 0.42,
          flexShrink: 0,
        }),
        h("div", {
          fontFamily: "Inter",
          fontWeight: 400,
          fontSize: size,
          lineHeight: 1.35,
          color: "#E6E8EF",
          flex: 1,
        }, t),
      )
    ),
  );
}

type Ctx = {
  W: number;
  H: number;
  photo: string | null;
  page?: string;
  n?: number;
  total?: number;
  // deno-lint-ignore no-explicit-any
  d: any;
};

const templates: Record<string, (c: Ctx) => unknown> = {
  // full-bleed photo, headline at bottom
  cover: ({ W, H, photo, page, n, total, d }) =>
    h(
      "div",
      { width: W, height: H, backgroundColor: NAVY, position: "relative" },
      photoLayer(
        photo,
        W,
        H,
        `linear-gradient(180deg, rgba(11,15,28,0.55) 0%, rgba(11,15,28,0.10) 22%, rgba(11,15,28,0.35) 45%, rgba(11,15,28,0.93) 66%, ${NAVY} 100%)`,
      ),
      brand(page, d.brandTop ?? 64),
      h(
        "div",
        {
          position: "absolute",
          left: 80,
          right: 80,
          bottom: d.bottom ?? 150,
          flexDirection: "column",
        },
        kicker(d.kicker),
        lines(d.title, {
          fontFamily: "Playfair",
          fontWeight: 700,
          fontSize: d.titleSize ?? 112,
          lineHeight: 1.04,
          color: WHITE,
        }),
        d.sub
          ? h("div", {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: d.subSize ?? 38,
            lineHeight: 1.35,
            color: "#E6E8EF",
            marginTop: 30,
          }, d.sub)
          : null,
        d.chip
          ? h("div", {
            marginTop: 36,
            alignSelf: "flex-start",
            border: `2px solid ${GOLD}`,
            padding: "14px 26px",
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 26,
            color: GOLD,
            letterSpacing: 1,
          }, d.chip)
          : null,
      ),
      swipe(!!d.swipe),
      progress(n, total),
    ),

  // photo on top half, content below
  photoTop: ({ W, H, photo, page, n, total, d }) =>
    h(
      "div",
      { width: W, height: H, backgroundColor: NAVY, position: "relative" },
      photo
        ? img(photo, {
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: d.photoH ?? 700,
          objectFit: "cover",
        })
        : null,
      h("div", {
        position: "absolute",
        top: 0,
        left: 0,
        width: W,
        height: (d.photoH ?? 700) + 2,
        backgroundImage:
          `linear-gradient(180deg, rgba(11,15,28,0.70) 0%, rgba(11,15,28,0.05) 25%, rgba(11,15,28,0.20) 60%, ${NAVY} 100%)`,
      }),
      brand(page),
      h(
        "div",
        {
          position: "absolute",
          left: 80,
          right: 80,
          top: d.contentTop ?? 600,
          flexDirection: "column",
        },
        kicker(d.kicker),
        lines(d.title, {
          fontFamily: "Playfair",
          fontWeight: 700,
          fontSize: d.titleSize ?? 76,
          lineHeight: 1.08,
          color: WHITE,
        }),
        h("div", {
          width: 120,
          height: 3,
          backgroundColor: GOLD,
          marginTop: 34,
          marginBottom: 38,
        }),
        d.bullets ? bullets(d.bullets, d.bulletSize ?? 34) : null,
        d.body
          ? h("div", {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 34,
            lineHeight: 1.4,
            color: "#E6E8EF",
          }, d.body)
          : null,
      ),
      progress(n, total),
    ),

  // hero number over faded photo
  number: ({ W, H, photo, page, n, total, d }) =>
    h(
      "div",
      { width: W, height: H, backgroundColor: NAVY, position: "relative" },
      photoLayer(
        photo,
        W,
        H,
        `linear-gradient(180deg, rgba(11,15,28,0.78) 0%, rgba(11,15,28,0.90) 50%, ${NAVY} 100%)`,
        1,
      ),
      brand(page),
      h(
        "div",
        {
          position: "absolute",
          left: 80,
          right: 80,
          top: d.top ?? 210,
          flexDirection: "column",
        },
        kicker(d.kicker),
        lines(d.title, {
          fontFamily: "Playfair",
          fontWeight: 700,
          fontSize: d.titleSize ?? 64,
          lineHeight: 1.1,
          color: WHITE,
        }),
        h("div", {
          fontFamily: "Playfair",
          fontWeight: 700,
          fontSize: d.numberSize ?? 230,
          lineHeight: 1,
          color: GOLD,
          marginTop: 40,
          letterSpacing: -4,
        }, d.number),
        d.numberCaption
          ? h("div", {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: 2,
            color: MUTED,
            marginTop: 10,
          }, d.numberCaption)
          : null,
        h("div", {
          width: 120,
          height: 3,
          backgroundColor: GOLD,
          marginTop: 44,
          marginBottom: 40,
        }),
        d.bullets ? bullets(d.bullets, d.bulletSize ?? 36) : null,
        d.highlight
          ? h("div", {
            marginTop: 36,
            borderLeft: `6px solid ${GOLD}`,
            paddingLeft: 28,
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 40,
            lineHeight: 1.3,
            color: GOLD,
          }, d.highlight)
          : null,
      ),
      progress(n, total),
    ),

  // numbered list with photo strip
  list: ({ W, H, photo, page, n, total, d }) =>
    h(
      "div",
      { width: W, height: H, backgroundColor: NAVY, position: "relative" },
      photo
        ? img(photo, {
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: d.photoH ?? 470,
          objectFit: "cover",
        })
        : null,
      h("div", {
        position: "absolute",
        top: 0,
        left: 0,
        width: W,
        height: (d.photoH ?? 470) + 2,
        backgroundImage:
          `linear-gradient(180deg, rgba(11,15,28,0.75) 0%, rgba(11,15,28,0.15) 35%, ${NAVY} 100%)`,
      }),
      brand(page),
      h(
        "div",
        {
          position: "absolute",
          left: 80,
          right: 80,
          top: d.contentTop ?? 400,
          flexDirection: "column",
        },
        kicker(d.kicker),
        lines(d.title, {
          fontFamily: "Playfair",
          fontWeight: 700,
          fontSize: d.titleSize ?? 70,
          lineHeight: 1.08,
          color: WHITE,
        }),
        h(
          "div",
          { flexDirection: "column", marginTop: 40 },
          ...(d.items as string[]).map((t, i) =>
            h(
              "div",
              {
                alignItems: "center",
                gap: 30,
                paddingTop: 22,
                paddingBottom: 22,
                borderTop: `1px solid rgba(233,203,129,0.25)`,
              },
              h("div", {
                fontFamily: "Playfair",
                fontWeight: 700,
                fontSize: 46,
                color: GOLD,
                width: 70,
              }, String(i + 1).padStart(2, "0")),
              h("div", {
                fontFamily: "Inter",
                fontWeight: 400,
                fontSize: d.itemSize ?? 34,
                color: "#E6E8EF",
                flex: 1,
                lineHeight: 1.3,
              }, t),
            )
          ),
        ),
      ),
      progress(n, total),
    ),

  // comparison cards (infographic / paths)
  cards: ({ W, H, photo, page, n, total, d }) =>
    h(
      "div",
      { width: W, height: H, backgroundColor: NAVY, position: "relative" },
      photo
        ? img(photo, {
          position: "absolute",
          top: 0,
          left: 0,
          width: W,
          height: d.photoH ?? 360,
          objectFit: "cover",
        })
        : null,
      h("div", {
        position: "absolute",
        top: 0,
        left: 0,
        width: W,
        height: (d.photoH ?? 360) + 2,
        backgroundImage:
          `linear-gradient(180deg, rgba(11,15,28,0.80) 0%, rgba(11,15,28,0.30) 40%, ${NAVY} 100%)`,
      }),
      brand(page),
      h(
        "div",
        {
          position: "absolute",
          left: 70,
          right: 70,
          top: d.contentTop ?? 170,
          bottom: 70,
          flexDirection: "column",
        },
        kicker(d.kicker),
        lines(d.title, {
          fontFamily: "Playfair",
          fontWeight: 700,
          fontSize: d.titleSize ?? 60,
          lineHeight: 1.08,
          color: WHITE,
        }),
        d.sub
          ? h("div", {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 26,
            lineHeight: 1.35,
            color: MUTED,
            marginTop: 18,
          }, d.sub)
          : null,
        h(
          "div",
          { flexDirection: "column", gap: 18, marginTop: 30 },
          // deno-lint-ignore no-explicit-any
          ...(d.cards as any[]).map((c) =>
            h(
              "div",
              {
                flexDirection: "column",
                backgroundColor: c.highlight ? "rgba(233,203,129,0.12)" : NAVY2,
                border: c.highlight
                  ? `2px solid ${GOLD}`
                  : `1px solid rgba(233,203,129,0.18)`,
                padding: "22px 30px",
              },
              h(
                "div",
                { justifyContent: "space-between", alignItems: "center" },
                h("div", {
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: 3,
                  color: GOLD,
                }, String(c.label).toUpperCase()),
                c.tag
                  ? h("div", {
                    fontFamily: "Inter",
                    fontWeight: 600,
                    fontSize: 18,
                    letterSpacing: 2,
                    color: NAVY,
                    backgroundColor: GOLD,
                    padding: "6px 12px",
                  }, c.tag)
                  : null,
              ),
              c.value
                ? h("div", {
                  fontFamily: "Playfair",
                  fontWeight: 700,
                  fontSize: c.valueSize ?? 52,
                  color: WHITE,
                  marginTop: 8,
                  lineHeight: 1.1,
                }, c.value)
                : null,
              c.note
                ? h("div", {
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontSize: 24,
                  color: "#D9DCE6",
                  marginTop: 8,
                  lineHeight: 1.35,
                }, c.note)
                : null,
            )
          ),
        ),
        d.foot
          ? h("div", {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 20,
            color: MUTED,
            marginTop: 22,
            lineHeight: 1.35,
          }, d.foot)
          : null,
        d.brandLine
          ? h("div", {
            fontFamily: "Inter",
            fontWeight: 600,
            fontSize: 24,
            color: GOLD,
            marginTop: 14,
          }, d.brandLine)
          : null,
      ),
      progress(n, total),
    ),
};

async function photoDataUri(path: string, W: number, H: number) {
  const r = await fetch(
    `${STORAGE}/render/image/public/${BUCKET}/${path}?width=${W}&height=${H}&resize=cover&quality=88`,
  );
  if (!r.ok) throw new Error(`photo ${path} ${r.status}`);
  const ct = r.headers.get("content-type") ?? "image/jpeg";
  return `data:${ct};base64,${
    encodeBase64(new Uint8Array(await r.arrayBuffer()))
  }`;
}

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
  const t0 = Date.now();
  try {
    const {
      dst,
      template,
      w = 1080,
      h: H = 1350,
      photo,
      page,
      n,
      total,
      data = {},
    } = await req.json();
    const tpl = templates[template];
    if (!tpl || !dst || String(dst).includes("..")) {
      return new Response(JSON.stringify({ error: "bad template/dst" }), {
        status: 400,
      });
    }
    if (!wasmReady) {
      wasmReady = fetch(`${FS}/@resvg/resvg-wasm@2.6.2/index_bg.wasm`).then((
        r,
      ) => r.arrayBuffer()).then((b) => initWasm(b));
    }
    const [f, src] = await Promise.all([
      fonts(),
      photo ? photoDataUri(photo, w, H) : Promise.resolve(null),
      wasmReady,
    ]);
    const svg = await satori(
      // deno-lint-ignore no-explicit-any
      tpl({ W: w, H, photo: src, page, n, total, d: data }) as any,
      // deno-lint-ignore no-explicit-any
      { width: w, height: H, fonts: f as any },
    );
    const png = new Resvg(svg, { fitTo: { mode: "width", value: w } }).render()
      .asPng();
    const { error } = await admin.storage.from(BUCKET).upload(dst, png, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(
      JSON.stringify({ ok: true, dst, bytes: png.length, ms: Date.now() - t0 }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String((e as Error)?.stack ?? e) }),
      {
        status: 500,
      },
    );
  }
});
