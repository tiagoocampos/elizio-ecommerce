import { useMemo } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Hammer, Mail, MapPin, MessageCircle, Search, Truck } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import logo from "@/assets/logo.jpg";
import { ErrorState } from "@/components/States";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/product/ProductImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { storeConfig } from "@/config/store";
import { testimonials } from "@/content/testimonials";
import { useCategories, useProducts } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { hasWhatsapp, whatsappLink } from "@/lib/whatsapp";
import { optimizeImage } from "@/lib/image";
import type { Category, Product } from "@/types/api";

// TODO: o hero usa src/assets/hero.jpg se existir (foto de interiores rústicos, horizontal, ~2000px).
// Sem o arquivo, cai no gradiente marrom escuro abaixo.
const heroFiles = import.meta.glob("/src/assets/hero.{jpg,jpeg,webp,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const heroImage: string | undefined = Object.values(heroFiles)[0];

function Hero() {
  return (
    <section className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-gradient-to-br from-wood to-wood-deep text-white sm:min-h-[92svh]">
      {heroImage && <img src={heroImage} alt="" className="absolute inset-0 -z-20 size-full object-cover" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/35 to-black/45" aria-hidden />
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 sm:pb-24 lg:px-8">
        <h1 className="text-hero max-w-3xl font-normal text-white">Móveis rústicos feitos sob medida para a sua casa</h1>
        <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
          Peças exclusivas, produzidas sob encomenda e entregues na sua porta.
        </p>
        <Button asChild variant="amber" size="lg" className="mt-8">
          <Link to="/produtos">Ver móveis</Link>
        </Button>
      </div>
    </section>
  );
}

function Intro({ image, alt }: { image: string | undefined; alt: string }) {
  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:gap-20 lg:px-8 lg:py-24">
        <div className="max-w-lg">
          <h2 className="text-display">Peças exclusivas, feitas para o seu espaço</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            Cada móvel é produzido sob encomenda. Você escolhe a peça e o acabamento, e nós cuidamos da produção e da entrega.
          </p>
        </div>
        <div className="md:justify-self-end md:w-full md:max-w-md">
          {image ? (
            <ProductImage src={image} alt={alt} ratio="aspect-square" width={900} sizes="(min-width: 768px) 28rem, 100vw" className="rounded-md" />
          ) : (
            // Sem foto de produto ainda: a logo (que tem o próprio fundo bege) entra como card.
            <img src={logo} alt="Elizio home&móveis" loading="lazy" className="aspect-square w-full rounded-md border border-border object-cover shadow-sm" />
          )}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { icon: Search, title: "Escolha a peça", text: "Navegue pelo catálogo e escolha o modelo e o acabamento." },
  { icon: Hammer, title: "Produzimos sob encomenda", text: "Sua peça é feita especialmente para você." },
  { icon: Truck, title: "Entregamos na sua porta", text: "Entrega própria na região ou por transportadora." },
];

function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona" className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h2 id="como-funciona" className="sr-only">Como funciona</h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-hover" aria-hidden>
                <step.icon className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Passo {index + 1}</p>
                <h3 className="mt-1 text-lg">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CategoryCard({ category, image, count }: { category: Category; image: string | undefined; count: number }) {
  return (
    <Link to={`/produtos?categoria=${category.id}`} className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
      <div className="overflow-hidden rounded-md">
        {image ? (
          <ProductImage src={image} alt={category.name} ratio="aspect-[4/5]" className="transition-transform duration-500 group-hover:scale-[1.03]" sizes="(min-width: 1024px) 18vw, 45vw" />
        ) : (
          <div className="flex aspect-[4/5] w-full items-center justify-center bg-accent p-4 text-center">
            <span className="font-heading text-xl text-foreground/70">{category.name}</span>
          </div>
        )}
      </div>
      <h3 className="mt-3 font-sans text-base font-semibold">{category.name}</h3>
      {count > 0 && <p className="text-sm text-muted-foreground">{count} {count === 1 ? "peça" : "peças"}</p>}
    </Link>
  );
}

function Categories({ products }: { products: Product[] | undefined }) {
  const categories = useCategories();

  const byCategory = useMemo(() => {
    const map = new Map<string, { image: string | undefined; count: number }>();
    for (const product of products ?? []) {
      const entry = map.get(product.category.id) ?? { image: undefined, count: 0 };
      entry.image ??= product.images[0];
      entry.count += 1;
      map.set(product.category.id, entry);
    }
    return map;
  }, [products]);

  // Esconde a seção se a API não tiver nenhuma categoria.
  if (categories.isSuccess && categories.data.length === 0) return null;

  return (
    <section className="bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_3fr] lg:gap-14 lg:px-8 lg:py-24">
        <div>
          <h2 className="text-display max-w-xs">Móveis, decoração e sofisticação</h2>
          <Button asChild variant="amber" className="mt-6">
            <Link to="/produtos">Confira</Link>
          </Button>
        </div>
        {categories.isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-hidden>
            {[0, 1, 2].map((key) => <Skeleton key={key} className="aspect-[4/5] w-full" />)}
          </div>
        ) : categories.isError ? (
          <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {categories.data.map((category) => (
              <li key={category.id}>
                <CategoryCard category={category} image={byCategory.get(category.id)?.image} count={byCategory.get(category.id)?.count ?? 0} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Featured({ query }: { query: ReturnType<typeof useProducts> }) {
  if (query.isSuccess && query.data.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-display">Destaques</h2>
          <Button asChild variant="outline" size="sm">
            <Link to="/produtos">Ver todos</Link>
          </Button>
        </div>
        {query.isPending ? (
          <ProductGridSkeleton />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : (
          <ProductGrid products={query.data.slice(0, 8)} />
        )}
      </div>
    </section>
  );
}

function Testimonials() {
  // Sem depoimentos reais cadastrados em src/content/testimonials.ts, a seção não aparece.
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <h2 className="text-display max-w-md">Adorado por nossos clientes</h2>
        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {testimonials.map((item) => (
            <li key={item.name}>
              {item.image && <img src={optimizeImage(item.image, 700)} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-md object-cover" />}
              <p className="mt-4 font-semibold">{item.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">“{item.text}”</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ContactColumn({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-white">
        {icon} {title}
      </h3>
      <div className="mt-2 text-white/85">{children}</div>
    </div>
  );
}

function Contact() {
  return (
    <section id="contato" className="relative isolate scroll-mt-20 overflow-hidden bg-gradient-to-br from-wood to-wood-deep text-white">
      <div className="absolute inset-0 -z-10 bg-black/20" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <h2 className="text-display max-w-md text-white">Fale com a gente</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {hasWhatsapp() && (
            <ContactColumn icon={<MessageCircle className="size-5" aria-hidden />} title="WhatsApp">
              <a className="inline-block py-1 underline-offset-4 hover:underline" href={whatsappLink("Olá! Vim pelo site e gostaria de saber mais.")} target="_blank" rel="noreferrer">
                Chamar no WhatsApp
              </a>
            </ContactColumn>
          )}
          <ContactColumn icon={<InstagramIcon className="size-5" />} title="Instagram">
            <a className="inline-block py-1 underline-offset-4 hover:underline" href={storeConfig.instagramUrl} target="_blank" rel="noreferrer">
              {storeConfig.instagramHandle}
            </a>
          </ContactColumn>
          {storeConfig.address && (
            <ContactColumn icon={<MapPin className="size-5" aria-hidden />} title="Endereço">
              <p className="whitespace-pre-line">{storeConfig.address}</p>
            </ContactColumn>
          )}
          {storeConfig.email && (
            <ContactColumn icon={<Mail className="size-5" aria-hidden />} title="E-mail">
              <a className="inline-block break-all py-1 underline-offset-4 hover:underline" href={`mailto:${storeConfig.email}`}>
                {storeConfig.email}
              </a>
            </ContactColumn>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageTitle();
  const products = useProducts();
  const firstImage = products.data?.find((product) => product.images.length > 0);

  return (
    <>
      <Hero />
      <Intro image={firstImage?.images[0]} alt={firstImage?.name ?? "Móvel Elizio"} />
      <HowItWorks />
      <Categories products={products.data} />
      <Featured query={products} />
      <Testimonials />
      <Contact />
    </>
  );
}
