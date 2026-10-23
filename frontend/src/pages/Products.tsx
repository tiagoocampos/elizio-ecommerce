import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { EmptyState, ErrorState, PageContainer, PageHeading } from "@/components/States";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories, useProducts } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Products() {
  usePageTitle("Móveis");
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("categoria") ?? undefined;
  const [search, setSearch] = useState("");

  const categories = useCategories();
  const products = useProducts(categoryId);

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    if (!term || !products.data) return products.data ?? [];
    return products.data.filter((product) => normalize(product.name).includes(term));
  }, [products.data, search]);

  const selectCategory = (id: string | undefined) => {
    const next = new URLSearchParams(params);
    if (id) next.set("categoria", id);
    else next.delete("categoria");
    setParams(next, { replace: true });
  };

  return (
    <PageContainer>
      <PageHeading title="Nossos móveis" description="Todas as peças são produzidas sob encomenda." />

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" role="group" aria-label="Filtrar por categoria">
          <Button size="sm" variant={categoryId ? "outline" : "secondary"} aria-pressed={!categoryId} onClick={() => selectCategory(undefined)}>
            Todas
          </Button>
          {categories.data?.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={categoryId === category.id ? "secondary" : "outline"}
              aria-pressed={categoryId === category.id}
              onClick={() => selectCategory(category.id)}
              className={cn("shrink-0")}
            >
              {category.name}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:max-w-xs">
          <Label htmlFor="busca" className="sr-only">Buscar por nome</Label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input id="busca" type="search" placeholder="Buscar por nome" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </div>
      </div>

      {products.isPending ? (
        <ProductGridSkeleton />
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search ? "Nenhuma peça encontrada" : "Nenhuma peça disponível por enquanto"}
          description={search ? "Tente outro nome ou limpe a busca." : "Volte em breve: novas peças estão a caminho."}
          action={
            (search || categoryId) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  selectCategory(undefined);
                }}
              >
                Limpar filtros
              </Button>
            )
          }
        />
      ) : (
        <ProductGrid products={filtered} />
      )}
    </PageContainer>
  );
}
