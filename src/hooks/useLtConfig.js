import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

// Maps Supabase snake_case columns to AppContext camelCase keys
export function rowToLt(row) {
  if (!row) return null;
  return {
    nome:      row.nome      ?? "",
    tensao:    row.tensao    ?? "500kV",
    ext:       row.ext       ?? 0,
    circ:      row.circ      ?? "simples",
    cabFase:   row.cab_fase  ?? 4,
    pararaios: row.pararaios ?? 2,
    opgw:      row.opgw      ?? 1,
  };
}

function ltToRow(lt, sessionId) {
  return {
    session_id: sessionId,
    nome:       lt.nome      ?? "",
    tensao:     lt.tensao    ?? "500kV",
    ext:        lt.ext       ?? 0,
    circ:       lt.circ      ?? "simples",
    cab_fase:   lt.cabFase   ?? 4,
    pararaios:  lt.pararaios ?? 2,
    opgw:       lt.opgw      ?? 1,
  };
}

export function useLtConfig(sessionId) {
  const qc = useQueryClient();
  const debounceRef = useRef(null);

  const query = useQuery({
    queryKey: ["lt", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lt_config")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (error) throw error;
      return rowToLt(data);
    },
  });

  const upsert = useMutation({
    mutationFn: async (lt) => {
      const { error } = await supabase
        .from("lt_config")
        .upsert(ltToRow(lt, sessionId), { onConflict: "session_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lt", sessionId] }),
  });

  // Debounced upsert — batches rapid field changes (e.g. text inputs)
  const upsertDebounced = (lt) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => upsert.mutate(lt), 500);
  };

  return { query, upsert, upsertDebounced };
}
