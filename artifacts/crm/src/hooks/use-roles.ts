import { useAuth } from "@workspace/replit-auth-web";
import { useQuery } from "@tanstack/react-query";

interface MeResponse {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: string;
  status: string;
}

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch("/api/users/me", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch user role");
  return res.json();
}

export function useUserRole() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const { data: meData, isLoading: isMeLoading } = useQuery<MeResponse>({
    queryKey: ["users", "me"],
    queryFn: fetchMe,
    enabled: !!user && isAuthenticated,
  });

  const isLoading = isAuthLoading || isMeLoading;
  const role = meData?.role ?? "viewer";

  const isAdmin = role === "admin" || role === "super_admin";
  const isSuperAdmin = role === "super_admin";
  const canEdit = ["admin", "super_admin", "fellow", "associate"].includes(role);
  const isContributor = role === "contributor";

  return {
    user,
    meData,
    role,
    isAdmin,
    isSuperAdmin,
    canEdit,
    isContributor,
    isLoading,
    isAuthenticated,
  };
}
