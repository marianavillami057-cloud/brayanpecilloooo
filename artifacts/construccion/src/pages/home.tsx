import { useListCategories, useListMedia, getListCategoriesQueryKey, getListMediaQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: categories, isLoading: isLoadingCategories } = useListCategories(
    { includeInactive: false },
    { query: { queryKey: getListCategoriesQueryKey({ includeInactive: false }) } }
  );

  const { data: mediaItems, isLoading: isLoadingMedia } = useListMedia(
    {},
    { query: { queryKey: getListMediaQueryKey({}) } }
  );

  const isLoading = isLoadingCategories || isLoadingMedia;

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
              <div className="pt-4">
                <a href="#portfolio" className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-4 rounded-lg shadow-lg hover-elevate transition-all">
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
            {categories?.filter(c => c.active).sort((a, b) => a.order - b.order).map(category => {
              const categoryMedia = mediaItems
                ?.filter(m => m.categoryId === category.id)
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
                    {categoryMedia.map(media => (
                      <div key={media.id} className="group rounded-xl overflow-hidden shadow-md bg-card hover:shadow-xl transition-all duration-300 border border-border">
                        <div className="aspect-video relative bg-muted">
                          {media.type === 'video' ? (
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
                          <h3 className="font-semibold text-lg text-foreground line-clamp-1">{media.title}</h3>
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

      <footer className="bg-secondary text-secondary-foreground py-12 mt-12 border-t border-secondary-border/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-secondary-foreground/70 font-medium">&copy; {new Date().getFullYear()} Alejandro Pecillo Construcción. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
