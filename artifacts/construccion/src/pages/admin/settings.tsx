import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { useGetCloudinarySettings, useUpdateCloudinarySettings, getGetCloudinarySettingsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useGetCloudinarySettings({
    query: { queryKey: getGetCloudinarySettingsQueryKey() }
  });

  const [cloudName, setCloudName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  useEffect(() => {
    if (settings) {
      setCloudName(settings.cloudName || "");
    }
  }, [settings]);

  const updateMutation = useUpdateCloudinarySettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCloudinarySettingsQueryKey() });
        toast({ title: "Ajustes guardados correctamente" });
        setApiKey("");
        setApiSecret("");
      },
      onError: () => {
        toast({ title: "Error al guardar", variant: "destructive" });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudName) {
      toast({ title: "El Cloud Name es obligatorio", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      data: {
        cloudName,
        apiKey,
        apiSecret
      }
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Ajustes del Sistema</h1>
          <p className="text-muted-foreground mt-1">Configura las credenciales de almacenamiento para las imágenes.</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Configuración de Cloudinary</CardTitle>
            <CardDescription>
              Necesario para subir fotos y videos. Puedes encontrar estos datos en el dashboard de Cloudinary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Status indicator */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Estado de la configuración:</p>
                    <p className="text-xs text-muted-foreground">
                      {settings?.cloudName && settings?.hasApiKey && settings?.hasApiSecret 
                        ? "Todas las credenciales están configuradas."
                        : "Faltan configurar credenciales."}
                    </p>
                  </div>
                  {settings?.cloudName && settings?.hasApiKey && settings?.hasApiSecret ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cloud Name</Label>
                  <Input 
                    value={cloudName} 
                    onChange={e => setCloudName(e.target.value)} 
                    placeholder="ej. dxyz123abc"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input 
                    type="text" 
                    value={apiKey} 
                    onChange={e => setApiKey(e.target.value)} 
                    placeholder={settings?.hasApiKey ? "•••••••••••••••• (Establecida)" : "Ingresa la API Key"}
                    required={!settings?.hasApiKey}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input 
                    type="password" 
                    value={apiSecret} 
                    onChange={e => setApiSecret(e.target.value)} 
                    placeholder={settings?.hasApiSecret ? "•••••••••••••••• (Establecida)" : "Ingresa el API Secret"}
                    required={!settings?.hasApiSecret}
                  />
                </div>

                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Configuración
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
