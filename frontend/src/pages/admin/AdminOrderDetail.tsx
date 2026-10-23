import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Field } from "@/components/Field";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { EmptyState, ErrorState, PageLoader } from "@/components/States";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePageTitle } from "@/hooks/usePageTitle";
import { queryKeys } from "@/hooks/queries";
import { api, errorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/forms";
import { formatCurrency, formatDateTime, formatPhone, formatZip, shortOrderId, sumMoney } from "@/lib/format";
import { allowedTransitions, orderStatusLabel, paymentStatusLabel, shippingMethodLabel } from "@/lib/orderStatus";
import { brazilianPhoneToWhatsapp, whatsappLink } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/types/api";

const hasMaxTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

const quoteSchema = z.object({
  shippingCost: z.string().refine((value) => {
    const number = Number(value.replace(",", "."));
    return value.trim() !== "" && Number.isFinite(number) && number >= 0 && hasMaxTwoDecimals(number);
  }, "Informe um valor válido (0 ou mais, até 2 casas decimais)"),
  shippingNote: z.string().trim().max(500, "Máximo de 500 caracteres"),
});
type QuoteValues = z.infer<typeof quoteSchema>;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-3 text-xl">{title}</h2>
      {children}
    </section>
  );
}

function QuoteForm({ order, onDone }: { order: Order; onDone: () => Promise<void> }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuoteValues>({ resolver: zodResolver(quoteSchema), defaultValues: { shippingCost: "", shippingNote: "" } });

  const onSubmit = async (values: QuoteValues) => {
    try {
      await api.patch(`/admin/orders/${order.id}/shipping-quote`, {
        shippingCost: Number(values.shippingCost.replace(",", ".")),
        ...(values.shippingNote ? { shippingNote: values.shippingNote } : {}),
      });
      toast.success("Frete informado. O cliente já pode pagar.");
      await onDone();
    } catch (error) {
      applyApiErrors(error, setError, ["shippingCost", "shippingNote"]);
    }
  };

  return (
    <Card title="Cotação do frete (transportadora)">
      <Alert className="mb-4 border-amber/50 bg-amber/10">
        <AlertTitle>Este pedido aguarda a sua cotação</AlertTitle>
        <AlertDescription>Informe o valor combinado com a transportadora. O total é recalculado e o cliente poderá pagar.</AlertDescription>
      </Alert>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Valor do frete (R$)" htmlFor="shippingCost" required error={errors.shippingCost?.message}>
          <Input id="shippingCost" inputMode="decimal" placeholder="350,00" aria-invalid={!!errors.shippingCost} {...register("shippingCost")} />
        </Field>
        <Field label="Observação (transportadora, prazo...)" htmlFor="shippingNote" error={errors.shippingNote?.message}>
          <Textarea id="shippingNote" placeholder="Ex.: Transportadora X, entrega em 10 dias" aria-invalid={!!errors.shippingNote} {...register("shippingNote")} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Informar frete"}</Button>
      </form>
    </Card>
  );
}

