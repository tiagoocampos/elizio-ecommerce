import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog, adminDialogClass } from "@/components/admin/ConfirmDialog";
import { Field } from "@/components/Field";
import { EmptyState, ErrorState, PageHeading } from "@/components/States";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { queryKeys } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api, errorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/forms";
import { formatCurrency, formatZip, onlyDigits } from "@/lib/format";
import type { ShippingZone, ShippingZoneInput } from "@/types/api";

const hasMaxTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
const zip = z.string().refine((value) => onlyDigits(value).length === 8, "CEP com 8 dígitos");

const schema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome"),
    cepStart: zip,
    cepEnd: zip,
    price: z.string().refine((value) => {
      const number = Number(value.replace(",", "."));
      return value.trim() !== "" && Number.isFinite(number) && number >= 0 && hasMaxTwoDecimals(number);
    }, "Informe um valor válido (até 2 casas decimais)"),
    minDays: z.string().refine((value) => /^\d+$/.test(value), "Número inteiro"),
    maxDays: z.string().refine((value) => /^\d+$/.test(value), "Número inteiro"),
    active: z.boolean(),
  })
  .refine((v) => onlyDigits(v.cepStart) <= onlyDigits(v.cepEnd), { message: "O CEP inicial deve ser menor ou igual ao final", path: ["cepStart"] })
  .refine((v) => !/^\d+$/.test(v.minDays) || !/^\d+$/.test(v.maxDays) || Number(v.minDays) <= Number(v.maxDays), {
    message: "O prazo mínimo deve ser menor ou igual ao máximo",
    path: ["minDays"],
  });

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { name: "", cepStart: "", cepEnd: "", price: "", minDays: "", maxDays: "", active: true };

function toFormValues(zone: ShippingZone | null): FormValues {
  if (!zone) return emptyValues;
  return {
    name: zone.name,
    cepStart: formatZip(zone.cepStart),
    cepEnd: formatZip(zone.cepEnd),
    price: String(zone.price).replace(".", ","),
    minDays: String(zone.minDays),
    maxDays: String(zone.maxDays),
    active: zone.active,
  };
}

