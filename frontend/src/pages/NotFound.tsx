import { Link } from "react-router-dom";
import { EmptyState, PageContainer } from "@/components/States";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Página não encontrada");
  return (
    <PageContainer>
      <EmptyState
        title="Página não encontrada"
        description="O endereço que você tentou abrir não existe."
        action={<Button asChild><Link to="/">Voltar ao início</Link></Button>}
      />
    </PageContainer>
  );
}
