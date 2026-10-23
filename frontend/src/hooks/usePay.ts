import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { PreferenceResponse } from "@/types/api";

// Gera uma nova preferência de pagamento e redireciona ao Mercado Pago.
export function usePay() {
  const [paying, setPaying] = useState(false);

  const pay = useCallback(
    async (orderId: string) => {
      if (paying) return;
      setPaying(true);
      try {
        const preference = await api.post<PreferenceResponse>("/payment/preference", { orderId });
        window.location.href = preference.checkoutUrl;
        // não libera o botão: a página está saindo para o Mercado Pago
      } catch (error) {
        toast.error(errorMessage(error));
        setPaying(false);
      }
    },
    [paying]
  );

  return { pay, paying };
}
