import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import Analysis from "./pages/Analysis";
import Alerts from "./pages/Alerts";
import DashboardNav from "./components/DashboardNav";

function App() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/analysis" component={Analysis} />
          <Route path="/alerts" component={Alerts} />
        </Switch>
      </main>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  );
}
