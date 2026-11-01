import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/site/reveal";

const faqs = [
  {
    q: "Vocês atendem quais tipos de empresa?",
    a: "Empresas do Simples Nacional e do Lucro Presumido, com foco em agências de emprego, agências de marketing, escritórios de engenharia e de advocacia. Atendemos outros segmentos de serviços sob consulta.",
  },
  {
    q: "Posso trocar de contador sem problemas?",
    a: "Sim. Cuidamos da troca: solicitamos os arquivos ao contador anterior, assumimos as obrigações e conferimos pendências antes da primeira entrega.",
  },
  {
    q: "Como funciona o atendimento?",
    a: "Digital. Você envia documentos e tira dúvidas pelos nossos canais e recebe resposta em até 1 dia útil. Reuniões por videochamada quando necessário.",
  },
  {
    q: "Quanto custa?",
    a: "Depende do regime, do número de notas e de funcionários e dos serviços contratados. Mande os dados básicos e respondemos com proposta em até 1 dia útil.",
  },
  {
    q: "Vocês fazem só contabilidade ou também o financeiro?",
    a: "Os dois. Você pode contratar só a contabilidade, só o BPO financeiro ou os serviços juntos, com a mesma equipe e os mesmos dados.",
  },
  {
    q: "Os dados da minha empresa ficam seguros?",
    a: "Sim. Acesso restrito, boas práticas de LGPD e NDA quando você quiser formalizar o sigilo.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t border-border-sub py-28">
      <div className="mx-auto max-w-3xl px-8">
        <Reveal className="text-center">
          <h2 className="section-title">Dúvidas frequentes</h2>
        </Reveal>

        <Reveal delay={0.1}>
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
        </Reveal>
      </div>
    </section>
  );
}
