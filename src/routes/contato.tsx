import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/contato")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Contato — Keystone" },
      {
        name: "description",
        content:
          "Fale com a Keystone. Nossa equipe está pronta para entender seu desafio e apresentar a solução certa em controladoria, FP&A e finanças corporativas.",
      },
      { property: "og:title", content: "Contato — Keystone" },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
  }),
  component: ContatoPage,
});

type FormState = {
  nome: string;
  email: string;
  empresa: string;
  telefone: string;
  mensagem: string;
};

function ContatoPage() {
  const [form, setForm] = useState<FormState>({
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
    const { error } = await supabase.from("leads").insert({
      nome: form.nome,
      email: form.email,
      empresa: form.empresa || null,
      telefone: form.telefone || null,
      mensagem: form.mensagem || null,
      origem: "Site — Página de Contato",
      track: "geral",
    });
    setStatus(error ? "error" : "done");
  }

  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader />
      <main className="px-8 pb-24 pt-36 lg:pt-44">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-center">
            <span className="eyebrow mx-auto">Contato</span>
            <h1 className="section-title mx-auto mt-7 max-w-2xl">
              Fale com <em>especialistas</em>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream-dim">
              Nossa equipe está pronta para entender seu desafio e apresentar a solução certa para o
              momento financeiro da sua empresa.
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Info */}
            <div>
              <div className="space-y-8">
                <ContactInfo
                  Icon={Mail}
                  title="E-mail"
                  lines={["contato@keystonecontroladoria.com.br"]}
                />
                <ContactInfo Icon={Phone} title="Telefone" lines={["(11) 3000-0000"]} />
                <ContactInfo Icon={MapPin} title="Escritório" lines={["São Paulo, SP — Brasil"]} />
                <ContactInfo
                  Icon={Clock}
                  title="Horário de atendimento"
                  lines={["Segunda a sexta, 9h às 18h", "Resposta em até 24 horas úteis"]}
                />
              </div>
            </div>

            {/* Form */}
            <div>
              {status === "done" ? (
                <div className="border border-gold/30 bg-navy-card p-10 text-center">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-2xl text-gold">
                    ✓
                  </div>
                  <p className="font-display text-2xl text-cream">Mensagem enviada</p>
                  <p className="mt-3 text-sm text-cream-dim">
                    Nossa equipe retornará em até 24 horas úteis.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="border border-border-sub bg-navy-card p-8 md:p-10 space-y-5"
                >
                  {(
                    [
                      { name: "nome", label: "Nome completo", type: "text", required: true },
                      { name: "email", label: "E-mail corporativo", type: "email", required: true },
                      { name: "empresa", label: "Empresa", type: "text", required: false },
                      {
                        name: "telefone",
                        label: "Telefone / WhatsApp",
                        type: "tel",
                        required: false,
                      },
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
                        className="mt-2 w-full border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
                      />
                    </label>
                  ))}

                  <label className="block">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-cream-dim">
                      Mensagem *
                    </span>
                    <textarea
                      required
                      rows={4}
                      value={form.mensagem}
                      onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
                      className="mt-2 w-full resize-none border border-border-sub bg-navy px-4 py-3 text-cream outline-none transition-colors focus:border-gold"
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
                    {status === "loading" ? "Enviando..." : "Enviar Mensagem"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ContactInfo({
  Icon,
  title,
  lines,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  lines: string[];
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-gold/30 bg-gold-dim">
        <Icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
      </div>
      <div>
        <h3 className="font-display text-base font-medium text-cream">{title}</h3>
        {lines.map((line) => (
          <p key={line} className="mt-1 text-sm text-cream-dim">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
