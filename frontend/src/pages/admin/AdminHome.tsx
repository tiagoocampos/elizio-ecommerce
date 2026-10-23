import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Package, Receipt, Tags, Truck } from "lucide-react";
import { ErrorState, PageHeading } from "@/components/States";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api } from "@/lib/api";
import { orderStatusLabel } from "@/lib/orderStatus";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/api";

const highlighted: OrderStatus[] = ["AWAITING_SHIPPING_QUOTE", "PENDING_PAYMENT", "PAID", "IN_PRODUCTION"];

const shortcuts = [
  { to: "/admin/produtos", label: "Produtos", description: "Cadastrar e editar peças", icon: Package },
  { to: "/admin/pedidos", label: "Pedidos", description: "Cotar frete e acompanhar status", icon: Receipt },
  { to: "/admin/frete", label: "Frete", description: "Zonas de entrega própria", icon: Truck },
  { to: "/admin/categorias", label: "Categorias", description: "Organizar o catálogo", icon: Tags },
];

export default function AdminHome() {
  usePageTitle("Resumo | Admin");
  const orders = useQuery({
    queryKey: queryKeys.adminOrders(),
    queryFn: () => api.get<Order[]>("/admin/orders"),
  });

  const count = (status: OrderStatus) => orders.data?.filter((order) => order.status === status).length ?? 0;

  return (
    <>
      <PageHeading title="Resumo" description="Visão rápida da loja." />

      <section aria-labelledby="pedidos-resumo" className="mb-10">
        <h2 id="pedidos-resumo" className="mb-3 text-xl">Pedidos em andamento</h2>
        {orders.isPending ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-hidden>
            {highlighted.map((status) => <Skeleton key={status} className="h-24" />)}
          </div>
        ) : orders.isError ? (
          <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {highlighted.map((status) => {
              const total = count(status);
              const urgent = status === "AWAITING_SHIPPING_QUOTE" && total > 0;
              return (
                <li key={status}>
                  <Link
                    to={`/admin/pedidos?status=${status}`}
                    className={cn("block rounded-md border bg-card p-4 transition-colors hover:border-foreground/40", urgent ? "border-amber ring-1 ring-amber" : "border-border")}
                  >
                    <span className="block text-3xl font-semibold tabular-nums">{total}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{orderStatusLabel[status]}</span>
                    {urgent && <span className="mt-1 block text-xs font-semibold text-[#7A4A0C]">Precisa da sua cotação</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="atalhos">
        <h2 id="atalhos" className="mb-3 text-xl">Atalhos</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.to}>
              <Link to={shortcut.to} className="flex items-center gap-4 rounded-md border border-border bg-card p-4 transition-colors hover:border-foreground/40">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/20 text-primary-hover" aria-hidden>
                  <shortcut.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{shortcut.label}</span>
                  <span className="block text-sm text-muted-foreground">{shortcut.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
