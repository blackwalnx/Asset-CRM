import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import { AuthGuard } from "@/components/auth-guard";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Contacts from "@/pages/contacts";
import ContactDetail from "@/pages/contact-detail";
import ContactForm from "@/pages/contact-form";
import Interactions from "@/pages/interactions";
import Submit from "@/pages/submit";
import Admin from "@/pages/admin";
import AuditLog from "@/pages/audit";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Public/Semi-public */}
      <Route path="/submit">
        <Layout>
          <Submit />
        </Layout>
      </Route>

      {/* Protected Routes */}
      <Route path="/">
        <AuthGuard>
          <Layout>
            <Dashboard />
          </Layout>
        </AuthGuard>
      </Route>

      <Route path="/contacts">
        <AuthGuard>
          <Layout>
            <Contacts />
          </Layout>
        </AuthGuard>
      </Route>

      <Route path="/contacts/new">
        <AuthGuard requireEdit>
          <Layout>
            <ContactForm />
          </Layout>
        </AuthGuard>
      </Route>

      <Route path="/contacts/:id">
        <AuthGuard>
          <Layout>
            <ContactDetail />
          </Layout>
        </AuthGuard>
      </Route>

      <Route path="/contacts/:id/edit">
        <AuthGuard requireEdit>
          <Layout>
            <ContactForm />
          </Layout>
        </AuthGuard>
      </Route>

      <Route path="/interactions">
        <AuthGuard>
          <Layout>
            <Interactions />
          </Layout>
        </AuthGuard>
      </Route>

      <Route path="/admin">
        <AuthGuard requireAdmin>
          <Layout>
            <Admin />
          </Layout>
        </AuthGuard>
      </Route>

      <Route path="/audit">
        <AuthGuard requireAdmin>
          <Layout>
            <AuditLog />
          </Layout>
        </AuthGuard>
      </Route>

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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
