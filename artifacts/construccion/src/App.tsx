import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";

import Home from "./pages/home";
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard";
import AdminCategories from "./pages/admin/categories";
import AdminMedia from "./pages/admin/media";
import AdminSettings from "./pages/admin/settings";
import AdminTestimonials from "./pages/admin/testimonials";

function handleAuthError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    window.location.href = "/admin";
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleAuthError }),
  mutationCache: new MutationCache({ onError: handleAuthError }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/media" component={AdminMedia} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/testimonios" component={AdminTestimonials} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
