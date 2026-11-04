import { Calendar } from "lucide-react";
import { CalendlyButton } from "@/components/site/calendly-button";
import { LeadForm } from "@/components/site/lead-form";

export function ContactForm() {
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
          <h2 className="section-title">Peça sua proposta de contabilidade</h2>
          <p className="mt-5 text-[15px] font-light text-cream-dim">
            Conte o regime, o número de funcionários e o faturamento médio. Respondemos em até
            1 dia útil, sem compromisso.
          </p>

          <div className="mt-8 flex justify-center">
            <CalendlyButton className="btn-gold">
              Agendar uma conversa
              <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
            </CalendlyButton>
          </div>

          <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-cream-mute">
            Escolha o horário direto na agenda, com confirmação automática
          </p>

          <div className="mx-auto mt-9 flex max-w-xs items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-cream-mute">
            <span className="h-px flex-1 bg-border-sub" />
            ou envie seus dados
            <span className="h-px flex-1 bg-border-sub" />
          </div>
        </div>

        <LeadForm
          origem="Site — Pedir proposta"
          submitLabel="Pedir proposta"
          successTitle="Mensagem enviada"
          successDescription="Recebemos seu contato. Nossa equipe retornará em até 24 horas úteis para confirmar a agenda."
          footer={
            <p className="text-center text-[10px] uppercase tracking-[0.15em] text-cream-mute">
              Seus dados ficam em sigilo. NDA disponível se você quiser.
            </p>
          }
          fields={[
            { name: "nome", label: "Nome completo", type: "text", required: true },
            { name: "email", label: "E-mail", type: "email", required: true },
            { name: "empresa", label: "Empresa", type: "text", required: true },
            { name: "telefone", label: "Telefone / WhatsApp", type: "tel" },
            {
              name: "mensagem",
              label: "Mensagem",
              type: "text",
              placeholder:
                "Ex.: Simples Nacional, 6 funcionários, faturamento de R$ 80 mil por mês. Quero trocar de contador.",
            },
          ]}
        />
      </div>
    </section>
  );
}
