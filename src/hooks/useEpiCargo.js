import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// Returns { [mo_cat_id]: { [epi_cat_id]: true } }
function rowsToMap(rows) {
  const map = {};
  for (const r of rows ?? []) {
    if (!map[r.mo_cat_id]) map[r.mo_cat_id] = {};
    map[r.mo_cat_id][r.epi_cat_id] = true;
  }
  return map;
}

export function useEpiCargo(sessionId) {
  const qc = useQueryClient();
  const key = ["epi_cargo", sessionId];

  const query = useQuery({
    queryKey: key,
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_cargo")
        .select("*")
        .eq("session_id", sessionId);
      if (error) throw error;
      return rowsToMap(data);
    },
  });

  // Toggle: if pair exists → delete; otherwise → insert
  const toggle = useMutation({
    mutationFn: async ({ moCatId, epiCatId }) => {
      const current = query.data ?? {};
      const exists = current[moCatId]?.[epiCatId];
      if (exists) {
        const { error } = await supabase
          .from("epi_cargo")
          .delete()
          .eq("session_id", sessionId)
          .eq("mo_cat_id", moCatId)
          .eq("epi_cat_id", epiCatId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("epi_cargo")
          .insert({ session_id: sessionId, mo_cat_id: moCatId, epi_cat_id: epiCatId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { query, toggle };
}
