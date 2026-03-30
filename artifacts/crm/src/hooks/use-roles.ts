import { useAuth } from "@/hooks/use-auth";

export function useUserRole() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const role = user?.role ?? "viewer";

  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";
  const canEdit = ["admin", "super_admin", "fellow", "associate"].includes(role);
  const isContributor = role === "contributor";

  return {
    user,
    role,
    isAdmin,
    isSuperAdmin,
    canEdit,
    isContributor,
    isLoading,
    isAuthenticated,
  };
}
