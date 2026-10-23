import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Field } from "@/components/Field";
import { PageContainer } from "@/components/States";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ApiError } from "@/lib/api";
import { applyApiErrors, safeRedirect } from "@/lib/forms";
import { formatPhone, onlyDigits } from "@/lib/format";

const schema = z.object({
  name: z.string().trim().min(1, "Informe seu nome"),
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  phone: z
    .string()
    .refine((value) => value === "" || (onlyDigits(value).length >= 10 && onlyDigits(value).length <= 11), "Informe um telefone válido com DDD"),
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  usePageTitle("Cadastrar");
  const { register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { phone: "" } });

  if (isAuthenticated) return <Navigate to={redirect} replace />;

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    try {
      // Cadastra e já entra (login automático).
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone ? onlyDigits(values.phone) : undefined,
      });
      toast.success("Cadastro realizado! Bem-vindo(a).");
      navigate(redirect, { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError("email", { type: "server", message: error.message });
      } else if (!applyApiErrors(error, setError, ["name", "email", "password", "phone"])) {
        setFormError(error instanceof Error ? error.message : null);
      }
    }
  };

  return (
    <PageContainer className="max-w-md">
      <h1 className="text-display">Criar conta</h1>
      <p className="mt-2 text-sm text-muted-foreground">Leva menos de um minuto.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {formError && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <Field label="Nome" htmlFor="name" required error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="E-mail" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Senha" htmlFor="password" required hint="Mínimo de 8 caracteres" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Telefone (opcional)" htmlFor="phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(54) 99999-9999"
            aria-invalid={!!errors.phone}
            {...register("phone", { onChange: (event) => setValue("phone", formatPhone(event.target.value)) })}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link className="inline-block py-2 font-medium text-foreground underline underline-offset-4" to={`/entrar${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}>
          Entrar
        </Link>
      </p>
    </PageContainer>
  );
}
