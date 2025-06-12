import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function useAuth() {
  const { toast } = useToast();

  const logout = () => {
    localStorage.removeItem('authToken');
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    window.location.href = "/login";
  };

  // Simple token check without any queries that cause re-renders
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  return {
    isAuthenticated: !!token,
    logout,
    token,
  };
}