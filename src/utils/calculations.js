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

  // Coeficientes: Hh ou Ch por unidade produzida
  const kpi = comp.kpi || 0;
  const coefMo = kpi > 0
    ? comp.moRows.reduce((s, r) => s + (r.qtd * (r.horasDia ?? 8.5)), 0) / kpi
    : null;
  const coefEq = kpi > 0
    ? comp.eqRows.reduce((s, r) => s + (r.qtd * (r.horasDia ?? 8.0)), 0) / kpi
    : null;

  return {
    custoMo, custoEq, total,
    durDias: Math.ceil(durDias),
    durTotalDias: Math.ceil(durDias),
    dur: Math.ceil(durMeses * 100) / 100,
    durMeses: Math.ceil(durMeses * 100) / 100,
    moQtd, eqQtd: comp.eqRows.length,
    coefMo, coefEq,
  };
};

// Coeficiente de uma linha individual (Hh ou Ch por unidade)
export const calcRowCoef = (row, kpi) =>
  kpi > 0 ? (row.qtd * (row.horasDia ?? 8.5)) / kpi : null;

// Calcula eficiência de um grupo vs equipe base do facilitador para uma atividade.
//
// Matriz de impacto coeficiente × KPI:
//   coef < base + KPI > base  → mais produtivo: custo ↓ prazo ↓ ✅
//   coef < base + KPI ≈ base  → menos recurso sem ganho de KPI: custo ↓ prazo ⚠️ (pode subestimar prazo)
//   coef < base + KPI < base  → menos recurso E menos produtivo: custo ↓ prazo ↑ ⚠️
//   coef > base + KPI > base  → mais recurso, mais rápido: custo ↑ prazo ↓
//   coef > base + KPI ≈ base  → mais recurso sem ganho: custo ↑ prazo =
//   coef > base + KPI < base  → mais recurso E mais lento: custo ↑ prazo ↑ ❌
export const calcEficiencia = (comp, baseComp, kpiBase) => {
  const kpiGrupo = comp.kpi || 0;

  const somaHhGrupo = comp.moRows.reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.5), 0);
  const somaChGrupo = comp.eqRows.reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.0), 0);

  const somaHhBase = (baseComp?.moRows ?? []).reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.5), 0);
  const somaChBase = (baseComp?.eqRows ?? []).reduce((s, r) => s + r.qtd * (r.horasDia ?? 8.0), 0);

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

  // Variação de KPI: positivo = grupo mais produtivo que a referência
  const varKpiPct = kpiGrupo > 0 && kpiBase > 0
    ? Math.round(((kpiGrupo - kpiBase) / kpiBase) * 100)
    : null;

  // Diagnóstico de impacto no prazo baseado na relação coef × KPI
  // "proporcional": se o KPI cresceu na mesma proporção que o coef caiu → sem impacto no prazo
  // Tolerância de 5pp para considerar "equivalente"
  const impactoPrazo = (() => {
    if (varMoPct == null || varKpiPct == null) return null;
    if (varMoPct < -5) {
      // Coef menor (menos recurso)
      if (varKpiPct >= Math.abs(varMoPct) - 5) return "melhor";    // KPI compensou: prazo ↓
      if (varKpiPct >= -5) return "risco";                          // KPI igual: prazo pode subir
      return "pior";                                                 // KPI também caiu: prazo ↑
    }
    if (varMoPct > 5) {
      // Coef maior (mais recurso)
      if (varKpiPct >= Math.abs(varMoPct) - 5) return "melhor";    // Mais recurso E mais rápido: prazo ↓
      if (varKpiPct >= -5) return "neutro";                         // Mais recurso sem ganho: prazo =
      return "pior";                                                 // Mais recurso E menos produtivo: prazo ↑
    }
    return "neutro"; // coef ≈ base
  })();

  return {
    coefMoGrupo, coefEqGrupo,
    coefMoBase,  coefEqBase,
    varMoPct, varEqPct,
    kpiGrupo, kpiBase, varKpiPct,
    impactoPrazo,
    temBase: (baseComp?.moRows?.length ?? 0) > 0 || (baseComp?.eqRows?.length ?? 0) > 0,
    temGrupo: somaHhGrupo > 0 || somaChGrupo > 0,
  };
};

