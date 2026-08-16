import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Para quais empresas o serviço é indicado?",
    a: "Empresas em crescimento que já sentem a complexidade financeira aumentar: fechamento gerencial demorado, custos sem rateio claro, orçamento só no Excel e diretoria sem indicadores confiáveis. Atendemos indústrias, varejo, saúde, tecnologia, serviços, agro e franquias — de empresas em estruturação a grupos multisegmento.",
  },
  {
    q: "Vocês substituem meu contador?",
    a: "Não. A controladoria é complementar à contabilidade. O contador cuida do fiscal e societário; nós traduzimos os números em informação gerencial e ajudamos o C-Level a decidir.",
  },
  {
    q: "Quanto tempo leva para ver resultado?",
    a: "Diagnóstico estruturado em até 48h após onboarding. Nos primeiros 30 dias entregamos modelo e cadência. A partir do 2º mês, rotina de fechamento e reuniões de resultado em pé.",
  },
  {
    q: "Como funciona a contratação?",
    a: "Começa com uma conversa inicial sem custo para entender seu contexto. Se houver fit, propomos um diagnóstico estruturado — engajamento pago, com escopo, prazo e entregáveis definidos. A partir dele, definimos a trilha adequada: controladoria mensal recorrente (retainer) ou projeto pontual.",
  },
  {
    q: "Vocês atendem presencialmente ou remoto?",
    a: "Padrão remoto, com reuniões executivas por videoconferência. Encontros presenciais combinados conforme localização e necessidade do projeto.",
  },
  {
    q: "Os dados da minha empresa ficam seguros?",
    a: "Sim. NDA antes de qualquer compartilhamento, boas práticas de LGPD e ambientes controlados para armazenamento de informações sensíveis.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-border-sub py-28">
      <div className="mx-auto max-w-3xl px-8">
        <div className="text-center">
          <span className="eyebrow">Dúvidas frequentes</span>
          <h2 className="section-title mt-6">
            O que <em>perguntam</em> antes de contratar
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-14 w-full">
          {faqs.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`item-${i}`}
              className="border-b border-border-sub"
            >
              <AccordionTrigger className="py-6 text-left font-display text-lg font-medium text-cream hover:text-gold-light hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-[14px] font-light leading-relaxed text-cream-dim">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
