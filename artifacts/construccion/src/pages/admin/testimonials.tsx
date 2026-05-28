import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
  useToggleTestimonial,
  getListTestimonialsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";

type TestimonialForm = {
  authorName: string;
  role: string;
  content: string;
  rating: number;
  order: number;
};

const emptyForm: TestimonialForm = { authorName: "", role: "", content: "", rating: 5, order: 0 };

export default function AdminTestimonials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const qKey = getListTestimonialsQueryKey({ includeInactive: true });

  const { data: testimonials, isLoading } = useListTestimonials(
    { includeInactive: true },
    { query: { queryKey: qKey } }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  const createMutation = useCreateTestimonial({
    mutation: {
      onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Testimonio creado" }); },
      onError: () => toast({ title: "Error al crear", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateTestimonial({
    mutation: {
      onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: "Testimonio actualizado" }); },
      onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteTestimonial({
    mutation: {
      onSuccess: () => { invalidate(); setDeleteId(null); toast({ title: "Testimonio eliminado" }); },
      onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
    },
  });

  const toggleMutation = useToggleTestimonial({
    mutation: {
      onSuccess: () => { invalidate(); },
      onError: () => toast({ title: "Error", variant: "destructive" }),
    },
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: NonNullable<typeof testimonials>[number]) => {
    setEditId(t.id);
    setForm({ authorName: t.authorName, role: t.role ?? "", content: t.content, rating: t.rating, order: t.order });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.authorName || !form.content) {
      toast({ title: "Nombre y testimonio son obligatorios", variant: "destructive" });
      return;
    }
    const data = { ...form, rating: Number(form.rating), order: Number(form.order) };
    if (editId !== null) {
      updateMutation.mutate({ params: { id: editId }, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Testimonios</h1>
            <p className="text-muted-foreground mt-1">Administra las reseñas que aparecen en la página pública.</p>
          </div>
          <Button data-testid="button-add-testimonial" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Testimonio
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : !testimonials?.length ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay testimonios todavía</p>
              <p className="text-sm mt-1">Agrega el primero con el botón de arriba.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {[...testimonials].sort((a, b) => a.order - b.order).map((t) => (
              <Card key={t.id} className={`border-border transition-opacity ${!t.active ? "opacity-60" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{t.authorName}</CardTitle>
                        {t.role && <span className="text-sm text-muted-foreground">— {t.role}</span>}
                        <Badge variant={t.active ? "default" : "secondary"} className="text-xs">
                          {t.active ? "Visible" : "Oculto"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Orden: {t.order}</span>
                      </div>
                      <div className="flex mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < t.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t.active ? "Ocultar" : "Mostrar"}
                        onClick={() => toggleMutation.mutate({ params: { id: t.id } })}
                        data-testid={`button-toggle-${t.id}`}
                      >
                        {t.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)} data-testid={`button-edit-${t.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(t.id)}
                        data-testid={`button-delete-${t.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/80 italic">"{t.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId !== null ? "Editar Testimonio" : "Nuevo Testimonio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Cliente *</Label>
              <Input
                data-testid="input-author-name"
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="ej. María González"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo / Descripción (opcional)</Label>
              <Input
                data-testid="input-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="ej. Propietaria en Bogotá"
              />
            </div>
            <div className="space-y-2">
              <Label>Testimonio *</Label>
              <Textarea
                data-testid="input-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="¿Qué dijo el cliente sobre el trabajo?"
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calificación (1–5)</Label>
                <Input
                  data-testid="input-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value, 10) || 5 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Orden de aparición</Label>
                <Input
                  data-testid="input-order"
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button data-testid="button-save-testimonial" type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editId !== null ? "Guardar Cambios" : "Crear Testimonio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar testimonio</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. El testimonio se eliminará permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate({ params: { id: deleteId } })}
            >
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
