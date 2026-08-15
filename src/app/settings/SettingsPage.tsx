import { PageHeader } from "@/components/shared/PageHeader";
import { TeamSection } from "./TeamSection";
import { PendingSection } from "./PendingSection";

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Configurações"
        description="Organização, equipe, marca, IA e automação."
      />

      <TeamSection />

      <PendingSection
        title="Marca e metodologia"
        phase={5}
        description="Tom, público, diferenciais, palavras proibidas e preferidas, e os métodos ORBITA e RICE como propriedade intelectual estruturada."
      />

      <PendingSection
        title="ICP"
        phase={11}
        description="Construtor visual do perfil de cliente ideal, com peso por critério."
      />

      <PendingSection
        title="Orçamento de IA e automação"
        phase={20}
        description="Teto de gasto por operação e modo de aprovação por automação."
      />
    </div>
  );
}
