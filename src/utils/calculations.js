import { ATIVS } from "../constants/catalogs";

export const DIAS_MES = 22;

export const calcA = (comp, esc) => {
  const moT = r => r.sal * r.qtd;
  const custoMo = comp.moRows.reduce((s, r) => s + moT(r), 0);
  const custoEq = comp.eqRows.reduce((s, r) => s + (r.loc * r.qtd), 0);
  const total = custoMo + custoEq;

  const durDias = comp.kpi && esc && comp.equipes ? esc / (comp.equipes * comp.kpi) : 0;
  const durMeses = durDias > 0 ? durDias / DIAS_MES : 0;
  const moQtd = comp.moRows.reduce((s, r) => s + r.qtd, 0);

  return {
    custoMo, custoEq, total,
    durDias: Math.ceil(durDias),
    durTotalDias: Math.ceil(durDias),
    dur: Math.ceil(durMeses * 100) / 100,
    durMeses: Math.ceil(durMeses * 100) / 100,
    moQtd, eqQtd: comp.eqRows.length,
  };
};

// Volumes produzidos por mês para uma atividade
export const monthlyVolumes = (esc, kpi, equipes) => {
  if (!kpi || !equipes || !esc) return [];
  const volPerMonth = equipes * kpi * DIAS_MES;
  const months = [];
  let remaining = esc;
  while (remaining > 0.005) {
    const thisMonth = Math.min(remaining, volPerMonth);
    months.push(Math.round(thisMonth));
    remaining -= thisMonth;
  }
  return months;
};

// Retorna { score: 0-100, desq: bool, missing: [{atividade, categoria, desc}] }
export const calcSeg = (requisitos, getCompFn) => {
  const missing = [];
  let totalAplicaveis = 0;
  let addedAplicaveis = 0;
  let addedNaoAplicaveis = 0;

  ATIVS.forEach(a => {
    const comp = getCompFn(a.id);
    const reqsAtiv = requisitos.filter(r => r.aId === a.id);
    const aplicaveis = reqsAtiv.filter(r => r.aplicavel !== false);
    const naoAplicaveis = reqsAtiv.filter(r => r.aplicavel === false);

    totalAplicaveis += aplicaveis.length;
    const addedIds = (comp.reqIds || []).map(Number);
    addedAplicaveis += aplicaveis.filter(r => addedIds.includes(+r._id)).length;
    addedNaoAplicaveis += naoAplicaveis.filter(r => addedIds.includes(+r._id)).length;

    aplicaveis.filter(r => !addedIds.includes(+r._id)).forEach(r => {
      missing.push({ atividade: a.desc, categoria: r.categoria, desc: r.desc });
    });
  });

  if (missing.length > 0) return { score: 0, desq: true, missing };

  const denominator = addedAplicaveis + addedNaoAplicaveis;
  const score = denominator > 0 ? Math.round((addedAplicaveis / denominator) * 100) : 100;
  return { score, desq: false, missing: [] };
};
