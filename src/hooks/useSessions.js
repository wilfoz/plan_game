import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useSessions() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*, grupos(id, nome, resp, ordem), lt_config(nome)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(s => ({
        ...s,
        grupos: (s.grupos ?? []).sort((a, b) => a.ordem - b.ordem),
        lt: s.lt_config?.[0] ?? { nome: "" },
      }));
    },
  });

  const add = useMutation({
    // Accepts { id, nome } so AppContext can pre-generate the ID for sync return
    mutationFn: async ({ id, nome = "Nova Sessão" }) => {
      const { error } = await supabase.from("sessions").insert({ id, nome });
      if (error) throw error;
      // Create default lt_config row for the new session
      const { error: ltErr } = await supabase
        .from("lt_config")
        .insert({ session_id: id });
      if (ltErr) throw ltErr;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const rename = useMutation({
    mutationFn: async ({ id, nome }) => {
      const { error } = await supabase
        .from("sessions")
        .update({ nome })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  return { query, add, rename, remove };
}
