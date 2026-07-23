import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMyProfile, updateProfile } from "@/lib/profile";
import { useAuth } from "./useAuth";
import type { FounderProfile } from "@/types/founder";

export function useMyProfile() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => fetchMyProfile(user!.id),
    enabled: !loading && !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<FounderProfile>) => updateProfile(user!.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-profile", user?.id] }),
  });
}