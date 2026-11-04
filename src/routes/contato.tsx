import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Clock, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LeadForm } from "@/components/site/lead-form";
import { seo } from "@/lib/site";

/**
 * Caixa do domínio próprio, hospedada na Hostinger (MX mx1/mx2.hostinger.com).
 * Só publique aqui um endereço que receba de verdade: o site já anunciou
 * contato@keystonecontroladoria.com.br, num domínio que nunca foi registrado.
 * Deixe vazio para esconder o bloco de e-mail.
 */
const EMAIL_CONTATO = "contato@keystone-contabilidade.com";

export const Route = createFileRoute("/contato")({
  head: () =>
    seo("/contato", {
      title: "Contato e Proposta de Contabilidade | Keystone",
      description:
        "Peça uma proposta de contabilidade, BPO financeiro ou controladoria para a sua empresa pelo formulário ou por e-mail. Resposta em até 1 dia útil.",
    }),
  component: ContatoPage,
});

function ContatoPage() {
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
                  Icon={MessageSquare}
                  title="Como falamos com você"
                  lines={["Preencha o formulário ao lado", "Retornamos pelo e-mail informado"]}
                />
                {EMAIL_CONTATO && (
                  <ContactInfo Icon={Mail} title="E-mail" lines={[EMAIL_CONTATO]} />
                )}
                <ContactInfo Icon={MapPin} title="Atendimento" lines={["Remoto — todo o Brasil"]} />
                <ContactInfo
                  Icon={Clock}
                  title="Horário de atendimento"
                  lines={["Segunda a sexta, 9h às 18h", "Resposta em até 24 horas úteis"]}
                />
              </div>
            </div>

            {/* Form */}
            <div>
              <LeadForm
                origem="Site — Página de Contato"
                submitLabel="Enviar Mensagem"
                successTitle="Mensagem enviada"
                successDescription="Nossa equipe retornará em até 24 horas úteis."
                fields={[
                  { name: "nome", label: "Nome completo", type: "text", required: true },
                  { name: "email", label: "E-mail corporativo", type: "email", required: true },
                  { name: "empresa", label: "Empresa", type: "text" },
                  { name: "telefone", label: "Telefone / WhatsApp", type: "tel" },
                  { name: "mensagem", label: "Mensagem", type: "text", required: true },
                ]}
              />
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
