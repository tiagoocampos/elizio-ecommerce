import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/types/api";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const from = product.priceFrom ?? product.variants[0]?.price ?? null;

  return (
    <Link to={`/produto/${product.slug}`} className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
      <div className="relative overflow-hidden rounded-md">
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {product.madeToOrder && (
          <span className="absolute left-2 top-2 rounded-sm bg-amber px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-amber-foreground">
            Sob encomenda
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-heading text-base leading-snug sm:text-lg">{product.name}</h3>
        {from !== null && (
          <p className="text-sm text-muted-foreground">
            a partir de <span className="font-semibold text-foreground">{formatCurrency(from)}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] w-full rounded-md" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4 lg:gap-x-6" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
