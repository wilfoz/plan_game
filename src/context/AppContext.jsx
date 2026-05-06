import { createContext, useContext, useState } from "react";
import { ATIVS, MO_CAT, EQ_CAT } from "../constants/catalogs";
import { uid } from "../utils/formatters";
import { calcA as calcABase, calcSeg as calcSegBase } from "../utils/calculations";

const mkComp = () => ({
  moRows: [], eqRows: [], reqIds: [],
  verbas: { ferramentas: 0, materiais: 0 }, kpi: 0, equipes: 1
});
const mkGrupoComps = () => Object.fromEntries(ATIVS.map(a => [a.id, mkComp()]));

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [screen, setScreen] = useState("intro");
  const [role, setRole] = useState(null);
  const [gIdx, setGIdx] = useState(0);
  const [aTab, setATab] = useState("a1");
  const [epiCargoAtivo, setEpiCargoAtivo] = useState("mo1");

  const [lt, setLt] = useState({
    nome: "LT 500 kV Norte — Trecho 01", tensao: "500kV",
    ext: 120, circ: "simples", cabFase: 4, pararaios: 2, opgw: 1
  });
  const [torres, setTorres] = useState({
    crossrope: { qtd: 10, ton: 280 }, suspensao: { qtd: 20, ton: 180 },
    ancoragem: { qtd: 10, ton: 320 }, estaiada: { qtd: 10, ton: 420 },
  });
  const uLt = (k, v) => setLt(p => ({ ...p, [k]: v }));
  const uTorre = (t, k, v) => setTorres(p => ({ ...p, [t]: { ...p[t], [k]: +v || 0 } }));

  const [grupos, setGrupos] = useState([
    { id: "g1", nome: "Grupo A", resp: "" },
    { id: "g2", nome: "Grupo B", resp: "" }
  ]);
  const [comps, setComps] = useState([mkGrupoComps(), mkGrupoComps()]);

  const addGrupo = () => {
    setGrupos(p => [...p, { id: "g" + (p.length + 1), nome: `Grupo ${String.fromCharCode(65 + p.length)}`, resp: "" }]);
    setComps(p => [...p, mkGrupoComps()]);
  };
  const uGrupo = (id, k, v) => setGrupos(p => p.map(g => g.id === id ? { ...g, [k]: v } : g));
  const delGrupo = (gi) => {
    if (grupos.length <= 1) return;
    setGrupos(p => p.filter((_, i) => i !== gi));
    setComps(p => p.filter((_, i) => i !== gi));
    if (gIdx >= grupos.length - 1) setGIdx(Math.max(0, grupos.length - 2));
  };

  const [kpisBase, setKpisBase] = useState(Object.fromEntries(ATIVS.map(a => [a.id, 0])));

  const [requisitos, setRequisitos] = useState([]);
  const addRequisito = (aId) => {
    setRequisitos(p => [...p, { _id: uid(), aId, categoria: "Procedimento", desc: "", tempo: 0, score: 50 }]);
  };
  const delRequisito = (_id) => setRequisitos(p => p.filter(r => r._id !== _id));
  const updRequisito = (_id, k, v) => setRequisitos(p => p.map(r => r._id === _id ? { ...r, [k]: v } : r));

  const [epiCargo, setEpiCargo] = useState({});
  const togEpi = (moId, epiId) =>
    setEpiCargo(p => ({ ...p, [moId]: { ...(p[moId] || {}), [epiId]: !(p[moId] || {})[epiId] } }));

  const gc = (gi, aId) => comps[gi]?.[aId] || mkComp();

  const updateComp = (gi, aId, fn) => setComps(p => {
    const n = [...p];
    n[gi] = { ...n[gi], [aId]: fn(n[gi]?.[aId] || mkComp()) };
    return n;
  });

  const toggleReq = (gi, aId, reqId) => updateComp(gi, aId, c => ({
    ...c,
    reqIds: (c.reqIds || []).includes(reqId)
      ? (c.reqIds || []).filter(id => id !== reqId)
      : [...(c.reqIds || []), reqId]
  }));

  const moAdd = (gi, aId, catId) => {
    const cat = MO_CAT.find(r => r.id === catId);
    if (!cat) return;
    updateComp(gi, aId, c => ({
      ...c,
      moRows: [...c.moRows, { _id: uid(), catId, cargo: cat.cargo, sal: cat.sal, qtd: 1, alim: 63.53, aloj: 19.09, saude: 0.77, folgas: 12.20 }]
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

  const uVb = (gi, aId, k, v) => updateComp(gi, aId, c => ({ ...c, verbas: { ...c.verbas, [k]: +v || 0 } }));
  const uKpi = (gi, aId, v) => updateComp(gi, aId, c => ({ ...c, kpi: +v || 0 }));
  const uEq = (gi, aId, v) => updateComp(gi, aId, c => ({ ...c, equipes: Math.max(1, +v || 1) }));

  const fator = lt.circ === "duplo" ? 2 : 1;
  const totalCabos = (lt.cabFase * 3 + lt.pararaios + lt.opgw) * fator;
  const extCondutor = lt.ext * lt.cabFase * 3 * fator;
  const totalTorres = Object.values(torres).reduce((s, t) => s + t.qtd, 0);
  const tonTotal = Object.values(torres).reduce((s, t) => s + t.ton, 0);
  const ESC = {
    ext: lt.ext, extCondutor, totalTorres,
    tonEstaiada: torres.estaiada.ton, qtdEstaiada: torres.estaiada.qtd,
    tonCrossrope: torres.crossrope.ton, qtdCrossrope: torres.crossrope.qtd,
    tonAuto: torres.suspensao.ton + torres.ancoragem.ton,
  };

  const calcA = (comp, esc, aId) => calcABase(comp, esc, aId, requisitos);
  const calcSeg = (gi) => calcSegBase(requisitos, (aId) => gc(gi, aId));

  const buildRank = () => {
    const res = grupos.map((g, i) => {
      const ct = ATIVS.reduce((s, a) => s + calcA(gc(i, a.id), ESC[a.eKey] || 0, a.id).total, 0);
      const dm = Math.max(0, ...ATIVS.map(a => calcA(gc(i, a.id), ESC[a.eKey] || 0, a.id).dur));
      return { ...g, gi: i, ct, dm, seg: calcSeg(i) };
    });
    const mc = Math.min(...res.map(r => r.ct).filter(v => v > 0), Infinity);
    const md = Math.min(...res.map(r => r.dm).filter(v => v > 0), Infinity);
    return res.map(r => {
      const sC = r.ct > 0 ? Math.round(Math.min(100, (mc / r.ct) * 100)) : 0;
      const sD = r.dm > 0 ? Math.round(Math.min(100, (md / r.dm) * 100)) : 0;
      const sS = r.seg;
      return { ...r, sC, sD, sS, total: Math.round(sC * .3 + sD * .3 + sS * .4), desq: sS < 70 };
    }).sort((a, b) => b.total - a.total);
  };

  return (
    <AppContext.Provider value={{
      screen, setScreen, role, setRole, gIdx, setGIdx, aTab, setATab,
      epiCargoAtivo, setEpiCargoAtivo,
      lt, torres, uLt, uTorre,
      grupos, addGrupo, uGrupo, delGrupo,
      kpisBase, setKpisBase,
      requisitos, addRequisito, delRequisito, updRequisito,
      epiCargo, togEpi,
      comps, gc, updateComp, toggleReq,
      moAdd, moDel, moUpd,
      eqAdd, eqDel, eqUpd,
      uVb, uKpi, uEq,
      ESC, fator, totalCabos, extCondutor, totalTorres, tonTotal,
      calcA, calcSeg, buildRank
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
