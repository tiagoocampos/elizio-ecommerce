import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError, errorMessage } from "./api";

/**
 * Mapeia `details` do erro de validação da API (400) para erros de campo do formulário.
 * Devolve true se ao menos um campo foi marcado; senão exibe a mensagem geral num toast.
 */
export function applyApiErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: string[]): boolean {
  let applied = false;

  if (error instanceof ApiError) {
    for (const detail of error.details) {
      if (typeof detail.path === "string" && fields.includes(detail.path)) {
        setError(detail.path as Path<T>, { type: "server", message: detail.message });
        applied = true;
      }
    }
  }

  if (!applied) {
    toast.error(errorMessage(error));
  }
  return applied;
}

/** Aceita só caminhos internos (evita redirecionar para outro site via ?redirect=). */
export function safeRedirect(value: string | null, fallback = "/"): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return fallback;
}
