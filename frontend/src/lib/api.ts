import type { ApiErrorDetail } from "@/types/api";
import { storageGet } from "./storage";

const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3333").replace(/\/+$/, "");

export const TOKEN_KEY = "elizio:token";

export class ApiError extends Error {
  status: number;
  details: ApiErrorDetail[];

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  /** Mensagem do primeiro erro de campo, quando houver. */
  fieldMessage(field: string): string | undefined {
    return this.details.find((detail) => detail.path === field)?.message;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** O AuthContext registra aqui o que fazer em 401 numa rota autenticada. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  json?: unknown;
  form?: FormData;
  query?: Record<string, string | undefined>;
  signal?: AbortSignal | undefined;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, form, query, signal } = options;

  const url = new URL(API_URL + path, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {};
  const token = storageGet(TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (form) {
    body = form; // o navegador define o Content-Type com o boundary
  } else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  let response: Response;
  try {
    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = body;
    if (signal) init.signal = signal;
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", 0);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const payload = (data ?? {}) as { error?: string; details?: ApiErrorDetail[] };

    // Sessão expirada em rota autenticada (login com senha errada também é 401, mas não conta).
    if (response.status === 401 && token && path !== "/session") {
      unauthorizedHandler?.();
    }

    throw new ApiError(payload.error ?? "Ocorreu um erro inesperado. Tente novamente.", response.status, payload.details ?? []);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | undefined>, signal?: AbortSignal) =>
    request<T>(path, { query, signal }),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: "POST", json }),
  put: <T>(path: string, json?: unknown) => request<T>(path, { method: "PUT", json }),
  patch: <T>(path: string, json?: unknown) => request<T>(path, { method: "PATCH", json }),
  delete: <T>(path: string, query?: Record<string, string | undefined>) =>
    request<T>(path, { method: "DELETE", query }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: "POST", form }),
  putForm: <T>(path: string, form: FormData) => request<T>(path, { method: "PUT", form }),
};

export function errorMessage(error: unknown, fallback = "Ocorreu um erro inesperado. Tente novamente."): string {
  return error instanceof ApiError || error instanceof Error ? error.message : fallback;
}
