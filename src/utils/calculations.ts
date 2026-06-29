import { ATIVS, BASE_COMPOSITIONS, MO_CAT, EQ_CAT } from "../constants/catalogs";
import { Comp, MoRow, EqRow, Requisito, AtividadeItem } from "../types";

export const DIAS_MES = 22;

export interface CalcAResult {
  custoMo: number;
  custoEq: number;
  total: number;
  durDias: number;
  durTotalDias: number;
  dur: number;
  durMeses: number;
  moQtd: number;
  eqQtd: number;
  coefMo: number | null;
  coefEq: number | null;
  fatorMobilizacao: number;
  custoMobilizacaoPct: number;
  custoMobilizacao: number;
}

export const calcA = (comp: Comp, esc: number): CalcAResult => {
  const moT = (r: MoRow) => r.sal * r.qtd;
  const custoMo = comp.moRows.reduce((s, r) => s + moT(r), 0);
  const custoEq = comp.eqRows.reduce((s, r) => s + (r.loc * r.qtd), 0);
  const total = custoMo + custoEq;

  const durDias = comp.kpi && esc && comp.equipes ? esc / (comp.equipes * comp.kpi) : 0;
  const durMesesRaw = durDias > 0 ? durDias / DIAS_MES : 0;
  const durMeses = Math.ceil(durMesesRaw * 100) / 100;
  const moQtd = comp.moRows.reduce((s, r) => s + r.qtd, 0);

  // Mobilização: +20% por equipe adicional sobre o custo total da atividade (equipes > 1)
  const equipes = comp.equipes || 1;
  const fatorMobilizacao = equipes > 1 ? 1 + 0.20 * (equipes - 1) : 1;
  const custoMobilizacaoPct = equipes > 1 ? Math.round(0.20 * (equipes - 1) * 100) : 0;
  const custoMobilizacao = total * durMeses * (fatorMobilizacao - 1);

  // Coeficientes: Hh ou Ch por unidade produzida
  const kpi = comp.kpi || 0;
  const coefMo = kpi > 0
    ? comp.moRows.reduce((s, r) => s + (r.qtd * (r.horasDia ?? 8.5)), 0) / kpi
    : null;
  const coefEq = kpi > 0
    ? comp.eqRows.reduce((s, r) => s + (r.qtd * (r.horasDia ?? 8.5)), 0) / kpi
    : null;

  return {
    custoMo, custoEq, total,
    durDias: Math.ceil(durDias),
    durTotalDias: Math.ceil(durDias),
    dur: durMeses,
    durMeses,
    moQtd, eqQtd: comp.eqRows.length,
    coefMo, coefEq,
    fatorMobilizacao, custoMobilizacaoPct, custoMobilizacao,
  };
};

// Coeficiente de uma linha individual (Hh ou Ch por unidade)
export const calcRowCoef = (row: MoRow | EqRow, kpi: number): number | null =>
  kpi > 0 ? (row.qtd * (row.horasDia ?? 8.5)) / kpi : null;

export interface SubAlocItem {
  cargo: string;
  moCatId: string;
  coefGrupo: number;
  minCoef: number;
  coefBase: number;
  minVarPct: number;
}

export interface ObrigatorioAusenteItem {
  tipo: "mo" | "eq";
  label: string;
  moCatId?: string;
  eqCatId?: string;
}

export interface CalcEficienciaResult {
  coefMoGrupo: number | null;
  coefEqGrupo: number | null;
  coefMoBase: number | null;
  coefEqBase: number | null;
  varMoPct: number | null;
  varEqPct: number | null;
  kpiGrupo: number;
  kpiBase: number;
  varKpiPct: number | null;
  impactoPrazo: "melhor" | "risco" | "pior" | "neutro" | null;
  temBase: boolean;
  temGrupo: boolean;
  subAlocacao: SubAlocItem[];
  obrigatorioAusente: ObrigatorioAusenteItem[];
  temSubAlocacao: boolean;
}

