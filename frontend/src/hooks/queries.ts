import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Address, Category, Order, Product } from "@/types/api";

export const queryKeys = {
  products: (categoryId?: string) => ["products", categoryId ?? "all"] as const,
  product: (slug: string) => ["product", slug] as const,
  categories: ["categories"] as const,
  addresses: ["addresses"] as const,
  orders: ["orders"] as const,
  order: (orderId: string) => ["order", orderId] as const,
  adminProducts: ["admin", "products"] as const,
  adminOrders: (status?: string) => ["admin", "orders", status ?? "all"] as const,
  adminOrder: (orderId: string) => ["admin", "order", orderId] as const,
  adminZones: ["admin", "shipping-zones"] as const,
};

export function useProducts(categoryId?: string) {
  return useQuery({
    queryKey: queryKeys.products(categoryId),
    queryFn: ({ signal }) => api.get<Product[]>("/products", { categoryId }, signal),
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.product(slug ?? ""),
    queryFn: ({ signal }) => api.get<Product>(`/product/${encodeURIComponent(slug ?? "")}`, undefined, signal),
    enabled: Boolean(slug),
    retry: (count, error) => (error as { status?: number }).status !== 404 && count < 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: ({ signal }) => api.get<Category[]>("/category", undefined, signal),
    staleTime: 60_000,
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: queryKeys.addresses,
    queryFn: ({ signal }) => api.get<Address[]>("/address", undefined, signal),
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: ({ signal }) => api.get<Order[]>("/orders", undefined, signal),
  });
}
