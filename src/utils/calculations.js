import { ATIVS } from "../constants/catalogs";

// 8 horas/dia = 480 min/dia, 22 dias úteis/mês
const HORAS_DIA = 8;
export const DIAS_MES = 22;
const MIN_DIA = HORAS_DIA * 60; // 480 min

export const calcA = (comp, esc, aId, requisitos = []) => {
  const moT = r => (r.sal + r.alim + r.aloj + r.saude + r.folgas) * r.qtd;
  const custoMo = comp.moRows.reduce((s, r) => s + moT(r), 0);
  const custoEq = comp.eqRows.reduce((s, r) => s + (r.loc * r.qtd), 0);
  const custoVb = comp.verbas.ferramentas + comp.verbas.materiais;
  const total = custoMo + custoEq + custoVb;

  // Requisitos selecionados pelo grupo
  const reqsAtiv = requisitos.filter(r => r.aId === aId);
  const reqsSelecionados = reqsAtiv.filter(r => (comp.reqIds || []).includes(r._id));
  const tempoReqMinPorDia = reqsSelecionados.reduce((s, r) => s + (r.tempo || 0), 0); // min de segurança por dia trabalhado

  // Duração base em DIAS = escopo / (equipes × KPI)
  // KPI = unidades/dia/equipe
  const durDias = comp.kpi && esc && comp.equipes ? esc / (comp.equipes * comp.kpi) : 0;

  // Impacto dos requisitos: tempo_req_min × dias_duração → total minutos
  // total minutos / 480 (min/dia) → dias extras
  const diasReq = durDias > 0 ? (tempoReqMinPorDia * durDias) / MIN_DIA : 0;

  // Duração total em dias e em meses
  const durTotalDias = durDias + diasReq;
  const durMeses = durTotalDias > 0 ? durTotalDias / DIAS_MES : 0;

  // Score de segurança da atividade
  const scoreMax = reqsAtiv.reduce((s, r) => s + (r.score || 0), 0);
  const scoreOk = reqsSelecionados.reduce((s, r) => s + (r.score || 0), 0);

  const moQtd = comp.moRows.reduce((s, r) => s + r.qtd, 0);
  
  return {
    custoMo, custoEq, custoVb, total,
    durDias: Math.ceil(durDias),       // dias base (sem requisitos)
    diasReq: Math.round(diasReq * 10) / 10,  // dias extras por requisitos
    durTotalDias: Math.ceil(durTotalDias), // dias totais
    dur: Math.ceil(durMeses * 100) / 100,  // meses (decimal para exibição)
    durMeses: Math.ceil(durMeses * 100) / 100,
    moQtd, eqQtd: comp.eqRows.length, scoreMax, scoreOk
  };
};

export const calcSeg = (requisitos, getCompFn) => {
  let totalScore = 0, okScore = 0;
  ATIVS.forEach(a => {
    const comp = getCompFn(a.id);
    const reqsAtiv = requisitos.filter(r => r.aId === a.id);
    totalScore += reqsAtiv.reduce((s, r) => s + (r.score || 0), 0);
    const selecionados = reqsAtiv.filter(r => (comp.reqIds || []).includes(r._id));
    okScore += selecionados.reduce((s, r) => s + (r.score || 0), 0);
  });
  return totalScore > 0 ? Math.round((okScore / totalScore) * 100) : 100;
};
