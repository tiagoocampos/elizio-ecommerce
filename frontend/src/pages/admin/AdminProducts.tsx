import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { EmptyState, ErrorState, PageHeading } from "@/components/States";
import { ProductImage } from "@/components/product/ProductImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api, errorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/api";

export default function AdminProducts() {
  usePageTitle("Produtos | Admin");
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: queryKeys.adminProducts, queryFn: () => api.get<Product[]>("/admin/products") });
  const [deactivating, setDeactivating] = useState<Product | null>(null);

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
    ]);
  };

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete("/product", { productId: id }),
    onSuccess: async () => {
      toast.success("Produto desativado");
      setDeactivating(null);
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setDeactivating(null);
    },
  });

  const reactivate = useMutation({
    // PUT /product aceita JSON quando não há arquivos
    mutationFn: (id: string) => api.put("/product", { productId: id, active: true }),
    onSuccess: async () => {
      toast.success("Produto reativado");
      await refresh();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const actions = (product: Product) => (
    <div className="flex gap-1">
      <Button asChild variant="ghost" size="icon-sm">
        <Link to={`/admin/produtos/${product.id}`} aria-label={`Editar ${product.name}`}><Pencil /></Link>
      </Button>
      {product.active ? (
        <Button variant="ghost" size="icon-sm" aria-label={`Desativar ${product.name}`} onClick={() => setDeactivating(product)}>
          <PowerOff className="text-destructive" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon-sm" aria-label={`Reativar ${product.name}`} disabled={reactivate.isPending} onClick={() => reactivate.mutate(product.id)}>
          <Power className="text-emerald-700" />
        </Button>
      )}
    </div>
  );

  return (
    <>
      <PageHeading
        title="Produtos"
        action={<Button asChild><Link to="/admin/produtos/novo"><Plus /> Novo produto</Link></Button>}
      />

      {products.isPending ? (
        <div className="space-y-2" aria-hidden>{[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-20" />)}</div>
      ) : products.isError ? (
        <ErrorState error={products.error} onRetry={() => products.refetch()} />
      ) : products.data.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado"
          description="Cadastre a primeira peça do catálogo."
          action={<Button asChild><Link to="/admin/produtos/novo"><Plus /> Novo produto</Link></Button>}
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3">Produto</th>
                  <th scope="col" className="p-3">Categoria</th>
                  <th scope="col" className="p-3">A partir de</th>
                  <th scope="col" className="p-3">Situação</th>
                  <th scope="col" className="p-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.data.map((product) => (
                  <tr key={product.id} className={product.active ? "" : "text-muted-foreground"}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <ProductImage src={product.images[0]} alt={product.name} ratio="aspect-square" width={160} sizes="3rem" className="w-12 shrink-0 rounded-md" />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-3">{product.category.name}</td>
                    <td className="p-3">{product.priceFrom != null ? formatCurrency(product.priceFrom) : "–"}</td>
                    <td className="p-3"><Badge variant={product.active ? "secondary" : "outline"}>{product.active ? "Ativo" : "Inativo"}</Badge></td>
                    <td className="p-3"><div className="flex justify-end">{actions(product)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {products.data.map((product) => (
              <li key={product.id} className="flex gap-3 rounded-md border border-border bg-card p-3">
                <ProductImage src={product.images[0]} alt={product.name} ratio="aspect-square" width={200} sizes="5rem" className="w-20 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.category.name}</p>
                  <p className="text-sm">{product.priceFrom != null ? `a partir de ${formatCurrency(product.priceFrom)}` : "Sem preço"}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <Badge variant={product.active ? "secondary" : "outline"}>{product.active ? "Ativo" : "Inativo"}</Badge>
                    {actions(product)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Desativar produto?"
        description={<><strong>{deactivating?.name}</strong> sai da loja, mas continua no sistema (pedidos antigos não são afetados). Você pode reativá-lo depois.</>}
        confirmLabel="Desativar"
        pending={deactivate.isPending}
        onConfirm={() => deactivating && deactivate.mutate(deactivating.id)}
      />
    </>
  );
}
