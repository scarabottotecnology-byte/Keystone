// Conteúdo das páginas de serviço da Keystone (escritório de contabilidade).

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

type Faq = { q: string; a: string };

function build(o: {
  slug: string;
  kicker: string;
  name: string;
  titlePrefix: string;
  titleAccent: string;
  heroDescription: string;
  problems: string[];
  includes: { title: string; desc: string }[];
  steps: { title: string; desc: string }[];
  checklist: string[];
  faq: Faq[];
  cta: { title: string; description: string };
}): ServiceContent {
  return {
    slug: o.slug,
    kicker: o.kicker,
    name: o.name,
    titlePrefix: o.titlePrefix,
    titleAccent: o.titleAccent,
    heroDescription: o.heroDescription,
    sections: [
      {
        kind: "problems",
        eyebrow: "Quando procurar",
        title: "Sinais de que você precisa de",
        titleEm: "ajuda aqui",
        items: o.problems,
      },
      { kind: "features", eyebrow: "O que fazemos", title: "O que está", titleEm: "incluído", items: o.includes },
      { kind: "steps", eyebrow: "Como funciona", title: "Do primeiro contato à", titleEm: "rotina", steps: o.steps },
      {
        kind: "checklist",
        eyebrow: "Para começar",
        title: "O que pedimos de",
        titleEm: "você",
        items: o.checklist,
        columns: 2,
      },
      { kind: "faq", eyebrow: "Dúvidas frequentes", title: "Perguntas sobre", titleEm: o.name.toLowerCase(), items: o.faq },
    ],
    cta: o.cta,
  };
}

const proposta = {
  title: "Quer saber quanto custa no seu caso?",
  description: "Conte o regime, o número de funcionários e o faturamento médio. Respondemos com proposta em até 1 dia útil.",
};

