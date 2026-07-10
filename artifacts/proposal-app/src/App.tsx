import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import ProposalForm from '@/pages/ProposalForm';
import ProposalPreview from '@/pages/ProposalPreview';

const queryClient = new QueryClient();

function ProtectedRoutes() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/proposals/new" component={ProposalForm} />
        <Route path="/proposals/:id/edit" component={ProposalForm} />
        <Route path="/proposals/:id/preview" component={ProposalPreview} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => {
        window.location.href = '/dashboard';
        return null;
      }} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
