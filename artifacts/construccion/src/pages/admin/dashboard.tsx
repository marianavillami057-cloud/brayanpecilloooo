import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListCategories, useListMedia, getListCategoriesQueryKey, getListMediaQueryKey, useAdminLogout, getGetAuthMeQueryKey } from "@workspace/api-client-react";
import { Folder, Image as ImageIcon, Video, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories(
    { includeInactive: true },
    { query: { queryKey: getListCategoriesQueryKey({ includeInactive: true }) } }
  );

  const { data: media } = useListMedia(
    {},
    { query: { queryKey: getListMediaQueryKey({}) } }
  );

  const logoutMutation = useAdminLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAuthMeQueryKey() });
        setLocation("/admin");
      }
    }
  });

  const stats = [
    {
      title: "Categorías Totales",
      value: categories?.length || 0,
      icon: Folder,
      link: "/admin/categories",
      color: "text-blue-500"
    },
    {
      title: "Categorías Activas",
      value: categories?.filter(c => c.active).length || 0,
      icon: Folder,
      link: "/admin/categories",
      color: "text-green-500"
    },
    {
      title: "Fotos",
      value: media?.filter(m => m.type === 'photo').length || 0,
      icon: ImageIcon,
      link: "/admin/media",
      color: "text-orange-500"
    },
    {
      title: "Videos",
      value: media?.filter(m => m.type === 'video').length || 0,
      icon: Video,
      link: "/admin/media",
      color: "text-purple-500"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Resumen general de tu portafolio de proyectos.</p>
          </div>
          <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <Link href={stat.link} className="text-xs text-primary hover:underline mt-2 inline-block">
                    Gestionar &rarr;
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Accesos Rápidos</CardTitle>
              <CardDescription>Gestiona el contenido de tu web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/admin/categories" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                  <Folder className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Categorías</h4>
                  <p className="text-xs text-muted-foreground">Crea y ordena las categorías de tus proyectos</p>
                </div>
              </Link>
              
              <Link href="/admin/media" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-md">
                  <ImageIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Media</h4>
                  <p className="text-xs text-muted-foreground">Sube fotos y videos a tus categorías</p>
                </div>
              </Link>

              <Link href="/admin/settings" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">Ajustes Cloudinary</h4>
                  <p className="text-xs text-muted-foreground">Configura el almacenamiento de imágenes</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
