import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ATIVS, MO_CAT, EQ_CAT, BASE_COMPOSITIONS, BASE_REQUIREMENTS } from "../constants/catalogs";
import { uid } from "../utils/formatters";
import {
  calcA as calcABase,
  calcSeg as calcSegBase,
  calcNaoAplicPenalty as calcNaoAplicPenaltyBase,
  calcEficienciaGeral,
} from "../utils/calculations";
import { useSessions } from "../hooks/useSessions";
import { useLtConfig } from "../hooks/useLtConfig";
import { useAtividadesConfig } from "../hooks/useAtividadesConfig";
import { useEquipeBase } from "../hooks/useEquipeBase";
import { useGrupos } from "../hooks/useGrupos";
import { useGrupoComps } from "../hooks/useGrupoComps";
import { useRequisitos } from "../hooks/useRequisitos";
import { useEpiCargo } from "../hooks/useEpiCargo";
import { useRealtimeComps } from "../hooks/useRealtimeComps";

const mkComp = () => ({ moRows: [], eqRows: [], reqIds: [], kpi: 0, equipes: 1, mesInicia: 0 });
const mkGrupoComps = () => Object.fromEntries(ATIVS.map(a => [a.id, mkComp()]));
const mkEquipesBase = () => Object.fromEntries(ATIVS.map(a => [a.id, { moRows: [], eqRows: [] }]));
const EMPTY_LT = { nome: "", tensao: "500kV", ext: 0, circ: "simples", cabFase: 4, pararaios: 2, opgw: 1 };

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const qc = useQueryClient();

  // ── UI state ────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState("login");
  const [role, setRole] = useState(null);
  const [gIdx, setGIdx] = useState(0);
  const [aTab, setATab] = useState("a1");
  const [epiCargoAtivo, setEpiCargoAtivo] = useState("mo1");
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [duracaoSomada, setDuracaoSomada] = useState(true);
  const [copyOptions, setCopyOptions] = useState(null);

  // ── Supabase hooks ────────────────────────────────────────────────────────
  const sessionsHook = useSessions();
  const ltHook       = useLtConfig(activeSessionId);
  const ativHook     = useAtividadesConfig(activeSessionId);
  const ebHook       = useEquipeBase(activeSessionId);
  const gruposHook   = useGrupos(activeSessionId);
  const reqHook      = useRequisitos(activeSessionId);
  const epiHook      = useEpiCargo(activeSessionId);

  // grupos precisa estar disponível antes de inicializar compsHook
  const grupos = gruposHook.query.data ?? [];
  const compsHook       = useGrupoComps(activeSessionId, grupos);
  const { connected: realtimeConnected } = useRealtimeComps(activeSessionId);

  // ── Sessions ─────────────────────────────────────────────────────────────
  // sessions includes nested grupos (via join in useSessions query)
  const sessions = sessionsHook.query.data ?? [];
  const sess = sessions.find(s => s.id === activeSessionId) || null;

  const addSession = (nome) => {
    const id = uid();
    // Optimistically insert into cache so setActiveSessionId works immediately
    qc.setQueryData(["sessions"], (old = []) => [
      ...old,
      { id, nome: nome || "Nova Sessão", created_at: new Date().toISOString(), grupos: [], lt: { nome: "" } },
    ]);
    sessionsHook.add.mutate({ id, nome: nome || "Nova Sessão" });
    return id;
  };

  const delSession = (id) => {
    qc.setQueryData(["sessions"], (old = []) => (old ?? []).filter(s => s.id !== id));
    sessionsHook.remove.mutate(id);
  };

  const uSessionNome = (id, nome) => {
    qc.setQueryData(["sessions"], (old = []) =>
      (old ?? []).map(s => s.id === id ? { ...s, nome } : s)
    );
    sessionsHook.rename.mutate({ id, nome });
  };

  // ── LT (local state initialized from query, debounced Supabase save) ─────
  const [lt, setLt] = useState(EMPTY_LT);
  useEffect(() => {
    if (ltHook.query.data) setLt(ltHook.query.data); // eslint-disable-line react-hooks/set-state-in-effect
  }, [ltHook.query.data]);

  const uLt = (k, v) => {
    const newLt = { ...lt, [k]: v };
    setLt(newLt);
    ltHook.upsertDebounced(newLt);
  };

  // ── Atividades config (local state + debounced Supabase) ─────────────────
  const [ativLocal, setAtivLocalState] = useState({});
  const ativLocalRef = useRef({});

  useEffect(() => {
    if (ativHook.query.data) {
      ativLocalRef.current = ativHook.query.data;
      setAtivLocalState(ativHook.query.data); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [ativHook.query.data]);

  const kpisBase        = Object.fromEntries(ATIVS.map(a => [a.id, ativLocal[a.id]?.kpiBase      ?? 0]));
  const volumesPrev     = Object.fromEntries(ATIVS.map(a => [a.id, ativLocal[a.id]?.volumePrev   ?? 0]));
  const comentariosAtiv = Object.fromEntries(ATIVS.map(a => [a.id, ativLocal[a.id]?.comentario   ?? ""]));
  const mesIniciaBase   = Object.fromEntries(ATIVS.map(a => [a.id, ativLocal[a.id]?.mesIniciaBase ?? 0]));

  const _saveAtiv = (ativId, current) => {
    const d = current[ativId] ?? { kpiBase: 0, volumePrev: 0, comentario: "", mesIniciaBase: 0 };
    ativHook.upsertDebounced(ativId, { kpiBase: d.kpiBase, volumePrev: d.volumePrev, comentario: d.comentario, mesIniciaBase: d.mesIniciaBase ?? 0 });
  };

  const setKpisBase = (fn) => {
    const cur = ativLocalRef.current;
    const curKpis = Object.fromEntries(ATIVS.map(a => [a.id, cur[a.id]?.kpiBase ?? 0]));
    const newMap = typeof fn === "function" ? fn(curKpis) : fn;
    const next = { ...cur };
    const changed = [];
    for (const a of ATIVS) {
      const v = newMap[a.id] ?? 0;
      if (v !== (cur[a.id]?.kpiBase ?? 0)) {
        next[a.id] = { ...(cur[a.id] ?? { kpiBase: 0, volumePrev: 0, comentario: "", mesIniciaBase: 0 }), kpiBase: v };
        changed.push(a.id);
      }
    }
    ativLocalRef.current = next;
    setAtivLocalState(next);
    for (const id of changed) _saveAtiv(id, next);
  };

  const setVolumesPrev = (fn) => {
    const cur = ativLocalRef.current;
    const curVols = Object.fromEntries(ATIVS.map(a => [a.id, cur[a.id]?.volumePrev ?? 0]));
    const newMap = typeof fn === "function" ? fn(curVols) : fn;
    const next = { ...cur };
    const changed = [];
    for (const a of ATIVS) {
      const v = newMap[a.id] ?? 0;
      if (v !== (cur[a.id]?.volumePrev ?? 0)) {
        next[a.id] = { ...(cur[a.id] ?? { kpiBase: 0, volumePrev: 0, comentario: "", mesIniciaBase: 0 }), volumePrev: v };
        changed.push(a.id);
      }
    }
    ativLocalRef.current = next;
    setAtivLocalState(next);
    for (const id of changed) _saveAtiv(id, next);
  };

  const setComentariosAtiv = (fn) => {
    const cur = ativLocalRef.current;
    const curComs = Object.fromEntries(ATIVS.map(a => [a.id, cur[a.id]?.comentario ?? ""]));
    const newMap = typeof fn === "function" ? fn(curComs) : fn;
    const next = { ...cur };
    const changed = [];
    for (const a of ATIVS) {
      const v = newMap[a.id] ?? "";
      if (v !== (cur[a.id]?.comentario ?? "")) {
        next[a.id] = { ...(cur[a.id] ?? { kpiBase: 0, volumePrev: 0, comentario: "", mesIniciaBase: 0 }), comentario: v };
        changed.push(a.id);
      }
    }
    ativLocalRef.current = next;
    setAtivLocalState(next);
    for (const id of changed) _saveAtiv(id, next);
  };

  const setMesIniciaBase = (fn) => {
    const cur = ativLocalRef.current;
    const curMes = Object.fromEntries(ATIVS.map(a => [a.id, cur[a.id]?.mesIniciaBase ?? 0]));
    const newMap = typeof fn === "function" ? fn(curMes) : fn;
    const next = { ...cur };
    const changed = [];
    for (const a of ATIVS) {
      const v = newMap[a.id] ?? 0;
      if (v !== (cur[a.id]?.mesIniciaBase ?? 0)) {
        next[a.id] = { ...(cur[a.id] ?? { kpiBase: 0, volumePrev: 0, comentario: "", mesIniciaBase: 0 }), mesIniciaBase: v };
        changed.push(a.id);
      }
    }
    ativLocalRef.current = next;
    setAtivLocalState(next);
    for (const id of changed) _saveAtiv(id, next);
  };

  // ── Grupos (React Query source of truth) ─────────────────────────────────
  const addGrupo = () => {
    const nome = `Grupo ${String.fromCharCode(65 + grupos.length)}`;
    gruposHook.add.mutate({ nome, resp: "", senha: "", ordem: grupos.length });
    // comps will be extended by the sync effect when grupos count increases
  };

  const uGrupo = (id, k, v) => gruposHook.update.mutate({ id, campo: k, valor: v });

  const delGrupo = (gi) => {
    if (grupos.length <= 1) return;
    gruposHook.remove.mutate(grupos[gi].id);
    // comps will be trimmed by the sync effect when grupos count decreases
  };

  // ── Requisitos ────────────────────────────────────────────────────────────
  const requisitos = reqHook.query.data ?? [];
  const addRequisito = (aId) => reqHook.add.mutate({ ativId: aId });
  const delRequisito = (_id) => reqHook.remove.mutate(_id);
  const updRequisito = (_id, k, v) => reqHook.update.mutate({ id: _id, campo: k, valor: v });

  // ── EPI ───────────────────────────────────────────────────────────────────
  const epiCargo = epiHook.query.data ?? {};
  const togEpi = (moId, epiId) => epiHook.toggle.mutate({ moCatId: moId, epiCatId: epiId });

  // ── Equipes Base ──────────────────────────────────────────────────────────
  const equipesBase = ebHook.query.data ?? mkEquipesBase();

  // Seed automático quando sessão nova (sem dados de equipe base, kpi ou requisitos)
  const seededSessionsRef = useRef(new Set());
  useEffect(() => {
    if (!activeSessionId) return;
    if (ebHook.query.isLoading || ativHook.query.isLoading || reqHook.query.isLoading) return;
    if (seededSessionsRef.current.has(activeSessionId)) return;

    const ebData    = ebHook.query.data ?? {};
    const ebEmpty   = Object.keys(ebData).length === 0;
    const kpisEmpty = ATIVS.every(a => !(ativLocalRef.current[a.id]?.kpiBase > 0));
    const reqEmpty  = (reqHook.query.data ?? []).length === 0;
    if (!ebEmpty || !kpisEmpty || !reqEmpty) { seededSessionsRef.current.add(activeSessionId); return; }

    seededSessionsRef.current.add(activeSessionId);

    const moRows = [];
    const eqRows = [];
    Object.entries(BASE_COMPOSITIONS).forEach(([aId, bc]) => {
      bc.moRows.forEach(r => moRows.push({
        session_id: activeSessionId, atividade_id: aId,
        cat_id: r.catId, cargo: r.cargo, sal: r.sal, qtd: r.qtd, horas_dia: r.horasDia,
      }));
      bc.eqRows.forEach(r => eqRows.push({
        session_id: activeSessionId, atividade_id: aId,
        cat_id: r.catId, nome: r.nome, loc: r.loc, qtd: r.qtd, horas_dia: r.horasDia,
      }));
    });
    ebHook.seedAll.mutate({ moRows, eqRows });

    setKpisBase(Object.fromEntries(
      Object.entries(BASE_COMPOSITIONS).map(([aId, bc]) => [aId, bc.kpi])
    ));

    reqHook.seedAll.mutate(BASE_REQUIREMENTS.map(r => ({
      session_id:   activeSessionId,
      atividade_id: r.aId,
      categoria:    r.categoria,
      descricao:    r.desc,
      aplicavel:    r.aplicavel,
    })));
  }, [activeSessionId, ebHook.query.isLoading, ebHook.query.data, ativHook.query.isLoading, reqHook.query.isLoading, reqHook.query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const eqBaseAddMo = (aId, catId) => {
    const cat = MO_CAT.find(r => r.id === catId);
    if (!cat) return;
    ebHook.addMo.mutate({ ativId: aId, catId, cargo: cat.cargo, sal: cat.sal, qtd: 1, horasDia: 8.5 });
  };
  const eqBaseDelMo = (_aId, _id) => ebHook.delMo.mutate(_id);
  const eqBaseUpdMo = (_aId, _id, k, v) => ebHook.updMo.mutate({ id: _id, campo: k, valor: +v || 0 });

  const eqBaseAddEq = (aId, catId) => {
    const cat = EQ_CAT.find(r => r.id === catId);
    if (!cat) return;
    ebHook.addEq.mutate({ ativId: aId, catId, nome: cat.nome, loc: cat.loc, qtd: 1, horasDia: 8.5 });
  };
  const eqBaseDelEq = (_aId, _id) => ebHook.delEq.mutate(_id);
  const eqBaseUpdEq = (_aId, _id, k, v) => ebHook.updEq.mutate({ id: _id, campo: k, valor: +v || 0 });

  // ── Comps (Supabase per-session, local state for immediate UI feedback) ──
  const [comps, setComps] = useState([]);

  // Limpa comps ao trocar de sessão
  useEffect(() => { setComps([]); }, [activeSessionId]); // eslint-disable-line react-hooks/set-state-in-effect

  // Inicializa comps a partir do Supabase quando a query carregar
  useEffect(() => {
    if (compsHook.query.data) setComps(compsHook.query.data); // eslint-disable-line react-hooks/set-state-in-effect
  }, [compsHook.query.data]);

  // Keep comps length in sync with grupos count (handles async add/del)
  const prevGruposLenRef = useRef(0);
  useEffect(() => {
    const newLen = grupos.length;
    if (newLen === prevGruposLenRef.current) return;
    if (newLen > prevGruposLenRef.current) {
      setComps(prev => {
        if (prev.length >= newLen) return prev;
        return [...prev, ...Array(newLen - prev.length).fill(null).map(() => mkGrupoComps())];
      });
    } else {
      setComps(prev => prev.slice(0, newLen));
      if (gIdx >= newLen) setGIdx(Math.max(0, newLen - 1)); // eslint-disable-line react-hooks/set-state-in-effect
    }
    prevGruposLenRef.current = newLen;
  }, [grupos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const gc = (gi, aId) => comps[gi]?.[aId] || mkComp();
  const updateComp = (gi, aId, fn) => {
    const currentComp = comps[gi]?.[aId] || mkComp();
    const newComp = fn(currentComp);
    setComps(p => {
      const nc = [...p];
      nc[gi] = { ...nc[gi], [aId]: newComp };
      return nc;
    });
    const grupoId = grupos[gi]?.id;
    if (grupoId) compsHook.upsertDebounced(grupoId, aId, newComp);
  };

  const toggleReq = (gi, aId, reqId) => {
    const rid = String(reqId);
    updateComp(gi, aId, c => {
      const ids = (c.reqIds || []).map(String);
      return { ...c, reqIds: ids.includes(rid) ? ids.filter(id => id !== rid) : [...ids, rid] };
    });
  };

  const moAdd = (gi, aId, catId) => {
    const cat = MO_CAT.find(r => r.id === catId);
    if (!cat) return;
    updateComp(gi, aId, c => ({
      ...c,
      moRows: [...c.moRows, { _id: uid(), catId, cargo: cat.cargo, sal: cat.sal, qtd: 1, horasDia: 8.5 }]
    }));
  };
  const moDel = (gi, aId, _id) => updateComp(gi, aId, c => ({ ...c, moRows: c.moRows.filter(r => r._id !== _id) }));
  const moUpd = (gi, aId, _id, k, v) => updateComp(gi, aId, c => ({
    ...c, moRows: c.moRows.map(r => r._id === _id ? { ...r, [k]: +v || 0 } : r)
  }));

  const eqAdd = (gi, aId, catId) => {
    const cat = EQ_CAT.find(r => r.id === catId);
    if (!cat) return;
    updateComp(gi, aId, c => ({
      ...c,
      eqRows: [...c.eqRows, { _id: uid(), catId, nome: cat.nome, loc: cat.loc, qtd: 1, horasDia: 8.5 }]
    }));
  };
  const eqDel = (gi, aId, _id) => updateComp(gi, aId, c => ({ ...c, eqRows: c.eqRows.filter(r => r._id !== _id) }));
  const eqUpd = (gi, aId, _id, k, v) => updateComp(gi, aId, c => ({
    ...c, eqRows: c.eqRows.map(r => r._id === _id ? { ...r, [k]: +v || 0 } : r)
  }));

  const uKpi      = (gi, aId, v) => updateComp(gi, aId, c => ({ ...c, kpi: +v || 0 }));
  const uEq       = (gi, aId, v) => updateComp(gi, aId, c => ({ ...c, equipes: Math.max(1, +v || 1) }));
  const uMesInicia = (gi, aId, v) => updateComp(gi, aId, c => ({ ...c, mesInicia: +v || 0 }));

  // ── LT derived values ────────────────────────────────────────────────────
  const fator        = lt.circ === "duplo" ? 2 : 1;
  const totalCabos   = ((lt.cabFase || 0) * 3 + (lt.pararaios || 0) + (lt.opgw || 0)) * fator;
  const extCondutor  = (lt.ext || 0) * (lt.cabFase || 0) * 3 * fator;
  const extParaRaios = (lt.ext || 0) * (lt.pararaios || 0) * fator;

  // ── Calculations (unchanged logic) ───────────────────────────────────────
  const calcA      = (comp, esc) => calcABase(comp, esc);
  const calcSeg    = (gi) => calcSegBase(requisitos, (aId) => gc(gi, aId));
  const calcEfGrupo = (gi) => calcEficienciaGeral((aId) => gc(gi, aId), equipesBase, kpisBase);

  const PENALTY = { risco: 1.2, pior: 1.4 };

  const buildRank = () => {
    const res = grupos.map((g, i) => {
      const ef = calcEfGrupo(i);
      const ctBase = ATIVS.reduce((s, a) => {
        const c  = calcA(gc(i, a.id), volumesPrev[a.id] || 0);
        const pen = PENALTY[ef.porAtiv[a.id]?.impactoPrazo] ?? 1.0;
        return s + c.total * (c.durMeses > 0 ? c.durMeses * pen : 0);
      }, 0);
      const penSeg = calcNaoAplicPenaltyBase(requisitos, (aId) => gc(i, aId));
      const ct = ctBase * penSeg.fator;
      let dm;
      if (duracaoSomada) {
        dm = ATIVS.reduce((s, a) => {
          const c = calcA(gc(i, a.id), volumesPrev[a.id] || 0);
          const pen = PENALTY[ef.porAtiv[a.id]?.impactoPrazo] ?? 1.0;
          return s + c.dur * pen;
        }, 0);
      } else {
        const pts = ATIVS.map(a => {
          const comp = gc(i, a.id);
          const c = calcA(comp, volumesPrev[a.id] || 0);
          const pen = PENALTY[ef.porAtiv[a.id]?.impactoPrazo] ?? 1.0;
          if (c.dur <= 0) return null;
          const mes = comp.mesInicia > 0 ? comp.mesInicia : (mesIniciaBase[a.id] || 0);
          if (mes <= 0) return null;
          return { s: mes, e: mes + Math.ceil(c.dur * pen) - 1 };
        }).filter(Boolean);
        dm = pts.length
          ? Math.max(...pts.map(x => x.e)) - Math.min(...pts.map(x => x.s)) + 1
          : 0;
      }
      const seg = calcSeg(i);
      return { ...g, gi: i, ct, dm, seg: seg.score, desq: seg.desq, reprovado: seg.reprovado, missing: seg.missing, ef, penSeg };
    });
    const valid = res.filter(r => !r.desq);
    const mc = Math.min(...valid.map(r => r.ct).filter(v => v > 0), Infinity);
    const md = Math.min(...valid.map(r => r.dm).filter(v => v > 0), Infinity);
    return res.map(r => {
      const sC = r.ct > 0 ? Math.round(Math.min(100, (mc / r.ct) * 100)) : 0;
      const sD = r.dm > 0 ? Math.round(Math.min(100, (md / r.dm) * 100)) : 0;
      const sS = r.seg; // 100 (aprovado) ou 0 (desclassificado) — gate classificatório
      const total = r.desq ? 0 : Math.round(sC * .5 + sD * .5);
      return { ...r, sC, sD, sS, total };
    }).sort((a, b) => b.total - a.total);
  };

  const isLoading = sessionsHook.query.isLoading || ltHook.query.isLoading;

  return (
    <AppContext.Provider value={{
      screen, setScreen, role, setRole, gIdx, setGIdx, aTab, setATab,
      epiCargoAtivo, setEpiCargoAtivo,
      duracaoSomada, setDuracaoSomada,
      copyOptions, setCopyOptions,
      sessions, activeSessionId, setActiveSessionId, addSession, delSession, uSessionNome, sess,
      lt, uLt,
      grupos, addGrupo, uGrupo, delGrupo,
      kpisBase, setKpisBase,
      volumesPrev, setVolumesPrev,
      comentariosAtiv, setComentariosAtiv,
      mesIniciaBase, setMesIniciaBase,
      requisitos, addRequisito, delRequisito, updRequisito,
      epiCargo, togEpi,
      comps, gc, updateComp, toggleReq,
      moAdd, moDel, moUpd,
      eqAdd, eqDel, eqUpd,
      uKpi, uEq, uMesInicia,
      equipesBase,
      eqBaseAddMo, eqBaseDelMo, eqBaseUpdMo,
      eqBaseAddEq, eqBaseDelEq, eqBaseUpdEq,
      fator, totalCabos, extCondutor, extParaRaios,
      calcA, calcSeg, calcEfGrupo, buildRank,
      isLoading, realtimeConnected,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext); // eslint-disable-line react-refresh/only-export-components
