import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  useGetCloudinarySettings,
  useUpdateCloudinarySettings,
  useGetContactSettings,
  useUpdateContactSettings,
  useGetStatsSettings,
  useUpdateStatsSettings,
  useGetHeroSettings,
  useUpdateHeroSettings,
  useGetUploadSignature,
  getGetCloudinarySettingsQueryKey,
  getGetContactSettingsQueryKey,
  getGetStatsSettingsQueryKey,
  getGetHeroSettingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, Phone, Mail, MessageCircle, BarChart2, ImageIcon, Trash2, UploadCloud, UserCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cloudinarySettings, isLoading: isLoadingCloudinary } = useGetCloudinarySettings({
    query: { queryKey: getGetCloudinarySettingsQueryKey() },
  });

  const { data: contactSettings, isLoading: isLoadingContact } = useGetContactSettings({
    query: { queryKey: getGetContactSettingsQueryKey() },
  });

  const { data: statsSettings, isLoading: isLoadingStats } = useGetStatsSettings({
    query: { queryKey: getGetStatsSettingsQueryKey() },
  });

  const { data: heroSettings, isLoading: isLoadingHero } = useGetHeroSettings({
    query: { queryKey: getGetHeroSettingsQueryKey() },
  });

  const [cloudName, setCloudName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [statProjects, setStatProjects] = useState(50);
  const [statYears, setStatYears] = useState(8);
  const [statSatisfaction, setStatSatisfaction] = useState(100);

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cloudinarySettings) {
      setCloudName(cloudinarySettings.cloudName || "");
    }
  }, [cloudinarySettings]);

  useEffect(() => {
    if (contactSettings) {
      setWhatsapp(contactSettings.whatsapp || "");
      setPhone(contactSettings.phone || "");
      setEmail(contactSettings.email || "");
    }
  }, [contactSettings]);

  useEffect(() => {
    if (statsSettings) {
      setStatProjects(statsSettings.projects ?? 50);
      setStatYears(statsSettings.years ?? 8);
      setStatSatisfaction(statsSettings.satisfaction ?? 100);
    }
  }, [statsSettings]);

  const updateCloudinary = useUpdateCloudinarySettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCloudinarySettingsQueryKey() });
        toast({ title: "Configuración de Cloudinary guardada" });
        setApiKey("");
        setApiSecret("");
      },
      onError: () => {
        toast({ title: "Error al guardar", variant: "destructive" });
      },
    },
  });

  const updateStats = useUpdateStatsSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStatsSettingsQueryKey() });
        toast({ title: "Estadísticas guardadas" });
      },
      onError: () => {
        toast({ title: "Error al guardar", variant: "destructive" });
      },
    },
  });

  const updateContact = useUpdateContactSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetContactSettingsQueryKey() });
        toast({ title: "Datos de contacto guardados" });
      },
      onError: () => {
        toast({ title: "Error al guardar", variant: "destructive" });
      },
    },
  });

  const updateHero = useUpdateHeroSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetHeroSettingsQueryKey() });
        toast({ title: "Imagen actualizada" });
      },
      onError: () => {
        toast({ title: "Error al actualizar", variant: "destructive" });
      },
    },
  });

  const getSignature = useGetUploadSignature();

  const handleCloudinarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudName) {
      toast({ title: "El Cloud Name es obligatorio", variant: "destructive" });
      return;
    }
    updateCloudinary.mutate({ data: { cloudName, apiKey, apiSecret } });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsapp || !phone || !email) {
      toast({ title: "Todos los campos de contacto son obligatorios", variant: "destructive" });
      return;
    }
    updateContact.mutate({ data: { whatsapp, phone, email } });
  };

  const handleStatsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStats.mutate({ data: { projects: statProjects, years: statYears, satisfaction: statSatisfaction } });
  };

  const handleUploadHeroImage = async (file: File, field: "coverImage" | "profileImage") => {
    if (!cloudinarySettings?.hasApiKey || !cloudinarySettings?.cloudName) {
      toast({ title: "Configura Cloudinary primero en la sección de abajo", variant: "destructive" });
      return;
    }
    const setter = field === "coverImage" ? setIsUploadingCover : setIsUploadingProfile;
    try {
      setter(true);
      const sigData = await getSignature.mutateAsync({});
      const result = await uploadToCloudinary(file, sigData.signature, sigData.timestamp, sigData.apiKey, sigData.cloudName);
      updateHero.mutate({ data: { [field]: result.secure_url } });
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setter(false);
    }
  };

  const handleDeleteHeroImage = (field: "coverImage" | "profileImage") => {
    updateHero.mutate({ data: { [field]: null } });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Ajustes del Sistema</h1>
          <p className="text-muted-foreground mt-1">Configura las imágenes, contacto y estadísticas.</p>
        </div>

        {/* Hero Images */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Imágenes del Perfil
            </CardTitle>
            <CardDescription>
              La portada es la imagen de fondo del hero. La foto de perfil es tu logo circular. Si eliminas alguna vuelve a la imagen original.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHero ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cover Image */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    Foto de Portada
                  </Label>
                  {heroSettings?.coverImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={heroSettings.coverImage}
                        alt="Portada actual"
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={isUploadingCover}
                        >
                          {isUploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                          <span className="ml-1">Cambiar</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteHeroImage("coverImage")}
                          disabled={updateHero.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => coverInputRef.current?.click()}
                    >
                      {isUploadingCover ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm">Subiendo portada...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <UploadCloud className="w-8 h-8" />
                          <p className="text-sm font-medium">Haz clic para subir la portada</p>
                          <p className="text-xs">JPG, PNG, WebP. Recomendado: 1200×400px</p>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadHeroImage(f, "coverImage");
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Profile Image */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <UserCircle2 className="w-4 h-4 text-primary" />
                    Foto de Perfil
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={heroSettings?.profileImage || "/logo.jpeg"}
                        alt="Perfil actual"
                        className="w-20 h-20 rounded-full object-cover border-2 border-border shadow"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => profileInputRef.current?.click()}
                        disabled={isUploadingProfile}
                      >
                        {isUploadingProfile ? (
                          <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Subiendo...</>
                        ) : (
                          <><UploadCloud className="mr-2 w-4 h-4" />Cambiar foto de perfil</>
                        )}
                      </Button>
                      {heroSettings?.profileImage && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteHeroImage("profileImage")}
                          disabled={updateHero.isPending}
                        >
                          <Trash2 className="mr-2 w-4 h-4" />
                          Restaurar original
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">JPG, PNG. Recomendado: cuadrada 400×400px</p>
                    </div>
                  </div>
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadHeroImage(f, "profileImage");
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              Estadísticas del Sitio
            </CardTitle>
            <CardDescription>
              Estos números aparecen en la página pública. Actualízalos cuando crezcas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleStatsSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Proyectos Terminados</Label>
                  <Input
                    type="number"
                    min={0}
                    value={statProjects}
                    onChange={(e) => setStatProjects(Number(e.target.value))}
                    placeholder="ej. 50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Se muestra como "50+" en la página.</p>
                </div>
                <div className="space-y-2">
                  <Label>Años de Experiencia</Label>
                  <Input
                    type="number"
                    min={0}
                    value={statYears}
                    onChange={(e) => setStatYears(Number(e.target.value))}
                    placeholder="ej. 8"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Se muestra como "8+" en la página.</p>
                </div>
                <div className="space-y-2">
                  <Label>Clientes Satisfechos (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={statSatisfaction}
                    onChange={(e) => setStatSatisfaction(Number(e.target.value))}
                    placeholder="ej. 100"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Se muestra como "100%" en la página.</p>
                </div>
                <Button type="submit" disabled={updateStats.isPending}>
                  {updateStats.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Estadísticas
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Contact Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Datos de Contacto
            </CardTitle>
            <CardDescription>
              Estos datos aparecen en la página pública para que los clientes puedan contactarte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingContact ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    Número de WhatsApp
                  </Label>
                  <Input
                    data-testid="input-whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="ej. +573159907313"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Incluir código de país. Ej: +573159907313</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Número de Llamada
                  </Label>
                  <Input
                    data-testid="input-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ej. +573159907313"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Correo Electrónico
                  </Label>
                  <Input
                    data-testid="input-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej. alejandropecillo168@gmail.com"
                    required
                  />
                </div>
                <Button
                  data-testid="button-save-contact"
                  type="submit"
                  disabled={updateContact.isPending}
                >
                  {updateContact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Contacto
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Cloudinary Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Configuración de Cloudinary</CardTitle>
            <CardDescription>
              Necesario para subir fotos y videos. Puedes encontrar estos datos en el dashboard de Cloudinary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCloudinary ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleCloudinarySubmit} className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg border border-border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Estado de la configuración:</p>
                    <p className="text-xs text-muted-foreground">
                      {cloudinarySettings?.cloudName && cloudinarySettings?.hasApiKey && cloudinarySettings?.hasApiSecret
                        ? "Todas las credenciales están configuradas."
                        : "Faltan configurar credenciales."}
                    </p>
                  </div>
                  {cloudinarySettings?.cloudName && cloudinarySettings?.hasApiKey && cloudinarySettings?.hasApiSecret ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cloud Name</Label>
                  <Input
                    value={cloudName}
                    onChange={(e) => setCloudName(e.target.value)}
                    placeholder="ej. dxyz123abc"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={cloudinarySettings?.hasApiKey ? "•••••••••••••••• (Establecida)" : "Ingresa la API Key"}
                    required={!cloudinarySettings?.hasApiKey}
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder={cloudinarySettings?.hasApiSecret ? "•••••••••••••••• (Establecida)" : "Ingresa el API Secret"}
                    required={!cloudinarySettings?.hasApiSecret}
                  />
                </div>

                <Button type="submit" disabled={updateCloudinary.isPending}>
                  {updateCloudinary.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cloudinary
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
