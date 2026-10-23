import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState, ErrorState, PageHeading } from "@/components/States";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime, shortOrderId } from "@/lib/format";
import { ORDER_STATUSES, orderStatusLabel } from "@/lib/orderStatus";
import type { Order, OrderStatus } from "@/types/api";

export default function AdminOrders() {
  usePageTitle("Pedidos | Admin");
  const [params, setParams] = useSearchParams();
  const raw = params.get("status");
  const status = ORDER_STATUSES.find((value) => value === raw) as OrderStatus | undefined;

  const orders = useQuery({
    queryKey: queryKeys.adminOrders(status),
    queryFn: () => api.get<Order[]>("/admin/orders", { status }),
  });

  const onFilter = (value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete("status");
    else next.set("status", value);
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeading title="Pedidos" />

      <div className="mb-6 max-w-xs space-y-1.5">
        <Label htmlFor="filtro-status">Filtrar por status</Label>
        <Select value={status ?? "all"} onValueChange={onFilter}>
          <SelectTrigger id="filtro-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ORDER_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>{orderStatusLabel[value]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orders.isPending ? (
        <div className="space-y-2" aria-hidden>{[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-16" />)}</div>
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : orders.data.length === 0 ? (
        <EmptyState title="Nenhum pedido" description={status ? "Não há pedidos com este status." : "Os pedidos aparecem aqui."} />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3">Pedido</th>
                  <th scope="col" className="p-3">Cliente</th>
                  <th scope="col" className="p-3">Data</th>
                  <th scope="col" className="p-3">Total</th>
                  <th scope="col" className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.data.map((order) => (
                  <tr key={order.id} className="hover:bg-accent/50">
                    <td className="p-3 font-medium">
                      <Link to={`/admin/pedidos/${order.id}`} className="underline-offset-4 hover:underline">{shortOrderId(order.id)}</Link>
                    </td>
                    <td className="p-3">
                      <span className="block">{order.user?.name}</span>
                      <span className="block text-xs text-muted-foreground">{order.user?.email}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                    <td className="p-3">{order.shippingCost === null ? <><span>{formatCurrency(order.total)}</span><span className="block text-xs text-muted-foreground">+ frete a cotar</span></> : formatCurrency(order.total)}</td>
                    <td className="p-3"><OrderStatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {orders.data.map((order) => (
              <li key={order.id}>
                <Link to={`/admin/pedidos/${order.id}`} className="block rounded-md border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{shortOrderId(order.id)}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm">{order.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                  <p className="mt-2 font-semibold">{formatCurrency(order.total)}{order.shippingCost === null && <span className="ml-1 text-xs font-normal text-muted-foreground">+ frete a cotar</span>}</p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
