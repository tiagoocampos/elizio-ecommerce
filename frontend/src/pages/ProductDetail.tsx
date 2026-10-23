import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Clock, MessageCircle, Ruler, Weight } from "lucide-react";
import { EmptyState, ErrorState, PageContainer } from "@/components/States";
import { ProductImage } from "@/components/product/ProductImage";
import { QuantityStepper } from "@/components/product/QuantityStepper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";
import { useProduct } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatCurrency } from "@/lib/format";
import { optimizeImage } from "@/lib/image";
import { hasWhatsapp, whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Product, Variant } from "@/types/api";

function isUnavailable(variant: Variant | undefined): boolean {
  // stock null = sem controle (sempre disponível); número 0 = indisponível
  return variant !== undefined && variant.stock !== null && variant.stock <= 0;
}

function Gallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const images = product.images;

  return (
    <div className="space-y-3">
      <ProductImage src={images[active]} alt={product.name} ratio="aspect-[4/5] lg:aspect-square" width={1200} sizes="(min-width: 1024px) 50vw, 100vw" className="rounded-md" eager />
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="Miniaturas">
          {images.map((url, index) => (
            <li key={url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Ver foto ${index + 1} de ${images.length}`}
                aria-current={index === active}
                className={cn("block w-full overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", index === active ? "border-primary" : "border-transparent hover:border-border")}
              >
                <img src={optimizeImage(url, 200)} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Specs({ product }: { product: Product }) {
  const dimensions = [
    product.widthCm !== null && `Largura ${product.widthCm} cm`,
    product.depthCm !== null && `Profundidade ${product.depthCm} cm`,
    product.heightCm !== null && `Altura ${product.heightCm} cm`,
  ].filter(Boolean);

  const hasAny = dimensions.length > 0 || product.weightKg !== null || product.leadTimeDays !== null;
  if (!hasAny) return null;

  return (
    <ul className="space-y-3 border-y border-border py-5 text-sm">
      {product.leadTimeDays !== null && (
        <li className="flex items-start gap-3">
          <Clock className="mt-0.5 size-4 shrink-0 text-primary-hover" aria-hidden />
          <span>Produzido sob encomenda em até <strong>{product.leadTimeDays} dias</strong></span>
        </li>
      )}
      {dimensions.length > 0 && (
        <li className="flex items-start gap-3">
          <Ruler className="mt-0.5 size-4 shrink-0 text-primary-hover" aria-hidden />
          <span>
            <span className="text-muted-foreground">Medidas: </span>
            {product.widthCm ?? "–"} x {product.depthCm ?? "–"} x {product.heightCm ?? "–"} cm
            <span className="block text-xs text-muted-foreground">(largura x profundidade x altura)</span>
          </span>
        </li>
      )}
      {product.weightKg !== null && (
        <li className="flex items-start gap-3">
          <Weight className="mt-0.5 size-4 shrink-0 text-primary-hover" aria-hidden />
          <span><span className="text-muted-foreground">Peso: </span>{product.weightKg.toLocaleString("pt-BR")} kg</span>
        </li>
      )}
    </ul>
  );
}

function ProductView({ product }: { product: Product }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [variantId, setVariantId] = useState<string | undefined>(product.variants.length === 1 ? product.variants[0]?.id : undefined);
  const [quantity, setQuantity] = useState(1);
  const [missingVariant, setMissingVariant] = useState(false);

  const variant = product.variants.find((candidate) => candidate.id === variantId);
  const unavailable = isUnavailable(variant);
  const maxQuantity = variant && variant.stock !== null ? Math.max(1, variant.stock) : 20;
  const price = variant?.price ?? product.priceFrom ?? product.variants[0]?.price;

  const handleAdd = () => {
    if (!variant) {
      setMissingVariant(true);
      toast.error("Escolha uma variação antes de adicionar ao carrinho.");
      return;
    }
    if (unavailable) return;

    addItem(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantLabel: variant.label,
        unitPrice: variant.price,
        image: product.images[0] ?? "",
      },
      quantity
    );
    toast.success("Adicionado ao carrinho", {
      description: `${product.name} (${variant.label}) x ${quantity}`,
      action: { label: "Ver carrinho", onClick: () => navigate("/carrinho") },
    });
  };

  const addLabel = unavailable ? "Indisponível" : "Adicionar ao carrinho";

  return (
    <PageContainer className="pb-28 lg:pb-12">
      <nav aria-label="Você está em" className="mb-6 text-sm text-muted-foreground">
        <Link to="/produtos" className="inline-block py-2 hover:text-foreground">Móveis</Link>
        <span aria-hidden> / </span>
        <Link to={`/produtos?categoria=${product.category.id}`} className="inline-block py-2 hover:text-foreground">{product.category.name}</Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Gallery product={product} />

        <div className="space-y-6">
          <div>
            {product.madeToOrder && (
              <span className="mb-3 inline-block rounded-sm bg-amber px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-amber-foreground">
                Sob encomenda
              </span>
            )}
            <h1 className="text-display">{product.name}</h1>
            <p className="mt-3 text-2xl font-semibold" aria-live="polite">
              {variant ? formatCurrency(price ?? 0) : price !== undefined && <><span className="text-base font-normal text-muted-foreground">a partir de </span>{formatCurrency(price)}</>}
            </p>
          </div>

          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>

          <Specs product={product} />

          <fieldset>
            <legend className="mb-3 text-sm font-semibold">
              Variação <span className="text-muted-foreground font-normal">(obrigatório)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((option) => {
                const selected = option.id === variantId;
                const out = isUnavailable(option);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setVariantId(option.id);
                      setMissingVariant(false);
                      setQuantity(1);
                    }}
                    className={cn(
                      "min-h-11 rounded-md border px-4 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      selected ? "border-foreground bg-foreground text-background" : "border-input bg-card hover:border-foreground/50",
                      out && !selected && "opacity-60"
                    )}
                  >
                    <span className="block font-medium">{option.label}</span>
                    <span className={cn("block text-xs", selected ? "text-background/80" : "text-muted-foreground")}>
                      {formatCurrency(option.price)}{out && " · indisponível"}
                    </span>
                  </button>
                );
              })}
            </div>
            {missingVariant && <p role="alert" className="mt-2 text-sm text-destructive">Escolha uma variação para continuar.</p>}
          </fieldset>

          <div className="hidden flex-wrap items-center gap-3 lg:flex">
            <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} />
            <Button size="lg" onClick={handleAdd} disabled={unavailable} className="flex-1 sm:flex-none sm:min-w-64">
              {addLabel}
            </Button>
          </div>
          {unavailable && <p role="alert" className="text-sm text-destructive">Esta variação está indisponível no momento.</p>}

          {hasWhatsapp() && (
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <a
                href={whatsappLink(`Olá! Tenho interesse nesta peça: ${product.name}. ${window.location.href}`)}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle /> Chamar no WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Barra fixa de compra no mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} />
          <Button onClick={handleAdd} disabled={unavailable} className="h-11 flex-1">
            {addLabel}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

function ProductSkeleton() {
  return (
    <PageContainer>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14" aria-hidden>
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </PageContainer>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const query = useProduct(slug);
  usePageTitle(query.data?.name ?? "Produto");

  // Ao trocar de produto (mesma rota), volta ao topo.
  useEffect(() => window.scrollTo({ top: 0 }), [slug]);

  if (query.isPending) return <ProductSkeleton />;

  if (query.isError) {
    const notFound = (query.error as { status?: number }).status === 404;
    return (
      <PageContainer>
        {notFound ? (
          <EmptyState
            title="Peça não encontrada"
            description="Ela pode ter saído do catálogo."
            action={<Button asChild><Link to="/produtos">Ver todos os móveis</Link></Button>}
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        )}
      </PageContainer>
    );
  }

  // key: reinicia o estado (variação e quantidade) ao navegar entre produtos
  return <ProductView key={query.data.id} product={query.data} />;
}
