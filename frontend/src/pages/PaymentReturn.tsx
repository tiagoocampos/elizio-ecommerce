import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { ErrorState, PageContainer, PageLoader } from "@/components/States";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { usePay } from "@/hooks/usePay";
import { api } from "@/lib/api";
import { formatCurrency, shortOrderId } from "@/lib/format";
import { orderStatusLabel } from "@/lib/orderStatus";
import type { Order } from "@/types/api";

type Kind = "success" | "failure" | "pending";

const POLL_MS = 3000;
const POLL_LIMIT_MS = 60_000;
const PAID_STATUSES: Order["status"][] = ["PAID", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];

const titles: Record<Kind, string> = {
  success: "Pagamento",
  failure: "Pagamento não concluído",
  pending: "Pagamento pendente",
};

function Panel({ icon, title, children, tone }: { icon: React.ReactNode; title: string; children: React.ReactNode; tone: "ok" | "wait" | "bad" }) {
  const toneClass = tone === "ok" ? "text-emerald-700" : tone === "bad" ? "text-destructive" : "text-primary-hover";
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-md border border-border bg-card px-6 py-12 text-center">
      <span className={toneClass} aria-hidden>{icon}</span>
      <h1 className="text-display">{title}</h1>
      <div className="space-y-4 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export default function PaymentReturn({ kind }: { kind: Kind }) {
  usePageTitle(titles[kind]);
  const [params] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { pay, paying } = usePay();
  // O Mercado Pago devolve o id do pedido em external_reference.
  const orderId = params.get("external_reference");

  const startedAt = useRef(Date.now());
  const [timedOut, setTimedOut] = useState(false);

  const order = useQuery({
    queryKey: queryKeys.order(orderId ?? ""),
    queryFn: () => api.get<Order>(`/order/${encodeURIComponent(orderId ?? "")}`),
    enabled: Boolean(orderId) && isAuthenticated,
    staleTime: 0,
    // Em success/pending, consulta a cada 3 s por até ~60 s enquanto o webhook ainda não marcou o pedido como pago.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const waiting = kind !== "failure" && status === "PENDING_PAYMENT";
      return waiting && Date.now() - startedAt.current < POLL_LIMIT_MS ? POLL_MS : false;
    },
  });

  useEffect(() => {
    if (kind === "failure") return;
    const timer = setTimeout(() => setTimedOut(true), POLL_LIMIT_MS);
    return () => clearTimeout(timer);
  }, [kind]);

  if (!orderId) {
    return (
      <PageContainer>
        <Panel icon={<Clock className="size-12" />} title="Retorno do pagamento" tone="wait">
          <p>Não conseguimos identificar o pedido neste retorno. Confira o andamento em Meus pedidos.</p>
          <Button asChild><Link to="/pedidos">Ver meus pedidos</Link></Button>
        </Panel>
      </PageContainer>
    );
  }

  if (authLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <Panel icon={<Clock className="size-12" />} title="Entre para ver seu pedido" tone="wait">
          <p>Para consultar o estado do pagamento, entre na sua conta.</p>
          <Button asChild><Link to={`/entrar?redirect=${encodeURIComponent(location.pathname + location.search)}`}>Entrar</Link></Button>
        </Panel>
      </PageContainer>
    );
  }

  if (order.isPending) return <PageLoader label="Consultando seu pedido..." />;

  if (order.isError) {
    return (
      <PageContainer>
        <ErrorState error={order.error} onRetry={() => order.refetch()} />
      </PageContainer>
    );
  }

  const data = order.data;
  const label = shortOrderId(data.id);
  const detailLink = (
    <Button asChild variant={PAID_STATUSES.includes(data.status) ? "default" : "outline"}>
      <Link to={`/pedidos/${data.id}`}>Ver pedido {label}</Link>
    </Button>
  );

  // O estado exibido vem sempre do pedido na API, nunca só da rota de retorno.
  if (PAID_STATUSES.includes(data.status)) {
    return (
      <PageContainer>
        <Panel icon={<CheckCircle2 className="size-12" />} title="Pagamento confirmado!" tone="ok">
          <p>Recebemos o pagamento do pedido {label} ({formatCurrency(data.total)}). Agora é com a gente: vamos produzir a sua peça.</p>
          {detailLink}
        </Panel>
      </PageContainer>
    );
  }

  if (data.status === "CANCELED") {
    return (
      <PageContainer>
        <Panel icon={<XCircle className="size-12" />} title="Pedido cancelado" tone="bad">
          <p>O pedido {label} foi cancelado.</p>
          {detailLink}
        </Panel>
      </PageContainer>
    );
  }

  if (data.status === "AWAITING_SHIPPING_QUOTE") {
    return (
      <PageContainer>
        <Panel icon={<Clock className="size-12" />} title="Aguardando o frete" tone="wait">
          <p>O pedido {label} aguarda a cotação do frete pelo vendedor.</p>
          {detailLink}
        </Panel>
      </PageContainer>
    );
  }

  // PENDING_PAYMENT
  if (kind === "failure") {
    return (
      <PageContainer>
        <Panel icon={<XCircle className="size-12" />} title="O pagamento não foi concluído" tone="bad">
          <p>O pedido {label} continua aberto. Você pode tentar pagar novamente.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => pay(data.id)} disabled={paying}>
              {paying ? "Redirecionando..." : "Tentar pagar novamente"}
            </Button>
            {detailLink}
          </div>
        </Panel>
      </PageContainer>
    );
  }

  const stillWaiting = !timedOut && Date.now() - startedAt.current < POLL_LIMIT_MS;

  return (
    <PageContainer>
      <Panel
        icon={stillWaiting ? <Loader2 className="size-12 animate-spin" /> : <Clock className="size-12" />}
        title={stillWaiting ? "Confirmando seu pagamento..." : "Estamos confirmando seu pagamento"}
        tone="wait"
      >
        {stillWaiting ? (
          <p role="status">Aguarde um instante, isso costuma levar poucos segundos. Não feche esta página.</p>
        ) : (
          <p role="status">
            A confirmação ainda não chegou, o que é normal em alguns meios de pagamento (como Pix e boleto). Status atual: <strong>{orderStatusLabel[data.status]}</strong>. Acompanhe pelo seu pedido.
          </p>
        )}
        {detailLink}
      </Panel>
    </PageContainer>
  );
}
