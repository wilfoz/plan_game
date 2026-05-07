import { createContext, useContext, useState, useEffect } from "react";
import { ATIVS, MO_CAT, EQ_CAT } from "../constants/catalogs";
import { uid } from "../utils/formatters";
import { calcA as calcABase, calcSeg as calcSegBase, DIAS_MES } from "../utils/calculations";

const mkComp = () => ({
  moRows: [], eqRows: [], reqIds: [],
  kpi: 0, equipes: 1
});
const mkGrupoComps = () => Object.fromEntries(ATIVS.map(a => [a.id, mkComp()]));

const mkSession = (nome) => ({
  id: uid(),
  nome: nome || "Nova Sessão",
  lt: { nome: "", tensao: "500kV", ext: 0, circ: "simples", cabFase: 4, pararaios: 2, opgw: 1 },
  grupos: [],
  comps: [],
  kpisBase: Object.fromEntries(ATIVS.map(a => [a.id, 0])),
  volumesPrev: Object.fromEntries(ATIVS.map(a => [a.id, 0])),
  comentariosAtiv: Object.fromEntries(ATIVS.map(a => [a.id, ""])),
  requisitos: [],
  epiCargo: {},
});

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [screen, setScreen] = useState("login");
  const [role, setRole] = useState(null);
  const [gIdx, setGIdx] = useState(0);
  const [aTab, setATab] = useState("a1");
  const [epiCargoAtivo, setEpiCargoAtivo] = useState("mo1");

  const [sessions, setSessions] = useState(() => {
    try {
      const raw = localStorage.getItem("jornadas_lt_sessions");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("jornadas_lt_sessions", JSON.stringify(sessions)); }
    catch { /* quota exceeded */ }
  }, [sessions]);

  const sess = sessions.find(s => s.id === activeSessionId) || null;
  const upd = fn => setSessions(p => p.map(s => s.id === activeSessionId ? fn(s) : s));

  // Sessions CRUD
  const addSession = (nome) => {
    const s = mkSession(nome);
    setSessions(p => [...p, s]);
    return s.id;
  };
  const delSession = (id) => setSessions(p => p.filter(s => s.id !== id));
  const uSessionNome = (id, nome) => setSessions(p => p.map(s => s.id === id ? { ...s, nome } : s));

  // LT
  const _emptyLt = { nome: "", tensao: "500kV", ext: 0, circ: "simples", cabFase: 4, pararaios: 2, opgw: 1 };
  const lt = sess?.lt ?? _emptyLt;
  const uLt = (k, v) => upd(s => ({ ...s, lt: { ...s.lt, [k]: v } }));

  // Grupos
  const grupos = sess?.grupos ?? [];
  const comps = sess?.comps ?? [];
  const addGrupo = () => upd(s => ({
    ...s,
    grupos: [...s.grupos, { id: String(uid()), nome: `Grupo ${String.fromCharCode(65 + s.grupos.length)}`, resp: "", senha: "" }],
    comps: [...s.comps, mkGrupoComps()]
  }));
  const uGrupo = (id, k, v) => upd(s => ({ ...s, grupos: s.grupos.map(g => g.id === id ? { ...g, [k]: v } : g) }));
  const delGrupo = (gi) => {
    if (grupos.length <= 1) return;
    upd(s => ({
      ...s,
      grupos: s.grupos.filter((_, i) => i !== gi),
      comps: s.comps.filter((_, i) => i !== gi)
    }));
    if (gIdx >= grupos.length - 1) setGIdx(Math.max(0, grupos.length - 2));
  };

  // KPIs
  const kpisBase = sess?.kpisBase ?? Object.fromEntries(ATIVS.map(a => [a.id, 0]));
  const setKpisBase = (fn) => upd(s => ({ ...s, kpisBase: typeof fn === "function" ? fn(s.kpisBase) : fn }));

  // Volumes Previstos e Comentários
  const volumesPrev = sess?.volumesPrev ?? Object.fromEntries(ATIVS.map(a => [a.id, 0]));
  const setVolumesPrev = (fn) => upd(s => ({ ...s, volumesPrev: typeof fn === "function" ? fn(s.volumesPrev) : fn }));

  const comentariosAtiv = sess?.comentariosAtiv ?? Object.fromEntries(ATIVS.map(a => [a.id, ""]));
  const setComentariosAtiv = (fn) => upd(s => ({ ...s, comentariosAtiv: typeof fn === "function" ? fn(s.comentariosAtiv) : fn }));

  // Requisitos
  const requisitos = sess?.requisitos ?? [];
  const addRequisito = (aId) => upd(s => ({
    ...s, requisitos: [...s.requisitos, { _id: uid(), aId, categoria: "Procedimento", desc: "", aplicavel: true }]
  }));
  const delRequisito = (_id) => upd(s => ({ ...s, requisitos: s.requisitos.filter(r => r._id !== _id) }));
  const updRequisito = (_id, k, v) => upd(s => ({
    ...s, requisitos: s.requisitos.map(r => r._id === _id ? { ...r, [k]: v } : r)
  }));

  // EPI
  const epiCargo = sess?.epiCargo ?? {};
  const togEpi = (moId, epiId) => upd(s => ({
    ...s,
    epiCargo: { ...s.epiCargo, [moId]: { ...(s.epiCargo[moId] || {}), [epiId]: !(s.epiCargo[moId] || {})[epiId] } }
  }));

  // Composições
  const gc = (gi, aId) => comps[gi]?.[aId] || mkComp();
  const updateComp = (gi, aId, fn) => upd(s => {
    const nc = [...s.comps];
    nc[gi] = { ...nc[gi], [aId]: fn(nc[gi]?.[aId] || mkComp()) };
    return { ...s, comps: nc };
  });

  const toggleReq = (gi, aId, reqId) => {
    const rid = +reqId;
    updateComp(gi, aId, c => {
      const ids = (c.reqIds || []).map(Number);
      return {
        ...c,
        reqIds: ids.includes(rid) ? ids.filter(id => id !== rid) : [...ids, rid]
      };
    });
  };

  const moAdd = (gi, aId, catId) => {
    const cat = MO_CAT.find(r => r.id === catId);
    if (!cat) return;
    updateComp(gi, aId, c => ({
      ...c,
      moRows: [...c.moRows, { _id: uid(), catId, cargo: cat.cargo, sal: cat.sal, qtd: 1 }]
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
      eqRows: [...c.eqRows, { _id: uid(), catId, nome: cat.nome, loc: cat.loc, qtd: 1 }]
    }));
  };
  const eqDel = (gi, aId, _id) => updateComp(gi, aId, c => ({ ...c, eqRows: c.eqRows.filter(r => r._id !== _id) }));
  const eqUpd = (gi, aId, _id, k, v) => updateComp(gi, aId, c => ({
    ...c, eqRows: c.eqRows.map(r => r._id === _id ? { ...r, [k]: +v || 0 } : r)
  }));

  const uKpi = (gi, aId, v) => updateComp(gi, aId, c => ({ ...c, kpi: +v || 0 }));
  const uEq = (gi, aId, v) => updateComp(gi, aId, c => ({ ...c, equipes: Math.max(1, +v || 1) }));

  // Valores derivados da LT (independentes de torres)
  const fator = lt.circ === "duplo" ? 2 : 1;
  const totalCabos = ((lt.cabFase || 0) * 3 + (lt.pararaios || 0) + (lt.opgw || 0)) * fator;
  const extCondutor = (lt.ext || 0) * (lt.cabFase || 0) * 3 * fator;

  const calcA = (comp, esc) => calcABase(comp, esc);
  const calcSeg = (gi) => calcSegBase(requisitos, (aId) => gc(gi, aId));

  const buildRank = () => {
    const res = grupos.map((g, i) => {
      const ct = ATIVS.reduce((s, a) => s + calcA(gc(i, a.id), volumesPrev[a.id] || 0).total, 0);
      const dm = Math.max(0, ...ATIVS.map(a => calcA(gc(i, a.id), volumesPrev[a.id] || 0).dur));
      const seg = calcSeg(i);
      return { ...g, gi: i, ct, dm, seg: seg.score, desq: seg.desq, missing: seg.missing };
    });
    const valid = res.filter(r => !r.desq);
    const mc = Math.min(...valid.map(r => r.ct).filter(v => v > 0), Infinity);
    const md = Math.min(...valid.map(r => r.dm).filter(v => v > 0), Infinity);
    return res.map(r => {
      const sC = r.ct > 0 ? Math.round(Math.min(100, (mc / r.ct) * 100)) : 0;
      const sD = r.dm > 0 ? Math.round(Math.min(100, (md / r.dm) * 100)) : 0;
      const sS = r.seg;
      const total = r.desq ? 0 : Math.round(sC * .3 + sD * .3 + sS * .4);
      return { ...r, sC, sD, sS, total };
    }).sort((a, b) => b.total - a.total);
  };

  return (
    <AppContext.Provider value={{
      screen, setScreen, role, setRole, gIdx, setGIdx, aTab, setATab,
      epiCargoAtivo, setEpiCargoAtivo,
      sessions, activeSessionId, setActiveSessionId, addSession, delSession, uSessionNome, sess,
      lt, uLt,
      grupos, addGrupo, uGrupo, delGrupo,
      kpisBase, setKpisBase,
      volumesPrev, setVolumesPrev,
      comentariosAtiv, setComentariosAtiv,
      requisitos, addRequisito, delRequisito, updRequisito,
      epiCargo, togEpi,
      comps, gc, updateComp, toggleReq,
      moAdd, moDel, moUpd,
      eqAdd, eqDel, eqUpd,
      uKpi, uEq,
      fator, totalCabos, extCondutor,
      calcA, calcSeg, buildRank
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
