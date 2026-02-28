import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Reads the `vetting_system_version` setting from `app_settings`.
 * Returns 'v2' by default (the new system) if the row is missing.
 */
export function useVettingVersion() {
  const { data, isLoading } = useQuery({
    queryKey: ["app_settings", "vetting_system_version"],
    queryFn: async () => {
      const { data: row } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "vetting_system_version")
        .maybeSingle();
      return (row?.value as "v1" | "v2") ?? "v2";
    },
    staleTime: 5 * 60 * 1000, // cache for 5 min
  });

  return { version: data ?? "v2", isLoading };
}
