import { useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { ATIVS } from "../constants/catalogs";
import { Comp, GrupoComps, Grupo } from "../types";

const mkComp = (): Comp => ({ moRows: [], eqRows: [], reqIds: [], kpi: 0, equipes: 1, mesInicia: 0 });

function buildComps(rows: any[], grupos: Grupo[]): GrupoComps[] {
  return grupos.map(g => {
    const grupoRows = rows.filter(r => r.grupo_id === g.id);
    return Object.fromEntries(ATIVS.map(a => {
      const row = grupoRows.find(r => r.atividade_id === a.id);
      if (!row) return [a.id, mkComp()];
      return [a.id, {
        kpi:       row.kpi           ?? 0,
        equipes:   row.equipes       ?? 1,
        mesInicia: row.mes_inicia    ?? 0,
        moRows:    row.mo_rows       ?? [],
        eqRows:    row.eq_rows       ?? [],
        reqIds:    (row.req_ids ?? []).map(String),
      }];
    }));
  });
}

export function useGrupoComps(sessionId: string | null, grupos: Grupo[]) {
  // Key includes grupo IDs so query refetches when groups are added/removed
  const key = ["grupo_comps", sessionId, grupos.map(g => g.id).join(",")];
  const debounceRefs = useRef<Record<string, any>>({});

  const query = useQuery<GrupoComps[]>({
    queryKey: key,
    enabled: !!sessionId,
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from("grupo_comps")
        .select("*")
        .eq("session_id", sessionId);
      if (error) throw error;
      return buildComps(data ?? [], grupos);
    },
  });

  const upsert = useMutation({
    mutationFn: async ({ grupoId, ativId, comp }: { grupoId: string; ativId: string; comp: Comp }) => {
      if (!sessionId) return;
      const { error } = await supabase
        .from("grupo_comps")
        .upsert({
          session_id:   sessionId,
          grupo_id:     grupoId,
          atividade_id: ativId,
          kpi:          comp.kpi       ?? 0,
          equipes:      comp.equipes  ?? 1,
          mes_inicia:   comp.mesInicia ?? 0,
          mo_rows:      comp.moRows   ?? [],
          eq_rows:      comp.eqRows   ?? [],
          req_ids:      comp.reqIds   ?? [],
          updated_at:   new Date().toISOString(),
        }, { onConflict: "grupo_id,atividade_id" });
      if (error) throw error;
    },
  });

  const upsertDebounced = (grupoId: string, ativId: string, comp: Comp) => {
    const dKey = `${grupoId}:${ativId}`;
    clearTimeout(debounceRefs.current[dKey]);
    debounceRefs.current[dKey] = setTimeout(
      () => upsert.mutate({ grupoId, ativId, comp }),
      600
    );
  };

  return { query, upsert, upsertDebounced };
}
