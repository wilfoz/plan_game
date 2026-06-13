import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ATIVS, MO_CAT, EQ_CAT, BASE_COMPOSITIONS, BASE_REQUIREMENTS, REQ_TRANSLATIONS } from "../constants/catalogs";
import { uid } from "../utils/formatters";
import { supabase } from "../lib/supabase";
import {
  calcA as calcABase,
  calcSeg as calcSegBase,
  calcNaoAplicPenalty as calcNaoAplicPenaltyBase,
  calcEficienciaGeral,
  CalcAResult,
  CalcSegResult,
  CalcEficienciaGeralResult,
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
import { Comp, GrupoComps, Grupo, LtConfig, Session, Requisito } from "../types";

const mkComp = (): Comp => ({ moRows: [], eqRows: [], reqIds: [], kpi: 0, equipes: 1, mesInicia: 0 });
const mkGrupoComps = (): GrupoComps => Object.fromEntries(ATIVS.map(a => [a.id, mkComp()]));
const mkEquipesBase = () => Object.fromEntries(ATIVS.map(a => [a.id, { moRows: [], eqRows: [] }]));
const EMPTY_LT: LtConfig = { nome: "", tensao: "500kV", ext: 0, circ: "simples", cabFase: 4, pararaios: 2, opgw: 1, travaEquipes: false };

interface AppContextType {
  screen: string;
  setScreen: (s: string) => void;
  role: "F" | "G" | "ADMIN" | null;
  setRole: (r: "F" | "G" | "ADMIN" | null) => void;
  activeEventId: string | null;
  setActiveEventId: (id: string | null) => void;
  activeEventNome: string | null;
  setActiveEventNome: (n: string | null) => void;
  adminToken: string | null;
  setAdminToken: (s: string | null) => void;
  logout: () => void;
  gIdx: number;
  setGIdx: (i: number) => void;
  aTab: string;
  setATab: (a: string) => void;
  epiCargoAtivo: string;
  setEpiCargoAtivo: (c: string) => void;
  duracaoSomada: boolean;
  setDuracaoSomada: (d: boolean) => void;
  travaEquipes: boolean;
  setTravaEquipes: (t: boolean | ((prev: boolean) => boolean)) => void;
  copyOptions: any;
  setCopyOptions: (o: any) => void;
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  addSession: (nome: string) => string;
  delSession: (id: string) => void;
  uSessionNome: (id: string, nome: string) => void;
  sess: Session | null;
  lt: LtConfig;
  uLt: (k: keyof LtConfig, v: any) => void;
  grupos: Grupo[];
  addGrupo: () => void;
  uGrupo: (id: string, k: string, v: any) => void;
  delGrupo: (gi: number) => void;
  kpisBase: Record<string, number>;
  setKpisBase: (fn: any) => void;
  volumesPrev: Record<string, number>;
  setVolumesPrev: (fn: any) => void;
  comentariosAtiv: Record<string, string>;
  setComentariosAtiv: (fn: any) => void;
  mesIniciaBase: Record<string, number>;
  setMesIniciaBase: (fn: any) => void;
  requisitos: Requisito[];
  addRequisito: (aId: string) => void;
  delRequisito: (_id: string) => void;
  updRequisito: (_id: string, k: string, v: any) => void;
  resetRequisitosToDefault: () => void;
  epiCargo: Record<string, Record<string, boolean>>;
  togEpi: (moId: string, epiId: string) => void;
  comps: GrupoComps[];
  gc: (gi: number, aId: string) => Comp;
  updateComp: (gi: number, aId: string, fn: (c: Comp) => Comp) => void;
  toggleReq: (gi: number, aId: string, reqId: string) => void;
  addAllReqs: (gi: number, aId: string) => void;
  moAdd: (gi: number, aId: string, catId: string) => void;
  moDel: (gi: number, aId: string, _id: string) => void;
  moUpd: (gi: number, aId: string, _id: string, k: string, v: any) => void;
  eqAdd: (gi: number, aId: string, catId: string) => void;
  eqDel: (gi: number, aId: string, _id: string) => void;
  eqUpd: (gi: number, aId: string, _id: string, k: string, v: any) => void;
  uKpi: (gi: number, aId: string, v: any) => void;
  uEq: (gi: number, aId: string, v: any) => void;
  uMesInicia: (gi: number, aId: string, v: any) => void;
  equipesBase: Record<string, { moRows: any[]; eqRows: any[] }>;
  eqBaseAddMo: (aId: string, catId: string) => void;
  eqBaseDelMo: (aId: string, _id: string) => void;
  eqBaseUpdMo: (aId: string, _id: string, k: string, v: any) => void;
  eqBaseAddEq: (aId: string, catId: string) => void;
  eqBaseDelEq: (aId: string, _id: string) => void;
  eqBaseUpdEq: (aId: string, _id: string, k: string, v: any) => void;
  fator: number;
  totalCabos: number;
  extCondutor: number;
  extParaRaios: number;
  escAutoMap: Record<string, number>;
  calcA: (comp: Comp, esc: number) => CalcAResult;
  calcSeg: (gi: number) => CalcSegResult;
  calcEfGrupo: (gi: number) => CalcEficienciaGeralResult;
  buildRank: () => any[];
  isLoading: boolean;
  realtimeConnected: boolean;
  lang: "pt" | "es";
  userSessions: any[];
  setUserSessions: (s: any[]) => void;
  cotacaoDolar: number;
  moCatalog: typeof MO_CAT;
  eqCatalog: typeof EQ_CAT;
  atividadesCatalog: typeof ATIVS;
  requisitosBaseCatalog: typeof BASE_REQUIREMENTS;
  formatCurrency: (v: number) => string;
  convertCurrency: (v: number) => number;
  reconvertCurrency: (v: number) => number;
  currencySymbol: string;
  translateRequisito: (descPT: string) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { i18n } = useTranslation();

  // Deriva idioma simples 'pt' ou 'es' para tradução estática baseada em catalogs.ts
  const lang: "pt" | "es" = i18n.language.startsWith("es") ? "es" : "pt";

  // ── UI state (restaurado do sessionStorage no mount) ────────────────────
  const _ss = (() => {
    try { return JSON.parse(sessionStorage.getItem("jlt_sess") ?? "null") ?? {}; }
    catch { return {}; }
  })();
  const [screen, setScreen]               = useState<string>(_ss.screen           ?? "login");
  const [role, setRole]                   = useState<"F" | "G" | "ADMIN" | null>(_ss.role              ?? null);
  const [gIdx, setGIdx]                   = useState<number>(_ss.gIdx              ?? 0);
  const [aTab, setATab]                   = useState<string>("a1");
  const [epiCargoAtivo, setEpiCargoAtivo] = useState<string>("mo1");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(_ss.activeSessionId ?? null);
  const [activeEventId, setActiveEventId] = useState<string | null>(_ss.activeEventId ?? null);
  const [activeEventNome, setActiveEventNome] = useState<string | null>(_ss.activeEventNome ?? null);
  const [adminToken, setAdminToken]       = useState<string | null>(_ss.adminToken ?? null);
  const [duracaoSomada, setDuracaoSomada] = useState<boolean>(true);
  const [copyOptions, setCopyOptions]     = useState<any>(null);
  const [userSessions, setUserSessions]   = useState<any[]>(_ss.userSessions ?? []);

  // ── Event Custom Catalogs & Currency Exchange ─────────────────────────────
  const { data: eventData } = useQuery({
    queryKey: ["event_data", activeEventId],
    queryFn: async () => {
      if (!activeEventId) return null;
      const { data, error } = await supabase
        .from("events")
        .select("cotacao_dolar")
        .eq("id", activeEventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!activeEventId,
  });
  const cotacaoDolar = eventData?.cotacao_dolar ?? 5.0;

  const { data: dbMoCat } = useQuery({
    queryKey: ["event_mo_cat", activeEventId],
    queryFn: async () => {
      if (!activeEventId) return null;
      const { data, error } = await supabase
        .from("event_mo_cat")
        .select("*")
        .eq("event_id", activeEventId);
      if (error) throw error;
      return data;
    },
    enabled: !!activeEventId,
  });
  const moCatalog = dbMoCat
    ? dbMoCat.map((m: any) => ({
        id: m.id,
        cargo: { pt: m.cargo_pt, es: m.cargo_es },
        sal: Number(m.sal),
      }))
    : MO_CAT;

  const { data: dbEqCat } = useQuery({
    queryKey: ["event_eq_cat", activeEventId],
    queryFn: async () => {
      if (!activeEventId) return null;
      const { data, error } = await supabase
        .from("event_eq_cat")
        .select("*")
        .eq("event_id", activeEventId);
      if (error) throw error;
      return data;
    },
    enabled: !!activeEventId,
  });
  const eqCatalog = dbEqCat
    ? dbEqCat.map((e: any) => ({
        id: e.id,
        nome: { pt: e.nome_pt, es: e.nome_es },
        loc: Number(e.loc),
      }))
    : EQ_CAT;

  const { data: dbAtividades } = useQuery({
    queryKey: ["event_atividades", activeEventId],
    queryFn: async () => {
      if (!activeEventId) return null;
      const { data, error } = await supabase
        .from("event_atividades")
        .select("*")
        .eq("event_id", activeEventId);
      if (error) throw error;
      return data;
    },
    enabled: !!activeEventId,
  });
  const atividadesCatalog = dbAtividades
    ? dbAtividades.map((a: any) => ({
        id: a.id,
        grp: a.grp,
        desc: { pt: a.desc_pt, es: a.desc_es },
        und: { pt: a.und_pt, es: a.und_es },
      }))
    : ATIVS;

  const { data: dbRequisitosBase } = useQuery({
    queryKey: ["event_requisitos_base", activeEventId],
    queryFn: async () => {
      if (!activeEventId) return null;
      const { data, error } = await supabase
        .from("event_requisitos_base")
        .select("*")
        .eq("event_id", activeEventId);
      if (error) throw error;
      return data;
    },
    enabled: !!activeEventId,
  });
  const requisitosBaseCatalog = dbRequisitosBase
    ? dbRequisitosBase.map((r: any) => ({
        aId: r.atividade_id,
        categoria: r.categoria,
        desc: r.descricao_pt,
        desc_es: r.descricao_es,
        aplicavel: r.aplicavel,
      }))
    : BASE_REQUIREMENTS;

  const currencySymbol = lang === "es" ? "$ " : "R$ ";

  const convertCurrency = (v: number): number => {
    if (lang === "es") return v / cotacaoDolar;
    return v;
  };

  const reconvertCurrency = (v: number): number => {
    if (lang === "es") return v * cotacaoDolar;
    return v;
  };

  const formatCurrency = (v: number): string => {
    const converted = convertCurrency(v);
    const locale = lang === "es" ? "es-US" : "pt-BR";
    return currencySymbol + converted.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const translateRequisito = (descPT: string): string => {
    if (lang === "es") {
      const dynReq = dbRequisitosBase?.find((r: any) => r.descricao_pt === descPT);
      if (dynReq) return dynReq.descricao_es;
      return REQ_TRANSLATIONS[descPT] || descPT;
    }
    return descPT;
  };

  // ── Supabase hooks ────────────────────────────────────────────────────────
  const sessionsHook = useSessions(activeEventId);
  const ltHook       = useLtConfig(activeSessionId);
  const ativHook     = useAtividadesConfig(activeSessionId);
  const ebHook       = useEquipeBase(activeSessionId);
  const gruposHook   = useGrupos(activeSessionId);
  const reqHook      = useRequisitos(activeSessionId);
  const epiHook      = useEpiCargo(activeSessionId);

  // ── Persistência de sessão (sessionStorage — apaga ao fechar a aba) ────────
  useEffect(() => {
    if (role) {
      sessionStorage.setItem("jlt_sess", JSON.stringify({
        role,
        gIdx,
        activeSessionId,
        screen,
        activeEventId,
        activeEventNome,
        adminToken,
        userSessions
      }));
    } else {
      sessionStorage.removeItem("jlt_sess");
    }
  }, [role, activeSessionId, gIdx, screen, activeEventId, activeEventNome, adminToken, userSessions]);

  const logout = () => {
    // Invalida a sessão admin no servidor (fire-and-forget) antes de limpar o cliente
    if (adminToken) {
      supabase.rpc("logout_admin_session", { p_token: adminToken }).then(undefined, () => { /* */ });
    }
    setRole(null);
    setActiveSessionId(null);
    setActiveEventId(null);
    setActiveEventNome(null);
    setAdminToken(null);
    setUserSessions([]);
    setScreen("login");
    sessionStorage.removeItem("jlt_sess");
  };

  // grupos precisa estar disponível antes de inicializar compsHook
  const grupos = gruposHook.query.data ?? [];
  const compsHook       = useGrupoComps(activeSessionId, grupos);
  const { connected: realtimeConnected } = useRealtimeComps(activeSessionId);

  // ── Sessions ─────────────────────────────────────────────────────────────
  const sessions = sessionsHook.query.data ?? [];
  const sess = sessions.find(s => s.id === activeSessionId) || null;

  const addSession = (nome: string) => {
    const id = uid();
    // Optimistically insert into cache so setActiveSessionId works immediately
    qc.setQueryData(["sessions", activeEventId], (old: any = []) => [
      ...old,
      { id, nome: nome || "Nova Sessão", created_at: new Date().toISOString(), event_id: activeEventId || undefined, grupos: [], lt: { nome: "" } },
    ]);
    sessionsHook.add.mutate({ id, nome: nome || "Nova Sessão", eventId: activeEventId });
    return id;
  };

  const delSession = (id: string) => {
    qc.setQueryData(["sessions", activeEventId], (old: any = []) => (old ?? []).filter((s: any) => s.id !== id));
    sessionsHook.remove.mutate(id);
  };

  const uSessionNome = (id: string, nome: string) => {
    qc.setQueryData(["sessions", activeEventId], (old: any = []) =>
      (old ?? []).map((s: any) => s.id === id ? { ...s, nome } : s)
    );
    sessionsHook.rename.mutate({ id, nome });
  };

  // ── LT (local state initialized from query, debounced Supabase save) ─────
  const [lt, setLt] = useState<LtConfig>(EMPTY_LT);
  useEffect(() => {
    if (ltHook.query.data) setLt(ltHook.query.data);
  }, [ltHook.query.data]);

  const uLt = (k: keyof LtConfig, v: any) => {
    const newLt = { ...lt, [k]: v };
    setLt(newLt);
    ltHook.upsertDebounced(newLt);
  };

  const travaEquipes    = lt.travaEquipes ?? false;
  const setTravaEquipes = (v: boolean | ((prev: boolean) => boolean)) => uLt("travaEquipes", typeof v === "function" ? v(travaEquipes) : v);

  // ── LT derived values ────────────────────────────────────────────────────
  const fator        = lt.circ === "duplo" ? 2 : 1;
  const totalCabos   = ((lt.cabFase || 0) * 3 + (lt.pararaios || 0) + (lt.opgw || 0)) * fator;
  const extCondutor  = (lt.ext || 0) * (lt.cabFase || 0) * 3 * fator;
  const extParaRaios = (lt.ext || 0) * (lt.pararaios || 0) * fator;
  const escAutoMap: Record<string, number> = { a5: extParaRaios, a6: extCondutor };

  // ── Atividades config (local state + debounced Supabase) ─────────────────
  const [ativLocal, setAtivLocalState] = useState<Record<string, any>>({});
  const ativLocalRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (ativHook.query.data) {
      ativLocalRef.current = ativHook.query.data;
      setAtivLocalState(ativHook.query.data);
    }
  }, [ativHook.query.data]);

  const kpisBase        = Object.fromEntries(ATIVS.map(a => [a.id, ativLocal[a.id]?.kpiBase      ?? 0]));
  const volumesPrev     = Object.fromEntries(ATIVS.map(a => {
    const manual = ativLocal[a.id]?.volumePrev ?? 0;
    return [a.id, manual > 0 ? manual : (escAutoMap[a.id] ?? 0)];
  }));
  const comentariosAtiv = Object.fromEntries(ATIVS.map(a => [a.id, ativLocal[a.id]?.comentario   ?? ""]));
  const mesIniciaBase   = Object.fromEntries(ATIVS.map(a => [a.id, ativLocal[a.id]?.mesIniciaBase ?? 0]));

  const _saveAtiv = (ativId: string, current: Record<string, any>) => {
    const d = current[ativId] ?? { kpiBase: 0, volumePrev: 0, comentario: "", mesIniciaBase: 0 };
    ativHook.upsertDebounced(ativId, { kpiBase: d.kpiBase, volumePrev: d.volumePrev, comentario: d.comentario, mesIniciaBase: d.mesIniciaBase ?? 0 });
  };

  const setKpisBase = (fn: any) => {
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

  const setVolumesPrev = (fn: any) => {
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

  const setComentariosAtiv = (fn: any) => {
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

  const setMesIniciaBase = (fn: any) => {
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
  };

  const uGrupo = (id: string, k: string, v: any) => gruposHook.update.mutate({ id, campo: k, valor: v });

  const delGrupo = (gi: number) => {
    if (grupos.length <= 1) return;
    gruposHook.remove.mutate(grupos[gi].id);
  };

  // ── Requisitos ────────────────────────────────────────────────────────────
  const requisitos = reqHook.query.data ?? [];
  const addRequisito = (aId: string) => reqHook.add.mutate({ ativId: aId });
  const delRequisito = (_id: string) => reqHook.remove.mutate(_id);
  const updRequisito = (_id: string, k: string, v: any) => reqHook.update.mutate({ id: _id, campo: k, valor: v });
  const resetRequisitosToDefault = () => {
    if (!activeSessionId) return;
    reqHook.resetToDefault.mutate(
      requisitosBaseCatalog.map(r => ({
        session_id:   activeSessionId,
        atividade_id: r.aId,
        categoria:    r.categoria,
        descricao:    r.desc,
        aplicavel:    r.aplicavel,
      }))
    );
  };

  // ── EPI ───────────────────────────────────────────────────────────────────
  const epiCargo = epiHook.query.data ?? {};
  const togEpi = (moId: string, epiId: string) => epiHook.toggle.mutate({ moCatId: moId, epiCatId: epiId });

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

    const moRows: any[] = [];
    const eqRows: any[] = [];
    Object.entries(BASE_COMPOSITIONS).forEach(([aId, bc]) => {
      bc.moRows.forEach(r => {
        const moItem = moCatalog.find(m => m.id === r.catId);
        moRows.push({
          session_id: activeSessionId, atividade_id: aId,
          cat_id: r.catId, cargo: moItem ? moItem.cargo.pt : r.cargo, sal: moItem ? moItem.sal : r.sal, qtd: r.qtd, horas_dia: r.horasDia,
          obrigatorio: r.obrigatorio ?? false,
          min_var_pct: r.minVarPct ?? null,
        });
      });
      bc.eqRows.forEach(r => {
        const eqItem = eqCatalog.find(e => e.id === r.catId);
        eqRows.push({
          session_id: activeSessionId, atividade_id: aId,
          cat_id: r.catId, nome: eqItem ? eqItem.nome.pt : r.nome, loc: eqItem ? eqItem.loc : r.loc, qtd: r.qtd, horas_dia: r.horasDia,
          obrigatorio: r.obrigatorio ?? false,
        });
      });
    });
    ebHook.seedAll.mutate({ moRows, eqRows });

    setKpisBase(Object.fromEntries(
      atividadesCatalog.map(a => {
        const dbAtiv = dbAtividades?.find((da: any) => da.id === a.id);
        return [a.id, dbAtiv ? dbAtiv.kpi_base : (BASE_COMPOSITIONS[a.id as keyof typeof BASE_COMPOSITIONS]?.kpi || 0)];
      })
    ));

    reqHook.seedAll.mutate(requisitosBaseCatalog.map(r => ({
      session_id:   activeSessionId,
      atividade_id: r.aId,
      categoria:    r.categoria,
      descricao:    r.desc,
      aplicavel:    r.aplicavel,
    })));
  }, [activeSessionId, ebHook.query.isLoading, ebHook.query.data, ativHook.query.isLoading, reqHook.query.isLoading, reqHook.query.data]);

  const eqBaseAddMo = (aId: string, catId: string) => {
    const cat = moCatalog.find(r => r.id === catId);
    if (!cat) return;
    ebHook.addMo.mutate({ ativId: aId, catId, cargo: cat.cargo.pt, sal: cat.sal, qtd: 1, horasDia: 8.5, obrigatorio: false, minVarPct: null });
  };
  const eqBaseDelMo = (_aId: string, _id: string) => ebHook.delMo.mutate(_id);
  const eqBaseUpdMo = (_aId: string, _id: string, k: string, v: any) => ebHook.updMo.mutate({ id: _id, campo: k, valor: k === "obrigatorio" ? !!v : (k === "minVarPct" ? (v === "" || v === null ? null : +v) : +v || 0) });

  const eqBaseAddEq = (aId: string, catId: string) => {
    const cat = eqCatalog.find(r => r.id === catId);
    if (!cat) return;
    ebHook.addEq.mutate({ ativId: aId, catId, nome: cat.nome.pt, loc: cat.loc, qtd: 1, horasDia: 8.5, obrigatorio: false });
  };
  const eqBaseDelEq = (_aId: string, _id: string) => ebHook.delEq.mutate(_id);
  const eqBaseUpdEq = (_aId: string, _id: string, k: string, v: any) => ebHook.updEq.mutate({ id: _id, campo: k, valor: k === "obrigatorio" ? !!v : +v || 0 });

  // ── Comps (Supabase per-session, local state for immediate UI feedback) ──
  const [comps, setComps] = useState<GrupoComps[]>([]);

  // Limpa comps ao trocar de sessão
  useEffect(() => { setComps([]); }, [activeSessionId]);

  // Inicializa comps a partir do Supabase quando a query carregar
  useEffect(() => {
    if (compsHook.query.data) setComps(compsHook.query.data);
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
      if (gIdx >= newLen) setGIdx(Math.max(0, newLen - 1));
    }
    prevGruposLenRef.current = newLen;
  }, [grupos.length]);

  const gc = (gi: number, aId: string) => comps[gi]?.[aId] || mkComp();
  const updateComp = (gi: number, aId: string, fn: (c: Comp) => Comp) => {
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

  const toggleReq = (gi: number, aId: string, reqId: string) => {
    const rid = String(reqId);
    updateComp(gi, aId, c => {
      const ids = (c.reqIds || []).map(String);
      return { ...c, reqIds: ids.includes(rid) ? ids.filter(id => id !== rid) : [...ids, rid] };
    });
  };

  const addAllReqs = (gi: number, aId: string) => {
    const allIds = requisitos.filter(r => r.aId === aId).map(r => String(r._id));
    updateComp(gi, aId, c => ({ ...c, reqIds: allIds }));
  };

  const moAdd = (gi: number, aId: string, catId: string) => {
    const cat = moCatalog.find(r => r.id === catId);
    if (!cat) return;
    updateComp(gi, aId, c => ({
      ...c,
      moRows: [...c.moRows, { _id: uid(), catId, cargo: cat.cargo.pt, sal: cat.sal, qtd: 1, horasDia: 8.5 }]
    }));
  };
  const moDel = (gi: number, aId: string, _id: string) => updateComp(gi, aId, c => ({ ...c, moRows: c.moRows.filter(r => r._id !== _id) }));
  const moUpd = (gi: number, aId: string, _id: string, k: string, v: any) => updateComp(gi, aId, c => ({
    ...c, moRows: c.moRows.map(r => r._id === _id ? { ...r, [k]: +v || 0 } : r)
  }));

  const eqAdd = (gi: number, aId: string, catId: string) => {
    const cat = eqCatalog.find(r => r.id === catId);
    if (!cat) return;
    updateComp(gi, aId, c => ({
      ...c,
      eqRows: [...c.eqRows, { _id: uid(), catId, nome: cat.nome.pt, loc: cat.loc, qtd: 1, horasDia: 8.5 }]
    }));
  };
  const eqDel = (gi: number, aId: string, _id: string) => updateComp(gi, aId, c => ({ ...c, eqRows: c.eqRows.filter(r => r._id !== _id) }));
  const eqUpd = (gi: number, aId: string, _id: string, k: string, v: any) => updateComp(gi, aId, c => ({
    ...c, eqRows: c.eqRows.map(r => r._id === _id ? { ...r, [k]: +v || 0 } : r)
  }));

  const uKpi      = (gi: number, aId: string, v: any) => updateComp(gi, aId, c => ({ ...c, kpi: +v || 0 }));
  const uEq       = (gi: number, aId: string, v: any) => updateComp(gi, aId, c => ({ ...c, equipes: Math.max(1, +v || 1) }));
  const uMesInicia = (gi: number, aId: string, v: any) => updateComp(gi, aId, c => ({ ...c, mesInicia: +v || 0 }));

  // ── Calculations ─────────────────────────────────────────────────────────
  const calcA      = (comp: Comp, esc: number) => calcABase(comp, esc);
  const calcSeg    = (gi: number) => calcSegBase(requisitos, (aId) => gc(gi, aId));
  const calcEfGrupo = (gi: number) => calcEficienciaGeral((aId) => gc(gi, aId), equipesBase, kpisBase);

  const PENALTY: Record<string, number> = { risco: 1.2, pior: 1.4 };

  const buildRank = () => {
    const getCompEff = (i: number, aId: string) => {
      const comp = gc(i, aId);
      const hasRes = comp.moRows.length > 0 || comp.eqRows.length > 0 || comp.kpi > 0;
      const kpiEff = hasRes ? (comp.kpi > 0 ? comp.kpi : kpisBase[aId] || 0) : 0;
      const eqEff = travaEquipes ? 1 : (comp.equipes || 1);
      return { ...comp, kpi: kpiEff, equipes: eqEff };
    };

    const res = grupos.map((g, i) => {
      const ef = calcEfGrupo(i);
      const ctBase = ATIVS.reduce((s, a) => {
        const c  = calcA(getCompEff(i, a.id), volumesPrev[a.id] || 0);
        const pen = PENALTY[ef.porAtiv[a.id]?.impactoPrazo ?? ""] ?? 1.0;
        return s + c.total * (c.durMeses > 0 ? c.durMeses * pen * c.fatorMobilizacao : 0);
      }, 0);
      const penSeg = calcNaoAplicPenaltyBase(requisitos, (aId) => gc(i, aId));
      const ct = ctBase * penSeg.fator;
      let dm;
      if (duracaoSomada) {
        dm = ATIVS.reduce((s, a) => {
          const c   = calcA(getCompEff(i, a.id), volumesPrev[a.id] || 0);
          const pen = PENALTY[ef.porAtiv[a.id]?.impactoPrazo ?? ""] ?? 1.0;
          return s + c.dur * pen;
        }, 0);
      } else {
        const pts = ATIVS.map(a => {
          const compEff = getCompEff(i, a.id);
          const c   = calcA(compEff, volumesPrev[a.id] || 0);
          if (c.dur <= 0) return null;
          const pen = PENALTY[ef.porAtiv[a.id]?.impactoPrazo ?? ""] ?? 1.0;
          const mes = compEff.mesInicia > 0 ? compEff.mesInicia : (mesIniciaBase[a.id] > 0 ? mesIniciaBase[a.id] : 1);
          return { s: mes, e: mes + Math.ceil(c.dur * pen) - 1 };
        }).filter(Boolean) as { s: number; e: number }[];
        dm = pts.length
          ? Math.max(...pts.map(x => x.e)) - Math.min(...pts.map(x => x.s)) + 1
          : 0;
      }
      const seg = calcSeg(i);
      const atvsVazias = ATIVS.filter(a => {
        const comp = gc(i, a.id);
        return !(comp.moRows?.length > 0 || comp.eqRows?.length > 0 || comp.kpi > 0);
      }).map(a => a.id);
      const desqIncompleto = atvsVazias.length > 0;
      return { ...g, gi: i, ct, dm, seg: seg.score, desq: seg.desq, reprovado: seg.reprovado, missing: seg.missing, ef, penSeg, desqIncompleto, atvsVazias };
    });
    // Apenas equipes com todas as atividades preenchidas entram no cálculo de referência (mc/md)
    const valid = res.filter(r => !r.desq && !r.desqIncompleto);
    const mc = Math.min(...valid.map(r => r.ct).filter(v => v > 0), Infinity);
    const md = Math.min(...valid.map(r => r.dm).filter(v => v > 0), Infinity);
    return res.map(r => {
      const isOut = r.desq || r.desqIncompleto;
      const sC = !isOut && r.ct > 0 ? Math.round(Math.min(100, (mc / r.ct) * 100)) : 0;
      const sD = !isOut && r.dm > 0 ? Math.round(Math.min(100, (md / r.dm) * 100)) : 0;
      const sS = r.seg; // 100 (aprovado) ou 0 (desclassificado) — gate classificatório
      const total = isOut ? 0 : Math.round(sC * .5 + sD * .5);
      return { ...r, sC, sD, sS, total };
    }).sort((a, b) => b.total - a.total);
  };

  const isLoading = sessionsHook.query.isLoading || ltHook.query.isLoading;

  return (
    <AppContext.Provider value={{
      screen, setScreen, role, setRole, gIdx, setGIdx, aTab, setATab,
      activeEventId, setActiveEventId, activeEventNome, setActiveEventNome,
      adminToken, setAdminToken, logout,
      epiCargoAtivo, setEpiCargoAtivo,
      duracaoSomada, setDuracaoSomada,
      travaEquipes, setTravaEquipes,
      copyOptions, setCopyOptions,
      sessions, activeSessionId, setActiveSessionId, addSession, delSession, uSessionNome, sess,
      lt, uLt,
      grupos, addGrupo, uGrupo, delGrupo,
      kpisBase, setKpisBase,
      volumesPrev, setVolumesPrev,
      comentariosAtiv, setComentariosAtiv,
      mesIniciaBase, setMesIniciaBase,
      requisitos, addRequisito, delRequisito, updRequisito, resetRequisitosToDefault,
      epiCargo, togEpi,
      comps, gc, updateComp, toggleReq, addAllReqs,
      moAdd, moDel, moUpd,
      eqAdd, eqDel, eqUpd,
      uKpi, uEq, uMesInicia,
      equipesBase,
      eqBaseAddMo, eqBaseDelMo, eqBaseUpdMo,
      eqBaseAddEq, eqBaseDelEq, eqBaseUpdEq,
      fator, totalCabos, extCondutor, extParaRaios, escAutoMap,
      calcA, calcSeg, calcEfGrupo, buildRank,
      isLoading, realtimeConnected,
      lang,
      userSessions, setUserSessions,
      cotacaoDolar,
      moCatalog,
      eqCatalog,
      atividadesCatalog,
      requisitosBaseCatalog,
      formatCurrency,
      convertCurrency,
      reconvertCurrency,
      currencySymbol,
      translateRequisito,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
