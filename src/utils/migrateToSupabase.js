import { supabase } from "../lib/supabase";

const LS_KEY      = "jornadas_lt_sessions";
const LS_COMPS    = (sid) => `jlt_comps_${sid}`;

// Returns sessions array from localStorage, or null if nothing stored.
function readLocalSessions() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Checks if there is local data worth migrating (at least one session with content).
export function hasLocalData() {
  const sessions = readLocalSessions();
  return !!(sessions && sessions.length > 0);
}

// Migrates all localStorage data to Supabase.
// Returns { ok: true } on success, { ok: false, error } on failure.
export async function migrateFromLocalStorage() {
  const sessions = readLocalSessions();
  if (!sessions || sessions.length === 0) return { ok: true };

  try {
    for (const s of sessions) {
      // 1. session
      await supabase.from("sessions").upsert({ id: s.id, nome: s.nome ?? "Sessão Importada" });

      // 2. lt_config
      const lt = s.lt ?? {};
      await supabase.from("lt_config").upsert(
        {
          session_id: s.id,
          nome:       lt.nome      ?? "",
          tensao:     lt.tensao    ?? "500kV",
          ext:        lt.ext       ?? 0,
          circ:       lt.circ      ?? "simples",
          cab_fase:   lt.cabFase   ?? 4,
          pararaios:  lt.pararaios ?? 2,
          opgw:       lt.opgw      ?? 1,
        },
        { onConflict: "session_id" }
      );

      // 3. atividades_config (kpisBase + volumesPrev + comentariosAtiv)
      const kpisBase        = s.kpisBase        ?? {};
      const volumesPrev     = s.volumesPrev     ?? {};
      const comentariosAtiv = s.comentariosAtiv ?? {};
      const ativIds = new Set([
        ...Object.keys(kpisBase),
        ...Object.keys(volumesPrev),
        ...Object.keys(comentariosAtiv),
      ]);
      for (const ativId of ativIds) {
        await supabase.from("atividades_config").upsert(
          {
            session_id:      s.id,
            atividade_id:    ativId,
            kpi_base:        kpisBase[ativId]        ?? 0,
            volume_previsto: volumesPrev[ativId]     ?? 0,
            comentario:      comentariosAtiv[ativId] ?? "",
          },
          { onConflict: "session_id,atividade_id" }
        );
      }

      // 4. equipe_base (moRows / eqRows per activity)
      const equipesBase = s.equipesBase ?? {};
      for (const [ativId, eb] of Object.entries(equipesBase)) {
        for (const r of eb.moRows ?? []) {
          await supabase.from("equipe_base_mo").insert({
            session_id:   s.id,
            atividade_id: ativId,
            cat_id:       r.catId    ?? r.cat_id   ?? "",
            cargo:        r.cargo    ?? "",
            sal:          r.sal      ?? 0,
            qtd:          r.qtd      ?? 1,
            horas_dia:    r.horasDia ?? r.horas_dia ?? 8.5,
          });
        }
        for (const r of eb.eqRows ?? []) {
          await supabase.from("equipe_base_eq").insert({
            session_id:   s.id,
            atividade_id: ativId,
            cat_id:       r.catId    ?? r.cat_id   ?? "",
            nome:         r.nome     ?? "",
            loc:          r.loc      ?? 0,
            qtd:          r.qtd      ?? 1,
            horas_dia:    r.horasDia ?? r.horas_dia ?? 8.5,
          });
        }
      }

      // 5. grupos — insert e recupera os IDs gerados para usar na migração de comps
      const grupoIdMap = {}; // index → uuid
      for (let i = 0; i < (s.grupos ?? []).length; i++) {
        const g = s.grupos[i];
        const { data: gRow } = await supabase
          .from("grupos")
          .insert({
            session_id: s.id,
            nome:       g.nome  ?? `Grupo ${i + 1}`,
            resp:       g.resp  ?? "",
            senha:      g.senha ?? "",
            ordem:      i,
          })
          .select("id")
          .single();
        if (gRow?.id) grupoIdMap[i] = gRow.id;
      }

      // 6. requisitos
      for (const r of s.requisitos ?? []) {
        await supabase.from("requisitos").insert({
          session_id:   s.id,
          atividade_id: r.aId,
          categoria:    r.categoria ?? "Procedimento",
          descricao:    r.desc      ?? "",
          aplicavel:    r.aplicavel ?? true,
        });
      }

      // 7. epi_cargo
      const epiCargo = s.epiCargo ?? {};
      for (const [moCatId, epis] of Object.entries(epiCargo)) {
        for (const epiCatId of Object.keys(epis)) {
          await supabase.from("epi_cargo").upsert(
            { session_id: s.id, mo_cat_id: moCatId, epi_cat_id: epiCatId },
            { onConflict: "session_id,mo_cat_id,epi_cat_id" }
          );
        }
      }

      // 8. grupo_comps — chave separada: jlt_comps_<sessionId>
      // Formato v1: array de grupoComps indexado por posição do grupo
      //   comps[gi][ativId] = { moRows, eqRows, reqIds, kpi, equipes }
      try {
        const rawComps = localStorage.getItem(LS_COMPS(s.id));
        const compsArr = rawComps ? JSON.parse(rawComps) : [];
        for (let gi = 0; gi < compsArr.length; gi++) {
          const grupoId = grupoIdMap[gi];
          if (!grupoId) continue;
          const grupoComps = compsArr[gi] ?? {};
          for (const [ativId, comp] of Object.entries(grupoComps)) {
            if (!comp) continue;
            await supabase.from("grupo_comps").upsert(
              {
                session_id:   s.id,
                grupo_id:     grupoId,
                atividade_id: ativId,
                kpi:          comp.kpi     ?? 0,
                equipes:      comp.equipes ?? 1,
                mo_rows:      comp.moRows  ?? [],
                eq_rows:      comp.eqRows  ?? [],
                req_ids:      (comp.reqIds ?? []).map(String),
              },
              { onConflict: "grupo_id,atividade_id" }
            );
          }
        }
        localStorage.removeItem(LS_COMPS(s.id));
      } catch {
        // comps ausentes ou inválidos — ignora silenciosamente
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(LS_KEY);
    return { ok: true };
  } catch (error) {
    console.error("Erro na migração:", error);
    return { ok: false, error };
  }
}
