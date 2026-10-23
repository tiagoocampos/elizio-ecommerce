import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Field } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryKeys } from "@/hooks/queries";
import { api } from "@/lib/api";
import { applyApiErrors } from "@/lib/forms";
import { formatZip, onlyDigits } from "@/lib/format";
import type { Address, AddressInput } from "@/types/api";

const schema = z.object({
  zipCode: z.string().refine((value) => onlyDigits(value).length === 8, "Informe um CEP válido com 8 dígitos"),
  street: z.string().trim().min(3, "Informe a rua"),
  number: z.string().trim().min(1, "Informe o número"),
  complement: z.string().trim(),
  district: z.string().trim().min(2, "Informe o bairro"),
  city: z.string().trim().min(2, "Informe a cidade"),
  state: z.string().trim().regex(/^[a-zA-Z]{2}$/, "Use a sigla do estado (ex.: RS)"),
});

type FormValues = z.infer<typeof schema>;

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

interface AddressFormProps {
  onCreated: (address: Address) => void;
  onCancel?: () => void;
}

export function AddressForm({ onCreated, onCancel }: AddressFormProps) {
  const queryClient = useQueryClient();
  const [lookingUp, setLookingUp] = useState(false);
  const lastLookup = useRef("");

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { zipCode: "", street: "", number: "", complement: "", district: "", city: "", state: "" },
  });

  // Preenchimento opcional pelo ViaCEP: nunca bloqueia e sempre dá para editar à mão.
  const lookupZip = async (zip: string) => {
    const digits = onlyDigits(zip);
    if (digits.length !== 8 || lastLookup.current === digits) return;
    lastLookup.current = digits;
    setLookingUp(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) return;
      const data = (await response.json()) as ViaCepResponse;
      if (data.erro) return;
      const fill = (field: "street" | "district" | "city" | "state", value: string | undefined) => {
        if (value && !getValues(field)) setValue(field, value, { shouldValidate: true });
      };
      fill("street", data.logradouro);
      fill("district", data.bairro);
      fill("city", data.localidade);
      fill("state", data.uf);
    } catch {
      /* consulta é só uma conveniência */
    } finally {
      setLookingUp(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const body: AddressInput = {
      zipCode: onlyDigits(values.zipCode),
      street: values.street,
      number: values.number,
      district: values.district,
      city: values.city,
      state: values.state.toUpperCase(),
      ...(values.complement ? { complement: values.complement } : {}),
    };

    try {
      const address = await api.post<Address>("/address", body);
      await queryClient.invalidateQueries({ queryKey: queryKeys.addresses });
      toast.success("Endereço salvo");
      onCreated(address);
    } catch (error) {
      applyApiErrors(error, setError, ["zipCode", "street", "number", "complement", "district", "city", "state"]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-6" aria-label="Novo endereço">
      <Field label="CEP" htmlFor="zipCode" required error={errors.zipCode?.message} hint={lookingUp ? "Buscando endereço..." : undefined} className="sm:col-span-2">
        <Input
          id="zipCode"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          aria-invalid={!!errors.zipCode}
          {...register("zipCode", {
            onChange: (event) => {
              const formatted = formatZip(event.target.value);
              setValue("zipCode", formatted);
              void lookupZip(formatted);
            },
          })}
        />
      </Field>
      <Field label="Rua" htmlFor="street" required error={errors.street?.message} className="sm:col-span-4">
        <Input id="street" autoComplete="address-line1" aria-invalid={!!errors.street} {...register("street")} />
      </Field>
      <Field label="Número" htmlFor="number" required error={errors.number?.message} className="sm:col-span-2">
        <Input id="number" autoComplete="off" aria-invalid={!!errors.number} {...register("number")} />
      </Field>
      <Field label="Complemento" htmlFor="complement" error={errors.complement?.message} className="sm:col-span-4">
        <Input id="complement" autoComplete="address-line2" aria-invalid={!!errors.complement} {...register("complement")} />
      </Field>
      <Field label="Bairro" htmlFor="district" required error={errors.district?.message} className="sm:col-span-3">
        <Input id="district" aria-invalid={!!errors.district} {...register("district")} />
      </Field>
      <Field label="Cidade" htmlFor="city" required error={errors.city?.message} className="sm:col-span-2">
        <Input id="city" autoComplete="address-level2" aria-invalid={!!errors.city} {...register("city")} />
      </Field>
      <Field label="UF" htmlFor="state" required error={errors.state?.message} className="sm:col-span-1">
        <Input id="state" maxLength={2} autoComplete="address-level1" className="uppercase" aria-invalid={!!errors.state} {...register("state")} />
      </Field>
      <div className="flex flex-wrap gap-3 sm:col-span-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar endereço"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
