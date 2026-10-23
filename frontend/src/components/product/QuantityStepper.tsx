import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY, MIN_QUANTITY } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
  className?: string;
}

export function QuantityStepper({ value, onChange, max = MAX_QUANTITY, label = "Quantidade", className }: QuantityStepperProps) {
  const limit = Math.min(max, MAX_QUANTITY);

  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center rounded-md border border-input bg-card", className)}>
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={value <= MIN_QUANTITY}
        onClick={() => onChange(value - 1)}
        className="flex size-11 items-center justify-center rounded-l-md hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="min-w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={value >= limit}
        onClick={() => onChange(value + 1)}
        className="flex size-11 items-center justify-center rounded-r-md hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
