import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Field } from "@/components/Field";
import { ImageManager, MAX_IMAGES, nextImageId } from "@/components/admin/ImageManager";
import type { ImageEntry } from "@/components/admin/ImageManager";
import { EmptyState, ErrorState, PageHeading, PageLoader } from "@/components/States";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys, useCategories } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api, ApiError, errorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/forms";
import type { Product, VariantPayload } from "@/types/api";

const hasMaxTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
const toNumber = (value: string) => Number(value.trim().replace(",", "."));

const optionalInt = z.string().refine((value) => value.trim() === "" || (/^\d+$/.test(value.trim()) && Number(value) > 0), "Informe um número inteiro positivo");

const variantSchema = z
  .object({
    variantId: z.string(),
    label: z.string().trim().min(1, "Informe o rótulo"),
    price: z.string().refine((value) => {
      const number = toNumber(value);
      return value.trim() !== "" && Number.isFinite(number) && number > 0 && number <= 99999999.99 && hasMaxTwoDecimals(number);
    }, "Preço positivo, até 2 casas decimais"),
    noStock: z.boolean(),
    stock: z.string(),
    sku: z.string().trim(),
  })
  .refine((variant) => variant.noStock || /^\d+$/.test(variant.stock.trim()), { message: "Informe o estoque (número inteiro)", path: ["stock"] });

const schema = z.object({
  name: z.string().trim().min(2, "O nome deve ter no mínimo 2 caracteres").max(120, "O nome deve ter no máximo 120 caracteres"),
  description: z.string().trim().min(1, "Informe a descrição"),
  categoryId: z.string().min(1, "Escolha a categoria"),
  madeToOrder: z.boolean(),
  active: z.boolean(),
  leadTimeDays: optionalInt,
  widthCm: optionalInt,
  depthCm: optionalInt,
  heightCm: optionalInt,
  weightKg: z.string().refine((value) => {
    if (value.trim() === "") return true;
    const number = toNumber(value);
    return Number.isFinite(number) && number > 0 && number <= 999999.99 && hasMaxTwoDecimals(number);
  }, "Peso positivo, até 2 casas decimais"),
  variants: z.array(variantSchema).min(1, "Informe pelo menos 1 variação"),
});

type FormValues = z.infer<typeof schema>;

const emptyVariant = { variantId: "", label: "", price: "", noStock: true, stock: "", sku: "" };

function toFormValues(product: Product | null): FormValues {
  if (!product) {
    return {
      name: "", description: "", categoryId: "", madeToOrder: true, active: true,
      leadTimeDays: "", widthCm: "", depthCm: "", heightCm: "", weightKg: "",
      variants: [{ ...emptyVariant }],
    };
  }
  const str = (value: number | null) => (value === null ? "" : String(value).replace(".", ","));
  return {
    name: product.name,
    description: product.description,
    categoryId: product.category.id,
    madeToOrder: product.madeToOrder,
    active: product.active,
    leadTimeDays: str(product.leadTimeDays),
    widthCm: str(product.widthCm),
    depthCm: str(product.depthCm),
    heightCm: str(product.heightCm),
    weightKg: str(product.weightKg),
    variants: product.variants.map((variant) => ({
      variantId: variant.id,
      label: variant.label,
      price: String(variant.price).replace(".", ","),
      noStock: variant.stock === null,
      stock: variant.stock === null ? "" : String(variant.stock),
      sku: variant.sku ?? "",
    })),
  };
}