// Calcula eficiência de um grupo vs equipe base do facilitador para uma atividade.
export const calcEficiencia = (
  comp: Comp,
  baseComp: { moRows: MoRow[]; eqRows: EqRow[] } | null,
  kpiBase: number,
  aId: string
): CalcEficienciaResult => {
  const kpiGrupo = comp.kpi || 0;

  const somaHhGrupo = comp.moRows.reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.5), 0);
  const somaChGrupo = comp.eqRows.reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.5), 0);

  const somaHhBase = (baseComp?.moRows ?? []).reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.5), 0);
  const somaChBase = (baseComp?.eqRows ?? []).reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.5), 0);

  const coefMoGrupo = kpiGrupo > 0 ? somaHhGrupo / kpiGrupo : null;
  const coefEqGrupo = kpiGrupo > 0 ? somaChGrupo / kpiGrupo : null;
  const coefMoBase  = kpiBase  > 0 ? somaHhBase  / kpiBase  : null;
  const coefEqBase  = kpiBase  > 0 ? somaChBase  / kpiBase  : null;

  const varMoPct = coefMoGrupo != null && coefMoBase != null && coefMoBase > 0
    ? Math.round(((coefMoGrupo - coefMoBase) / coefMoBase) * 100)
    : null;
  const varEqPct = coefEqGrupo != null && coefEqBase != null && coefEqBase > 0
    ? Math.round(((coefEqGrupo - coefEqBase) / coefEqBase) * 100)
    : null;

  const varKpiPct = kpiGrupo > 0 && kpiBase > 0
    ? Math.round(((kpiGrupo - kpiBase) / kpiBase) * 100)
    : null;

  const impactoPrazo = (() => {
    if (varMoPct == null || varKpiPct == null) return null;
    if (varMoPct < -5) {
      if (varKpiPct >= Math.abs(varMoPct) - 5) return "melhor";
      if (varKpiPct >= -5) return "risco";
      return "pior";
    }
    if (varMoPct > 5) {
      if (varKpiPct >= Math.abs(varMoPct) - 5) return "melhor";
      if (varKpiPct >= -5) return "neutro";
      return "pior";
    }
    return "neutro";
  })();

  const subAlocacao: SubAlocItem[] = [];
  const obrigatorioAusente: ObrigatorioAusenteItem[] = [];

  if (baseComp) {
    baseComp.moRows.forEach((refRow: any) => {
      const grupoRows = comp.moRows.filter(r => r.catId === refRow.catId);
      const grupoQtd  = grupoRows.reduce((s, r) => s + (r.qtd || 0), 0);

      if (refRow.obrigatorio && grupoQtd < 1) {
        obrigatorioAusente.push({ tipo: "mo", label: refRow.cargo, moCatId: refRow.catId });
        return;
      }

      if (refRow.minVarPct !== null && refRow.minVarPct !== undefined && refRow.minVarPct > -100 && kpiBase > 0 && kpiGrupo > 0) {
        const coefBase = (refRow.qtd * (refRow.horasDia ?? 8.5)) / kpiBase;
        if (coefBase > 0) {
          const minCoef   = coefBase * (1 + refRow.minVarPct / 100);
          const hhGrupo   = grupoRows.reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.5), 0);
          const coefGrupo = hhGrupo / kpiGrupo;
          if (coefGrupo < minCoef) {
            subAlocacao.push({
              cargo:     refRow.cargo,
              moCatId:   refRow.catId,
              coefGrupo: Math.round(coefGrupo * 100) / 100,
              minCoef:   Math.round(minCoef   * 100) / 100,
              coefBase:  Math.round(coefBase  * 100) / 100,
              minVarPct: refRow.minVarPct,
            });
          }
        }
      }
    });

    baseComp.eqRows.filter((r: any) => r.obrigatorio).forEach((refRow: any) => {
      const grupoRow = comp.eqRows.find(r => r.catId === refRow.catId);
      if (!grupoRow || grupoRow.qtd < 1)
        obrigatorioAusente.push({ tipo: "eq", label: refRow.nome, eqCatId: refRow.catId });
    });
  }

  return {
    coefMoGrupo, coefEqGrupo,
    coefMoBase,  coefEqBase,
    varMoPct, varEqPct,
    kpiGrupo, kpiBase, varKpiPct,
    impactoPrazo,
    temBase:  (baseComp?.moRows?.length ?? 0) > 0 || (baseComp?.eqRows?.length ?? 0) > 0,
    temGrupo: somaHhGrupo > 0 || somaChGrupo > 0,
    subAlocacao,
    obrigatorioAusente,
    temSubAlocacao: subAlocacao.length > 0 || obrigatorioAusente.length > 0,
  };
};

