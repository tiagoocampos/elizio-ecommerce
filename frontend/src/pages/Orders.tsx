import { useMemo } from "react";
import { Link } from "react-router-dom";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState, ErrorState, PageContainer, PageHeading } from "@/components/States";
import { ProductImage } from "@/components/product/ProductImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyOrders, useProducts } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatCurrency, formatDate, shortOrderId } from "@/lib/format";

export default function Orders() {
  usePageTitle("Meus pedidos");
  const orders = useMyOrders();
  const products = useProducts();

  // Os itens do pedido não trazem foto: casa variantId com as variações do catálogo ativo.
  const imageByVariant = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products.data ?? []) {
      const image = product.images[0];
      if (!image) continue;
      for (const variant of product.variants) map.set(variant.id, image);
    }
    return map;
  }, [products.data]);

  const sorted = useMemo(
    () => [...(orders.data ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders.data]
  );

  return (
    <PageContainer className="max-w-4xl">
      <PageHeading title="Meus pedidos" />

      {orders.isPending ? (
        <div className="space-y-3" aria-hidden>
          {[0, 1, 2].map((key) => <Skeleton key={key} className="h-24 w-full" />)}
        </div>
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Você ainda não fez nenhum pedido"
          description="Quando fizer, ele aparece aqui para você acompanhar."
          action={<Button asChild><Link to="/produtos">Ver móveis</Link></Button>}
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((order) => {
            const first = order.items[0];
            return (
              <li key={order.id}>
                <Link
                  to={`/pedidos/${order.id}`}
                  className="flex items-center gap-4 rounded-md border border-border bg-card p-3 transition-colors hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-4"
                >
                  <ProductImage
                    src={first ? imageByVariant.get(first.variantId) : undefined}
                    alt={first?.productName ?? "Pedido"}
                    ratio="aspect-square"
                    width={200}
                    sizes="5rem"
                    className="w-16 shrink-0 rounded-md sm:w-20"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-semibold">Pedido {shortOrderId(order.id)}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {first ? first.productName : "Sem itens"}
                      {order.items.length > 1 && ` e mais ${order.items.length - 1} ${order.items.length === 2 ? "item" : "itens"}`}
                    </p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <p className="shrink-0 text-right font-semibold">{formatCurrency(order.total)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
