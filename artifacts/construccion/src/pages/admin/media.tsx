import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useListCategories,
  useListMedia,
  useCreateMedia,
  useUpdateMedia,
  useDeleteMedia,
  useGetUploadSignature,
  useGetCloudinarySettings,
  getListMediaQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Video, UploadCloud, GripVertical, Tag, Pencil, Check, X as XIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type MediaItem = {
  id: number;
  title: string;
  type: string;
  url: string;
  categoryId: number;
  order: number;
  thumbnailUrl?: string | null;
};

function SortableMediaCard({
  item,
  categories,
  onDelete,
  onCategoryChange,
  onTitleChange,
}: {
  item: MediaItem;
  categories: { id: number; name: string }[];
  onDelete: (id: number) => void;
  onCategoryChange: (id: number, categoryId: number) => void;
  onTitleChange: (id: number, title: string) => void;
}) {
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(item.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTitleValue(item.title);
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== item.title) {
      onTitleChange(item.id, trimmed);
    }
    setEditingTitle(false);
  };

  const cancelEdit = () => {
    setTitleValue(item.title);
    setEditingTitle(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="group relative rounded-lg border border-border bg-card overflow-hidden select-none">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1.5 left-1.5 z-10 bg-black/50 text-white rounded p-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Arrastrar para reordenar"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      <div className="aspect-square bg-muted relative">
        {item.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center bg-black/10">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : (
          <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
        )}

        {/* Hover overlay: delete + category + edit */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (confirm("¿Eliminar este archivo?")) onDelete(item.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            title="Cambiar categoría"
            onClick={() => setShowCatPicker((v) => !v)}
          >
            <Tag className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            title="Editar nombre"
            onClick={startEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category picker */}
      {showCatPicker && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-card border-t border-border p-2 shadow-lg">
          <Select
            value={item.categoryId.toString()}
            onValueChange={(v) => {
              onCategoryChange(item.id, parseInt(v));
              setShowCatPicker(false);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Title area */}
      {editingTitle ? (
        <div className="p-2 flex items-center gap-1">
          <input
            ref={titleInputRef}
            className="flex-1 text-xs border border-border rounded px-1.5 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") cancelEdit();
            }}
            onBlur={saveTitle}
          />
          <button
            className="shrink-0 text-green-600 hover:text-green-700"
            onMouseDown={(e) => { e.preventDefault(); saveTitle(); }}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            className="shrink-0 text-destructive hover:text-destructive/80"
            onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          className="p-2 text-xs font-medium truncate flex items-center gap-1 cursor-pointer hover:bg-muted/50 transition-colors"
          title={`${item.title} — clic para editar`}
          onClick={startEdit}
        >
          <span className="truncate">{item.title}</span>
          <Pencil className="w-2.5 h-2.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
}

export default function AdminMedia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: categories } = useListCategories({ includeInactive: true });
  const { data: mediaItems, isLoading } = useListMedia(
    {},
    { query: { queryKey: getListMediaQueryKey({}) } }
  );
  const { data: cloudinarySettings } = useGetCloudinarySettings();

  // Local state for optimistic drag-and-drop
  const [localMedia, setLocalMedia] = useState<MediaItem[]>([]);
  useEffect(() => {
    if (mediaItems) setLocalMedia(mediaItems as MediaItem[]);
  }, [mediaItems]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const getSignatureMutation = useGetUploadSignature();

  const createMediaMutation = useCreateMedia({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMediaQueryKey({}) });
        setIsUploadOpen(false);
        resetForm();
        toast({ title: "Archivo subido correctamente" });
      },
    },
  });

  const updateMediaMutation = useUpdateMedia({
    mutation: {
      onError: () => toast({ title: "Error al guardar orden", variant: "destructive" }),
    },
  });

  const deleteMediaMutation = useDeleteMedia({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMediaQueryKey({}) });
        toast({ title: "Archivo eliminado" });
      },
    },
  });

  const resetForm = () => {
    setTitle("");
    setType("photo");
    setCategoryId("");
    setFile(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!cloudinarySettings?.hasApiKey || !cloudinarySettings?.cloudName) {
      toast({
        title: "Error de configuración",
        description: "Faltan datos de Cloudinary en Ajustes",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const sigData = await getSignatureMutation.mutateAsync({});
      const uploadResult = await uploadToCloudinary(
        file,
        sigData.signature,
        sigData.timestamp,
        sigData.apiKey,
        sigData.cloudName
      );

      // Use 0 as sentinel for "no category"
      const catId = categoryId ? parseInt(categoryId) : 0;
      const catItems = localMedia.filter((m) => m.categoryId === catId);
      const nextOrder = catItems.length > 0 ? Math.max(...catItems.map((m) => m.order)) + 1 : 0;

      await createMediaMutation.mutateAsync({
        data: {
          title,
          type,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          categoryId: catId,
          order: nextOrder,
        },
      });
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent, groupCategoryId: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalMedia((prev) => {
      const groupItems = prev
        .filter((m) => m.categoryId === groupCategoryId)
        .sort((a, b) => a.order - b.order);
      const otherItems = prev.filter((m) => m.categoryId !== groupCategoryId);

      const oldIndex = groupItems.findIndex((m) => m.id === active.id);
      const newIndex = groupItems.findIndex((m) => m.id === over.id);
      const reordered = arrayMove(groupItems, oldIndex, newIndex);

      // Assign new sequential orders and save
      reordered.forEach((item, idx) => {
        if (item.order !== idx) {
          updateMediaMutation.mutate({ id: item.id, data: { order: idx } });
        }
      });

      return [...otherItems, ...reordered.map((item, idx) => ({ ...item, order: idx }))];
    });
  };

  const handleTitleChange = (mediaId: number, newTitle: string) => {
    updateMediaMutation.mutate(
      { id: mediaId, data: { title: newTitle } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMediaQueryKey({}) });
          toast({ title: "Nombre actualizado" });
        },
        onError: () => toast({ title: "Error al guardar nombre", variant: "destructive" }),
      }
    );
    setLocalMedia((prev) =>
      prev.map((m) => (m.id === mediaId ? { ...m, title: newTitle } : m))
    );
  };

  const handleCategoryChange = (mediaId: number, newCategoryId: number) => {
    // Calculate order as last in the new category
    const catItems = localMedia.filter((m) => m.categoryId === newCategoryId);
    const nextOrder = catItems.length > 0 ? Math.max(...catItems.map((m) => m.order)) + 1 : 0;

    updateMediaMutation.mutate(
      { id: mediaId, data: { categoryId: newCategoryId, order: nextOrder } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMediaQueryKey({}) });
          toast({ title: "Categoría actualizada" });
        },
      }
    );
    setLocalMedia((prev) =>
      prev.map((m) =>
        m.id === mediaId ? { ...m, categoryId: newCategoryId, order: nextOrder } : m
      )
    );
  };

  const sortedCategories = [...(categories ?? [])].sort((a, b) => a.order - b.order);

  // Find items whose categoryId doesn't match any known category
  const knownCatIds = new Set((categories ?? []).map((c) => c.id));
  const uncategorized = localMedia.filter((m) => !knownCatIds.has(m.categoryId));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Media</h1>
            <p className="text-muted-foreground mt-1">
              Sube y gestiona fotos y videos. Arrastra para reordenar.
            </p>
          </div>

          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UploadCloud className="mr-2 h-4 w-4" />
                Subir Archivo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Subir Nuevo Archivo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título / Descripción</Label>
                  <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={type}
                      onValueChange={(v: "photo" | "video") => setType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">Foto</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">— Sin categoría —</SelectItem>
                        {sortedCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Archivo</Label>
                  <Input
                    type="file"
                    accept={type === "photo" ? "image/*" : "video/*"}
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUploading || !file}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...
                    </>
                  ) : (
                    "Subir"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Sin categoría (orphaned items) */}
            {uncategorized.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold border-b border-border pb-2 text-destructive flex items-center gap-2">
                  <Tag className="w-5 h-5" /> Sin Categoría
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    — asigna una categoría con el botón <Tag className="inline w-3 h-3" />
                  </span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {uncategorized.map((item) => (
                    <SortableMediaCard
                      key={item.id}
                      item={item}
                      categories={sortedCategories}
                      onDelete={(id) => deleteMediaMutation.mutate({ id })}
                      onCategoryChange={handleCategoryChange}
                      onTitleChange={handleTitleChange}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Per-category groups */}
            {sortedCategories.map((category) => {
              const catMedia = localMedia
                .filter((m) => m.categoryId === category.id)
                .sort((a, b) => a.order - b.order);
              if (!catMedia.length) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <h3 className="text-xl font-bold border-b border-border pb-2 text-secondary flex items-center gap-2">
                    {category.name}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({catMedia.length})
                    </span>
                  </h3>

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, category.id)}
                  >
                    <SortableContext
                      items={catMedia.map((m) => m.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {catMedia.map((item) => (
                          <SortableMediaCard
                            key={item.id}
                            item={item}
                            categories={sortedCategories}
                            onDelete={(id) => deleteMediaMutation.mutate({ id })}
                            onCategoryChange={handleCategoryChange}
                            onTitleChange={handleTitleChange}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              );
            })}

            {localMedia.length === 0 && (
              <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-border">
                <UploadCloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No hay archivos multimedia subidos.</p>
                <p className="text-sm mt-1">
                  Usa el botón "Subir Archivo" para agregar contenido.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
