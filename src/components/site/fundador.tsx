import { Reveal, RevealGroup, RevealItem } from "@/components/site/reveal";
import { KeystoneMonogram } from "@/components/site/keystone-monogram";

/**
 * Quem está por trás: a trajetória é uma sequência real no tempo,
 * por isso aparece como linha do tempo.
 */
const trajetoria = [
  {
    periodo: "2025 · hoje",
    onde: "Grupo multissetorial com mais de 50 empresas",
    papel: "Especialista em Controladoria Estratégica",
    feito: "Conduz o orçamento consolidado do grupo, a DRE e a precificação de produtos.",
  },
  {
    periodo: "2023 · 2025",
    onde: "Coca-Cola FEMSA",
    papel: "Analista de Controladoria Sênior",
    feito: "Orçamento e controle de resultado de um centro de distribuição.",
  },
  {
    periodo: "2020 · 2023",
    onde: "Reserva Paulista",
    papel: "Analista de Controladoria",
    feito: "Fechamento, análise de resultado e indicadores gerenciais.",
  },
  {
    periodo: "2017 · 2020",
    onde: "Carmim",
    papel: "Analista Administrativo-Financeiro Sênior",
    feito: "Rotina financeira e administrativa de uma marca de moda e varejo.",
  },
  {
    periodo: "2012 · 2017",
    onde: "Positivo Tecnologia",
    papel: "Área financeira",
    feito: "Primeiros anos em uma indústria de tecnologia de capital aberto.",
  },
];

const formacao = [
  "Bacharel em Ciências Contábeis",
  "Tecnólogo em Gestão Financeira",
  "MBAs em finanças e gestão",
  "SAP, TOTVS e Power BI",
];

export function Fundador() {
  return (
    <section id="sobre" className="border-t border-border-sub py-28">
      <div className="mx-auto grid max-w-[1400px] gap-16 px-6 md:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
        <Reveal>
          <h2 className="section-title">
            Quem cuida dos <em>seus números</em>
          </h2>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center border border-border">
              <KeystoneMonogram size={28} />
            </div>
            <div>
              <p className="font-display text-xl font-medium text-cream">Jefferson Scarabotto</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">
                Fundador da Keystone
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-[15px] font-light leading-relaxed text-cream-dim">
            <p>
              Passei os últimos 14 anos dentro da controladoria de empresas que não podiam errar o
              número: indústria, distribuição e varejo, com orçamentos que hoje consolidam mais de
              50 empresas.
            </p>
            <p>
              A Keystone existe para levar esse mesmo rigor a empresas que não têm, e nem precisam
              ter, um departamento de controladoria. Você recebe a rotina contábil de um escritório
              e a leitura de resultado de quem fecha o mês de grandes grupos.
            </p>
          </div>

          <ul className="mt-10 grid grid-cols-1 gap-px border border-border-sub bg-border-sub sm:grid-cols-2">
            {formacao.map((f) => (
              <li key={f} className="bg-navy px-5 py-4 text-[13px] text-cream">
                {f}
              </li>
            ))}
          </ul>
        </Reveal>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
            Trajetória
          </p>
          <RevealGroup className="mt-6">
            <div className="relative border-l border-border">
              {trajetoria.map((t, i) => (
                <RevealItem key={t.periodo} className="relative pb-10 pl-8 last:pb-0">
                  <span
                    aria-hidden
                    className={`absolute -left-[5px] top-1.5 h-[9px] w-[9px] border ${
                      i === 0 ? "border-gold bg-gold" : "border-border bg-navy"
                    }`}
                  />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-cream-mute">
                      {t.periodo}
                    </p>
                    <p className="mt-2 font-display text-[22px] font-medium leading-snug text-cream">
                      {t.onde}
                    </p>
                    <p className="text-[13px] text-gold">{t.papel}</p>
                    <p className="mt-2 text-[13px] font-light leading-relaxed text-cream-dim">
                      {t.feito}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </div>
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