export default function AdminOrderDetail() {
  const { orderId = "" } = useParams();
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [confirming, setConfirming] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.adminOrder(orderId),
    queryFn: () => api.get<Order>(`/admin/orders/${encodeURIComponent(orderId)}`),
    enabled: Boolean(orderId),
  });
  usePageTitle(query.data ? `Pedido ${shortOrderId(query.data.id)} | Admin` : "Pedido | Admin");

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminOrder(orderId) }),
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
    ]);
  };

  const changeStatus = useMutation({
    mutationFn: (status: OrderStatus) => api.patch(`/order/${orderId}/status`, { status }),
    onSuccess: async () => {
      toast.success("Status atualizado");
      setNextStatus("");
      setConfirming(false);
      await refresh();
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setConfirming(false);
    },
  });

  if (query.isPending) return <PageLoader />;

  if (query.isError) {
    const notFound = (query.error as { status?: number }).status === 404;
    return notFound ? (
      <EmptyState title="Pedido não encontrado" action={<Button asChild><Link to="/admin/pedidos">Voltar aos pedidos</Link></Button>} />
    ) : (
      <ErrorState error={query.error} onRetry={() => query.refetch()} />
    );
  }

  const order = query.data;
  const options = allowedTransitions[order.status];
  const needsQuote = order.shippingMethod === "CARRIER" && order.status === "AWAITING_SHIPPING_QUOTE";
  const phone = order.user?.phone;

  const submitStatus = () => {
    if (!nextStatus) return;
    // cancelar e marcar como pago manualmente pedem confirmação
    if (nextStatus === "CANCELED" || nextStatus === "PAID") setConfirming(true);
    else changeStatus.mutate(nextStatus);
  };

  return (
    <>
      <nav aria-label="Você está em" className="mb-4 text-sm text-muted-foreground">
        <Link to="/admin/pedidos" className="inline-block py-2 hover:text-foreground">Pedidos</Link> <span aria-hidden>/</span> {shortOrderId(order.id)}
      </nav>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-display">Pedido {shortOrderId(order.id)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">Criado em {formatDateTime(order.createdAt)}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {needsQuote && <QuoteForm order={order} onDone={refresh} />}

          <Card title="Itens">
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
                <dt className="text-muted-foreground">Frete ({shippingMethodLabel[order.shippingMethod]}{order.shippingZone ? `: ${order.shippingZone.name}` : ""})</dt>
                <dd>{order.shippingCost === null ? "A cotar" : formatCurrency(order.shippingCost)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatCurrency(order.total)}</dd></div>
            </dl>
            {order.shippingNote && <p className="mt-3 text-sm text-muted-foreground">Observação do frete: {order.shippingNote}</p>}
          </Card>

          <Card title="Pagamentos">
            {order.payments && order.payments.length > 0 ? (
              <ul className="divide-y divide-border text-sm">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="flex justify-between gap-3 py-2">
                    <span>
                      <span className="block font-medium">{paymentStatusLabel[payment.status]}</span>
                      <span className="block text-muted-foreground">
                        {formatDateTime(payment.createdAt)}{payment.method ? ` · ${payment.method}` : ""}
                        {payment.externalId ? ` · MP ${payment.externalId}` : ""}
                      </span>
                    </span>
                    <span>{formatCurrency(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            {options.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este pedido está em um status final: não há próximas etapas.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="novo-status">Mudar para</Label>
                  <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as OrderStatus)}>
                    <SelectTrigger id="novo-status" className="w-full">
                      <SelectValue placeholder="Escolha a próxima etapa" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((value) => (
                        <SelectItem key={value} value={value}>{orderStatusLabel[value]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={submitStatus} disabled={!nextStatus || changeStatus.isPending}>
                  {changeStatus.isPending ? "Atualizando..." : "Atualizar status"}
                </Button>
              </div>
            )}
          </Card>

          <Card title="Cliente">
            <p className="font-medium">{order.user?.name}</p>
            <p className="text-sm text-muted-foreground break-all">{order.user?.email}</p>
            {phone && (
              <Button asChild variant="outline" size="sm" className="mt-3">
                <a href={whatsappLink(`Olá, ${order.user?.name}! Sobre o seu pedido ${shortOrderId(order.id)}...`, brazilianPhoneToWhatsapp(phone))} target="_blank" rel="noreferrer">
                  <MessageCircle /> {formatPhone(phone)}
                </a>
              </Button>
            )}
          </Card>

          <Card title="Endereço de entrega">
            <address className="text-sm not-italic text-muted-foreground">
              {order.shipStreet}, {order.shipNumber}{order.shipComplement ? ` - ${order.shipComplement}` : ""}<br />
              {order.shipDistrict} · {order.shipCity}/{order.shipState}<br />
              CEP {formatZip(order.shipZipCode)}
            </address>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={nextStatus === "CANCELED" ? "Cancelar este pedido?" : "Marcar como pago?"}
        description={
          nextStatus === "CANCELED"
            ? "O estoque dos itens com controle de estoque será devolvido. Esta ação não pode ser desfeita."
            : "Use só para pagamento combinado por fora do Mercado Pago. O pedido seguirá para a produção."
        }
        confirmLabel={nextStatus === "CANCELED" ? "Cancelar pedido" : "Marcar como pago"}
        destructive={nextStatus === "CANCELED"}
        pending={changeStatus.isPending}
        onConfirm={() => nextStatus && changeStatus.mutate(nextStatus)}
      />
    </>
  );
}
