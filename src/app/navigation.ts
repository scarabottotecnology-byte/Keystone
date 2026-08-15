import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  Gauge,
  Inbox,
  LayoutGrid,
  Megaphone,
  PenLine,
  Radar,
  Settings,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Registro único de navegação do Keystone Growth OS.
 *
 * A sidebar, o roteador e as telas de módulo não implementado leem daqui —
 * não existe lista de destinos duplicada em outro lugar. Adicionar um módulo
 * é adicionar uma entrada nesta constante.
 *
 * `phase` é a fase do roadmap (docs/09-ROADMAP-E-ACEITE.md) em que o módulo
 * passa a existir de verdade. Módulo com `status: "planned"` renderiza um
 * estado honesto dizendo isso, em vez de uma tela com dado falso.
 *
 * A FASE 1 entregou a fundação, não telas com dado — todos nasceram
 * `planned`. Configurações virou `active` na FASE 2, com a seção de Equipe.
 * Command Center virou `active` na FASE 3: `rpc_command_center()` responde
 * de verdade, só que com os seis componentes do Growth Score indisponíveis,
 * porque nenhuma tabela de origem (conteúdo, leads, prospecção, pipeline)
 * existe ainda. Cada tela ativa que ainda não cobre tudo o que promete
 * declara a parte pendente nela mesma, com a fase em que chega — nunca
 * esconde atrás de um placeholder de tela inteira nem finge com dado falso.
 */

export type ModuleStatus = "active" | "planned";

