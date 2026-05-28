import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useToggleCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatOrder, setNewCatOrder] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState("");

  const { data: categories, isLoading } = useListCategories(
    { includeInactive: true },
    { query: { queryKey: getListCategoriesQueryKey({ includeInactive: true }) } }
  );

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
        setNewCatOrder("");
        toast({ title: "Categoría creada" });
      }
    }
  });

  const updateMutation = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        invalidateList();
        setEditId(null);
        toast({ title: "Categoría actualizada" });
      }
    }
  });

  const toggleMutation = useToggleCategory({
    mutation: {
      onSuccess: () => {
        invalidateList();
        toast({ title: "Estado actualizado" });
      }
    }
  });

  const deleteMutation = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        invalidateList();
        toast({ title: "Categoría eliminada" });
      }
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        name: newCatName,
        order: parseInt(newCatOrder) || 0,
        active: true
      }
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateMutation.mutate({
        id: editId,
        data: {
          name: editName,
          order: parseInt(editOrder) || 0
        }
      });
    }
  };

  const handleMoveOrder = (id: number, currentOrder: number, direction: 'up' | 'down') => {
    updateMutation.mutate({
      id,
      data: { order: direction === 'up' ? currentOrder - 1 : currentOrder + 1 }
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Categorías</h1>
            <p className="text-muted-foreground mt-1">Gestiona los proyectos y su orden de aparición.</p>
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
                  <Input required value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ej. Construcción en Seco" />
                </div>
                <div className="space-y-2">
                  <Label>Orden (Número)</Label>
                  <Input type="number" required value={newCatOrder} onChange={e => setNewCatOrder(e.target.value)} placeholder="1" />
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                <Input required value={editName} onChange={e => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input type="number" required value={editOrder} onChange={e => setEditOrder(e.target.value)} />
              </div>
              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="bg-card rounded-md border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px] text-center">Orden</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : categories && categories.length > 0 ? (
                categories.sort((a, b) => a.order - b.order).map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="text-center font-medium">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <button 
                          onClick={() => handleMoveOrder(category.id, category.order, 'up')}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <span>{category.order}</span>
                        <button 
                          onClick={() => handleMoveOrder(category.id, category.order, 'down')}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-secondary">{category.name}</TableCell>
                    <TableCell>
                      {category.active ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => toggleMutation.mutate({ id: category.id })}
                        title={category.active ? "Ocultar" : "Mostrar"}
                      >
                        {category.active ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-primary" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          setEditId(category.id);
                          setEditName(category.name);
                          setEditOrder(category.order.toString());
                        }}
                      >
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          if (confirm("¿Estás seguro de eliminar esta categoría? Se eliminarán también todas sus fotos y videos.")) {
                            deleteMutation.mutate({ id: category.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No hay categorías registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