// Agrega eficiência de todas as atividades de um grupo
export const calcEficienciaGeral = (getCompFn, equipesBase, kpisBase) => {
  let totalVarMo = 0, totalVarEq = 0, countMo = 0, countEq = 0;
  let countPrazoRisco = 0, countPrazoPior = 0, countPrazoMelhor = 0;
  const porAtiv = {};

  ATIVS.forEach(a => {
    const comp = getCompFn(a.id);
    const baseComp = equipesBase?.[a.id] ?? null;
    const kpiBase = kpisBase?.[a.id] ?? 0;
    const ef = calcEficiencia(comp, baseComp, kpiBase);
    porAtiv[a.id] = ef;
    if (ef.varMoPct != null) { totalVarMo += ef.varMoPct; countMo++; }
    if (ef.varEqPct != null) { totalVarEq += ef.varEqPct; countEq++; }
    if (ef.impactoPrazo === "risco") countPrazoRisco++;
    if (ef.impactoPrazo === "pior")  countPrazoPior++;
    if (ef.impactoPrazo === "melhor") countPrazoMelhor++;
  });

  const varMoMedia = countMo > 0 ? Math.round(totalVarMo / countMo) : null;
  const varEqMedia = countEq > 0 ? Math.round(totalVarEq / countEq) : null;

  return { porAtiv, varMoMedia, varEqMedia, countPrazoRisco, countPrazoPior, countPrazoMelhor };
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

// Conta requisitos "Não Aplicável" adicionados indevidamente por um grupo.
// Cada um penaliza +2% no custo total do projeto (aplicado em buildRank).
// Retorna { count, fator (ex: 1.06 para 3 req), pct (ex: 6), detalhes[] }
export const calcNaoAplicPenalty = (requisitos, getCompFn) => {
  let count = 0;
  const detalhes = [];
  ATIVS.forEach(a => {
    const comp = getCompFn(a.id);
    const addedIds = (comp.reqIds || []).map(Number);
    requisitos
      .filter(r => r.aId === a.id && r.aplicavel === false)
      .forEach(r => {
        if (addedIds.includes(+r._id)) {
          count++;
          detalhes.push({ atividade: a.desc, categoria: r.categoria, desc: r.desc });
        }
      });
  });
  return { count, fator: 1 + count * 0.02, pct: count * 2, detalhes };
};

// ─── Coerência de recursos ─────────────────────────────────────────────────
//
// Regras: cada cargo operador deve ter o(s) equipamento(s) correspondente(s).
// opPorEq = quantos operadores por unidade de equipamento.
const COERENCIA_REGRAS = [
  { cargo: "OPERADOR DE GUINDASTE",        eqNomes: ["GUINDASTE"],                                                           opPorEq: 1 },
  { cargo: "OPERADOR DE GUINCHO",          eqNomes: ["GUINCHO P/ MONTAGEM"],                                                 opPorEq: 1 },
  // CONJUNTO LANÇAMENTO inclui puller + freio; cada conjunto exige 2 operadores
  { cargo: "OPERADOR DE PULLER/FREIO",     eqNomes: ["CONJUNTO LANÇAMENTO - PULLER E FREIO"],                               opPorEq: 2 },
  { cargo: "MOTORISTA OPERADOR MUNCK",     eqNomes: ["CAMINHÃO MUNCK"],                                                      opPorEq: 1 },
  { cargo: "MOTORISTA",                    eqNomes: ["CAMINHÃO PRANCHA", "CAMINHONETE 4X4", "CAMINHÃO CABINADO 10 PESSOAS"], opPorEq: 1 },
  { cargo: "OPERADOR DE TRATOR",           eqNomes: ["TRATOR", "TRATOR DE ESTEIRA"],                                         opPorEq: 1 },
  { cargo: "OPERADOR DE MAQUINAS PESASAS", eqNomes: ["ESCAVADEIRA HIDRÁULICA", "RETROESCAVADEIRA 4X4"],                     opPorEq: 1 },
  { cargo: "NIVELADOR",                    eqNomes: ["ESTAÇÃO TOTAL", "GPS RTK"],                                            opPorEq: 1 },
];

// Capacidade total de passageiros por unidade de veículo de transporte.
// CAMINHÃO CABINADO 10 PESSOAS: 10 no banco traseiro + motorista + carona = 12.
// CAMINHONETE 4X4: motorista + 4 = 5.
// CAMINHÃO PRANCHA: motorista + 1 = 2.
export const CAPACIDADE_TRANSPORTE = {
  "CAMINHÃO CABINADO 10 PESSOAS": 12,
  "CAMINHONETE 4X4": 5,
  "CAMINHÃO PRANCHA": 2,
};

// Cargos que já possuem veículo próprio e não precisam de vaga nos veículos coletivos.
const CARGOS_TRANSPORTE_PROPRIO = ["MOTORISTA OPERADOR MUNCK"];

// Retorna { issues[] } com problemas de coerência operador↔equipamento e transporte.
export function calcCoerencia(moRows, eqRows) {
  const issues = [];
  const qtdOp = (cargo) => moRows.filter(r => r.cargo === cargo).reduce((s, r) => s + (r.qtd || 1), 0);
  const qtdEq = (nomes) => eqRows.filter(r => nomes.includes(r.nome)).reduce((s, r) => s + (r.qtd || 1), 0);

  for (const reg of COERENCIA_REGRAS) {
    const nOp = qtdOp(reg.cargo);
    const nEq = qtdEq(reg.eqNomes);
    if (nOp === 0 && nEq === 0) continue;

    const eqEsperado = nOp > 0 ? Math.ceil(nOp / reg.opPorEq) : 0;
    const opEsperado = nEq * reg.opPorEq;

    if (nOp > 0 && nEq === 0) {
      issues.push({ tipo: "sem_equipamento", cargo: reg.cargo, nOp, eqNomes: reg.eqNomes, eqEsperado });
    } else if (nOp === 0 && nEq > 0) {
      issues.push({ tipo: "sem_operador", cargo: reg.cargo, nEq, eqNomes: reg.eqNomes, opEsperado });
    } else {
      if (nEq < eqEsperado)
        issues.push({ tipo: "eq_insuficiente", cargo: reg.cargo, nOp, nEq, eqNomes: reg.eqNomes, eqEsperado });
      else if (nEq > eqEsperado)
        issues.push({ tipo: "eq_ocioso", cargo: reg.cargo, nOp, nEq, eqNomes: reg.eqNomes, eqEsperado });
      if (reg.opPorEq === 2 && nOp % 2 !== 0)
        issues.push({ tipo: "impar_puller_freio", nOp });
    }
  }

  // Capacidade de transporte coletivo
  const totalMo = moRows.reduce((s, r) => s + (r.qtd || 1), 0);
  const comProprio = moRows
    .filter(r => CARGOS_TRANSPORTE_PROPRIO.includes(r.cargo))
    .reduce((s, r) => s + (r.qtd || 1), 0);
  const precisam = totalMo - comProprio;
  const vagas = eqRows.reduce((s, r) => s + ((CAPACIDADE_TRANSPORTE[r.nome] || 0) * (r.qtd || 1)), 0);
  const deficit = Math.max(0, precisam - vagas);
  if (totalMo > 0 && deficit > 0)
    issues.push({ tipo: "transporte_insuficiente", totalMo, comProprio, precisam, vagas, deficit });

  return { issues };
}

// ─── Score de segurança ────────────────────────────────────────────────────
// Retorna { score: 0-100, desq: bool, missing: [{atividade, categoria, desc}] }
// Score = aplicaveis adicionados / total aplicaveis * 100; desq se score < 70
export const calcSeg = (requisitos, getCompFn) => {
  const missing = [];
  let totalAplicaveis = 0;
  let addedAplicaveis = 0;

  ATIVS.forEach(a => {
    const comp = getCompFn(a.id);
    const reqsAtiv = requisitos.filter(r => r.aId === a.id);
    const aplicaveis = reqsAtiv.filter(r => r.aplicavel !== false);

    totalAplicaveis += aplicaveis.length;
    const addedIds = (comp.reqIds || []).map(Number);
    addedAplicaveis += aplicaveis.filter(r => addedIds.includes(+r._id)).length;

    aplicaveis.filter(r => !addedIds.includes(+r._id)).forEach(r => {
      missing.push({ atividade: a.desc, categoria: r.categoria, desc: r.desc });
    });
  });

  const score = totalAplicaveis > 0 ? Math.round((addedAplicaveis / totalAplicaveis) * 100) : 100;
  const desq = score < 70;
  const reprovado = !desq && score < 100;
  return { score, desq, reprovado, missing: (desq || reprovado) ? missing : [] };
};
