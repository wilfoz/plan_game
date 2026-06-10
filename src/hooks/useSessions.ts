import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Session } from "../types";

export function useSessions(eventId?: string | null) {
  const qc = useQueryClient();

  const query = useQuery<Session[]>({
    queryKey: ["sessions", eventId],
    queryFn: async () => {
      let q = supabase
        .from("sessions")
        .select("*, grupos(id, nome, resp, ordem), lt_config(nome)");
      
      if (eventId) {
        q = q.eq("event_id", eventId);
      }

      const { data, error } = await q.order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        id: s.id,
        nome: s.nome,
        created_at: s.created_at,
        event_id: s.event_id,
        grupos: (s.grupos ?? []).sort((a: any, b: any) => a.ordem - b.ordem),
        lt: s.lt_config?.[0] ?? { nome: "" },
      }));
    },
  });

  const add = useMutation({
    mutationFn: async ({ id, nome = "Nova Sessão", eventId: evId }: { id: string; nome?: string; eventId?: string | null }) => {
      const { error } = await supabase.from("sessions").insert({ id, nome, event_id: evId || null });
      if (error) throw error;
      // Create default lt_config row for the new session
      const { error: ltErr } = await supabase
        .from("lt_config")
        .insert({ session_id: id });
      if (ltErr) throw ltErr;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions", eventId] }),
  });

  const rename = useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("sessions")
        .update({ nome })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions", eventId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions", eventId] }),
  });

  return { query, add, rename, remove };
}
