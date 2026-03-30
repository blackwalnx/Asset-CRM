import React from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useUserRole } from "@/hooks/use-roles";
import { Spinner } from "@/components/ui";

export function AuthGuard({ children, requireAdmin = false, requireEdit = false }: { children: React.ReactNode, requireAdmin?: boolean, requireEdit?: boolean }) {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { isAdmin, canEdit, isLoading: roleLoading } = useUserRole();

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to view this page. Administrator access is required.</p>
        </div>
      </div>
    );
  }

  if (requireEdit && !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Read Only</h2>
          <p className="text-muted-foreground">Your role does not permit modifying records.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
