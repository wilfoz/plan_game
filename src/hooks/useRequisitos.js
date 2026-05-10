import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useRequisitos(sessionId) {
  const qc = useQueryClient();
  const key = ["requisitos", sessionId];

  const query = useQuery({
    queryKey: key,
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requisitos")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      // Normalize to AppContext shape: _id as string, aId for atividade_id
      return (data ?? []).map(r => ({
        _id:       r.id,
        aId:       r.atividade_id,
        categoria: r.categoria,
        desc:      r.descricao,
        aplicavel: r.aplicavel,
      }));
    },
  });

  const inv = () => qc.invalidateQueries({ queryKey: key });

  const add = useMutation({
    mutationFn: async ({ ativId, categoria = "Procedimento", desc = "", aplicavel = true }) => {
      const { data, error } = await supabase
        .from("requisitos")
        .insert({
          session_id:   sessionId,
          atividade_id: ativId,
          categoria,
          descricao:    desc,
          aplicavel,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: inv,
  });

  const update = useMutation({
    mutationFn: async ({ id, campo, valor }) => {
      // AppContext uses "desc" but DB column is "descricao"
      const col = campo === "desc" ? "descricao" : campo;
      const { error } = await supabase
        .from("requisitos")
        .update({ [col]: valor })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("requisitos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const seedAll = useMutation({
    mutationFn: async (rows) => {
      const { error } = await supabase.from("requisitos").insert(rows);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  return { query, add, update, remove, seedAll };
}
