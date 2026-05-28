import { useState, useEffect } from "react";
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
import { Loader2, Plus, Pencil, Trash2, Star, Eye, EyeOff, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Testimonial = {
  id: number;
  authorName: string;
  role?: string | null;
  content: string;
  rating: number;
  active: boolean;
  order: number;
};

type TestimonialForm = {
  authorName: string;
  role: string;
  content: string;
  rating: number;
};

const emptyForm: TestimonialForm = { authorName: "", role: "", content: "", rating: 5 };

function SortableTestimonialCard({
  testimonial,
  onEdit,
  onDelete,
  onToggle,
}: {
  testimonial: Testimonial;
  onEdit: (t: Testimonial) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: testimonial.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border-border transition-opacity ${!testimonial.active ? "opacity-60" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              title="Arrastrar para reordenar"
            >
              <GripVertical className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg">{testimonial.authorName}</CardTitle>
                {testimonial.role && (
                  <span className="text-sm text-muted-foreground">— {testimonial.role}</span>
                )}
                <Badge
                  variant={testimonial.active ? "default" : "secondary"}
                  className="text-xs"
                >
                  {testimonial.active ? "Visible" : "Oculto"}
                </Badge>
              </div>
              <div className="flex mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                title={testimonial.active ? "Ocultar" : "Mostrar"}
                onClick={() => onToggle(testimonial.id)}
              >
                {testimonial.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(testimonial)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(testimonial.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80 italic ml-9">"{testimonial.content}"</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminTestimonials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const qKey = getListTestimonialsQueryKey({ includeInactive: true });

  const { data: testimonials, isLoading } = useListTestimonials(
    { includeInactive: true },
    { query: { queryKey: qKey } }
  );

  const [localItems, setLocalItems] = useState<Testimonial[]>([]);
  useEffect(() => {
    if (testimonials) {
      setLocalItems([...testimonials as Testimonial[]].sort((a, b) => a.order - b.order));
    }
  }, [testimonials]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qKey });

  const createMutation = useCreateTestimonial({
    mutation: {
      onSuccess: () => {
        invalidate();
        setDialogOpen(false);
        toast({ title: "Testimonio creado" });
      },
      onError: () => toast({ title: "Error al crear", variant: "destructive" }),
    },
  });

  const updateMutation = useUpdateTestimonial({
    mutation: {
      onSuccess: () => {
        invalidate();
        setDialogOpen(false);
        toast({ title: "Testimonio actualizado" });
      },
      onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
    },
  });

  const deleteMutation = useDeleteTestimonial({
    mutation: {
      onSuccess: () => {
        invalidate();
        setDeleteId(null);
        toast({ title: "Testimonio eliminado" });
      },
      onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
    },
  });

  const toggleMutation = useToggleTestimonial({
    mutation: {
      onSuccess: () => invalidate(),
      onError: () => toast({ title: "Error", variant: "destructive" }),
    },
  });

  const orderMutation = useUpdateTestimonial({
    mutation: {
      onError: () => toast({ title: "Error al guardar orden", variant: "destructive" }),
    },
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditId(t.id);
    setForm({ authorName: t.authorName, role: t.role ?? "", content: t.content, rating: t.rating });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.authorName || !form.content) {
      toast({ title: "Nombre y testimonio son obligatorios", variant: "destructive" });
      return;
    }
    const nextOrder = localItems.length > 0 ? Math.max(...localItems.map((t) => t.order)) + 1 : 0;

    if (editId !== null) {
      updateMutation.mutate({ id: editId, data: { ...form, rating: Number(form.rating) } });
    } else {
      createMutation.mutate({ data: { ...form, rating: Number(form.rating), order: nextOrder } });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalItems((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      reordered.forEach((item, idx) => {
        if (item.order !== idx) {
          orderMutation.mutate({ id: item.id, data: { order: idx } });
        }
      });

      return reordered.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Testimonios</h1>
            <p className="text-muted-foreground mt-1">
              Administra las reseñas. Arrastra para cambiar el orden.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Testimonio
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : !localItems.length ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay testimonios todavía</p>
              <p className="text-sm mt-1">Agrega el primero con el botón de arriba.</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localItems.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-3">
                {localItems.map((t) => (
                  <SortableTestimonialCard
                    key={t.id}
                    testimonial={t}
                    onEdit={openEdit}
                    onDelete={(id) => setDeleteId(id)}
                    onToggle={(id) => toggleMutation.mutate({ id })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="ej. María González"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo / Descripción (opcional)</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="ej. Propietaria en Bogotá"
              />
            </div>
            <div className="space-y-2">
              <Label>Testimonio *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="¿Qué dijo el cliente sobre el trabajo?"
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Calificación (1–5)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= form.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
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
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
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
