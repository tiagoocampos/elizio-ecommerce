import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog, adminDialogClass } from "@/components/admin/ConfirmDialog";
import { Field } from "@/components/Field";
import { EmptyState, ErrorState, PageHeading } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys, useCategories } from "@/hooks/queries";
import { usePageTitle } from "@/hooks/usePageTitle";
import { api, errorMessage } from "@/lib/api";
import { applyApiErrors } from "@/lib/forms";
import type { Category } from "@/types/api";

const schema = z.object({
  name: z.string().trim().min(3, "O nome deve ter no mínimo 3 caracteres").max(45, "O nome deve ter no máximo 45 caracteres"),
});
type FormValues = z.infer<typeof schema>;

function CategoryDialog({ category, open, onOpenChange }: { category: Category | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), values: { name: category?.name ?? "" } });

  const onSubmit = async (values: FormValues) => {
    try {
      if (category) await api.put(`/category/${category.id}`, values);
      else await api.post("/category", values);
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success(category ? "Categoria atualizada" : "Categoria criada");
      onOpenChange(false);
    } catch (error) {
      applyApiErrors(error, setError, ["name"]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={adminDialogClass}>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>O endereço (slug) da categoria é gerado a partir do nome.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Nome" htmlFor="category-name" required error={errors.name?.message}>
            <Input id="category-name" autoFocus aria-invalid={!!errors.name} {...register("name")} />
          </Field>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCategories() {
  usePageTitle("Categorias | Admin");
  const queryClient = useQueryClient();
  const categories = useCategories();
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/category/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      toast.success("Categoria excluída");
      setDeleting(null);
    },
    onError: (error) => {
      // 409: categoria com produtos
      toast.error(errorMessage(error));
      setDeleting(null);
    },
  });

  return (
    <>
      <PageHeading
        title="Categorias"
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> Nova categoria
          </Button>
        }
      />

      {categories.isPending ? (
        <div className="space-y-2" aria-hidden>{[0, 1, 2].map((key) => <Skeleton key={key} className="h-16" />)}</div>
      ) : categories.isError ? (
        <ErrorState error={categories.error} onRetry={() => categories.refetch()} />
      ) : categories.data.length === 0 ? (
        <EmptyState title="Nenhuma categoria" description="Crie a primeira para organizar o catálogo." />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {categories.data.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-3 p-3 sm:p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{category.name}</p>
                <p className="truncate text-sm text-muted-foreground">/{category.slug}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" aria-label={`Editar ${category.name}`} onClick={() => { setEditing(category); setFormOpen(true); }}>
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Excluir ${category.name}`} onClick={() => setDeleting(category)}>
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CategoryDialog category={editing} open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir categoria?"
        description={<>Você vai excluir <strong>{deleting?.name}</strong>. Categorias que possuem produtos não podem ser excluídas.</>}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </>
  );
}
