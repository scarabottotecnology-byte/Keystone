import { useState } from "react";

export function ContactForm() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    empresa: "",
    telefone: "",
    mensagem: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const [firstname, ...rest] = form.nome.trim().split(" ");
    const lastname = rest.join(" ");
    const { createHubspotLead } = await import("@/lib/hubspot.functions");
    const result = await createHubspotLead({
      data: {
        firstname: firstname || form.nome,
        lastname,
        email: form.email,
        company: form.empresa,
        phone: form.telefone,
        origem: "Site — Agendar Diagnóstico",
        mensagem: form.mensagem,
      },
    });
    setStatus(result.ok ? "done" : "error");
  }

  return (
    <section
      id="contato"
      className="relative overflow-hidden border-y border-border-sub bg-navy-mid py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse, rgba(166,25,46,0.07) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-3xl px-8">
        <div className="mb-12 text-center">
          <span className="eyebrow">Contato</span>
          <h2 className="section-title mt-6">
            Agendar <em>Diagnóstico Estratégico</em>
          </h2>
          <p className="mt-5 text-[15px] font-light text-cream-dim">
            30 minutos. Sem compromisso. Com análise real do seu momento
            financeiro.
          </p>
        </div>

        {status === "done" ? (
          <div className="border border-gold/30 bg-navy-card p-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold text-2xl">
              ✓
            </div>
            <p className="font-display text-2xl text-cream">Mensagem enviada</p>
            <p className="mt-3 text-sm text-cream-dim">
              Recebemos seu contato. Nossa equipe retornará em até 24 horas úteis para confirmar a agenda.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-border-sub bg-navy-card p-8 md:p-10 space-y-5">
            {(
              [
                { name: "nome", label: "Nome completo", type: "text", required: true },
                { name: "email", label: "E-mail corporativo", type: "email", required: true },
                { name: "empresa", label: "Empresa", type: "text", required: true },
                { name: "telefone", label: "Telefone / WhatsApp", type: "tel", required: false },
              ] as const
            ).map(({ name, label, type, required }) => (
              <label key={name} className="block">
                <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
                  {label}
                  {required && " *"}
                </span>
                <input
                  type={type}
                  required={required}
                  value={form[name]}
                  onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                  className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold placeholder:text-cream-mute/40"
                />
              </label>
            ))}

            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
                Mensagem / Contexto
              </span>
              <textarea
                rows={4}
                value={form.mensagem}
                onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
                placeholder="Descreva brevemente o momento da empresa: expansão, captação, M&A, reestruturação..."
                className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold placeholder:text-cream-mute/40 resize-none"
              />
            </label>

            {status === "error" && (
              <p className="text-xs text-red-400">
                Erro ao enviar. Verifique os dados e tente novamente.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-gold w-full justify-center disabled:opacity-60"
            >
              {status === "loading" ? "Enviando..." : "Agendar Diagnóstico →"}
            </button>

            <p className="text-center text-[10px] uppercase tracking-[0.15em] text-cream-mute">
              Confidencialidade total · NDA disponível antes do primeiro compartilhamento
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
