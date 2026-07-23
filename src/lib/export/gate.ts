import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useIsVerifiedStudent() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-verified-student", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("college_members")
        .select("college_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });
}