export interface CalcEficienciaGeralResult {
  porAtiv: Record<string, CalcEficienciaResult>;
  varMoMedia: number | null;
  varEqMedia: number | null;
  countPrazoRisco: number;
  countPrazoPior: number;
  countPrazoMelhor: number;
  countSubAlocacao: number;
}

// Agrega eficiência de todas as atividades de um grupo
export const calcEficienciaGeral = (
  getCompFn: (aId: string) => Comp,
  equipesBase: Record<string, { moRows: MoRow[]; eqRows: EqRow[] }> | null,
  kpisBase: Record<string, number>
): CalcEficienciaGeralResult => {
  let totalVarMo = 0, totalVarEq = 0, countMo = 0, countEq = 0;
  let countPrazoRisco = 0, countPrazoPior = 0, countPrazoMelhor = 0, countSubAlocacao = 0;
  const porAtiv: Record<string, CalcEficienciaResult> = {};

  ATIVS.forEach(a => {
    const comp = getCompFn(a.id);
    const baseComp = equipesBase?.[a.id] ?? null;
    const kpiBase = kpisBase?.[a.id] ?? 0;
    const ef = calcEficiencia(comp, baseComp, kpiBase, a.id);
    porAtiv[a.id] = ef;
    if (ef.varMoPct != null) { totalVarMo += ef.varMoPct; countMo++; }
    if (ef.varEqPct != null) { totalVarEq += ef.varEqPct; countEq++; }
    if (ef.impactoPrazo === "risco") countPrazoRisco++;
    if (ef.impactoPrazo === "pior")  countPrazoPior++;
    if (ef.impactoPrazo === "melhor") countPrazoMelhor++;
    if (ef.temSubAlocacao) countSubAlocacao++;
  });

  const varMoMedia = countMo > 0 ? Math.round(totalVarMo / countMo) : null;
  const varEqMedia = countEq > 0 ? Math.round(totalVarEq / countEq) : null;

  return { porAtiv, varMoMedia, varEqMedia, countPrazoRisco, countPrazoPior, countPrazoMelhor, countSubAlocacao };
};

// Volumes produzidos por mês para uma atividade
export const monthlyVolumes = (esc: number, kpi: number, equipes: number): number[] => {
  if (!kpi || !equipes || !esc) return [];
  const volPerMonth = equipes * kpi * DIAS_MES;
  const months: number[] = [];
  let remaining = esc;
  while (remaining > 0.005) {
    const thisMonth = Math.min(remaining, volPerMonth);
    months.push(Math.round(thisMonth));
    remaining -= thisMonth;
  }
  return months;
};

export interface NaoAplicPenaltyDetalhe {
  atividadeId: string;
  atividadeDesc: MultilingualText;
  categoria: string;
  desc: string;
}

export interface MultilingualText {
  pt: string;
  es: string;
}

export interface CalcNaoAplicPenaltyResult {
  count: number;
  fator: number;
  pct: number;
  detalhes: NaoAplicPenaltyDetalhe[];
}