function ProductForm({ product }: { product: Product | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categories = useCategories();
  const [images, setImages] = useState<ImageEntry[]>(() =>
    (product?.images ?? []).map((url) => ({ id: nextImageId(), kind: "existing" as const, url }))
  );
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // libera as URLs de pré-visualização ao sair da tela
  useEffect(
    () => () => {
      for (const image of images) if (image.kind === "new") URL.revokeObjectURL(image.preview);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(product) });
  const { fields, append, remove } = useFieldArray({ control, name: "variants" });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    if (images.length < 1) {
      setImagesError("Envie pelo menos 1 foto.");
      document.getElementById("fotos")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (images.length > MAX_IMAGES) {
      setImagesError(`Máximo de ${MAX_IMAGES} imagens por produto.`);
      return;
    }
    setImagesError(null);

    // stock e sku vão sempre explícitos (número/null e texto/null), sem depender de "campo ausente"
    const variants: VariantPayload[] = values.variants.map((variant) => ({
      ...(variant.variantId ? { id: variant.variantId } : {}),
      label: variant.label,
      price: toNumber(variant.price),
      stock: variant.noStock ? null : Number(variant.stock.trim()),
      sku: variant.sku ? variant.sku : null,
    }));

    const form = new FormData();
    if (product) form.append("productId", product.id);
    form.append("name", values.name);
    form.append("description", values.description);
    form.append("categoryId", values.categoryId);
    form.append("madeToOrder", String(values.madeToOrder));
    if (product) form.append("active", String(values.active));
    const optional: [string, string][] = [
      ["leadTimeDays", values.leadTimeDays],
      ["widthCm", values.widthCm],
      ["depthCm", values.depthCm],
      ["heightCm", values.heightCm],
      ["weightKg", values.weightKg],
    ];
    for (const [key, value] of optional) {
      if (value.trim() !== "") form.append(key, String(toNumber(value)));
    }
    form.append("variants", JSON.stringify(variants));

    if (product) {
      form.append("keepImages", JSON.stringify(images.flatMap((image) => (image.kind === "existing" ? [image.url] : []))));
    }
    for (const image of images) {
      if (image.kind === "new") form.append("images", image.file, image.file.name);
    }

    try {
      if (product) await api.putForm("/product", form);
      else await api.postForm("/product", form);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["product"] }),
      ]);
      toast.success(product ? "Produto atualizado" : "Produto criado");
      navigate("/admin/produtos");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // ex.: "Variação já vendida; não pode ser removida."
        setFormError(error.message);
        toast.error(error.message);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (!applyApiErrors(error, setError, ["name", "description", "categoryId", "leadTimeDays", "widthCm", "depthCm", "heightCm", "weightKg"])) {
        setFormError(errorMessage(error));
      }
    }
  };

  const variantsRootError = errors.variants?.root?.message ?? errors.variants?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-10">
      {formError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="sec-dados" className="space-y-5">
        <h2 id="sec-dados" className="text-xl">Dados do produto</h2>
        <Field label="Nome" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Descrição" htmlFor="description" required error={errors.description?.message}>
          <Textarea id="description" rows={5} aria-invalid={!!errors.description} {...register("description")} />
        </Field>
        <Field label="Categoria" htmlFor="categoryId" required error={errors.categoryId?.message}>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="categoryId" className="w-full" aria-invalid={!!errors.categoryId}>
                  <SelectValue placeholder={categories.isPending ? "Carregando..." : "Escolha a categoria"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.data?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
            <label htmlFor="madeToOrder" className="flex-1 py-2 text-sm font-medium">Sob encomenda</label>
            <Controller control={control} name="madeToOrder" render={({ field }) => <Switch id="madeToOrder" checked={field.value} onCheckedChange={field.onChange} />} />
          </div>
          {product && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card p-3">
              <label htmlFor="active" className="flex-1 py-2 text-sm font-medium">Produto ativo na loja</label>
              <Controller control={control} name="active" render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Prazo (dias)" htmlFor="leadTimeDays" error={errors.leadTimeDays?.message}>
            <Input id="leadTimeDays" inputMode="numeric" aria-invalid={!!errors.leadTimeDays} {...register("leadTimeDays")} />
          </Field>
          <Field label="Largura (cm)" htmlFor="widthCm" error={errors.widthCm?.message}>
            <Input id="widthCm" inputMode="numeric" aria-invalid={!!errors.widthCm} {...register("widthCm")} />
          </Field>
          <Field label="Profundidade (cm)" htmlFor="depthCm" error={errors.depthCm?.message}>
            <Input id="depthCm" inputMode="numeric" aria-invalid={!!errors.depthCm} {...register("depthCm")} />
          </Field>
          <Field label="Altura (cm)" htmlFor="heightCm" error={errors.heightCm?.message}>
            <Input id="heightCm" inputMode="numeric" aria-invalid={!!errors.heightCm} {...register("heightCm")} />
          </Field>
          <Field label="Peso (kg)" htmlFor="weightKg" error={errors.weightKg?.message}>
            <Input id="weightKg" inputMode="decimal" aria-invalid={!!errors.weightKg} {...register("weightKg")} />
          </Field>
        </div>
        {product && <p className="text-xs text-muted-foreground">Campos opcionais deixados em branco não alteram o valor já salvo.</p>}
      </section>

      <section aria-labelledby="fotos" id="fotos" className="space-y-3">
        <h2 className="text-xl">Fotos</h2>
        <ImageManager images={images} onChange={(next) => { setImages(next); setImagesError(null); }} onError={(message) => toast.error(message)} existingFirst={product !== null} />
        {imagesError && <p role="alert" className="text-sm text-destructive">{imagesError}</p>}
      </section>

      <section aria-labelledby="sec-variacoes" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="sec-variacoes" className="text-xl">Variações</h2>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyVariant })}>
            <Plus /> Adicionar variação
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Cada variação tem seu rótulo (ex.: &quot;Envelhecido, 1,80m&quot;) e preço. Sem controle de estoque = peça sob encomenda.
          {product && " Variações já vendidas não podem ser removidas."}
        </p>
        {variantsRootError && <p role="alert" className="text-sm text-destructive">{variantsRootError}</p>}

        <ul className="space-y-4">
          {fields.map((field, index) => {
            const rowErrors = errors.variants?.[index];
            const noStock = watch(`variants.${index}.noStock`);
            return (
              <li key={field.id} className="space-y-4 rounded-md border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Variação {index + 1}{watch(`variants.${index}.variantId`) ? "" : product ? " (nova)" : ""}</p>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} disabled={fields.length === 1} aria-label={`Remover variação ${index + 1}`}>
                    <Trash2 /> Remover
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-6">
                  <Field label="Rótulo" htmlFor={`v-label-${index}`} required error={rowErrors?.label?.message} className="sm:col-span-3">
                    <Input id={`v-label-${index}`} aria-invalid={!!rowErrors?.label} {...register(`variants.${index}.label`)} />
                  </Field>
                  <Field label="Preço (R$)" htmlFor={`v-price-${index}`} required error={rowErrors?.price?.message} className="sm:col-span-2">
                    <Input id={`v-price-${index}`} inputMode="decimal" placeholder="1500,00" aria-invalid={!!rowErrors?.price} {...register(`variants.${index}.price`)} />
                  </Field>
                  <Field label="SKU (opcional)" htmlFor={`v-sku-${index}`} error={rowErrors?.sku?.message} className="sm:col-span-3">
                    <Input id={`v-sku-${index}`} {...register(`variants.${index}.sku`)} />
                  </Field>
                  <div className="space-y-3 sm:col-span-3">
                    <div className="flex min-h-11 items-center gap-3">
                      <Controller
                        control={control}
                        name={`variants.${index}.noStock`}
                        render={({ field: box }) => <Checkbox id={`v-nostock-${index}`} checked={box.value} onCheckedChange={(checked) => box.onChange(checked === true)} />}
                      />
                      <Label htmlFor={`v-nostock-${index}`}>Sem controle de estoque (sob encomenda)</Label>
                    </div>
                    {!noStock && (
                      <Field label="Estoque" htmlFor={`v-stock-${index}`} required error={rowErrors?.stock?.message}>
                        <Input id={`v-stock-${index}`} inputMode="numeric" aria-invalid={!!rowErrors?.stock} {...register(`variants.${index}.stock`)} />
                      </Field>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0">
        <Button asChild type="button" variant="ghost">
          <Link to="/admin/produtos">Cancelar</Link>
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : product ? "Salvar alterações" : "Criar produto"}
        </Button>
      </div>
    </form>
  );
}

export default function AdminProductForm() {
  const { id } = useParams();
  const editing = id !== undefined;
  usePageTitle(editing ? "Editar produto | Admin" : "Novo produto | Admin");

  // Não há GET de produto por id para admin no contrato: busca na lista de GET /admin/products.
  const products = useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: () => api.get<Product[]>("/admin/products"),
    enabled: editing,
    staleTime: 0,
  });

  if (!editing) {
    return (
      <>
        <PageHeading title="Novo produto" />
        <ProductForm product={null} />
      </>
    );
  }

  if (products.isPending) return <PageLoader />;
  if (products.isError) return <ErrorState error={products.error} onRetry={() => products.refetch()} />;

  const product = products.data.find((candidate) => candidate.id === id);
  if (!product) {
    return <EmptyState title="Produto não encontrado" action={<Button asChild><Link to="/admin/produtos">Voltar aos produtos</Link></Button>} />;
  }

  return (
    <>
      <PageHeading title={`Editar: ${product.name}`} />
      <ProductForm key={product.id} product={product} />
    </>
  );
}
