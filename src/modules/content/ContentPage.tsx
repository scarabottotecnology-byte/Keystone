import { PageHeader } from "@/components/shared/PageHeader";
import { ContentIdeasSection } from "./ContentIdeasSection";
import { ContentLibrary } from "./ContentLibrary";

export function ContentPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Content"
        description="Produzir peças fundamentadas na base de conhecimento e reprovar o que estiver abaixo do padrão — ideias viram peça pelo A3, e o A4 revisa antes da aprovação."
      />

      <ContentIdeasSection />
      <ContentLibrary />
    </div>
  );
}
