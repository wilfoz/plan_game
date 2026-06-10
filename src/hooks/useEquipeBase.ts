import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { MoRow, EqRow } from "../types";

interface EquipeBaseMap {
  [atividade_id: string]: {
    moRows: MoRow[];
    eqRows: EqRow[];
  };
}

// Returns { [atividade_id]: { moRows: [], eqRows: [] } }
function buildMap(moRows: any[], eqRows: any[]): EquipeBaseMap {
  const map: EquipeBaseMap = {};
  const ensure = (id: string) => { if (!map[id]) map[id] = { moRows: [], eqRows: [] }; };
  for (const r of moRows ?? []) {
    ensure(r.atividade_id);
    map[r.atividade_id].moRows.push({
      _id:      r.id,   // backward compat: pages reference rows by _id
      catId:    r.cat_id,
      cargo:    r.cargo,
      sal:      r.sal,
      qtd:      r.qtd,
      horasDia: r.horas_dia,
    });
  }
  for (const r of eqRows ?? []) {
    ensure(r.atividade_id);
    map[r.atividade_id].eqRows.push({
      _id:      r.id,   // backward compat
      catId:    r.cat_id,
      nome:     r.nome,
      loc:      r.loc,
      qtd:      r.qtd,
      horasDia: r.horas_dia,
    });
  }
  return map;
}

export function useEquipeBase(sessionId: string | null) {
  const qc = useQueryClient();
  const key = ["equipe_base", sessionId];

  const query = useQuery<EquipeBaseMap>({
    queryKey: key,
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return {};
      const [moRes, eqRes] = await Promise.all([
        supabase.from("equipe_base_mo").select("*").eq("session_id", sessionId),
        supabase.from("equipe_base_eq").select("*").eq("session_id", sessionId),
      ]);
      if (moRes.error) throw moRes.error;
      if (eqRes.error) throw eqRes.error;
      return buildMap(moRes.data ?? [], eqRes.data ?? []);
    },
  });

  const inv = () => qc.invalidateQueries({ queryKey: key });

  // MO mutations
  const addMo = useMutation({
    mutationFn: async ({
      ativId,
      catId,
      cargo,
      sal,
      qtd,
      horasDia,
    }: {
      ativId: string;
      catId: string;
      cargo: string;
      sal?: number;
      qtd?: number;
      horasDia?: number;
    }) => {
      if (!sessionId) return;
      const { error } = await supabase.from("equipe_base_mo").insert({
        session_id:   sessionId,
        atividade_id: ativId,
        cat_id:       catId,
        cargo,
        sal:          sal      ?? 0,
        qtd:          qtd      ?? 1,
        horas_dia:    horasDia ?? 8.5,
      });
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const delMo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipe_base_mo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const updMo = useMutation({
    mutationFn: async ({ id, campo, valor }: { id: string; campo: string; valor: any }) => {
      const colMap: Record<string, string> = { sal: "sal", qtd: "qtd", horasDia: "horas_dia" };
      const col = colMap[campo] ?? campo;
      const { error } = await supabase
        .from("equipe_base_mo")
        .update({ [col]: valor })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  // EQ mutations
  const addEq = useMutation({
    mutationFn: async ({
      ativId,
      catId,
      nome,
      loc,
      qtd,
      horasDia,
    }: {
      ativId: string;
      catId: string;
      nome: string;
      loc?: number;
      qtd?: number;
      horasDia?: number;
    }) => {
      if (!sessionId) return;
      const { error } = await supabase.from("equipe_base_eq").insert({
        session_id:   sessionId,
        atividade_id: ativId,
        cat_id:       catId,
        nome,
        loc:       loc      ?? 0,
        qtd:       qtd      ?? 1,
        horas_dia: horasDia ?? 8.5,
      });
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const delEq = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipe_base_eq").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const updEq = useMutation({
    mutationFn: async ({ id, campo, valor }: { id: string; campo: string; valor: any }) => {
      const colMap: Record<string, string> = { loc: "loc", qtd: "qtd", horasDia: "horas_dia" };
      const col = colMap[campo] ?? campo;
      const { error } = await supabase
        .from("equipe_base_eq")
        .update({ [col]: valor })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const seedAll = useMutation({
    mutationFn: async ({ moRows, eqRows }: { moRows: any[]; eqRows: any[] }) => {
      const [moRes, eqRes] = await Promise.all([
        supabase.from("equipe_base_mo").insert(moRows),
        supabase.from("equipe_base_eq").insert(eqRows),
      ]);
      if (moRes.error) throw moRes.error;
      if (eqRes.error) throw eqRes.error;
    },
    onSuccess: inv,
  });

  return { query, addMo, delMo, updMo, addEq, delEq, updEq, seedAll };
}
