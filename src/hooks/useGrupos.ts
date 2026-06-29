import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { Grupo } from "../types";

export function useGrupos(sessionId: string | null, eventId: string | null = null) {
  const qc = useQueryClient();
  const key = ["grupos", sessionId];

  const query = useQuery<Grupo[]>({
    queryKey: key,
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("grupos")
        .select("id, session_id, event_id, nome, resp, ordem")
        .eq("session_id", sessionId)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((g: any) => ({
        id: g.id,
        nome: g.nome,
        resp: g.resp ?? "",
        ordem: g.ordem ?? 0,
        session_id: g.session_id,
        event_id: g.event_id ?? undefined,
      }));
    },
  });

  // Also invalidate sessions since it includes a grupos join
  const inv = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["sessions"] });
  };

  const add = useMutation({
    mutationFn: async ({
      nome,
      resp = "",
      senha = "",
      ordem = 0,
    }: {
      nome: string;
      resp?: string;
      senha?: string;
      ordem?: number;
    }) => {
      if (!sessionId) return "";
      // event_id: usa o evento ativo; se ausente, deriva do evento da sessão.
      let evId = eventId;
      if (!evId) {
        const { data: sess } = await supabase
          .from("sessions")
          .select("event_id")
          .eq("id", sessionId)
          .single();
        evId = sess?.event_id ?? null;
      }
      const { data, error } = await supabase
        .from("grupos")
        .insert({ session_id: sessionId, event_id: evId, nome, resp, senha: "", ordem })
        .select("id")
        .single();
      if (error) throw error;
      // Hash a senha via RPC (bcrypt) se foi fornecida
      if (senha && data) {
        const { error: hashErr } = await supabase.rpc("set_grupo_senha", {
          g_id: data.id,
          plaintext: senha,
        });
        if (hashErr) throw hashErr;
      }
      return data?.id ?? "";
    },
    onSuccess: inv,
  });

  const update = useMutation({
    mutationFn: async ({ id, campo, valor }: { id: string; campo: string; valor: any }) => {
      if (campo === "senha") {
        // Senha nunca é salva em plaintext — hash via RPC
        if (!valor) return;
        const { error } = await supabase.rpc("set_grupo_senha", {
          g_id: id,
          plaintext: valor,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("grupos")
          .update({ [campo]: valor })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: inv,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grupos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  return { query, add, update, remove };
}
