import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Erro 404"
        title="Esta página não existe"
        description={`Nenhum módulo responde por ${pathname}. Verifique o endereço ou volte para a navegação.`}
      />
      <div>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Voltar ao Command Center</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