export interface NavItem {
  /** Rótulo exibido na sidebar. */
  label: string;
  /** Rota. Também é a chave do módulo. */
  to: string;
  icon: LucideIcon;
  status: ModuleStatus;
  /** Fase do roadmap em que o módulo é entregue. */
  phase: number;
  /** O que o módulo responde. Aparece na tela de módulo planejado. */
  purpose: string;
  /** O que existirá aqui quando a fase for concluída. */
  delivers?: string[];
  /** Rota exata para marcação de item ativo (só a raiz precisa). */
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    label: "Visão geral",
    items: [
      {
        label: "Command Center",
        to: "/",
        icon: Gauge,
        status: "active",
        phase: 3,
        end: true,
        purpose:
          "Responder em menos de dez segundos o que está acontecendo com o crescimento.",
        delivers: [
          "Growth Score com componentes e tendência",
          "Pipeline gerado, leads, oportunidades e receita atribuída",
          "Todo indicador com comparação contra o período anterior",
          "AI Growth Insight e Next Best Action do dia",
        ],
      },
    ],
  },
  {
    label: "Crescimento",
    items: [
      {
        label: "Intelligence",
        to: "/intelligence",
        icon: Radar,
        status: "planned",
        phase: 4,
        purpose:
          "Descobrir oportunidade de mercado antes de produzir conteúdo.",
        delivers: [
          "Feed de insights com relevância e potencial comercial",
          "Fonte obrigatória em cada insight — sem procedência, é descartado",
          "Ação de gerar pauta a partir de um insight, preservando a origem",
        ],
      },
      {
        label: "Content",
        to: "/content",
        icon: PenLine,
        status: "planned",
        phase: 5,
        purpose:
          "Produzir peças fundamentadas na base de conhecimento e reprovar o que estiver abaixo do padrão.",
        delivers: [
          "Pipeline de geração em etapas: ângulo, hook, estrutura, copy, CTA",
          "Content Score de 0 a 100 em dez dimensões",
          "Revisão por modelo distinto do gerador",
          "Biblioteca, variações e fila de aprovação",
        ],
      },
      {
        label: "Calendar",
        to: "/calendar",
        icon: CalendarDays,
        status: "planned",
        phase: 4,
        purpose: "Distribuir a pauta ao longo da semana, por canal e formato.",
        delivers: [
          "Visualizações de mês, semana, dia e lista",
          "Regras de distribuição configuráveis por dia e pilar",
          "Canal, formato, status, horário e score em cada item",
        ],
      },
      {
        label: "Social",
        to: "/social",
        icon: Share2,
        status: "planned",
        phase: 6,
        purpose: "Publicar no LinkedIn e no Instagram sem duplicar e sem falhar em silêncio.",
        delivers: [
          "Contas conectadas com saúde e validade de credencial",
          "Fila de publicação, histórico e falhas com erro legível",
          "Publicação idempotente: reexecutar o workflow não publica duas vezes",
        ],
      },
      {
        label: "Analytics",
        to: "/analytics",
        icon: BarChart3,
        status: "planned",
        phase: 8,
        purpose: "Medir o que o conteúdo gerou — até a receita, não até a curtida.",
        delivers: [
          "Snapshot diário de métricas, preservando a curva de evolução",
          "Engagement Rate, CTR, Lead Conversion Rate e Content ROI",
          "Métrica que a plataforma não fornece aparece como indisponível, nunca como zero",
        ],
      },
    ],
  },
  {
    label: "Receita",
    items: [
      {
        label: "Leads",
        to: "/leads",
        icon: Users,
        status: "planned",
        phase: 10,
        purpose: "Capturar sem duplicar e registrar a origem no momento do evento.",
        delivers: [
          "Captura pública protegida por token, validação e rate limit",
          "Deduplicação por e-mail, telefone ou perfil",
          "Timeline completa e score por lead",
        ],
      },
      {
        label: "Prospects",
        to: "/prospects",
        icon: Building2,
        status: "planned",
        phase: 12,
        purpose:
          "Encontrar empresas aderentes ao ICP por fonte oficial e priorizar quem abordar.",
        delivers: [
          "ICP Score com contribuição e motivo por critério",
          "Cobertura declarada: score que avaliou 40% dos critérios não se disfarça de score completo",
          "Pesquisa comercial com lastro — só afirma o que tem fonte",
        ],
      },
      {
        label: "Campaigns",
        to: "/campaigns",
        icon: Megaphone,
        status: "planned",
        phase: 14,
        purpose: "Abordar de forma personalizada e conforme, sem virar máquina de spam.",
        delivers: [
          "Sequências D0, D3, D7, D14 e D30 com condição por etapa",
          "Supressão verificada antes de todo envio, opt-out em toda mensagem",
          "Resposta do prospect interrompe a sequência automaticamente",
        ],
      },
      {
        label: "Inbox",
        to: "/inbox",
        icon: Inbox,
        status: "planned",
        phase: 16,
        purpose: "Conversar, pré-qualificar e saber a hora de passar para o humano.",
        delivers: [
          "Conversas de WhatsApp e e-mail num lugar só",
          "Pré-qualificação por IA que nunca cita preço nem faz proposta",
          "Botão ASSUMIR CONVERSA — depois dele, a IA sugere e não envia",
        ],
      },
      {
        label: "Pipeline",
        to: "/pipeline",
        icon: LayoutGrid,
        status: "planned",
        phase: 17,
        purpose: "Conduzir a oportunidade preservando de onde ela veio.",
        delivers: [
          "Kanban com empresa, contato, valor, score, origem e próxima ação",
          "Histórico de toda mudança de estágio",
          "Origem de conteúdo e campanha herdada do lead",
        ],
      },
    ],
  },
  {
    label: "Inteligência",
    items: [
      {
        label: "AI Insights",
        to: "/ai-insights",
        icon: Sparkles,
        status: "planned",
        phase: 19,
        purpose: "Transformar análise em ação executável, não em relatório.",
        delivers: [
          "Problema, evidência, recomendação e impacto esperado",
          "Botão EXECUTAR quando a recomendação tem ação válida associada",
          "Toda execução registrada em auditoria com o resultado",
        ],
      },
      {
        label: "Automations",
        to: "/automations",
        icon: Activity,
        status: "planned",
        phase: 20,
        purpose: "Operar o ciclo diário sem que nada falhe em silêncio.",
        delivers: [
          "Catálogo de automações com horário e modo de aprovação",
          "Histórico de execução, taxa de erro e timeline por passo",
          "Correlation ID reconstruindo a cadeia inteira de uma execução",
        ],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        label: "Configurações",
        to: "/settings",
        icon: Settings,
        status: "active",
        phase: 2,
        purpose:
          "Organização, marca, IA, contas conectadas, ICP, automação, segurança.",
        delivers: [
          "Perfil da organização e gestão de membros por papel",
          "Marca: tom, público, diferenciais, palavras proibidas e preferidas",
          "Métodos ORBITA e RICE como propriedade intelectual estruturada",
          "Orçamento de IA e modo de aprovação por automação",
        ],
      },
    ],
  },
];

/** Todos os itens, achatados — usado pelo roteador. */
export const ALL_NAV_ITEMS: NavItem[] = NAVIGATION.flatMap((g) => g.items);

/** Itens que ainda não têm implementação real. */
export const PLANNED_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter(
  (i) => i.status === "planned",
);

export function findNavItem(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => i.to === pathname);
}
