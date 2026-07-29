import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Whether this account may use the export tools.
 *
 * Two ways to qualify:
 *
 *  - belonging to a college (the intended route — exports are a perk of
 *    joining with a verified school email), or
 *  - holding the platform `admin` role.
 *
 * The admin clause is not a convenience. Admins are the people who support
 * founders through exporting, and being told "ask your college to verify you"
 * on your own platform is a dead end with no one to escalate to — the gate
 * has no override, so a platform owner with no college row could never
 * export at all.
 */
export function useIsVerifiedStudent() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-verified-student", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const [{ data: membership }, { data: roles }] = await Promise.all([
        supabase
          .from("college_members")
          .select("college_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      if (membership) return true;
      return (roles ?? []).some((r: { role: string }) => r.role === "admin");
    },
    enabled: !!user,
  });
}
