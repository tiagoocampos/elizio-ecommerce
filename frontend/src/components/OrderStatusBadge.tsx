import { Badge } from "@/components/ui/badge";
import { orderStatusClass, orderStatusLabel } from "@/lib/orderStatus";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/api";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("h-auto rounded-sm border px-2 py-1 text-xs font-semibold", orderStatusClass[status], className)}>
      {orderStatusLabel[status]}
    </Badge>
  );
}
