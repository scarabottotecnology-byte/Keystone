import { PendingSection } from "@/components/shared/PendingSection";

/**
 * Diferente de Next Best Action — que já existe como consulta determinística
 * e só está vazia por falta de fonte —, este bloco depende do agente A9 em
 * si, que nasce na FASE 19. Não é "sem dado ainda"; é "a análise não existe
 * ainda". Duas ausências diferentes merecem mensagens diferentes.
 */
export function AiGrowthInsightCard() {
  return (
    <PendingSection
      title="AI Growth Insight"
      phase={19}
      description="Recomendação gerada pelo agente A9 a partir do estado real do negócio — problema, evidência e impacto esperado. Até lá, o Next Best Action ao lado já roda pela consulta determinística que este bloco vai herdar."
    />
  );
}
