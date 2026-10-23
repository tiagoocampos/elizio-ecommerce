import { ImageOff } from "lucide-react";
import { optimizeImage } from "@/lib/image";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string | undefined;
  alt: string;
  /** Largura (px) pedida ao Cloudinary */
  width?: number;
  sizes?: string;
  className?: string;
  /** aspect-ratio do contêiner, em classe Tailwind (padrão 4/5) */
  ratio?: string;
  eager?: boolean;
}

export function ProductImage({ src, alt, width = 600, sizes, className, ratio = "aspect-[4/5]", eager = false }: ProductImageProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-muted", ratio, className)}>
      {src ? (
        <img
          src={optimizeImage(src, width)}
          srcSet={`${optimizeImage(src, Math.round(width / 2))} ${Math.round(width / 2)}w, ${optimizeImage(src, width)} ${width}w, ${optimizeImage(src, width * 2)} ${width * 2}w`}
          sizes={sizes ?? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground" role="img" aria-label={alt}>
          <ImageOff className="size-8" aria-hidden />
        </div>
      )}
    </div>
  );
}