export const services: ServiceContent[] = [
  build({
    slug: "contabilidade-mensal",
    kicker: "Contabilidade",
    name: "Contabilidade Mensal",
    titlePrefix: "Contabilidade",
    titleAccent: "mensal",
    heroDescription:
      "Escrituração, balancete, demonstrações e obrigações acessórias em dia e relatórios que você consegue ler. Para empresas do Simples Nacional e do Lucro Presumido.",
    problems: [
      "Você só fala com o contador quando há problema ou multa.",
      "Não sabe se o lucro que aparece no extrato é o lucro real da empresa.",
      "A contabilidade fecha tarde e ninguém explica os números.",
      "Documentos se perdem entre e-mail, WhatsApp e planilha.",
    ],
    includes: [
      { title: "Escrituração contábil", desc: "Lançamentos, conciliações e plano de contas adequado à sua atividade." },
      { title: "Balancete e demonstrações", desc: "Balancete mensal, balanço patrimonial e DRE, com leitura em linguagem simples." },
      { title: "Obrigações acessórias", desc: "ECD, ECF, DEFIS ou DASN conforme o regime, além de declarações municipais e estaduais." },
      { title: "Responsável pela conta", desc: "Um ponto de contato fixo acompanhando a empresa mês a mês." },
      { title: "Portal e atendimento digital", desc: "Envio de documentos e acompanhamento online, com resposta em até 1 dia útil." },
      { title: "Reunião de resultado", desc: "Conversa periódica para explicar o mês e apontar o que exige decisão." },
    ],
    steps: [
      { title: "Levantamento", desc: "Coletamos cadastro, contratos, extratos e a situação contábil atual." },
      { title: "Migração", desc: "Assumimos a contabilidade com o contador anterior, sem interromper obrigações." },
      { title: "Rotina mensal", desc: "Você envia os documentos até a data combinada; nós fechamos e entregamos." },
      { title: "Acompanhamento", desc: "Revisão de regime, de custos fiscais e de pendências ao longo do ano." },
    ],
    checklist: [
      "Contrato social e CNPJ atualizados",
      "Extratos bancários e de cartões do mês",
      "Notas fiscais emitidas e recebidas",
      "Acesso ao emissor de notas ou ao ERP",
      "Folha de pagamento do mês, se houver funcionários",
      "Relação de contas a pagar e a receber",
    ],
    faq: [
      { q: "Vocês assumem a contabilidade de quem já tem contador?", a: "Sim. Cuidamos da troca: pedimos a carta de anuência, recebemos os arquivos e a documentação do contador anterior e seguimos sem perder prazos." },
      { q: "Atendem Simples Nacional e Lucro Presumido?", a: "Sim. Esses são os regimes em que mais atuamos. Também orientamos quando faz sentido migrar de um para o outro." },
      { q: "O que acontece se eu atrasar documentos?", a: "Avisamos antes do vencimento e explicamos o efeito na apuração. Se o atraso for recorrente, ajustamos o fluxo de envio com você." },
    ],
    cta: proposta,
  }),
  build({
    slug: "abertura-de-empresas",
    kicker: "Abertura e legalização",
    name: "Abertura de Empresas",
    titlePrefix: "Abertura de",
    titleAccent: "empresas",
    heroDescription:
      "Escolhemos o tipo societário, a atividade (CNAE) e o regime tributário certos para a sua operação, e cuidamos de CNPJ, inscrições e licenças até a empresa poder faturar.",
    problems: [
      "Você vai abrir uma empresa e não sabe se compensa Simples Nacional ou Lucro Presumido.",
      "Teme escolher o CNAE errado e pagar imposto a mais ou ser barrado em contratos.",
      "Precisa abrir agência, escritório de engenharia ou de advocacia com regras próprias de registro.",
      "Quer transformar um trabalho como autônomo ou MEI em uma empresa.",
    ],
    includes: [
      { title: "Análise do regime tributário", desc: "Comparativo entre Simples Nacional e Lucro Presumido com a sua previsão de faturamento e folha." },
      { title: "Tipo societário e contrato social", desc: "Sociedade limitada, sociedade unipessoal, sociedade simples de advocacia ou empresário individual, conforme o caso." },
      { title: "CNPJ e inscrições", desc: "Registro na Junta, Receita Federal, inscrição municipal e, quando aplicável, estadual." },
      { title: "Alvarás e licenças", desc: "Alvará de funcionamento e licenças exigidas pela atividade e pelo município." },
      { title: "Registro em conselho de classe", desc: "Orientação e apoio para CREA/CAU em engenharia e arquitetura e OAB em sociedades de advogados." },
      { title: "Certificado digital e emissão de notas", desc: "Orientação para certificado digital e habilitação para emitir nota fiscal." },
    ],
    steps: [
      { title: "Conversa de viabilidade", desc: "Entendemos a atividade, os sócios e a previsão de faturamento." },
      { title: "Desenho", desc: "Definimos CNAE, regime, capital e cláusulas do contrato social." },
      { title: "Registro", desc: "Protocolamos nos órgãos e acompanhamos as exigências." },
      { title: "Empresa pronta", desc: "Entregamos CNPJ, inscrições e orientação para o primeiro mês de operação." },
    ],
    checklist: [
      "Documento e CPF de todos os sócios",
      "Comprovante de residência dos sócios",
      "Endereço onde a empresa vai funcionar",
      "Descrição da atividade e previsão de faturamento",
      "Número de funcionários previstos",
      "Registro profissional, quando exigido",
    ],
    faq: [
      { q: "Quanto tempo leva para abrir a empresa?", a: "Depende da atividade e do município. Em casos simples, o CNPJ costuma sair em poucos dias úteis; alvarás e licenças podem levar mais tempo." },
      { q: "Preciso estar na cidade?", a: "Em geral não. O processo é digital, com assinatura eletrônica. Alguns municípios pedem etapas presenciais, e avisamos antes." },
      { q: "Vocês fazem a abertura se eu não for ficar com a contabilidade?", a: "A abertura é mais eficiente quando a mesma equipe cuida da rotina depois, então apresentamos as duas opções na proposta." },
    ],
    cta: proposta,
  }),
  build({
    slug: "alteracao-e-encerramento",
    kicker: "Legalização",
    name: "Alteração e Encerramento de Empresas",
    titlePrefix: "Alteração e",
    titleAccent: "encerramento",
    heroDescription:
      "Entrada e saída de sócios, mudança de endereço, de atividade ou de capital, e baixa de empresas, com regularização fiscal para que a empresa não deixe pendências em seu nome.",
    problems: [
      "Um sócio quer sair e o contrato social está desatualizado.",
      "A empresa mudou de endereço ou passou a prestar outro serviço sem atualizar o cadastro.",
      "Você parou de operar, mas a empresa continua acumulando obrigações e multas.",
      "Quer encerrar a empresa sem herdar dívidas ou declarações em atraso.",
    ],
    includes: [
      { title: "Alteração contratual", desc: "Sócios, capital, endereço, objeto social, nome empresarial e administração." },
      { title: "Atualização cadastral", desc: "Receita Federal, prefeitura, estado, Simples Nacional e órgãos de classe." },
      { title: "Diagnóstico de pendências", desc: "Levantamento de declarações em atraso, débitos e certidões antes de qualquer baixa." },
      { title: "Distrato e baixa", desc: "Distrato social, balanço de encerramento e baixa nos órgãos competentes." },
      { title: "Declarações finais", desc: "Declarações de extinção e entrega das obrigações do período final." },
      { title: "Guarda de documentos", desc: "Orientação sobre os prazos de guarda dos documentos após o encerramento." },
    ],
    steps: [
      { title: "Diagnóstico", desc: "Verificamos a situação cadastral e fiscal da empresa." },
      { title: "Regularização", desc: "Resolvemos o que estiver em aberto para destravar a alteração ou a baixa." },
      { title: "Protocolo", desc: "Preparamos e registramos os atos nos órgãos." },
      { title: "Conclusão", desc: "Entregamos os documentos finais e as certidões." },
    ],
    checklist: [
      "Contrato social e alterações anteriores",
      "CNPJ e documentos dos sócios",
      "Certificado digital, se houver",
      "Últimas declarações entregues",
      "Relação de funcionários e contratos em vigor",
      "Extratos e saldo das contas bancárias",
    ],
    faq: [
      { q: "Dá para encerrar uma empresa com dívidas?", a: "A baixa pode ser feita, mas débitos continuam existindo e podem alcançar os sócios em certas situações. Por isso começamos pelo diagnóstico." },
      { q: "Quanto tempo leva uma baixa?", a: "Varia com as pendências e com o município. A fase de regularização costuma ser a mais longa." },
      { q: "Posso só mudar o endereço?", a: "Sim. É uma alteração simples em muitos casos, mas pode exigir novo alvará." },
    ],
    cta: proposta,
  }),
  build({
    slug: "bpo-financeiro",
    kicker: "BPO financeiro",
    name: "BPO Financeiro",
    titlePrefix: "BPO",
    titleAccent: "financeiro",
    heroDescription:
      "Contas a pagar e a receber, conciliação bancária, fluxo de caixa e DRE gerencial feitos por nós, para você saber quanto tem em caixa, quanto vai entrar e quanto sobra no fim do mês.",
    problems: [
      "O financeiro é tocado por você ou por alguém que também faz outras coisas.",
      "Você descobre que faltou dinheiro quando o boleto já venceu.",
      "Não sabe qual cliente, projeto ou contrato dá mais lucro.",
      "Sua agência ou escritório fatura bem, mas o caixa nunca acompanha.",
    ],
    includes: [
      { title: "Contas a pagar", desc: "Programação, conferência e pagamento de fornecedores, impostos e folha, com sua aprovação." },
      { title: "Contas a receber e cobrança", desc: "Emissão de cobranças, controle de inadimplência e régua de lembretes." },
      { title: "Conciliação bancária", desc: "Conferência diária ou semanal entre extratos, cartões e lançamentos." },
      { title: "Fluxo de caixa projetado", desc: "Visão semanal e mensal do que entra e sai nos próximos meses." },
      { title: "DRE gerencial", desc: "Resultado por mês, por centro de custo, cliente ou projeto." },
      { title: "Indicadores e reunião mensal", desc: "Painel com poucos indicadores e conversa para decidir o próximo passo." },
    ],
    steps: [
      { title: "Mapeamento", desc: "Entendemos suas contas, ferramentas e rotina de aprovação." },
      { title: "Plano de contas gerencial", desc: "Organizamos categorias e centros de custo de acordo com o seu negócio." },
      { title: "Operação", desc: "Rodamos o dia a dia financeiro com cadência combinada." },
      { title: "Gestão", desc: "Entregamos relatórios e discutimos o que ajustar." },
    ],
    checklist: [
      "Acesso de consulta aos bancos e cartões",
      "Lista de fornecedores, clientes e contratos recorrentes",
      "Sistema financeiro ou planilha em uso",
      "Política de alçadas e aprovação de pagamentos",
      "Metas de caixa ou de margem, se existirem",
      "Pessoa de contato na empresa",
    ],
    faq: [
      { q: "Vocês movimentam o dinheiro da empresa?", a: "Operamos o financeiro conforme o nível de acesso que você definir. Pagamentos podem ficar sempre dependentes da sua aprovação final." },
      { q: "Preciso trocar de sistema?", a: "Não necessariamente. Trabalhamos com o que você já usa e sugerimos mudanças só se houver ganho claro." },
      { q: "BPO substitui a contabilidade?", a: "Não. São serviços diferentes e complementares. Quando feitos pela mesma equipe, os dados fluem sem retrabalho." },
    ],
    cta: proposta,
  }),
  build({
    slug: "fiscal-e-tributario",
    kicker: "Fiscal e tributário",
    name: "Fiscal e Planejamento Tributário",
    titlePrefix: "Fiscal e",
    titleAccent: "planejamento tributário",
    heroDescription:
      "Apuração de impostos, notas fiscais e obrigações acessórias, com análise do regime que realmente custa menos para a sua empresa, hoje e na transição da reforma tributária.",
    problems: [
      "Você paga imposto sem saber se o regime atual é o mais barato.",
      "Está perto do limite do Simples Nacional e não sabe o que acontece depois.",
      "As retenções de ISS, IRRF, PIS, COFINS e CSLL em notas de serviços estão confusas.",
      "Quer entender como a reforma tributária afeta a sua empresa.",
    ],
    includes: [
      { title: "Apuração do Simples Nacional", desc: "Cálculo do DAS, do fator R e dos anexos aplicáveis à sua atividade." },
      { title: "Apuração do Lucro Presumido", desc: "IRPJ, CSLL, PIS, COFINS, ISS e demais tributos, com cálculo trimestral." },
      { title: "Obrigações acessórias", desc: "DCTFWeb, EFD-Reinf, EFD-Contribuições e demais declarações conforme o regime." },
      { title: "Retenções na fonte", desc: "Conferência das retenções em notas emitidas e recebidas." },
      { title: "Planejamento tributário", desc: "Comparativo entre regimes e simulação da carga com a sua realidade." },
      { title: "Recuperação de créditos", desc: "Revisão de pagamentos a maior e créditos que possam ser compensados." },
    ],
    steps: [
      { title: "Diagnóstico fiscal", desc: "Revisamos CNAE, anexo, notas e histórico de apurações." },
      { title: "Simulação", desc: "Comparamos a carga entre regimes com seus números." },
      { title: "Decisão", desc: "Apresentamos a recomendação com prazos para mudança, quando houver." },
      { title: "Rotina", desc: "Apuramos e entregamos as obrigações todo mês." },
    ],
    checklist: [
      "Faturamento mensal dos últimos 12 meses",
      "Notas fiscais emitidas e recebidas",
      "Folha de pagamento e pró-labore",
      "Última declaração anual entregue",
      "Lista de atividades prestadas ou produtos vendidos",
      "Contratos com retenção de impostos",
    ],
    faq: [
      { q: "Quando vale migrar do Simples para o Lucro Presumido?", a: "Depende da margem, da folha e do tipo de serviço. Em atividades com folha pequena e margem alta pode compensar, em outras não. Só uma simulação com seus números responde." },
      { q: "Vocês fazem recuperação de impostos pagos a maior?", a: "Fazemos a revisão e a apuração. Quando o caso exigir medida judicial, indicamos assessoria jurídica." },
      { q: "A reforma tributária muda minha situação?", a: "Haverá transição gradual. Acompanhamos as regras e avisamos quando houver decisão a tomar." },
    ],
    cta: proposta,
  }),
  build({
    slug: "departamento-pessoal",
    kicker: "Departamento pessoal",
    name: "Departamento Pessoal e Folha",
    titlePrefix: "Departamento pessoal e",
    titleAccent: "folha",
    heroDescription:
      "Admissão, folha de pagamento, férias, 13º, rescisão e eSocial feitos por nós, para você contratar com segurança e evitar autuações trabalhistas e previdenciárias.",
    problems: [
      "Contratar e demitir parece arriscado e cheio de detalhes.",
      "A folha é feita em planilha e já houve erro de cálculo.",
      "Agências de emprego e prestadores precisam de muitas admissões em pouco tempo.",
      "O eSocial gera pendências que ninguém entende.",
    ],
    includes: [
      { title: "Admissão e registro", desc: "Contrato, exame admissional, registro e envio ao eSocial." },
      { title: "Folha mensal", desc: "Proventos, descontos, INSS, IRRF, FGTS, vale-transporte e benefícios." },
      { title: "Férias e 13º salário", desc: "Cálculo, aviso, recibo e programação para não surpreender o caixa." },
      { title: "Rescisões", desc: "Cálculo, verbas e homologação conforme o tipo de desligamento." },
      { title: "eSocial, FGTS Digital e DCTFWeb", desc: "Eventos periódicos e de saúde, guias e declarações em dia." },
      { title: "Pró-labore e retiradas", desc: "Orientação para pagar os sócios dentro da regra." },
    ],
    steps: [
      { title: "Cadastro", desc: "Importamos funcionários, salários e benefícios." },
      { title: "Calendário", desc: "Definimos datas de envio de variáveis, fechamento e pagamento." },
      { title: "Folha", desc: "Calculamos, conferimos e enviamos holerites e guias." },
      { title: "Revisão", desc: "Acompanhamos afastamentos, férias vencendo e riscos trabalhistas." },
    ],
    checklist: [
      "Contratos de trabalho em vigor",
      "Lista de funcionários com salário e cargo",
      "Convenção coletiva aplicável",
      "Benefícios oferecidos (VT, VR, plano)",
      "Pontos e variáveis do mês",
      "Certificado digital da empresa",
    ],
    faq: [
      { q: "Vocês fazem o eSocial?", a: "Sim. Enviamos os eventos de admissão, folha, afastamento e desligamento, além de tratar as inconsistências." },
      { q: "Há limite de funcionários?", a: "A proposta é calculada pelo número de funcionários e pela complexidade. Atendemos desde equipes pequenas até operações com muitas admissões por mês." },
      { q: "E se houver reclamação trabalhista?", a: "Fornecemos os documentos e cálculos que sustentam a defesa. A representação em juízo é feita por advogado." },
    ],
    cta: proposta,
  }),
  build({
    slug: "regularizacao-fiscal",
    kicker: "Regularização",
    name: "Regularização Fiscal e Parcelamentos",
    titlePrefix: "Regularização",
    titleAccent: "fiscal",
    heroDescription:
      "Declarações em atraso, débitos, intimações e malha fina. Levantamos a situação real, negociamos parcelamentos quando existirem e recuperamos certidões para a empresa voltar a operar sem travas.",
    problems: [
      "A empresa recebeu intimação ou notificação da Receita, estado ou prefeitura.",
      "Há declarações em atraso e multas acumulando.",
      "Você não consegue certidão negativa para participar de licitação, financiamento ou contrato.",
      "O Simples Nacional corre o risco de exclusão por débitos.",
    ],
    includes: [
      { title: "Diagnóstico de pendências", desc: "Consulta de débitos, declarações e situação cadastral nos órgãos." },
      { title: "Parcelamentos", desc: "Análise das modalidades disponíveis e simulação do impacto no caixa." },
      { title: "Respostas a intimações", desc: "Elaboração da resposta técnica e organização dos documentos de suporte." },
      { title: "Entrega de declarações em atraso", desc: "Regularização de DEFIS, DCTF, ECD, ECF e outras." },
      { title: "Certidões", desc: "Emissão de certidões negativas ou positivas com efeito de negativas." },
      { title: "Prevenção", desc: "Rotina para que a pendência não se repita." },
    ],
    steps: [
      { title: "Levantamento", desc: "Mapeamos tudo o que há em aberto." },
      { title: "Estratégia", desc: "Definimos a ordem de regularização e o caminho de menor custo." },
      { title: "Execução", desc: "Entregamos declarações, protocolamos pedidos e parcelamos." },
      { title: "Acompanhamento", desc: "Monitoramos o status até a emissão das certidões." },
    ],
    checklist: [
      "Procuração eletrônica ou certificado digital",
      "Cópia das intimações recebidas",
      "Declarações e guias antigas",
      "Extratos de débitos disponíveis nos portais",
      "Documentos do período em questão",
      "Contrato social atualizado",
    ],
    faq: [
      { q: "Parcelamento sempre vale a pena?", a: "Não necessariamente. Comparamos a opção com o pagamento à vista e outras modalidades antes de recomendar." },
      { q: "Vocês representam a empresa em processo?", a: "Atuamos na parte contábil e administrativa. Para contencioso e processo judicial, trabalhamos junto com advogado." },
      { q: "Qual o prazo para responder uma intimação?", a: "O prazo está na própria intimação e costuma ser curto. Se recebeu uma, procure-nos o quanto antes." },
    ],
    cta: {
      title: "Recebeu uma intimação ou tem débitos em aberto?",
      description: "Fale com a gente logo. Os prazos correm e a primeira resposta costuma ser a mais importante.",
    },
  }),
  build({
    slug: "imposto-de-renda",
    kicker: "Pessoa física e sócios",
    name: "Imposto de Renda para Sócios e Profissionais",
    titlePrefix: "Imposto de renda para",
    titleAccent: "sócios",
    heroDescription:
      "Declaração anual, carnê-leão, ganho de capital e organização da renda dos sócios, para que o que sai da empresa e o que entra na pessoa física estejam alinhados.",
    problems: [
      "Você recebe da empresa e de outras fontes e não sabe como declarar.",
      "Vendeu bem, ações ou imóvel e precisa calcular ganho de capital.",
      "Recebe aluguel ou presta serviço como pessoa física e tem de pagar carnê-leão.",
      "Teme cair na malha fina.",
    ],
    includes: [
      { title: "Declaração anual (IRPF)", desc: "Elaboração e conferência da declaração completa." },
      { title: "Carnê-leão", desc: "Apuração mensal de rendimentos sem retenção, como aluguéis e serviços." },
      { title: "Ganho de capital", desc: "Cálculo e recolhimento na venda de imóveis, participações e outros bens." },
      { title: "Investimentos e renda variável", desc: "Apuração de operações em bolsa e demais aplicações." },
      { title: "Sócios e distribuição de lucros", desc: "Coerência entre pró-labore, lucros distribuídos e declaração pessoal." },
      { title: "Malha fina", desc: "Diagnóstico e retificação quando houver divergência." },
    ],
    steps: [
      { title: "Envio de documentos", desc: "Você nos envia informes de rendimentos e comprovantes." },
      { title: "Conferência", desc: "Cruzamos as informações com os dados da empresa." },
      { title: "Declaração", desc: "Preparamos e revisamos junto com você." },
      { title: "Entrega", desc: "Transmitimos e guardamos o recibo e os documentos." },
    ],
    checklist: [
      "Informes de rendimentos do ano",
      "Comprovantes de despesas dedutíveis",
      "Informes bancários e de corretoras",
      "Documentos de bens e dívidas",
      "Recibo da declaração do ano anterior",
      "Documentos da empresa (pró-labore e lucros)",
    ],
    faq: [
      { q: "Vocês atendem só sócios de empresas clientes?", a: "Priorizamos sócios dos nossos clientes, mas também atendemos profissionais autônomos e liberais mediante proposta." },
      { q: "Quando devo enviar os documentos?", a: "Quanto antes melhor. Perto do prazo final a fila aumenta e o risco de erro também." },
      { q: "Declaro lucros distribuídos?", a: "Sim, como rendimento isento dentro das regras vigentes. Acompanhamos mudanças legislativas sobre o assunto." },
    ],
    cta: proposta,
  }),
  build({
    slug: "gestao-e-indicadores",
    kicker: "Gestão financeira",
    name: "Gestão e Indicadores",
    titlePrefix: "Gestão e",
    titleAccent: "indicadores",
    heroDescription:
      "Orçamento, precificação, ponto de equilíbrio e acompanhamento mensal para empresas que querem usar a contabilidade para decidir, e não só para cumprir obrigação.",
    problems: [
      "Você não sabe o preço mínimo que cada serviço precisa ter.",
      "A empresa cresce, mas a margem não acompanha.",
      "Decisões de contratar ou investir são tomadas no feeling.",
      "Seus sócios discordam sobre o resultado da empresa.",
    ],
    includes: [
      { title: "DRE gerencial mensal", desc: "Resultado por área, cliente ou projeto, com comparação ao mês anterior." },
      { title: "Precificação", desc: "Cálculo de preço por serviço ou produto considerando custos, impostos e margem." },
      { title: "Ponto de equilíbrio", desc: "Quanto faturar por mês para cobrir todos os custos." },
      { title: "Orçamento e metas", desc: "Planejamento simples do ano com revisão trimestral." },
      { title: "Painel de indicadores", desc: "Poucos números, atualizados, escolhidos para o seu negócio." },
      { title: "Reunião de gestão", desc: "Conversa com plano de ação para o mês seguinte." },
    ],
    steps: [
      { title: "Diagnóstico", desc: "Analisamos a estrutura de custos e o histórico." },
      { title: "Modelo", desc: "Montamos DRE gerencial, orçamento e metas." },
      { title: "Acompanhamento", desc: "Atualizamos o painel todo mês." },
      { title: "Decisão", desc: "Discutimos ajustes de preço, custo e investimento." },
    ],
    checklist: [
      "DRE ou balancete recentes",
      "Lista de custos fixos e variáveis",
      "Tabela de preços atual",
      "Principais clientes e contratos",
      "Metas de faturamento ou de margem",
      "Equipe e custo por função",
    ],
    faq: [
      { q: "Isso substitui um diretor financeiro?", a: "Para empresas pequenas e médias, cobre grande parte do que um CFO faria no dia a dia. Não substitui uma estrutura financeira interna em empresas maiores." },
      { q: "Preciso contratar a contabilidade para contratar esse serviço?", a: "Não é obrigatório, mas o trabalho flui melhor quando a base contábil está conosco." },
      { q: "Quanto tempo até ver resultado?", a: "Os primeiros relatórios saem no primeiro ciclo mensal. Os ganhos de margem aparecem conforme você aplica as decisões." },
    ],
    cta: proposta,
  }),
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
