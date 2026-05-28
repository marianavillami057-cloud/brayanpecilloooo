import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { 
  useListCategories, 
  useListMedia, 
  useCreateMedia, 
  useDeleteMedia, 
  useGetUploadSignature,
  useGetCloudinarySettings,
  getListMediaQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Image as ImageIcon, Video, UploadCloud } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function AdminMedia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"photo" | "video">("photo");
  const [categoryId, setCategoryId] = useState("");
  const [order, setOrder] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: categories } = useListCategories({ includeInactive: true });
  const { data: mediaItems, isLoading } = useListMedia({}, { query: { queryKey: getListMediaQueryKey({}) } });
  const { data: cloudinarySettings } = useGetCloudinarySettings();

  const getSignatureMutation = useGetUploadSignature();
  const createMediaMutation = useCreateMedia({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMediaQueryKey({}) });
        setIsUploadOpen(false);
        resetForm();
        toast({ title: "Archivo subido correctamente" });
      }
    }
  });

  const deleteMediaMutation = useDeleteMedia({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMediaQueryKey({}) });
        toast({ title: "Archivo eliminado" });
      }
    }
  });

  const resetForm = () => {
    setTitle("");
    setType("photo");
    setCategoryId("");
    setOrder("");
    setFile(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !categoryId) return;
    
    if (!cloudinarySettings?.hasApiKey || !cloudinarySettings?.cloudName) {
      toast({ title: "Error de configuración", description: "Faltan datos de Cloudinary en Ajustes", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);
      
      // 1. Get Signature
      const sigData = await getSignatureMutation.mutateAsync({});
      
      // 2. Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        file,
        sigData.signature,
        sigData.timestamp,
        sigData.apiKey,
        sigData.cloudName
      );

      // 3. Create Media Record
      await createMediaMutation.mutateAsync({
        data: {
          title,
          type,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          categoryId: parseInt(categoryId),
          order: parseInt(order) || 0
        }
      });
      
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Media</h1>
            <p className="text-muted-foreground mt-1">Sube y gestiona fotos y videos de tus proyectos.</p>
          </div>
          
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <UploadCloud className="mr-2 h-4 w-4" />
                Subir Archivo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Subir Nuevo Archivo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título / Descripción corta</Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={(v: "photo" | "video") => setType(v)}>
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
                    <Label>Categoría</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Orden (opcional)</Label>
                  <Input type="number" value={order} onChange={e => setOrder(e.target.value)} placeholder="0" />
                </div>

                <div className="space-y-2">
                  <Label>Archivo</Label>
                  <Input 
                    type="file" 
                    accept={type === 'photo' ? "image/*" : "video/*"} 
                    required 
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </div>

                <Button type="submit" disabled={isUploading || !file} className="w-full">
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo a Cloudinary...</>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Media Grid grouped by category */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-12">
            {categories?.sort((a,b) => a.order - b.order).map(category => {
              const catMedia = mediaItems?.filter(m => m.categoryId === category.id).sort((a,b) => a.order - b.order);
              if (!catMedia?.length) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <h3 className="text-xl font-bold border-b border-border pb-2 text-secondary">{category.name}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {catMedia.map(media => (
                      <div key={media.id} className="group relative rounded-lg border border-border bg-card overflow-hidden">
                        <div className="aspect-square bg-muted relative">
                          {media.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black/10">
                              <Video className="w-8 h-8 text-muted-foreground" />
                            </div>
                          ) : (
                            <img src={media.url} alt={media.title} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              onClick={() => {
                                if(confirm("¿Eliminar este archivo?")) {
                                  deleteMediaMutation.mutate({ id: media.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            Orden: {media.order}
                          </div>
                        </div>
                        <div className="p-2 text-xs font-medium truncate" title={media.title}>
                          {media.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {mediaItems?.length === 0 && (
              <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-border">
                <UploadCloud className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No hay archivos multimedia subidos.</p>
                <p className="text-sm mt-1">Usa el botón "Subir Archivo" para agregar contenido a tus proyectos.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
