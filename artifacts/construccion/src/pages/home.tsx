import {
  useListCategories,
  useListMedia,
  useGetContactSettings,
  useListTestimonials,
  getListCategoriesQueryKey,
  getListMediaQueryKey,
  getGetContactSettingsQueryKey,
  getListTestimonialsQueryKey,
} from "@workspace/api-client-react";
import { Loader2, Phone, Mail, MessageCircle, Star } from "lucide-react";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Alejandro Pecillo
              </h1>
              <p className="text-xl md:text-2xl text-secondary-foreground/90 font-medium max-w-2xl border-l-4 border-primary pl-4">
                Construyendo lo que necesitas, con la garantía que mereces.
              </p>

              <div className="pt-2">
                <a
                  href="#portfolio"
                  className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-lg shadow-lg hover-elevate transition-all"
                >
                  Ver Proyectos
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src="/logo.jpeg"
                alt="Alejandro Pecillo Logo"
                className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-full shadow-2xl border-4 border-white/20"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Portfolio Section */}
      <main id="portfolio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
                      {categoryMedia.map((media) => (
                        <div
                          key={media.id}
                          className="group rounded-xl overflow-hidden shadow-md bg-card hover:shadow-xl transition-all duration-300 border border-border"
                        >
                          <div className="aspect-video relative bg-muted">
                            {media.type === "video" ? (
                              <video
                                src={media.url}
                                controls
                                className="w-full h-full object-cover"
                                poster={media.thumbnailUrl || undefined}
                              />
                            ) : (
                              <img
                                src={media.url}
                                alt={media.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            )}
                          </div>
                          <div className="p-4 bg-card">
                            <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                              {media.title}
                            </h3>
                          </div>
                        </div>
                      ))}
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
      <section className="bg-secondary text-secondary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold">Contacto</h2>
          <p className="text-secondary-foreground/80 text-lg max-w-xl mx-auto">
            Consultas, presupuestos y proyectos — estamos disponibles para ayudarte.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <a
              href={`https://wa.me/${whatsappClean}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-whatsapp-footer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-7 py-4 rounded-lg shadow-lg transition-all text-lg"
            >
              <MessageCircle className="w-6 h-6" />
              {whatsapp}
            </a>
            <a
              href={`tel:${phoneClean}`}
              data-testid="link-phone-footer"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-7 py-4 rounded-lg shadow-lg transition-all text-lg"
            >
              <Phone className="w-6 h-6" />
              {phone}
            </a>
            <a
              href={`mailto:${email}`}
              data-testid="link-email-footer"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-7 py-4 rounded-lg shadow-lg transition-all border border-white/30 text-lg"
            >
              <Mail className="w-6 h-6" />
              {email}
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

      {/* Floating WhatsApp button */}
      <a
        href={`https://wa.me/${whatsappClean}`}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="link-whatsapp-float"
        title="Contactar por WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-green-500/40"
        style={{ boxShadow: "0 4px 24px 0 rgba(34,197,94,0.45)" }}
      >
        <MessageCircle className="w-6 h-6 flex-shrink-0" />
        <span className="text-sm leading-tight">WhatsApp</span>
      </a>
    </div>
  );
}
