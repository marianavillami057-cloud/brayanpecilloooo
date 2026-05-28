import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, GripVertical } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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

type Category = {
  id: number;
  name: string;
  order: number;
  active: boolean;
};

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
  onToggle,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 group"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Name */}
      <span className="flex-1 font-semibold text-secondary">{category.name}</span>

      {/* Status badge */}
      {category.active ? (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
          Activo
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-xs">
          Inactivo
        </Badge>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={category.active ? "Ocultar" : "Mostrar"}
          onClick={() => onToggle(category.id)}
        >
          {category.active ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-primary" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(category)}
        >
          <Edit className="h-4 w-4 text-blue-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(category.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const { data: categories, isLoading } = useListCategories(
    { includeInactive: true },
    { query: { queryKey: getListCategoriesQueryKey({ includeInactive: true }) } }
  );

  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  useEffect(() => {
    if (categories) {
      setLocalCategories([...categories as Category[]].sort((a, b) => a.order - b.order));
    }
  }, [categories]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey({ includeInactive: true }) });
    queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey({ includeInactive: false }) });
  };

  const createMutation = useCreateCategory({
    mutation: {
      onSuccess: () => {
        invalidateList();
        setIsCreateOpen(false);
        setNewCatName("");
        toast({ title: "Categoría creada" });
      },
    },
  });

  const updateMutation = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        invalidateList();
        setEditId(null);
        toast({ title: "Categoría actualizada" });
      },
    },
  });

  const orderMutation = useUpdateCategory({
    mutation: {
      onError: () => toast({ title: "Error al guardar orden", variant: "destructive" }),
    },
  });

  const toggleMutation = useToggleCategory({
    mutation: {
      onSuccess: () => {
        invalidateList();
        toast({ title: "Estado actualizado" });
      },
    },
  });

  const deleteMutation = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        invalidateList();
        toast({ title: "Categoría eliminada" });
      },
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const nextOrder =
      localCategories.length > 0 ? Math.max(...localCategories.map((c) => c.order)) + 1 : 0;
    createMutation.mutate({ data: { name: newCatName, order: nextOrder, active: true } });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({ id: editId, data: { name: editName } });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalCategories((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id);
      const newIndex = prev.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);

      reordered.forEach((item, idx) => {
        if (item.order !== idx) {
          orderMutation.mutate({ id: item.id, data: { order: idx } });
        }
      });

      return reordered.map((item, idx) => ({ ...item, order: idx }));
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Categorías</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las categorías. Arrastra para cambiar el orden.
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Categoría</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ej. Construcción en Seco"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Crear
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full"
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar Cambios
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : localCategories.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-border">
            <p className="text-lg font-medium">No hay categorías registradas.</p>
            <p className="text-sm mt-1">
              Crea la primera con el botón "Nueva Categoría".
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localCategories.map((category) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    onEdit={(c) => {
                      setEditId(c.id);
                      setEditName(c.name);
                    }}
                    onDelete={(id) => {
                      if (
                        confirm(
                          "¿Eliminar esta categoría? También se eliminarán todas sus fotos y videos."
                        )
                      ) {
                        deleteMutation.mutate({ id });
                      }
                    }}
                    onToggle={(id) => toggleMutation.mutate({ id })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </AdminLayout>
  );
}
