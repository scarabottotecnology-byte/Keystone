import { createFileRoute } from "@tanstack/react-router";
import { Clock, Globe2, Mail, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { LeadForm } from "@/components/site/lead-form";
import { seo } from "@/lib/site";

/** Mesma caixa da página em português (src/routes/contato.tsx). */
const CONTACT_EMAIL = "contato@keystone-contabilidade.com";

export const Route = createFileRoute("/en/contact")({
  head: () =>
    seo("/en/contact", {
      title: "Contact and Proposal | Keystone",
      description:
        "Request a proposal for remote controllership, FP&A or financial BPO for your company, by form or email. We reply within 1 business day.",
    }),
  component: ContactPageEn,
});

function ContactPageEn() {
  return (
    <div className="min-h-screen bg-navy text-cream">
      <SiteHeader locale="en" />
      <main className="px-8 pb-24 pt-36 lg:pt-44">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-center">
            <span className="eyebrow mx-auto">Contact</span>
            <h1 className="section-title mx-auto mt-7 max-w-2xl">
              Talk to a <em>controller</em>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-cream-dim">
              Tell us where your company is today and what you need to see every month. We reply
              with a clear scope and fee proposal.
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              <ContactInfo
                Icon={MessageSquare}
                title="How we get back to you"
                lines={["Fill in the form", "We reply to the email you provide"]}
              />
              <ContactInfo Icon={Mail} title="Email" lines={[CONTACT_EMAIL]} />
              <ContactInfo
                Icon={Globe2}
                title="Where we work"
                lines={["Remote, worldwide", "Based in São Paulo, Brazil (UTC−3)"]}
              />
              <ContactInfo
                Icon={Clock}
                title="Business hours"
                lines={["Monday to Friday, 9am to 6pm (UTC−3)", "Reply within 1 business day"]}
              />
            </div>

            <div>
              <LeadForm
                locale="en"
                origem="EN site — Contact page"
                submitLabel="Send message"
                successDescription="Thank you. We will get back to you within 1 business day."
                fields={[
                  { name: "nome", label: "Full name", type: "text", required: true },
                  { name: "email", label: "Work email", type: "email", required: true },
                  { name: "empresa", label: "Company", type: "text" },
                  { name: "telefone", label: "Phone / WhatsApp", type: "tel" },
                  { name: "mensagem", label: "Message", type: "text", required: true },
                ]}
              />
            </div>
          </div>
        </div>
      </main>
      <SiteFooter locale="en" />
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
