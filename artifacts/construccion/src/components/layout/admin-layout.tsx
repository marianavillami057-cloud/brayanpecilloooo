import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetAuthMe, getGetAuthMeQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: auth, isLoading } = useGetAuthMe({
    query: {
      queryKey: getGetAuthMeQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (!isLoading && !auth?.authenticated) {
      setLocation("/admin");
    }
  }, [auth, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!auth?.authenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Navbar */}
      <header className="bg-secondary text-secondary-foreground shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <span className="font-bold text-xl tracking-tight">Alejandro Pecillo</span>
              <span className="text-sm px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Admin</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/admin/dashboard" className="text-sm font-medium hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); setLocation("/admin/dashboard"); }}>Dashboard</a>
              <a href="/admin/categories" className="text-sm font-medium hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); setLocation("/admin/categories"); }}>Categorías</a>
              <a href="/admin/media" className="text-sm font-medium hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); setLocation("/admin/media"); }}>Media</a>
              <a href="/admin/testimonios" className="text-sm font-medium hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); setLocation("/admin/testimonios"); }}>Testimonios</a>
              <a href="/admin/settings" className="text-sm font-medium hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); setLocation("/admin/settings"); }}>Ajustes</a>
              <a href="/" target="_blank" rel="noreferrer" className="text-sm text-secondary-foreground/70 hover:text-white transition-colors ml-4">Ver sitio</a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
