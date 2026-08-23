import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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

type SocialPost = Tables<"social_posts">;
type StatusFilter = "todos" | "pendente" | "publicado";

function SocialCalendarPage() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [posts, setPosts] = useState<SocialPost[]>([]);
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
        .from("social_posts")
        .select("*")
        .order("data_publicacao", { ascending: true });
      if (cancelled) return;
      if (fetchError) setError("Não foi possível carregar o calendário.");
      setPosts(data ?? []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [checkingAuth]);

  const pilares = useMemo(() => Array.from(new Set(posts.map((p) => p.pilar))).sort(), [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (filter !== "todos" && p.status !== filter) return false;
      if (pilarFilter !== "todos" && p.pilar !== pilarFilter) return false;
      return true;
    });
  }, [posts, filter, pilarFilter]);

  const counts = useMemo(
    () => ({
      total: posts.length,
      pendente: posts.filter((p) => p.status === "pendente").length,
      publicado: posts.filter((p) => p.status === "publicado").length,
    }),
    [posts],
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
            Painel somente leitura do calendário editorial. A publicação de fato acontece pelo
            Buffer — este painel serve apenas para acompanhar data, pilar e status de cada post.
          </p>

          <div className="mt-8 flex flex-wrap gap-8">
            <Counter label="Total de posts" value={counts.total} />
            <Counter label="Pendentes" value={counts.pendente} />
            <Counter label="Publicados" value={counts.publicado} />
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(["todos", "pendente", "publicado"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`border px-4 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors ${
                  filter === s
                    ? "border-gold text-gold"
                    : "border-border-sub text-cream-mute hover:border-gold/50 hover:text-cream"
                }`}
              >
                {s === "todos" ? "Todos" : s === "pendente" ? "Pendentes" : "Publicados"}
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
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border-sub bg-navy-card">
                  <Th>#</Th>
                  <Th>Data</Th>
                  <Th>Dia</Th>
                  <Th>Pilar</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border-sub last:border-b-0 hover:bg-navy-card/60"
                  >
                    <Td className="text-cream-mute">{String(p.post_numero).padStart(2, "0")}</Td>
                    <Td>{formatDate(p.data_publicacao)}</Td>
                    <Td className="text-cream-dim">{p.dia_semana}</Td>
                    <Td className="text-cream-dim">{p.pilar}</Td>
                    <Td>
                      <StatusBadge status={p.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
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
  return <td className={`px-5 py-3.5 text-cream ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === "publicado";
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
        isPublished ? "border-emerald-500/40 text-emerald-400" : "border-gold/40 text-gold"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? "bg-emerald-400" : "bg-gold"}`} />
      {isPublished ? "Publicado" : "Pendente"}
    </span>
  );
}
