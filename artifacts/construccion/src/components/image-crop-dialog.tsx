import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";

type CropType = "profile" | "cover";

type ImageCropDialogProps = {
  open: boolean;
  imageUrl: string;
  cropType: CropType;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
  isUploading: boolean;
};

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.95);
  });
}

export function ImageCropDialog({
  open,
  imageUrl,
  cropType,
  onConfirm,
  onCancel,
  isUploading,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isProfile = cropType === "profile";
  const aspect = isProfile ? 1 : 16 / 5;

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const generatePreview = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch {}
  }, [imageUrl, croppedAreaPixels]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
      onConfirm(blob);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {isProfile ? "Ajustar Foto de Perfil" : "Ajustar Foto de Portada"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isProfile
              ? "Arrastra y usa el zoom para centrar tu foto en el círculo."
              : "Arrastra y usa el zoom para encuadrar la imagen del banner."}
          </p>
        </DialogHeader>

        {/* Crop area */}
        <div
          className="relative w-full bg-black/80"
          style={{ height: isProfile ? 300 : 240 }}
        >
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={isProfile ? "round" : "rect"}
            showGrid={!isProfile}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: "2px solid rgba(255,255,255,0.8)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              },
            }}
          />
        </div>

        {/* Zoom control */}
        <div className="px-6 py-3 flex items-center gap-3 border-b border-border">
          <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Slider
            min={1}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
            className="flex-1"
          />
          <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Hero preview */}
        <div className="px-6 py-4 bg-muted/40">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Vista previa en el hero
          </p>

          {/* Simulated hero */}
          <div className="rounded-lg overflow-hidden border border-border shadow-sm bg-secondary max-w-full">
            {/* Cover band */}
            <div className="relative w-full h-16 bg-secondary overflow-hidden">
              {isProfile ? (
                <div className="w-full h-full bg-secondary" />
              ) : previewUrl ? (
                <img src={previewUrl} alt="cover preview" className="w-full h-full object-cover" />
              ) : (
                <img src={imageUrl} alt="cover preview" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent pointer-events-none" />
            </div>

            {/* Profile row */}
            <div className="px-3 pb-3 -mt-6 flex items-end gap-3">
              <div className="flex-shrink-0 relative z-10">
                {isProfile ? (
                  previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="perfil preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                    />
                  ) : (
                    <img
                      src={imageUrl}
                      alt="perfil preview"
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                    />
                  )
                ) : (
                  <div className="w-14 h-14 rounded-full bg-secondary border-2 border-white shadow overflow-hidden">
                    <img src="/logo.jpeg" alt="logo" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="pb-1">
                <p className="text-white font-bold text-sm leading-tight">Alejandro Pecillo</p>
                <p className="text-white/70 text-xs">Construyendo lo que necesitas...</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={generatePreview}
            className="mt-2 text-xs text-primary underline hover:text-primary/80 transition-colors"
          >
            Actualizar vista previa
          </button>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isUploading || !croppedAreaPixels}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              "Confirmar y Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
