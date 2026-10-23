import { useRef } from "react";
import { ArrowDown, ArrowUp, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { optimizeImage } from "@/lib/image";
import { cn } from "@/lib/utils";

export const MAX_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type ImageEntry =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; file: File; preview: string };

let counter = 0;
export const nextImageId = () => `img-${++counter}`;

interface ImageManagerProps {
  images: ImageEntry[];
  onChange: (images: ImageEntry[]) => void;
  onError: (message: string) => void;
  /** Na edição, fotos novas sempre entram depois das atuais (regra da API: keepImages + arquivos novos). */
  existingFirst?: boolean;
}

export function ImageManager({ images, onChange, onError, existingFirst = false }: ImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const added: ImageEntry[] = [];
    for (const file of Array.from(list)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        onError(`"${file.name}": use imagens JPEG, PNG ou WEBP.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        onError(`"${file.name}" passa de 5 MB.`);
        continue;
      }
      if (images.length + added.length >= MAX_IMAGES) {
        onError(`Máximo de ${MAX_IMAGES} imagens por produto.`);
        break;
      }
      added.push({ id: nextImageId(), kind: "new", file, preview: URL.createObjectURL(file) });
    }
    if (added.length > 0) onChange([...images, ...added]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => {
    const target = images.find((image) => image.id === id);
    if (target?.kind === "new") URL.revokeObjectURL(target.preview);
    onChange(images.filter((image) => image.id !== id));
  };

  const canMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    const from = images[index];
    const to = images[target];
    if (!from || !to) return false;
    return !(existingFirst && from.kind !== to.kind);
  };

  const move = (index: number, direction: -1 | 1) => {
    if (!canMove(index, direction)) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    if (item) next.splice(index + direction, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, index) => (
          <li key={image.id} className="overflow-hidden rounded-md border border-border bg-card">
            <div className="relative aspect-square bg-muted">
              <img
                src={image.kind === "existing" ? optimizeImage(image.url, 400) : image.preview}
                alt={`Foto ${index + 1}${index === 0 ? " (principal)" : ""}`}
                className="size-full object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-sm bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-primary-foreground">Principal</span>
              )}
              {image.kind === "new" && (
                <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-foreground px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase text-background">Nova</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-1 p-1.5">
              <div className="flex">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Mover foto ${index + 1} para antes`} disabled={!canMove(index, -1)} onClick={() => move(index, -1)}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Mover foto ${index + 1} para depois`} disabled={!canMove(index, 1)} onClick={() => move(index, 1)}>
                  <ArrowDown />
                </Button>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover foto ${index + 1}`} onClick={() => remove(image.id)}>
                <X className="text-destructive" />
              </Button>
            </div>
          </li>
        ))}

        {images.length < MAX_IMAGES && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn("flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-card text-sm text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring")}
            >
              <ImagePlus className="size-6" aria-hidden />
              Adicionar fotos
            </button>
          </li>
        )}
      </ul>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" tabIndex={-1} aria-label="Selecionar fotos" onChange={(event) => addFiles(event.target.files)} />
      <p className="text-xs text-muted-foreground">
        De 1 a {MAX_IMAGES} fotos (JPEG, PNG ou WEBP, até 5 MB cada). A primeira é a principal.
        {existingFirst && " Fotos novas entram depois das atuais."}
      </p>
    </div>
  );
}
