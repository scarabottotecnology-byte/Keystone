import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ferramentas/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso Ferramentas — Keystone" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/ferramentas" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    navigate({ to: "/ferramentas" });
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-10">
          <span className="grid h-12 w-12 place-items-center border border-gold/40 font-display text-[13px] font-semibold tracking-wider text-gold">
            K
          </span>
        </Link>
        <div className="border border-border-sub bg-navy-2 p-10">
          <h1 className="font-display text-3xl font-light text-cream text-center">
            Ferramentas <em className="italic text-gold">Exclusivas</em>
          </h1>
          <p className="mt-3 text-center text-sm text-cream-dim">
            Acesso às calculadoras tributárias da Keystone
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
                E-mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
                Senha
              </span>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
              />
            </label>

            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full justify-center disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <a
            href="/#contato"
            className="mt-6 block text-center text-[11px] uppercase tracking-[0.2em] text-cream-mute transition-colors hover:text-gold"
          >
            Não tem acesso? Solicite aqui →
          </a>
        </div>
      </div>
    </div>
  );
}
