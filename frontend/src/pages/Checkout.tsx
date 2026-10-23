import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddressForm } from "@/components/checkout/AddressForm";
import { ErrorState, PageContainer, PageHeading, PageLoader } from "@/components/States";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/contexts/CartContext";
import { useAddresses } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api, errorMessage } from "@/lib/api";
import { formatCurrency, formatZip, sumMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Address, CreateOrderInput, Order, PreferenceResponse, ShippingMethod, ShippingQuote } from "@/types/api";

function OptionCard({ value, selected, children }: { value: string; selected: boolean; children: React.ReactNode }) {
  return (
    <label
      htmlFor={`opt-${value}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border bg-card p-4 transition-colors",
        selected ? "border-foreground ring-1 ring-foreground" : "border-input hover:border-foreground/50"
      )}
    >
      <RadioGroupItem id={`opt-${value}`} value={value} className="mt-1" />
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}

export default function Checkout() {
  usePageTitle("Finalizar compra");
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const addresses = useAddresses();

  const [addressId, setAddressId] = useState<string | undefined>();
  const [addingAddress, setAddingAddress] = useState(false);
  const [method, setMethod] = useState<ShippingMethod | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Depois que o pedido é criado o carrinho é esvaziado: isso não pode disparar o redirect de "carrinho vazio".
  const orderCreated = useRef(false);

  const selectedAddress: Address | undefined = useMemo(
    () => addresses.data?.find((address) => address.id === addressId) ?? addresses.data?.[0],
    [addresses.data, addressId]
  );

  const zip = selectedAddress?.zipCode;
  const quote = useQuery({
    queryKey: ["shipping-quote", zip],
    queryFn: () => api.post<ShippingQuote>("/shipping/quote", { zipCode: zip }),
    enabled: Boolean(zip),
    staleTime: 0,
  });

  // Pré-seleciona entrega própria se existir; senão transportadora. Reajusta se a cotação mudar.
  useEffect(() => {
    if (!quote.data) return;
    const available: ShippingMethod[] = [];
    if (quote.data.localZone) available.push("LOCAL_ZONE");
    if (quote.data.carrier.available) available.push("CARRIER");
    if (quote.data.pickup.available) available.push("PICKUP");
    setMethod((current) => (current && available.includes(current) ? current : available[0]));
  }, [quote.data]);

  if (items.length === 0 && !orderCreated.current) return <Navigate to="/carrinho" replace />;

  const shippingCost: number | null =
    method === "LOCAL_ZONE" ? (quote.data?.localZone?.price ?? null) : method === "PICKUP" ? 0 : null;
  const displayTotal = shippingCost !== null ? sumMoney([subtotal, shippingCost]) : subtotal;

  const canSubmit = Boolean(selectedAddress && method && quote.isSuccess) && !submitting;

  const handleSubmit = async () => {
    if (!selectedAddress || !method || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const body: CreateOrderInput = {
      addressId: selectedAddress.id,
      shippingMethod: method,
      items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
    };

    let order: Order;
    try {
      order = await api.post<Order>("/order", body);
    } catch (error) {
      // sem estoque, CEP fora da área de entrega própria etc.: o carrinho fica intacto
      setSubmitError(errorMessage(error));
      toast.error(errorMessage(error));
      setSubmitting(false);
      return;
    }

    orderCreated.current = true;
    clear();

    if (order.status === "AWAITING_SHIPPING_QUOTE") {
      navigate(`/pedidos/${order.id}`, { replace: true, state: { justCreatedQuote: true } });
      return;
    }

    try {
      const preference = await api.post<PreferenceResponse>("/payment/preference", { orderId: order.id });
      // Redireciona ao Mercado Pago; o botão segue desabilitado até a página sair.
      window.location.href = preference.checkoutUrl;
    } catch (error) {
      toast.error(`${errorMessage(error)} Seu pedido foi criado; você pode pagar em Meus pedidos.`);
      navigate(`/pedidos/${order.id}`, { replace: true });
    }
  };

  return (
    <PageContainer>
      <PageHeading title="Finalizar compra" />

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <div className="space-y-10">
          {/* 1. Endereço */}
          <section aria-labelledby="sec-endereco" className="space-y-4">
            <h2 id="sec-endereco" className="text-xl">1. Endereço de entrega</h2>
            {addresses.isPending ? (
              <PageLoader label="Carregando endereços..." />
            ) : addresses.isError ? (
              <ErrorState error={addresses.error} onRetry={() => addresses.refetch()} />
            ) : (
              <>
                {addresses.data.length > 0 && !addingAddress && (
                  <RadioGroup value={selectedAddress?.id ?? ""} onValueChange={setAddressId} className="gap-3" aria-label="Endereços salvos">
                    {addresses.data.map((address) => (
                      <label
                        key={address.id}
                        htmlFor={`addr-${address.id}`}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-md border bg-card p-4",
                          selectedAddress?.id === address.id ? "border-foreground ring-1 ring-foreground" : "border-input hover:border-foreground/50"
                        )}
                      >
                        <RadioGroupItem id={`addr-${address.id}`} value={address.id} className="mt-1" />
                        <span className="text-sm">
                          <span className="block font-medium">
                            {address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ""}
                          </span>
                          <span className="block text-muted-foreground">
                            {address.district} · {address.city}/{address.state} · CEP {formatZip(address.zipCode)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                )}

                {addingAddress || addresses.data.length === 0 ? (
                  <div className="rounded-md border border-border bg-card p-4 sm:p-5">
                    <AddressForm
                      onCreated={(address) => {
                        setAddressId(address.id);
                        setAddingAddress(false);
                      }}
                      {...(addresses.data.length > 0 ? { onCancel: () => setAddingAddress(false) } : {})}
                    />
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setAddingAddress(true)}>
                    Cadastrar novo endereço
                  </Button>
                )}
              </>
            )}
          </section>

          {/* 2. Frete */}
          <section aria-labelledby="sec-frete" className="space-y-4">
            <h2 id="sec-frete" className="text-xl">2. Forma de entrega</h2>
            {!selectedAddress ? (
              <p className="text-sm text-muted-foreground">Escolha ou cadastre um endereço para ver as opções de frete.</p>
            ) : quote.isPending ? (
              <PageLoader label="Calculando opções de frete..." />
            ) : quote.isError ? (
              <ErrorState error={quote.error} onRetry={() => quote.refetch()} />
            ) : (
              <RadioGroup value={method ?? ""} onValueChange={(value) => setMethod(value as ShippingMethod)} className="gap-3" aria-label="Forma de entrega">
                {quote.data.localZone && (
                  <OptionCard value="LOCAL_ZONE" selected={method === "LOCAL_ZONE"}>
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">Entrega própria ({quote.data.localZone.name})</span>
                      <span className="font-semibold">{formatCurrency(quote.data.localZone.price)}</span>
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      Prazo de entrega: de {quote.data.localZone.minDays} a {quote.data.localZone.maxDays} dias
                    </span>
                  </OptionCard>
                )}
                {quote.data.carrier.available && (
                  <OptionCard value="CARRIER" selected={method === "CARRIER"}>
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">Transportadora</span>
                      <span className="text-sm text-muted-foreground">Valor informado pelo vendedor após o pedido</span>
                    </span>
                    <span className="block text-sm text-muted-foreground">{quote.data.carrier.note}</span>
                  </OptionCard>
                )}
                {quote.data.pickup.available && (
                  <OptionCard value="PICKUP" selected={method === "PICKUP"}>
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">Retirada na loja</span>
                      <span className="font-semibold">Grátis</span>
                    </span>
                  </OptionCard>
                )}
              </RadioGroup>
            )}
          </section>
        </div>

        {/* 3. Resumo */}
        <aside className="h-fit space-y-4 rounded-md border border-border bg-card p-5 lg:sticky lg:top-28" aria-labelledby="sec-resumo">
          <h2 id="sec-resumo" className="text-xl">Resumo do pedido</h2>
          <ul className="divide-y divide-border text-sm">
            {items.map((item) => (
              <li key={item.variantId} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block text-muted-foreground">{item.variantLabel} · {item.quantity} un.</span>
                </span>
                <span className="shrink-0">{formatCurrency(sumMoney([item.unitPrice * item.quantity]))}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete</dt>
              <dd>{method === "CARRIER" ? "A combinar" : method === "PICKUP" ? "Grátis" : shippingCost !== null ? formatCurrency(shippingCost) : "–"}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatCurrency(displayTotal)}</dd>
            </div>
          </dl>

          {method === "CARRIER" && (
            <Alert>
              <AlertTitle>Frete a combinar</AlertTitle>
              <AlertDescription>
                O total final será confirmado após a cotação do frete pelo vendedor. Você só paga depois disso.
              </AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            Os valores acima são uma prévia: o total oficial é calculado pelo sistema ao confirmar o pedido.
          </p>

          {submitError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button size="lg" className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? "Processando..." : method === "CARRIER" ? "Enviar pedido" : "Confirmar e pagar"}
          </Button>
          <Button asChild variant="link" className="w-full">
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
        </aside>
      </div>
    </PageContainer>
  );
}
