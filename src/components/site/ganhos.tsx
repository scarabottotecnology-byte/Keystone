import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";

/**
 * "O que você ganha" montado como um lançamento contábil:
 * à esquerda o débito (o que sai da mesa do cliente), à direita o crédito
 * (o que entra na gestão dele), fechando com o saldo sob o duplo traço
 * que marca um total no livro-razão.
 */
const lancamentos = [
  {
    debito: "Guias, prazos e obrigações do mês",
    credito: "Calendário fiscal cumprido por nós, com aviso antes de cada vencimento",
  },
  {
    debito: "Contas a pagar, a receber e conciliação bancária",
    credito: "Caixa conciliado toda semana e fluxo de caixa projetado para os próximos meses",
  },
  {
    debito: "A dúvida se o regime tributário ainda compensa",
    credito: "Simples e Presumido recalculados com os seus números antes de cada virada de ano",
  },
  {
    debito: "Um balancete que ninguém lê",
    credito: "DRE gerencial mensal, com margem por cliente, produto ou contrato",
  },
  {
    debito: "Admissões, férias, rescisões e eSocial",
    credito: "Folha fechada no prazo e o custo real de cada pessoa da equipe",
  },
  {
    debito: "Preço, contratação e investimento decididos no escuro",
    credito: "Preço, ponto de equilíbrio e orçamento calculados antes de você decidir",
  },
];

export function Ganhos() {
  return (
    <section id="ganhos" className="py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-8">
        <Reveal className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <h2 className="section-title">
            O que você ganha ao <em>contratar a Keystone</em>
          </h2>
          <p className="text-[15px] font-light leading-relaxed text-cream-dim">
            Contabilidade não deveria ser só um custo para ficar em dia com o governo. Veja o
            lançamento: o que sai da sua mesa e o que entra na sua gestão.
          </p>
        </Reveal>

        <div className="mt-16 border border-border">
          {/* Cabeçalho do razão */}
          <div className="hidden grid-cols-2 border-b border-border md:grid">
            <p className="px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream-mute">
              Débito · sai da sua mesa
            </p>
            <p className="border-l border-border px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
              Crédito · entra na sua gestão
            </p>
          </div>

          <RevealGroup>
            {lancamentos.map((l) => (
              <RevealItem
                key={l.debito}
                className="grid border-b border-border-sub last:border-b-0 md:grid-cols-2"
              >
                <div className="px-6 pb-2 pt-6 md:px-8 md:py-6">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.25em] text-cream-mute md:hidden">
                    Sai da sua mesa
                  </span>
                  <p className="text-[15px] font-light leading-relaxed text-cream-mute line-through decoration-cream-mute/40 decoration-1">
                    {l.debito}
                  </p>
                </div>
                <div className="px-6 pb-6 pt-2 md:border-l md:border-border-sub md:px-8 md:py-6">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gold md:hidden">
                    Entra na sua gestão
                  </span>
                  <p className="text-[15px] leading-relaxed text-cream">{l.credito}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* Saldo: o duplo traço que fecha um total no livro-razão */}
          <div className="border-t-[3px] border-double border-gold/70 bg-navy-card px-6 py-8 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-10 md:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Saldo</p>
            <p className="mt-3 font-display text-[26px] font-normal leading-snug text-cream md:mt-0 md:text-[30px]">
              Mais tempo para vender e números confiáveis para decidir.
            </p>
            <Link to="/contato" className="btn-gold mt-6 md:mt-0">
              Pedir proposta
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
