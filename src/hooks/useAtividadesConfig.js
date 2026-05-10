import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// Returns { [atividade_id]: { kpiBase, volumePrev, comentario, mesIniciaBase } }
function rowsToMap(rows) {
  const map = {};
  for (const r of rows ?? []) {
    map[r.atividade_id] = {
      kpiBase:       r.kpi_base        ?? 0,
      volumePrev:    r.volume_previsto ?? 0,
      comentario:    r.comentario      ?? "",
      mesIniciaBase: r.mes_inicia_base ?? 0,
    };
  }
  return map;
}

export function useAtividadesConfig(sessionId) {
  const qc = useQueryClient();
  const debounceRefs = useRef({});

  const query = useQuery({
    queryKey: ["atividades_config", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atividades_config")
        .select("*")
        .eq("session_id", sessionId);
      if (error) throw error;
      return rowsToMap(data);
    },
  });

  const upsertAtiv = useMutation({
    mutationFn: async ({ ativId, kpiBase, volumePrev, comentario, mesIniciaBase }) => {
      const { error } = await supabase.from("atividades_config").upsert(
        {
          session_id:      sessionId,
          atividade_id:    ativId,
          kpi_base:        kpiBase        ?? 0,
          volume_previsto: volumePrev     ?? 0,
          comentario:      comentario     ?? "",
          mes_inicia_base: mesIniciaBase  ?? 0,
        },
        { onConflict: "session_id,atividade_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atividades_config", sessionId] }),
  });

  // Debounced per-activity upsert
  const upsertDebounced = (ativId, fields) => {
    clearTimeout(debounceRefs.current[ativId]);
    debounceRefs.current[ativId] = setTimeout(
      () => upsertAtiv.mutate({ ativId, ...fields }),
      500
    );
  };

  return { query, upsertAtiv, upsertDebounced };
}