function ZoneDialog({ zone, open, onOpenChange }: { zone: ShippingZone | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), values: toFormValues(zone) });

  const onSubmit = async (values: FormValues) => {
    const body: ShippingZoneInput = {
      name: values.name,
      cepStart: onlyDigits(values.cepStart),
      cepEnd: onlyDigits(values.cepEnd),
      price: Number(values.price.replace(",", ".")),
      minDays: Number(values.minDays),
      maxDays: Number(values.maxDays),
      ...(zone ? { active: values.active } : {}),
    };
    try {
      if (zone) await api.put(`/admin/shipping-zones/${zone.id}`, body);
      else await api.post("/admin/shipping-zones", body);
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminZones });
      toast.success(zone ? "Zona atualizada" : "Zona criada");
      onOpenChange(false);
    } catch (error) {
      applyApiErrors(error, setError, ["name", "cepStart", "cepEnd", "price", "minDays", "maxDays"]);
    }
  };

  const maskZip = (field: "cepStart" | "cepEnd") => ({
    onChange: (event: { target: { value: string } }) => setValue(field, formatZip(event.target.value)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={adminDialogClass}>
        <DialogHeader>
          <DialogTitle>{zone ? "Editar zona de entrega" : "Nova zona de entrega"}</DialogTitle>
          <DialogDescription>Faixa de CEP atendida pela entrega própria, com preço fixo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="zone-name" required error={errors.name?.message} className="sm:col-span-2">
            <Input id="zone-name" aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <Field label="CEP inicial" htmlFor="zone-start" required error={errors.cepStart?.message}>
            <Input id="zone-start" inputMode="numeric" placeholder="00000-000" aria-invalid={!!errors.cepStart} {...register("cepStart", maskZip("cepStart"))} />
          </Field>
          <Field label="CEP final" htmlFor="zone-end" required error={errors.cepEnd?.message}>
            <Input id="zone-end" inputMode="numeric" placeholder="00000-000" aria-invalid={!!errors.cepEnd} {...register("cepEnd", maskZip("cepEnd"))} />
          </Field>
          <Field label="Preço do frete (R$)" htmlFor="zone-price" required error={errors.price?.message} className="sm:col-span-2">
            <Input id="zone-price" inputMode="decimal" placeholder="80,00" aria-invalid={!!errors.price} {...register("price")} />
          </Field>
          <Field label="Prazo mínimo (dias)" htmlFor="zone-min" required error={errors.minDays?.message}>
            <Input id="zone-min" inputMode="numeric" aria-invalid={!!errors.minDays} {...register("minDays")} />
          </Field>
          <Field label="Prazo máximo (dias)" htmlFor="zone-max" required error={errors.maxDays?.message}>
            <Input id="zone-max" inputMode="numeric" aria-invalid={!!errors.maxDays} {...register("maxDays")} />
          </Field>
          {zone && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3 sm:col-span-2">
              <label htmlFor="zone-active" className="flex-1 py-2 text-sm font-medium">Zona ativa</label>
              <Controller control={control} name="active" render={({ field }) => <Switch id="zone-active" checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminShipping() {
  usePageTitle("Frete | Admin");
  const queryClient = useQueryClient();
  const zones = useQuery({ queryKey: queryKeys.adminZones, queryFn: () => api.get<ShippingZone[]>("/admin/shipping-zones") });
  const [editing, setEditing] = useState<ShippingZone | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<ShippingZone | null>(null);

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/shipping-zones/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminZones });
      toast.success("Zona desativada");
      setDeactivating(null);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setDeactivating(null);
    },
  });

  return (
    <>
      <PageHeading
        title="Frete"
        description="Zonas da entrega própria. Para CEPs fora delas, o cliente escolhe transportadora (valor cotado por você) ou retirada."
        action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> Nova zona</Button>}
      />

      {zones.isPending ? (
        <div className="space-y-2" aria-hidden>{[0, 1, 2].map((key) => <Skeleton key={key} className="h-20" />)}</div>
      ) : zones.isError ? (
        <ErrorState error={zones.error} onRetry={() => zones.refetch()} />
      ) : zones.data.length === 0 ? (
        <EmptyState title="Nenhuma zona de entrega" description="Cadastre as faixas de CEP atendidas pela entrega própria." />
      ) : (
        <>
          {/* Tabela no desktop */}
          <div className="hidden overflow-hidden rounded-md border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="p-3">Zona</th>
                  <th scope="col" className="p-3">Faixa de CEP</th>
                  <th scope="col" className="p-3">Preço</th>
                  <th scope="col" className="p-3">Prazo</th>
                  <th scope="col" className="p-3">Situação</th>
                  <th scope="col" className="p-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {zones.data.map((zone) => (
                  <tr key={zone.id} className={zone.active ? "" : "text-muted-foreground"}>
                    <td className="p-3 font-medium">{zone.name}</td>
                    <td className="p-3 whitespace-nowrap">{formatZip(zone.cepStart)} a {formatZip(zone.cepEnd)}</td>
                    <td className="p-3">{formatCurrency(zone.price)}</td>
                    <td className="p-3 whitespace-nowrap">{zone.minDays} a {zone.maxDays} dias</td>
                    <td className="p-3"><Badge variant={zone.active ? "secondary" : "outline"}>{zone.active ? "Ativa" : "Inativa"}</Badge></td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Editar ${zone.name}`} onClick={() => { setEditing(zone); setFormOpen(true); }}><Pencil /></Button>
                        {zone.active && <Button variant="ghost" size="icon-sm" aria-label={`Desativar ${zone.name}`} onClick={() => setDeactivating(zone)}><Trash2 className="text-destructive" /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards no mobile */}
          <ul className="space-y-3 md:hidden">
            {zones.data.map((zone) => (
              <li key={zone.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{zone.name}</p>
                    <p className="text-sm text-muted-foreground">{formatZip(zone.cepStart)} a {formatZip(zone.cepEnd)}</p>
                  </div>
                  <Badge variant={zone.active ? "secondary" : "outline"}>{zone.active ? "Ativa" : "Inativa"}</Badge>
                </div>
                <p className="mt-2 text-sm">{formatCurrency(zone.price)} · {zone.minDays} a {zone.maxDays} dias</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(zone); setFormOpen(true); }}><Pencil /> Editar</Button>
                  {zone.active && <Button variant="outline" size="sm" onClick={() => setDeactivating(zone)}><Trash2 /> Desativar</Button>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <ZoneDialog zone={editing} open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={deactivating !== null}
        onOpenChange={(open) => !open && setDeactivating(null)}
        title="Desativar zona?"
        description={<>A zona <strong>{deactivating?.name}</strong> deixa de aparecer para novos pedidos. Pedidos antigos não são afetados e você pode reativá-la editando.</>}
        confirmLabel="Desativar"
        pending={deactivate.isPending}
        onConfirm={() => deactivating && deactivate.mutate(deactivating.id)}
      />
    </>
  );
}
