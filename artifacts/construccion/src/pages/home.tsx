import {
  useListCategories,
  useListMedia,
  useGetContactSettings,
  useListTestimonials,
  useGetStatsSettings,
  getListCategoriesQueryKey,
  getListMediaQueryKey,
  getGetContactSettingsQueryKey,
  getListTestimonialsQueryKey,
  getGetStatsSettingsQueryKey,
} from "@workspace/api-client-react";
import { Loader2, MessageCircle, Star, HardHat, Hammer, PaintBucket, Ruler, Phone, Mail } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type LightboxItem = { url: string; title: string; type: "image" | "video"; thumbnailUrl?: string | null };

function Lightbox({ items, startIndex, onClose }: { items: LightboxItem[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const item = items[index];
  const prev = useCallback(() => setIndex((i) => (i - 1 + items.length) % items.length), [items.length]);
  const next = useCallback(() => setIndex((i) => (i + 1) % items.length), [items.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/40 rounded-full p-2 transition-colors z-10"
        onClick={onClose}
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Prev */}
      {items.length > 1 && (
        <button
          className="absolute left-2 sm:left-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2 sm:p-3 transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Media */}
      <div
        className="max-w-5xl max-h-[90vh] w-full px-10 sm:px-16 flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            key={item.url}
            src={item.url}
            controls
            autoPlay
            className="max-h-[75vh] w-full rounded-lg shadow-2xl"
            poster={item.thumbnailUrl || undefined}
          />
        ) : (
          <img
            src={item.url}
            alt={item.title}
            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        )}
        <p className="text-white/80 text-xs sm:text-sm font-medium text-center px-2">{item.title}</p>
        {items.length > 1 && (
          <p className="text-white/40 text-xs">{index + 1} / {items.length}</p>
        )}
      </div>

      {/* Next */}
      {items.length > 1 && (
        <button
          className="absolute right-2 sm:right-4 text-white/80 hover:text-white bg-black/40 rounded-full p-2 sm:p-3 transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
}

function CountUp({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function Home() {
  const { data: categories, isLoading: isLoadingCategories } = useListCategories(
    { includeInactive: false },
    { query: { queryKey: getListCategoriesQueryKey({ includeInactive: false }) } }
  );

  const { data: mediaItems, isLoading: isLoadingMedia } = useListMedia(
    {},
    { query: { queryKey: getListMediaQueryKey({}) } }
  );

  const { data: contact } = useGetContactSettings({
    query: { queryKey: getGetContactSettingsQueryKey() },
  });

  const { data: testimonials } = useListTestimonials(
    { includeInactive: false },
    { query: { queryKey: getListTestimonialsQueryKey({ includeInactive: false }) } }
  );

  const { data: statsData } = useGetStatsSettings({
    query: { queryKey: getGetStatsSettingsQueryKey() },
  });

  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number } | null>(null);

  const isLoading = isLoadingCategories || isLoadingMedia;

  const whatsapp = contact?.whatsapp ?? "+573159907313";
  const phone = contact?.phone ?? "+573159907313";
  const email = contact?.email ?? "alejandropecillo168@gmail.com";

  const whatsappClean = whatsapp.replace(/\D/g, "");
  const phoneClean = phone.replace(/[\s]/g, "");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Hero Section */}
      <header className="bg-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32 relative z-10">
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="flex-1 space-y-4 sm:space-y-6 text-center sm:text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Alejandro Pecillo
              </h1>
              <p className="text-base sm:text-xl md:text-2xl text-secondary-foreground/90 font-medium max-w-2xl border-l-4 border-primary pl-4">
                Construyendo lo que necesitas, con la garantía que mereces.
              </p>

              <div className="pt-2">
                <a
                  href="#portfolio"
                  className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-lg shadow-lg hover-elevate transition-all text-sm sm:text-base"
                >
                  Ver Proyectos
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src="/logo.jpeg"
                alt="Alejandro Pecillo Logo"
                className="w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 object-cover rounded-full shadow-2xl border-4 border-white/20"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Portfolio Section */}
      <main id="portfolio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-24">
            {categories
              ?.filter((c) => c.active)
              .sort((a, b) => a.order - b.order)
              .map((category) => {
                const categoryMedia =
                  mediaItems
                    ?.filter((m) => m.categoryId === category.id)
                    .sort((a, b) => a.order - b.order) || [];

                if (categoryMedia.length === 0) return null;

                return (
                  <section key={category.id} className="space-y-8">
                    <div className="flex items-center gap-4">
                      <h2 className="text-3xl font-bold text-secondary uppercase tracking-wide">
                        {category.name}
                      </h2>
                      <div className="flex-1 h-px bg-border"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {categoryMedia.map((media, idx) => {
                        const allItems: LightboxItem[] = categoryMedia.map((m) => ({
                          url: m.url,
                          title: m.title,
                          type: m.type as "image" | "video",
                          thumbnailUrl: m.thumbnailUrl,
                        }));
                        return (
                          <div
                            key={media.id}
                            className="group rounded-xl overflow-hidden shadow-md bg-card hover:shadow-xl transition-all duration-300 border border-border cursor-pointer"
                            onClick={() => setLightbox({ items: allItems, index: idx })}
                          >
                            <div className="aspect-video relative bg-muted">
                              {media.type === "video" ? (
                                <>
                                  <video
                                    src={media.url}
                                    className="w-full h-full object-cover"
                                    poster={media.thumbnailUrl || undefined}
                                    muted
                                    preload="metadata"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                      <svg className="w-6 h-6 text-secondary ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <img
                                    src={media.url}
                                    alt={media.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow">
                                      <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                                      </svg>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="p-4 bg-card">
                              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                                {media.title}
                              </h3>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

            {(!categories?.length || !mediaItems?.length) && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-xl">No hay proyectos disponibles en este momento.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Services Section */}
      <section className="bg-background py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-secondary uppercase tracking-wide">Nuestros Servicios</h2>
            <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col items-center text-center gap-3 sm:gap-4 bg-muted/40 border border-border rounded-xl p-5 sm:p-8 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <HardHat className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-foreground">Construcción</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed hidden sm:block">Edificamos desde cero con materiales de calidad y cumplimiento de plazos garantizado.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3 sm:gap-4 bg-muted/40 border border-border rounded-xl p-5 sm:p-8 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Hammer className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-foreground">Remodelación</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed hidden sm:block">Transformamos y modernizamos espacios existentes adaptándonos a tu visión y presupuesto.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3 sm:gap-4 bg-muted/40 border border-border rounded-xl p-5 sm:p-8 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <PaintBucket className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-foreground">Acabados</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed hidden sm:block">Pisos, pintura, enchapes y detalles finos que le dan vida y personalidad a cada obra.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-3 sm:gap-4 bg-muted/40 border border-border rounded-xl p-5 sm:p-8 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Ruler className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-foreground">Diseño</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed hidden sm:block">Planificamos y diseñamos cada proyecto para maximizar funcionalidad y estética.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary text-secondary-foreground py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <p className="text-3xl sm:text-5xl font-extrabold text-primary">
                <CountUp target={statsData?.projects ?? 50} />+
              </p>
              <p className="text-xs sm:text-lg font-semibold text-secondary-foreground/90 uppercase tracking-wide leading-tight">Proyectos<br className="sm:hidden" /> Terminados</p>
              <p className="text-xs text-secondary-foreground/60 hidden sm:block">Obras entregadas con éxito en toda la región</p>
            </div>
            <div className="flex flex-col items-center gap-1 sm:gap-2 border-x border-secondary-foreground/20">
              <p className="text-3xl sm:text-5xl font-extrabold text-primary">
                <CountUp target={statsData?.years ?? 8} />+
              </p>
              <p className="text-xs sm:text-lg font-semibold text-secondary-foreground/90 uppercase tracking-wide leading-tight">Años de<br className="sm:hidden" /> Experiencia</p>
              <p className="text-xs text-secondary-foreground/60 hidden sm:block">Trayectoria y conocimiento en construcción</p>
            </div>
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <p className="text-3xl sm:text-5xl font-extrabold text-primary">
                <CountUp target={statsData?.satisfaction ?? 100} />%
              </p>
              <p className="text-xs sm:text-lg font-semibold text-secondary-foreground/90 uppercase tracking-wide leading-tight">Clientes<br className="sm:hidden" /> Satisfechos</p>
              <p className="text-xs text-secondary-foreground/60 hidden sm:block">Compromiso total con cada proyecto</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials && testimonials.length > 0 && (
        <section className="bg-muted/50 py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary uppercase tracking-wide">Lo que dicen nuestros clientes</h2>
              <div className="w-16 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...testimonials].sort((a, b) => a.order - b.order).map((t) => (
                <div key={t.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < t.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <p className="text-foreground/80 italic flex-1">"{t.content}"</p>
                  <div className="border-t border-border pt-4">
                    <p className="font-semibold text-foreground">{t.authorName}</p>
                    {t.role && <p className="text-sm text-muted-foreground">{t.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section className="bg-secondary text-secondary-foreground py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">Contacto</h2>
          <p className="text-secondary-foreground/80 text-base sm:text-lg max-w-xl mx-auto">
            Consultas, presupuestos y proyectos — estamos disponibles para ayudarte.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 pt-2">
            <a
              href={`https://wa.me/${whatsappClean}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-whatsapp-footer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 sm:px-7 py-3 sm:py-4 rounded-lg shadow-lg transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="truncate">{whatsapp}</span>
            </a>
            <a
              href={`tel:${phoneClean}`}
              data-testid="link-phone-footer"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-5 sm:px-7 py-3 sm:py-4 rounded-lg shadow-lg transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              <Phone className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="truncate">{phone}</span>
            </a>
            <a
              href={`mailto:${email}`}
              data-testid="link-email-footer"
              className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 sm:px-7 py-3 sm:py-4 rounded-lg shadow-lg transition-all border border-white/30 text-sm sm:text-base w-full sm:w-auto"
            >
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              <span className="truncate">{email}</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-secondary text-secondary-foreground py-8 border-t border-secondary-border/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-secondary-foreground/70 font-medium">
            &copy; {new Date().getFullYear()} Alejandro Pecillo Construcción. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          items={lightbox.items}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Floating WhatsApp button */}
      <a
        href={`https://wa.me/${whatsappClean}`}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="link-whatsapp-float"
        title="Contactar por WhatsApp"
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold p-3 sm:pl-4 sm:pr-5 sm:py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-green-500/40"
        style={{ boxShadow: "0 4px 24px 0 rgba(34,197,94,0.45)" }}
      >
        <img src="/whatsapp-logo.png" alt="WhatsApp" className="w-6 h-6 flex-shrink-0" />
        <span className="text-sm leading-tight hidden sm:inline">WhatsApp</span>
      </a>
    </div>
  );
}
