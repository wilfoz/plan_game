import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// Returns { [grupoId]: { text, charts, updatedAt } }
function rowsToMap(rows) {
  return Object.fromEntries(
    (rows ?? []).map(r => [r.grupo_id, {
      text:      r.texto      ?? "",
      charts:    r.graficos   ?? [],
      updatedAt: r.updated_at,
    }])
  );
}

export function useAiAnalises(sessionId) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["ai_analises", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_analises")
        .select("grupo_id, texto, graficos, updated_at")
        .eq("session_id", sessionId);
      if (error) throw error;
      return rowsToMap(data);
    },
  });

  const save = useMutation({
    mutationFn: async ({ grupoId, text, charts }) => {
      const { error } = await supabase
        .from("ai_analises")
        .upsert({
          session_id: sessionId,
          grupo_id:   grupoId,
          texto:      text    ?? "",
          graficos:   charts  ?? [],
          updated_at: new Date().toISOString(),
        }, { onConflict: "session_id,grupo_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_analises", sessionId] }),
  });

  return { query, save };
}
