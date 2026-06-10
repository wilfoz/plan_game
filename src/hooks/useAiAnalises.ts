import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface AiAnalise {
  text: string;
  charts: any[];
  updatedAt: string;
}

export type AiAnalisesMap = Record<string, AiAnalise>;

function rowsToMap(rows: any[]): AiAnalisesMap {
  return Object.fromEntries(
    (rows ?? []).map((r: any) => [r.grupo_id, {
      text:      r.texto      ?? "",
      charts:    r.graficos   ?? [],
      updatedAt: r.updated_at,
    }])
  );
}

export function useAiAnalises(sessionId: string | null) {
  const qc = useQueryClient();

  const query = useQuery<AiAnalisesMap>({
    queryKey: ["ai_analises", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return {};
      const { data, error } = await supabase
        .from("ai_analises")
        .select("grupo_id, texto, graficos, updated_at")
        .eq("session_id", sessionId);
      if (error) throw error;
      return rowsToMap(data ?? []);
    },
  });

  const save = useMutation({
    mutationFn: async ({ grupoId, text, charts }: { grupoId: string; text: string; charts: any[] }) => {
      if (!sessionId) return;
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