// Conta requisitos "Não Aplicável" adicionados indevidamente por um grupo.
export const calcNaoAplicPenalty = (
  requisitos: Requisito[],
  getCompFn: (aId: string) => Comp
): CalcNaoAplicPenaltyResult => {
  let count = 0;
  const detalhes: NaoAplicPenaltyDetalhe[] = [];
  ATIVS.forEach(a => {
    const comp = getCompFn(a.id);
    const addedIds = (comp.reqIds || []).map(String);
    requisitos
      .filter(r => r.aId === a.id && r.aplicavel === false)
      .forEach(r => {
        if (addedIds.includes(String(r._id))) {
          count++;
          detalhes.push({
            atividadeId: a.id,
            atividadeDesc: a.desc,
            categoria: r.categoria,
            desc: r.desc
          });
        }
      });
  });
  return { count, fator: 1 + count * 0.02, pct: count * 2, detalhes };
};

// ─── Coerência de recursos (IDs baseados no catálogo) ─────────────────────
interface CoerenciaRegra {
  moCatId: string;
  eqCatIds: string[];
  opPorEq: number;
}

const COERENCIA_REGRAS: CoerenciaRegra[] = [
  { moCatId: "mo4",  eqCatIds: ["eq1"],                                                                           opPorEq: 1 },
  { moCatId: "mo5",  eqCatIds: ["eq9"],                                                                           opPorEq: 1 },
  { moCatId: "mo6",  eqCatIds: ["eq2"],                                                                           opPorEq: 2 },
  { moCatId: "mo10", eqCatIds: ["eq3"],                                                                           opPorEq: 1 },
  { moCatId: "mo9",  eqCatIds: ["eq4", "eq6", "eq13", "eq5", "eq16", "eq17"],                                     opPorEq: 1 },
  { moCatId: "mo7",  eqCatIds: ["eq7", "eq19"],                                                                   opPorEq: 1 },
  { moCatId: "mo8",  eqCatIds: ["eq18", "eq8", "eq20"],                                                           opPorEq: 1 },
  { moCatId: "mo16", eqCatIds: ["eq11"],                                                                          opPorEq: 1 },
  { moCatId: "mo14", eqCatIds: ["eq15", "eq14"],                                                                  opPorEq: 1 },
];

export const CAPACIDADE_TRANSPORTE: Record<string, number> = {
  "eq13": 12,
  "eq6": 5,
  "eq4": 2,
  "eq5": 2,
  "eq16": 21,
  "eq17": 31,
};

const CARGOS_TRANSPORTE_PROPRIO = ["mo10"];

export interface CoerenciaIssue {
  tipo: "sem_equipamento" | "sem_operador" | "eq_insuficiente" | "eq_ocioso" | "impar_puller_freio" | "transporte_insuficiente";
  moCatId?: string;
  cargo?: string;
  nOp?: number;
  eqCatIds?: string[];
  eqNomes?: string[];
  eqEsperado?: number;
  nEq?: number;
  opEsperado?: number;
  totalMo?: number;
  comProprio?: number;
  precisam?: number;
  vagas?: number;
  deficit?: number;
}

