// Service page content, ported from the legacy Next.js site
// (keystone-strategic-finance-platform/src/app/servicos/**) — copy only,
// restyled entirely with the Dark Luxury Corporate design system.

export type ServiceSection =
  | {
      kind: "problems";
      eyebrow: string;
      title: string;
      titleEm?: string;
      intro?: string;
      items: string[];
    }
  | {
      kind: "steps";
      eyebrow: string;
      title: string;
      titleEm?: string;
      intro?: string;
      steps: { title: string; desc: string }[];
    }
  | {
      kind: "method";
      eyebrow: string;
      title: string;
      titleEm?: string;
      intro?: string;
      letters: { letter: string; name: string; desc: string }[];
    }
  | {
      kind: "results";
      eyebrow: string;
      title: string;
      titleEm?: string;
      intro?: string;
      results: { metric: string; before: string; after: string; change: string }[];
    }
  | {
      kind: "features";
      eyebrow: string;
      title: string;
      titleEm?: string;
      intro?: string;
      items: { title: string; desc: string }[];
    }
  | {
      kind: "checklist";
      eyebrow: string;
      title: string;
      titleEm?: string;
      intro?: string;
      items: string[];
      columns?: 1 | 2;
    }
  | {
      kind: "faq";
      eyebrow: string;
      title: string;
      titleEm?: string;
      items: { q: string; a: string }[];
    };

export type ServiceContent = {
  slug: string;
  kicker: string;
  name: string;
  titlePrefix: string;
  titleAccent: string;
  heroDescription: string;
  sections: ServiceSection[];
  cta: { title: string; description: string };
};

