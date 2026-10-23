import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// Wordmark em texto (a logo em JPG tem fundo bege e só aparece em cards, nunca no header).
export function Brand({ className, light = false, to = "/" }: { className?: string; light?: boolean; to?: string }) {
  return (
    <Link to={to} aria-label="Elizio home&móveis, página inicial" className={cn("inline-flex flex-col leading-none", className)}>
      <span className={cn("font-heading text-2xl font-bold tracking-tight sm:text-[1.75rem]", light ? "text-white" : "text-foreground")}>
        Elizio
      </span>
      <span className="mt-0.5 text-[0.7rem] font-medium tracking-[0.12em] text-primary">home&amp;móveis</span>
    </Link>
  );
}
