import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ferramentas/social")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Calendário de Social Media — Keystone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SocialCalendarPage,
});

// This panel reads from the real content-engine schema already provisioned in
// Supabase (content_calendar -> content_assets -> content_ideas -> content_pillars),
// not a standalone table. It is a read-only view of the editorial calendar; actual
// publishing happens elsewhere (Buffer / the content engine's own pipeline).
type CalendarRow = {
  id: string;
  scheduled_for: string;
  status: string;
  content_assets: {
    headline: string | null;
    body: string | null;
    media: unknown;
    content_ideas: {
      title: string;
      content_pillars: { name: string } | null;
    } | null;
  } | null;
};

type StatusFilter = "todos" | "scheduled" | "published" | "outros";

function classifyStatus(status: string): "scheduled" | "published" | "outros" {
  if (status === "scheduled") return "scheduled";
  if (status === "published") return "published";
  return "outros";
}

function firstImagePath(media: unknown): string | null {
  if (!Array.isArray(media)) return null;
  const first = media[0];
  if (first && typeof first === "object" && "path" in first) {
    const path = (first as { path?: unknown }).path;
    return typeof path === "string" ? path : null;
  }
  return null;
}

function SocialCalendarPage() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [rows, setRows] = useState<CalendarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("todos");
  const [pilarFilter, setPilarFilter] = useState<string>("todos");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/ferramentas/login" });
        return;
      }
      setCheckingAuth(false);
    });
  }, [navigate]);

  useEffect(() => {
    if (checkingAuth) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("content_calendar")
        .select(
          `
          id,
          scheduled_for,
          status,
          content_assets (
            headline,
            body,
            media,
            content_ideas (
              title,
              content_pillars ( name )
            )
          )
        `,
        )
        .eq("channel", "linkedin")
        .order("scheduled_for", { ascending: true });
      if (cancelled) return;
      if (fetchError) setError("Não foi possível carregar o calendário.");
      setRows((data as unknown as CalendarRow[]) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [checkingAuth]);

  const pilares = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map((r) => r.content_assets?.content_ideas?.content_pillars?.name)
            .filter((name): name is string => Boolean(name)),
        ),
      ).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== "todos" && classifyStatus(r.status) !== filter) return false;
      if (pilarFilter !== "todos") {
        const name = r.content_assets?.content_ideas?.content_pillars?.name;
        if (name !== pilarFilter) return false;
      }
      return true;
    });
  }, [rows, filter, pilarFilter]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      scheduled: rows.filter((r) => classifyStatus(r.status) === "scheduled").length,
      published: rows.filter((r) => classifyStatus(r.status) === "published").length,
    }),
    [rows],
  );

  if (checkingAuth) {
    return <div className="min-h-screen bg-navy" />;
  }

  return (
    <div className="min-h-screen bg-navy">
      <SiteHeader />
      <main className="mx-auto max-w-[1300px] px-8 py-16 pt-36 lg:pt-44">
        <div className="mb-4">
          <Link
            to="/ferramentas"
            className="text-[11px] uppercase tracking-[0.2em] text-cream-mute hover:text-gold"
          >
            ← Ferramentas
          </Link>
        </div>

        <div className="mb-14 border-b border-border-sub pb-14">
          <span className="text-[11px] uppercase tracking-[0.3em] text-gold">
            Área Exclusiva · Social Media
          </span>
          <h1 className="mt-5 font-display text-4xl font-light leading-[1.05] text-cream md:text-5xl">
            Calendário de <strong className="font-semibold">publicação — LinkedIn</strong>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-cream-dim">
            Painel somente leitura do motor de conteúdo (content_calendar → content_assets →
            content_ideas → content_pillars). A publicação de fato acontece pelo pipeline de
            conteúdo — este painel serve apenas para acompanhar data, pilar, texto e status de
            cada post.
          </p>

          <div className="mt-8 flex flex-wrap gap-8">
            <Counter label="Total de posts" value={counts.total} />
            <Counter label="Agendados" value={counts.scheduled} />
            <Counter label="Publicados" value={counts.published} />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(["todos", "scheduled", "published", "outros"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`border px-4 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                  filter === s
                    ? "border-gold text-gold"
                    : "border-border-sub text-cream-mute hover:border-gold/50 hover:text-cream"
                }`}
              >
                {s === "todos"
                  ? "Todos"
                  : s === "scheduled"
                    ? "Agendados"
                    : s === "published"
                      ? "Publicados"
                      : "Outros"}
              </button>
            ))}
          </div>

          <label className="block">
            <select
              value={pilarFilter}
              onChange={(e) => setPilarFilter(e.target.value)}
              className="border border-border-sub bg-navy px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-cream-dim outline-none focus:border-gold"
            >
              <option value="todos">Todos os pilares</option>
              {pilares.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? (
          <p className="border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-400">{error}</p>
        ) : loading ? (
          <p className="text-sm text-cream-mute">Carregando calendário…</p>
        ) : filtered.length === 0 ? (
          <p className="border border-border-sub bg-navy-card p-8 text-sm text-cream-mute">
            Nenhum post encontrado para este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto border border-border-sub">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-sub bg-navy-card">
                  <Th>Data</Th>
                  <Th>Pilar</Th>
                  <Th>Título / Preview</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const asset = r.content_assets;
                  const idea = asset?.content_ideas;
                  const pilar = idea?.content_pillars?.name ?? "—";
                  const title = idea?.title ?? asset?.headline ?? "—";
                  const preview = asset?.body ? asset.body.slice(0, 90).trim() + "…" : null;
                  const image = firstImagePath(asset?.media);
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border-sub last:border-b-0 hover:bg-navy-card/60"
                    >
                      <Td className="whitespace-nowrap text-cream-mute">
                        {formatDateTime(r.scheduled_for)}
                      </Td>
                      <Td className="text-cream-dim">{pilar}</Td>
                      <Td>
                        <div className="font-medium text-cream">{title}</div>
                        {preview ? (
                          <div className="mt-1 text-xs text-cream-mute">{preview}</div>
                        ) : null}
                        {image ? (
                          <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-cream-mute/70">
                            {image}
                          </div>
                        ) : null}
                      </Td>
                      <Td>
                        <StatusBadge status={r.status} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-4 w-px bg-gold/50" />
      <span className="text-xs text-cream-mute">
        <strong className="font-medium text-cream-dim">{value}</strong> {label}
      </span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-cream-mute">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 align-top text-cream ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const kind = classifyStatus(status);
  const isPublished = kind === "published";
  const isScheduled = kind === "scheduled";
  const label = isPublished ? "Publicado" : isScheduled ? "Agendado" : status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
        isPublished
          ? "border-emerald-500/40 text-emerald-400"
          : isScheduled
            ? "border-gold/40 text-gold"
            : "border-border-sub text-cream-mute"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isPublished ? "bg-emerald-400" : isScheduled ? "bg-gold" : "bg-cream-mute"
        }`}
      />
      {label}
    </span>
  );
}