export const services: ServiceContent[] = [
  {
    slug: "controladoria-estrategica",
    kicker: "Serviço · Controladoria",
    name: "Controladoria Estratégica",
    titlePrefix: "Controladoria",
    titleAccent: "Estratégica",
    heroDescription:
      "Estruturação completa de processos de controladoria, compliance e governança financeira para empresas que exigem excelência operacional e transparência com investidores, conselhos e auditores.",
    sections: [
      {
        kind: "problems",
        eyebrow: "O problema",
        title: "Impacto financeiro de controles",
        titleEm: "inadequados",
        intro:
          "Empresas sem uma controladoria estruturada enfrentam riscos que vão além da conformidade — afetam diretamente a capacidade de gerar caixa, precificar corretamente e comunicar resultados com credibilidade.",
        items: [
          "Controles internos informais expõem a empresa a riscos operacionais e fraudes.",
          "Fechamento contábil demorado compromete a agilidade das decisões gerenciais.",
          "Falta de padronização dificulta auditorias e processos de compliance.",
          "Governança financeira frágil reduz a confiança de investidores e conselhos.",
        ],
      },
      {
        kind: "steps",
        eyebrow: "Nossa metodologia",
        title: "Como",
        titleEm: "resolvemos",
        steps: [
          {
            title: "Diagnóstico",
            desc: "Avaliação completa da maturidade dos processos de controladoria.",
          },
          {
            title: "Desenho",
            desc: "Estruturação de políticas, procedimentos e controles internos.",
          },
          {
            title: "Implantação",
            desc: "Implementação assistida com transferência de conhecimento.",
          },
          { title: "Monitoramento", desc: "Acompanhamento contínuo e melhoria dos processos." },
        ],
      },
      {
        kind: "results",
        eyebrow: "Resultados",
        title: "Impacto",
        titleEm: "mensurável",
        results: [
          { metric: "Tempo de fechamento", before: "20+ dias", after: "5–8 dias", change: "−65%" },
          { metric: "Índice de conformidade", before: "45%", after: "95%+", change: "+111%" },
          {
            metric: "Achados de auditoria",
            before: "20+ por ciclo",
            after: "< 5 por ciclo",
            change: "−75%",
          },
          { metric: "Satisfação do board", before: "—", after: "9,2/10", change: "Novo" },
        ],
      },
      {
        kind: "faq",
        eyebrow: "Dúvidas frequentes",
        title: "Perguntas sobre",
        titleEm: "controladoria",
        items: [
          {
            q: "Quanto tempo leva para implantar uma controladoria estratégica?",
            a: "O ciclo completo varia de 4 a 8 meses, dependendo da complexidade e maturidade atual da empresa. Dividimos em fases para gerar valor incremental desde o primeiro mês.",
          },
          {
            q: "A Keystone assume a operação da controladoria?",
            a: "Não. Nosso modelo é de implantação com transferência de conhecimento. Estruturamos processos, capacitamos equipes e acompanhamos a evolução — mas a operação permanece com a empresa.",
          },
          {
            q: "Qual o investimento necessário?",
            a: "Proporcional à complexidade do projeto e ao tamanho da organização. Após o diagnóstico inicial, apresentamos uma proposta com escopo, prazos e valores detalhados.",
          },
          {
            q: "Vocês atendem empresas listadas em bolsa?",
            a: "Sim. Nossa metodologia contempla requisitos de compliance para empresas de capital aberto, incluindo controles internos robustos, relatórios gerenciais para o conselho e apoio em processos de auditoria.",
          },
        ],
      },
    ],
    cta: {
      title: "Pronto para transformar sua controladoria?",
      description:
        "Comece com um diagnóstico financeiro gratuito e descubra onde sua empresa pode gerar mais valor.",
    },
  },
  {
    slug: "fpa-planejamento-financeiro",
    kicker: "Método ÓRBITA™",
    name: "FP&A e Planejamento Financeiro",
    titlePrefix: "FP&A e Planejamento",
    titleAccent: "Financeiro",
    heroDescription:
      "Budget, forecast e acompanhamento gerencial com o Método ÓRBITA™. Conectamos visão estratégica com execução trimestral, transformando orçamento corporativo em ferramenta de decisão.",
    sections: [
      {
        kind: "problems",
        eyebrow: "O desafio",
        title: "Orçamento não é burocracia.",
        titleEm: "É estratégia.",
        intro:
          "A maioria das empresas trata o processo de budget como um exercício contábil. O Método ÓRBITA™ transforma o orçamento em uma ferramenta viva de gestão, conectando cada linha orçamentária a um objetivo estratégico mensurável.",
        items: [
          "Orçamentos que repetem o passado com ajustes cosméticos.",
          "Forecast sem capacidade preditiva real.",
          "Desvios orçamentários sem planos de ação estruturados.",
          "Dificuldade em conectar métricas financeiras com estratégia.",
        ],
      },
      {
        kind: "method",
        eyebrow: "Método ÓRBITA™",
        title: "O ciclo que",
        titleEm: "transforma",
        letters: [
          {
            letter: "Ó",
            name: "Objetivos",
            desc: "Metas financeiras alinhadas à estratégia corporativa.",
          },
          {
            letter: "R",
            name: "Roadmap",
            desc: "Plano trimestral de ação, com responsáveis e prazos.",
          },
          {
            letter: "B",
            name: "Budget",
            desc: "Orçamento corporativo integrado, com premissas e cenários.",
          },
          { letter: "I", name: "Indicadores", desc: "KPIs financeiros e operacionais em rotina." },
          { letter: "T", name: "Tracking", desc: "Realizado vs. orçado analisado continuamente." },
          { letter: "A", name: "Ação", desc: "Correção de desvios antes que virem crise." },
        ],
      },
    ],
    cta: {
      title: "Conecte estratégia com execução financeira.",
      description:
        "Solicite um diagnóstico e descubra como o Método ÓRBITA™ pode transformar seu planejamento.",
    },
  },
  {
    slug: "gestao-estrategica-custos",
    kicker: "Método RICE™",
    name: "Gestão Estratégica de Custos",
    titlePrefix: "Gestão Estratégica",
    titleAccent: "de Custos",
    heroDescription:
      "Inteligência analítica e precisão na gestão de custos. Identifique desperdícios, mapeie direcionadores e descubra a rentabilidade real do seu negócio com o Método RICE™.",
    sections: [
      {
        kind: "method",
        eyebrow: "Método RICE™",
        title: "Inteligência",
        titleEm: "analítica",
        letters: [
          {
            letter: "R",
            name: "Reclassificação",
            desc: "Estruturação de centros de custo e classificação de despesas.",
          },
          {
            letter: "I",
            name: "Identificação",
            desc: "Mapeamento de direcionadores e análise de desperdícios.",
          },
          {
            letter: "C",
            name: "Custeio",
            desc: "Custeio por produto, canal, cliente e unidade de negócio.",
          },
          {
            letter: "E",
            name: "Estratégia",
            desc: "Precificação, mix de produtos e maximização de margem.",
          },
        ],
      },
      {
        kind: "checklist",
        eyebrow: "Análise de rentabilidade",
        title: "Onde seu negócio",
        titleEm: "ganha e perde dinheiro",
        intro:
          "A maioria das empresas conhece a margem bruta consolidada, mas não responde perguntas críticas: qual produto é mais rentável, qual cliente gera mais valor, qual canal tem melhor margem de contribuição.",
        columns: 2,
        items: [
          "Rentabilidade por produto/serviço",
          "Rentabilidade por cliente",
          "Rentabilidade por canal de venda",
          "Rentabilidade por unidade de negócio",
          "Análise de mix de produtos",
          "Precificação estratégica",
        ],
      },
    ],
    cta: {
      title: "Conheça a rentabilidade real do seu negócio.",
      description: "O Método RICE™ revela onde sua empresa ganha e perde dinheiro.",
    },
  },
  {
    slug: "business-intelligence",
    kicker: "Business Intelligence",
    name: "Business Intelligence",
    titlePrefix: "Business Intelligence",
    titleAccent: "Financeiro",
    heroDescription:
      "Dashboards financeiros e operacionais com visualização de dados em tempo real. Transformamos dados brutos em inteligência acionável para decisões rápidas e precisas.",
    sections: [
      {
        kind: "features",
        eyebrow: "Nossa entrega",
        title: "Dashboards que",
        titleEm: "geram ação",
        intro:
          "Não construímos relatórios — construímos instrumentos de navegação financeira. Cada dashboard é desenhado para responder uma pergunta de negócio e gerar uma decisão.",
        items: [
          {
            title: "KPIs Financeiros",
            desc: "Indicadores-chave acompanhados em rotina, sem depender de planilha manual.",
          },
          {
            title: "Fluxo de Caixa",
            desc: "Posição de caixa e projeção sempre atualizadas, com visão de curto e longo prazo.",
          },
          {
            title: "DRE Gerencial",
            desc: "Resultado por BU e segmento, do EBITDA ao resultado líquido.",
          },
          {
            title: "Budget vs. Real",
            desc: "Comparativo automático entre orçado e realizado, com alertas de desvio.",
          },
          {
            title: "Rentabilidade",
            desc: "Margem por produto, canal e cliente em um único painel.",
          },
          {
            title: "Indicadores Operacionais",
            desc: "KPIs de operação conectados ao resultado financeiro.",
          },
          { title: "Scorecards", desc: "Visão executiva consolidada para reunião de resultado." },
          {
            title: "Relatórios Automáticos",
            desc: "Distribuição periódica sem trabalho manual de compilação.",
          },
        ],
      },
    ],
    cta: {
      title: "Dados em tempo real. Decisões imediatas.",
      description: "Descubra como Business Intelligence pode acelerar suas decisões financeiras.",
    },
  },
  {
    slug: "valuation-ma",
    kicker: "Valuation & M&A",
    name: "Valuation & M&A",
    titlePrefix: "Valuation",
    titleAccent: "& M&A",
    heroDescription:
      "Avaliação de empresas, due diligence financeira e estruturação de operações societárias com rigor técnico comparável ao das grandes consultorias.",
    sections: [
      {
        kind: "features",
        eyebrow: "Nossa entrega",
        title: "Precisão técnica em cada",
        titleEm: "etapa da operação",
        items: [
          {
            title: "Valuation",
            desc: "Avaliação por múltiplos, DCF e métodos híbridos para transações, rodadas de investimento e planejamento sucessório.",
          },
          {
            title: "Due Diligence",
            desc: "Auditoria financeira detalhada para operações de M&A, identificando riscos, contingências e oportunidades de valor.",
          },
          {
            title: "M&A Advisory",
            desc: "Estruturação de operações societárias, negociação e apoio técnico em processos de fusão, aquisição e joint venture.",
          },
        ],
      },
    ],
    cta: {
      title: "Precisão técnica para decisões de alto impacto.",
      description: "Solicite uma avaliação com nossos especialistas.",
    },
  },
  {
    slug: "planejamento-tributario",
    kicker: "Planejamento Tributário",
    name: "Planejamento Tributário",
    titlePrefix: "Planejamento",
    titleAccent: "Tributário",
    heroDescription:
      "Otimização da carga tributária com legalidade, eficiência e visão estratégica. Análise de regimes, estruturas societárias e benefícios fiscais.",
    sections: [
      {
        kind: "features",
        eyebrow: "Frentes de atuação",
        title: "Eficiência fiscal com",
        titleEm: "visão estratégica",
        items: [
          {
            title: "Regime Tributário",
            desc: "Análise comparativa entre Lucro Real, Lucro Presumido e Simples Nacional.",
          },
          { title: "Elisão Fiscal", desc: "Estratégias legais para redução de carga tributária." },
          {
            title: "Transfer Pricing",
            desc: "Precificação de transações entre partes relacionadas.",
          },
          {
            title: "Benefícios Fiscais",
            desc: "Mapeamento e aproveitamento de incentivos regionais e setoriais.",
          },
        ],
      },
    ],
    cta: {
      title: "Eficiência tributária com visão estratégica.",
      description: "Descubra oportunidades de otimização fiscal para sua empresa.",
    },
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