// Retorna issues de coerência de recursos baseados em IDs do catálogo
export function calcCoerencia(moRows: MoRow[], eqRows: EqRow[]): { issues: CoerenciaIssue[] } {
  const issues: CoerenciaIssue[] = [];
  const qtdOp = (moCatId: string) => moRows.filter(r => r.catId === moCatId).reduce((s, r) => s + (r.qtd || 0), 0);
  const qtdEq = (eqCatIds: string[]) => eqRows.filter(r => eqCatIds.includes(r.catId)).reduce((s, r) => s + (r.qtd || 0), 0);
  const cargoNome = (moCatId: string) => MO_CAT.find(m => m.id === moCatId)?.cargo.pt || moCatId;
  const eqNomesPt = (eqCatIds: string[]) => eqCatIds.map(id => EQ_CAT.find(e => e.id === id)?.nome.pt || id);

  for (const reg of COERENCIA_REGRAS) {
    const nOp = qtdOp(reg.moCatId);
    const nEq = qtdEq(reg.eqCatIds);
    if (nOp === 0 && nEq === 0) continue;

    // IDs dos equipamentos que o grupo realmente cadastrou
    const presentEqIds = reg.eqCatIds.filter(id => eqRows.some(r => r.catId === id));
    const displayEqIds = presentEqIds.length > 0 ? presentEqIds : reg.eqCatIds;

    const eqEsperado = nOp > 0 ? Math.ceil(nOp / reg.opPorEq) : 0;
    const opEsperado = nEq * reg.opPorEq;

    if (nOp > 0 && nEq === 0) {
      issues.push({ tipo: "sem_equipamento", moCatId: reg.moCatId, cargo: cargoNome(reg.moCatId), nOp, eqCatIds: reg.eqCatIds, eqNomes: eqNomesPt(reg.eqCatIds), eqEsperado });
    } else if (nOp === 0 && nEq > 0) {
      issues.push({ tipo: "sem_operador", moCatId: reg.moCatId, cargo: cargoNome(reg.moCatId), nEq, eqCatIds: displayEqIds, eqNomes: eqNomesPt(displayEqIds), opEsperado });
    } else {
      if (nEq < eqEsperado)
        issues.push({ tipo: "eq_insuficiente", moCatId: reg.moCatId, cargo: cargoNome(reg.moCatId), nOp, nEq, eqCatIds: displayEqIds, eqNomes: eqNomesPt(displayEqIds), eqEsperado });
      else if (nEq > eqEsperado)
        issues.push({ tipo: "eq_ocioso", moCatId: reg.moCatId, cargo: cargoNome(reg.moCatId), nOp, nEq, eqCatIds: displayEqIds, eqNomes: eqNomesPt(displayEqIds), eqEsperado });
      if (reg.opPorEq === 2 && nOp % 2 !== 0)
        issues.push({ tipo: "impar_puller_freio", nOp });
    }
  }

  // Capacidade de transporte coletivo
  const totalMo = moRows.reduce((s, r) => s + (r.qtd || 0), 0);
  const comProprio = moRows
    .filter(r => CARGOS_TRANSPORTE_PROPRIO.includes(r.catId))
    .reduce((s, r) => s + (r.qtd || 0), 0);
  const precisam = totalMo - comProprio;
  const vagas = eqRows.reduce((s, r) => s + ((CAPACIDADE_TRANSPORTE[r.catId] || 0) * (r.qtd || 0)), 0);
  const deficit = Math.max(0, precisam - vagas);
  if (totalMo > 0 && deficit > 0)
    issues.push({ tipo: "transporte_insuficiente", totalMo, comProprio, precisam, vagas, deficit });

  return { issues };
}

export interface MissingReq {
  atividadeId: string;
  atividadeDesc: MultilingualText;
  categoria: string;
  desc: string;
}

export interface CalcSegResult {
  score: number;
  desq: boolean;
  reprovado: boolean;
  missing: MissingReq[];
}

// Score de segurança
export const calcSeg = (requisitos: Requisito[], getCompFn: (aId: string) => Comp): CalcSegResult => {
  const missing: MissingReq[] = [];
  let totalAplicaveis = 0;
  let addedAplicaveis = 0;

  ATIVS.forEach(a => {
    const comp = getCompFn(a.id);
    const hasResources = (comp.moRows?.length > 0) || (comp.eqRows?.length > 0);
    if (!hasResources) return;

    const reqsAtiv = requisitos.filter(r => r.aId === a.id);
    const aplicaveis = reqsAtiv.filter(r => r.aplicavel !== false);

    totalAplicaveis += aplicaveis.length;
    const addedIds = (comp.reqIds || []).map(String);
    addedAplicaveis += aplicaveis.filter(r => addedIds.includes(String(r._id))).length;

    aplicaveis.filter(r => !addedIds.includes(String(r._id))).forEach(r => {
      missing.push({
        atividadeId: a.id,
        atividadeDesc: a.desc,
        categoria: r.categoria,
        desc: r.desc
      });
    });
  });

  const desq = totalAplicaveis === 0 || addedAplicaveis < totalAplicaveis;
  const score = desq ? 0 : 100;
  return { score, desq, reprovado: false, missing: desq ? missing : [] };
};
