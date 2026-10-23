import { Link, useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { EmptyState, PageContainer, PageHeading } from "@/components/States";
import { ProductImage } from "@/components/product/ProductImage";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatCurrency, sumMoney } from "@/lib/format";

export default function Cart() {
  usePageTitle("Carrinho");
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <PageContainer>
        <PageHeading title="Carrinho" />
        <EmptyState
          title="Seu carrinho está vazio"
          description="Escolha uma peça no catálogo para começar."
          action={<Button asChild><Link to="/produtos">Ver móveis</Link></Button>}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeading title="Carrinho" />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <ul className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <li key={item.variantId} className="flex gap-4 py-5">
              <Link to={`/produto/${item.slug}`} className="w-24 shrink-0 sm:w-28">
                <ProductImage src={item.image} alt={item.name} ratio="aspect-square" width={300} sizes="7rem" className="rounded-md" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/produto/${item.slug}`} className="font-heading text-lg leading-snug hover:underline">{item.name}</Link>
                    <p className="text-sm text-muted-foreground">{item.variantLabel}</p>
                    <p className="mt-1 text-sm">{formatCurrency(item.unitPrice)} cada</p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatCurrency(sumMoney([item.unitPrice * item.quantity]))}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <QuantityStepper value={item.quantity} onChange={(value) => updateQuantity(item.variantId, value)} label={`Quantidade de ${item.name}`} />
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.variantId)} aria-label={`Remover ${item.name} do carrinho`}>
                    <Trash2 /> <span className="hidden sm:inline">Remover</span>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-4 rounded-md border border-border bg-card p-5 lg:sticky lg:top-28">
          <h2 className="text-xl">Resumo</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-lg font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            O frete é calculado no checkout, de acordo com o seu CEP. Os valores finais são confirmados ao fechar o pedido.
          </p>
          <Button size="lg" className="w-full" onClick={() => navigate("/checkout")}>
            Finalizar compra
          </Button>
          <Button asChild variant="link" className="w-full">
            <Link to="/produtos">Continuar comprando</Link>
          </Button>
        </aside>
      </div>
    </PageContainer>
  );
}
