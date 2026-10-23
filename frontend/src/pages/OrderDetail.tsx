import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, MessageCircle } from "lucide-react";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState, ErrorState, PageContainer, PageLoader } from "@/components/States";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePay } from "@/hooks/usePay";
import { api } from "@/lib/api";
import { formatCurrency, formatDateTime, formatZip, shortOrderId, sumMoney } from "@/lib/format";
import { orderStatusLabel, orderStatusMessage, orderTimeline, paymentStatusLabel, shippingMethodLabel } from "@/lib/orderStatus";
import { hasWhatsapp, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/api";

function Timeline({ status }: { status: Order["status"] }) {
  if (status === "CANCELED" || status === "AWAITING_SHIPPING_QUOTE") return null;
  const current = orderTimeline.indexOf(status);

  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Andamento do pedido">
      {orderTimeline.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step} className="flex flex-col items-center gap-2 text-center" aria-current={index === current ? "step" : undefined}>
            <span className={cn("flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold", done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
              {done ? <Check className="size-4" aria-hidden /> : index + 1}
            </span>
            <span className={cn("text-[0.7rem] leading-tight sm:text-xs", done ? "font-semibold" : "text-muted-foreground")}>{orderStatusLabel[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetail() {
  const { orderId = "" } = useParams();
  const location = useLocation();
  const { pay, paying } = usePay();
  const justCreatedQuote = (location.state as { justCreatedQuote?: boolean } | null)?.justCreatedQuote === true;

  const query = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => api.get<Order>(`/order/${encodeURIComponent(orderId)}`),
    enabled: Boolean(orderId),
  });
  usePageTitle(query.data ? `Pedido ${shortOrderId(query.data.id)}` : "Pedido");

  if (query.isPending) return <PageLoader />;

  if (query.isError) {
    const notFound = (query.error as { status?: number }).status === 404;
    return (
      <PageContainer>
        {notFound ? (
          <EmptyState title="Pedido não encontrado" action={<Button asChild><Link to="/pedidos">Ver meus pedidos</Link></Button>} />
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </PageContainer>
    );
  }

  const order = query.data;
  const label = shortOrderId(order.id);
  const statusMessage = orderStatusMessage[order.status];
  const quoteMessage = `Olá! Gostaria de saber sobre o frete do meu pedido ${label}.`;

  return (
    <PageContainer className="max-w-4xl">
      <nav aria-label="Você está em" className="mb-4 text-sm text-muted-foreground">
        <Link to="/pedidos" className="inline-block py-2 hover:text-foreground">Meus pedidos</Link> <span aria-hidden>/</span> {label}
      </nav>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-display">Pedido {label}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">Feito em {formatDateTime(order.createdAt)}</p>

      <div className="space-y-6">
        {order.status === "AWAITING_SHIPPING_QUOTE" && (
          <Alert className="border-amber/50 bg-amber/10">
            <AlertTitle>{justCreatedQuote ? "Recebemos seu pedido!" : "Aguardando a cotação do frete pelo vendedor"}</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                {justCreatedQuote
                  ? "Recebemos seu pedido! O Elizio vai informar o valor do frete e você poderá pagar em seguida."
                  : "O Elizio vai informar o valor do frete e você poderá pagar em seguida."}
              </p>
              {hasWhatsapp() && (
                <Button asChild variant="outline" size="sm">
                  <a href={whatsappLink(quoteMessage)} target="_blank" rel="noreferrer"><MessageCircle /> Falar no WhatsApp</a>
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {order.status === "PENDING_PAYMENT" && (
          <Alert className="border-primary/50 bg-primary/10">
            <AlertTitle>Pagamento pendente</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>Seu pedido está reservado. Finalize o pagamento para iniciarmos a produção.</p>
              <Button onClick={() => pay(order.id)} disabled={paying}>
                {paying ? "Redirecionando..." : "Pagar agora"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {statusMessage && (
          <Alert variant={order.status === "CANCELED" ? "destructive" : "default"}>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}

        <Timeline status={order.status} />

        <section aria-labelledby="itens" className="rounded-md border border-border bg-card p-4 sm:p-5">
          <h2 id="itens" className="mb-3 text-xl">Itens</h2>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium">{item.productName}</span>
                  <span className="block text-muted-foreground">{item.variantLabel} · {item.quantity} x {formatCurrency(item.unitPrice)}</span>
                </span>
                <span className="shrink-0 font-medium">{formatCurrency(sumMoney([item.unitPrice * item.quantity]))}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete ({shippingMethodLabel[order.shippingMethod]})</dt>
              <dd>{order.shippingCost === null ? "A combinar" : order.shippingCost === 0 ? "Grátis" : formatCurrency(order.shippingCost)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatCurrency(order.total)}</dd></div>
          </dl>
          {order.shippingCost === null && (
            <p className="mt-2 text-xs text-muted-foreground">O total será atualizado quando o frete for informado.</p>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section aria-labelledby="entrega" className="rounded-md border border-border bg-card p-4 sm:p-5">
            <h2 id="entrega" className="mb-3 text-xl">Entrega</h2>
            <p className="text-sm font-medium">{shippingMethodLabel[order.shippingMethod]}</p>
            {order.shippingNote && <p className="mt-1 text-sm text-muted-foreground">Observação do vendedor: {order.shippingNote}</p>}
            <address className="mt-3 text-sm not-italic text-muted-foreground">
              {order.shipStreet}, {order.shipNumber}{order.shipComplement ? ` - ${order.shipComplement}` : ""}<br />
              {order.shipDistrict} · {order.shipCity}/{order.shipState}<br />
              CEP {formatZip(order.shipZipCode)}
            </address>
          </section>

          {order.payments && order.payments.length > 0 && (
            <section aria-labelledby="pagamentos" className="rounded-md border border-border bg-card p-4 sm:p-5">
              <h2 id="pagamentos" className="mb-3 text-xl">Pagamentos</h2>
              <ul className="divide-y divide-border text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="flex justify-between gap-3 py-2">
                    <span>
                      <span className="block font-medium">{paymentStatusLabel[payment.status]}</span>
                      <span className="block text-muted-foreground">{formatDateTime(payment.createdAt)}{payment.method ? ` · ${payment.method}` : ""}</span>
                    </span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
