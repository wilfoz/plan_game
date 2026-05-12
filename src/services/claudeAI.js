import { calcCoerencia } from "../utils/calculations";
import { ATIVS } from "../constants/catalogs";

const API_URL = "/api/claude";
const MODEL_TOOLS = "claude-haiku-4-5-20251001"; // Round 1: geração de gráficos (tool calls)
const MODEL_TEXT  = "claude-sonnet-4-6";          // Round 2: análise textual e follow-ups
const PROXY_HEADERS = {
  "Content-Type": "application/json",
  ...(import.meta.env.VITE_CLAUDE_PROXY_SECRET
    ? { "x-proxy-secret": import.meta.env.VITE_CLAUDE_PROXY_SECRET }
    : {}),
};

const TOOLS = [
  {
    name: "renderizar_grafico",
    description: `Renderiza um gráfico visual no painel de análise.
Use OBRIGATORIAMENTE esta ferramenta para criar os seguintes gráficos antes de escrever o texto:
1. tipo "barras_comparativas" — Coeficiente MO (Hh/unid) por atividade: série "Grupo" e série "Referência"
2. tipo "radar_performance" — Performance geral: dimensões Custo, Prazo, Segurança, Efic.MO, Efic.EQ com valores 0-100 para "Grupo" e linha de referência "Base" com todos valores 100
3. (opcional) tipo "barras_custo_atividade" — Decomposição de custo por atividade: barras empilhadas MO vs EQ em R$/mês — use quando houver variação relevante entre atividades
4. (opcional) tipo "barras_comparativas" adicional para coeficiente EQ, se relevante`,
    input_schema: {
      type: "object",
      properties: {
        tipo: {
          type: "string",
          enum: ["barras_comparativas", "radar_performance", "barras_custo_atividade"],
          description: "barras_comparativas: barras agrupadas por atividade. radar_performance: teia de aranha com múltiplas dimensões (valores 0-100). barras_custo_atividade: barras empilhadas com custo MO e EQ por atividade (R$/mês)."
        },
        titulo: { type: "string", description: "Título do gráfico, curto e descritivo" },
        categorias: {
          type: "array",
          items: { type: "string" },
          description: "Nomes das atividades (para barras) ou dimensões de desempenho (para radar)"
        },
        series: {
          type: "array",
          description: "Séries de dados — pelo menos 2 séries (Grupo e Referência/Base)",
          items: {
            type: "object",
            properties: {
              nome: { type: "string", description: "Nome da série, ex: 'Grupo A', 'Referência'" },
              valores: {
                type: "array",
                items: { type: "number" },
                description: "Valores numéricos correspondentes a cada categoria"
              }
            },
            required: ["nome", "valores"]
          }
        },
        unidade: { type: "string", description: "Unidade dos valores, ex: Hh/und, Ch/und, R$/mês. Omita para radar (valores são %)." }
      },
      required: ["tipo", "titulo", "categorias", "series"]
    }
  }
];

// ── Helpers de formatação ────────────────────────────────────────────────────

const BRL = v => v != null ? `R$ ${Math.round(v).toLocaleString("pt-BR")}` : "—";

function formatObrigatorioAusente(ef) {
  const porAtiv = ef?.porAtiv ?? {};
  const linhas = [];
  for (const [aId, efAtv] of Object.entries(porAtiv)) {
    const ausentes = efAtv.obrigatorioAusente ?? [];
    if (ausentes.length === 0) continue;
    const atv = ATIVS.find(a => a.id === aId);
    linhas.push(`• ${atv?.desc ?? aId}:`);
    for (const a of ausentes) {
      const tipo = a.tipo === "mo" ? "CARGO" : "EQUIPAMENTO";
      linhas.push(`  ❌ ${tipo} OBRIGATÓRIO AUSENTE: ${a.label}`);
    }
  }
  return linhas.length > 0
    ? linhas.join("\n")
    : "✅ Nenhum recurso obrigatório ausente nas atividades analisadas.";
}

function formatMobilizacao(coerenciaAtivs) {
  const linhas = [];
  for (const { atv, equipes } of coerenciaAtivs) {
    if ((equipes ?? 1) > 1) {
      const pct = Math.round(0.20 * (equipes - 1) * 100);
      linhas.push(`• ${atv.desc}: ${equipes} equipes → +${pct}% sobre o custo total desta atividade`);
    }
  }
  return linhas.length > 0
    ? linhas.join("\n")
    : "• Nenhuma atividade com equipes adicionais mobilizadas.";
}

function formatCoerencia(coerenciaAtivs) {
  const linhas = [];
  let totalIssues = 0;

  for (const { atv, issues } of coerenciaAtivs) {
    if (issues.length === 0) continue;
    totalIssues += issues.length;
    linhas.push(`• ${atv.desc} (${atv.und}):`);
    for (const iss of issues) {
      switch (iss.tipo) {
        case "sem_equipamento":
          linhas.push(`  ⚠️ ${iss.nOp}× ${iss.cargo} sem ${iss.eqNomes.join(" ou ")} — esperado ${iss.eqEsperado} unid.`);
          break;
        case "sem_operador":
          linhas.push(`  ⚠️ ${iss.nEq}× ${iss.eqNomes[0]} sem ${iss.cargo} — esperado ${iss.opEsperado} operador(es)`);
          break;
        case "eq_insuficiente":
          linhas.push(`  ⚠️ ${iss.nOp}× ${iss.cargo}: apenas ${iss.nEq} ${iss.eqNomes[0]} (esperado ${iss.eqEsperado})`);
          break;
        case "eq_ocioso":
          linhas.push(`  ℹ️ ${iss.nEq}× ${iss.eqNomes[0]} para ${iss.nOp}× ${iss.cargo} — ${iss.nEq - iss.eqEsperado} equipamento(s) ocioso(s)`);
          break;
        case "impar_puller_freio":
          linhas.push(`  ⚠️ Número ímpar de OPERADOR DE PULLER/FREIO (${iss.nOp}) — cada CONJUNTO LANÇAMENTO requer 2 operadores`);
          break;
        case "transporte_insuficiente":
          linhas.push(`  🚨 Transporte insuficiente: ${iss.precisam} colaboradores precisam de vaga, ${iss.vagas} disponíveis — déficit de ${iss.deficit} vaga(s) [MOTORISTA OPERADOR MUNCK excluído: ${iss.comProprio}]`);
          break;
      }
    }
  }

  if (totalIssues === 0)
    return "✅ Nenhum problema de coerência detectado em nenhuma atividade.";
  return linhas.join("\n");
}

function formatIncompat(ativs) {
  const linhas = [];
  for (const { atv, efAtv } of ativs) {
    if (efAtv.varKpiPct != null && efAtv.varKpiPct > 40) {
      linhas.push(`⚠️ KPI ALTO (+${efAtv.varKpiPct}%): ${atv.desc} — KPI grupo ${efAtv.kpiGrupo} un/dia vs base ${efAtv.kpiBase} un/dia. Risco: prazo irreal por superprodutividade declarada incompatível com os recursos alocados.`);
    }
    for (const s of (efAtv.subAlocacao ?? [])) {
      linhas.push(`❌ COEFICIENTE ABAIXO DO LIMITE (CBIC/ANEEL): ${atv.desc} — ${s.cargo}: ${s.coefGrupo.toFixed(2)} Hh/und (mínimo ${s.minCoef.toFixed(2)} Hh/und, redução máxima permitida: ${s.minVarPct}%). Sub-alocação crítica — frente de trabalho subdimensionada.`);
    }
  }
  return linhas.length > 0
    ? linhas.join("\n")
    : "✅ Nenhum alerta de incompatibilidade detectado.";
}

function formatComposicao(compsRaw, calcAResults) {
  const linhas = [];
  for (const { atv, moRows, eqRows, equipes, mesInicia, kpi } of (compsRaw ?? [])) {
    const hasAny = (moRows?.length > 0) || (eqRows?.length > 0);
    if (!hasAny) continue;
    const calc = calcAResults?.find(c => c.aId === atv.id)?.result;
    const mesStr = mesInicia > 0 ? `Mês ${mesInicia}` : "—";
    const eqStr = (equipes ?? 1) > 1 ? `${equipes} equipes (+${Math.round(0.20 * ((equipes ?? 1) - 1) * 100)}% mobiliz.)` : "1 equipe";
    linhas.push(`• ${atv.desc} (início: ${mesStr} | ${eqStr} | KPI: ${kpi || "—"} un/dia):`);
    if ((moRows?.length ?? 0) > 0) {
      linhas.push(`  MO — ${BRL(calc?.custoMo)}/mês:`);
      for (const r of moRows) {
        linhas.push(`    ${r.qtd}× ${r.cargo} | sal ${BRL(r.sal)}/mês`);
      }
    }
    if ((eqRows?.length ?? 0) > 0) {
      linhas.push(`  EQ — ${BRL(calc?.custoEq)}/mês:`);
      for (const r of eqRows) {
        linhas.push(`    ${r.qtd}× ${r.nome} | loc ${BRL(r.loc)}/mês`);
      }
    }
    if (calc?.dur > 0) {
      const custoTot = calc.total * calc.durMeses * calc.fatorMobilizacao;
      linhas.push(`  Custo total estimado: ${BRL(custoTot)} | Duração: ${calc.dur.toFixed(2)} meses`);
    }
  }
  return linhas.length > 0 ? linhas.join("\n") : "Nenhum recurso cadastrado.";
}

function formatRankContext(rankContext) {
  if (!rankContext || rankContext.length === 0)
    return "Análise individual (único grupo ou contexto de comparação indisponível).";
  const linhas = rankContext.map(r => {
    const status = r.desq ? "❌ DESQ" : "✅";
    return `• ${r.nome}: Score ${r.total ?? "—"} (sC ${r.sC ?? "—"}% | sD ${r.sD ?? "—"}%) ${status}`;
  });
  return linhas.join("\n");
}

function formatSegDetalhes(penSeg, scores) {
  const linhas = [];
  if ((penSeg?.count ?? 0) > 0) {
    linhas.push(`ARMADILHAS ATIVADAS — ${penSeg.count} requisito(s) "Não Aplicável" incluído(s) indevidamente (+${penSeg.pct}% custo):`);
    (penSeg.detalhes ?? []).forEach(d => {
      linhas.push(`  ❌ ${d.atividade} | ${d.categoria}: ${d.desc}`);
    });
  }
  if (scores?.desq) {
    linhas.push(`DESCLASSIFICAÇÃO: grupo não incluiu todos os requisitos APLICÁVEIS obrigatórios.`);
  }
  return linhas.length > 0 ? linhas.join("\n") : "✅ Sem armadilhas ativadas e todos os requisitos aplicáveis incluídos.";
}

function buildPrompt({ grupo, lt, ef, scores, ativs, penSeg, coerenciaAtivs, compsRaw, calcAResults, rankContext }) {
  const pct = v => (v != null ? `${v > 0 ? "+" : ""}${v}%` : "—");

  const ativsDetalhes = ativs
    .map(({ atv, efAtv }) => {
      const u = atv.und.toLowerCase();
      return [
        `• ${atv.desc} (${atv.und}):`,
        `  MO: ${efAtv.coefMoGrupo?.toFixed(2) ?? "—"} Hh/${u} | Base: ${efAtv.coefMoBase?.toFixed(2) ?? "—"} Hh/${u} | Var MO: ${pct(efAtv.varMoPct)}`,
        `  EQ: ${efAtv.coefEqGrupo?.toFixed(2) ?? "—"} Ch/${u} | Base: ${efAtv.coefEqBase?.toFixed(2) ?? "—"} Ch/${u} | Var EQ: ${pct(efAtv.varEqPct)}`,
        `  KPI Grupo: ${efAtv.kpiGrupo} unid/dia | KPI Base: ${efAtv.kpiBase} unid/dia | Var KPI: ${pct(efAtv.varKpiPct)}`,
        `  Impacto Prazo: ${efAtv.impactoPrazo ?? "—"}`,
      ].join("\n");
    })
    .join("\n\n");

  const efMO = Math.max(0, Math.round(100 - Math.max(0, ef.varMoMedia ?? 0)));
  const efEQ = Math.max(0, Math.round(100 - Math.max(0, ef.varEqMedia ?? 0)));

  return `Você é um especialista em gestão de obras de linhas de transmissão elétrica com domínio em composição de equipes, produtividade e normas EMOP/SINAPI.

PROJETO: ${lt.nome || "LT"} | ${lt.tensao} | ${lt.ext} km | Circuito ${lt.circ} | ${lt.cabFase} cabos fase | ${lt.pararaios} para-raios

GRUPO ANALISADO: ${grupo.nome}${grupo.resp ? ` (${grupo.resp})` : ""}

OUTROS GRUPOS NA SESSÃO (comparação competitiva):
${formatRankContext(rankContext)}

METODOLOGIA DE SCORING:
- sC = CUSTO TOTAL DO PROJETO = custo_mensal × duração_penalizada × fator_mobilização × penalidade_segurança
- sD: atividades "risco" +20%, "pior" +40% sobre duração declarada
- PENALIDADE DE SEGURANÇA: +2% no custo por cada requisito "Não Aplicável" adicionado indevidamente
- CUSTO DE MOBILIZAÇÃO (quando equipes > 1): +20% por equipe adicional s/ custo total da atividade

SCORES DO GRUPO (após todas as penalidades):
- Score de Custo (sC): ${scores.sC ?? "—"}% | Score de Duração (sD): ${scores.sD ?? "—"}%
- Score Total: ${scores.total ?? "—"}% (50% Custo + 50% Prazo)
- Segurança (classificatória): ${scores.desq ? "❌ DESCLASSIFICADO — requisito aplicável ausente" : "✅ APROVADO — todos os requisitos incluídos"}

COMPOSIÇÃO DE RECURSOS POR ATIVIDADE (mão de obra e equipamentos declarados pelo grupo):
${formatComposicao(compsRaw, calcAResults)}

EFICIÊNCIA POR ATIVIDADE (coeficientes vs referência base):
${ativsDetalhes || "Nenhuma atividade com dados de comparação disponíveis."}

MÉDIAS GERAIS:
- Var. MO média: ${pct(ef.varMoMedia)} | Var. EQ média: ${pct(ef.varEqMedia)}
- Atividades prazo melhor: ${ef.countPrazoMelhor ?? 0} | risco: ${ef.countPrazoRisco ?? 0} | pior: ${ef.countPrazoPior ?? 0}

VALORES PRÉ-CALCULADOS PARA O RADAR (use exatamente estes):
- Custo = ${scores.sC ?? 0} | Prazo = ${scores.sD ?? 0} | Segurança = ${scores.desq ? 0 : 100}
- Efic.MO = ${efMO} | Efic.EQ = ${efEQ}
- Referência (Base) = todos os valores 100

SEGURANÇA — DETALHAMENTO:
${formatSegDetalhes(penSeg, scores)}
- Requisitos "Não Aplicável" indevidos: ${penSeg?.count ?? 0}
- Acréscimo no custo total: +${penSeg?.pct ?? 0}%

RECURSOS OBRIGATÓRIOS AUSENTES:
${formatObrigatorioAusente(ef)}

COERÊNCIA DE RECURSOS (verificação operador ↔ equipamento e transporte):
${formatCoerencia(coerenciaAtivs)}

ALERTAS DE INCOMPATIBILIDADE (KPI > 40% DA BASE OU COEFICIENTES ABAIXO DO LIMITE CBIC/ANEEL):
${formatIncompat(ativs)}

CUSTO DE MOBILIZAÇÃO POR ATIVIDADE:
${formatMobilizacao(coerenciaAtivs)}

---
INSTRUÇÕES:
1. Use renderizar_grafico para criar os gráficos (obrigatório antes do texto)
2. Depois forneça análise em 4 seções (máximo 700 palavras, português brasileiro, tom técnico):
   **1. Diagnóstico de Eficiência** — padrões nos coeficientes, atividades com maior desvio, composição de recursos crítica
   **2. Impacto em Custo e Prazo** — relação coeficiente × KPI, atividades críticas, custo de mobilização (equipes extras encarecem em 20%/equipe), posicionamento vs outros grupos
   **3. Recursos Obrigatórios, Coerência e Incompatibilidades** — liste cada cargo/equipamento obrigatório ausente e explique o risco operacional (NR, segurança, viabilidade). Para KPI acima de 40% da base: questione viabilidade de campo. Para sub-alocação abaixo do piso CBIC: classifique como CRÍTICO. Para coerência operador↔equipamento: classifique como OCIOSO, RISCO OPERACIONAL ou INVIÁVEL.
   **4. Recomendações** — 3 ações práticas específicas: primeiro inclusão de recursos obrigatórios ausentes e correção de incompatibilidades KPI/coeficiente; depois custo-benefício de equipes adicionais vs penalidade de mobilização; e ajustes de coerência e segurança`;
}

// ── Round 1: tool calls (não-streaming) ──────────────────────────────────────

async function fetchRound1(prompt) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: PROXY_HEADERS,
    body: JSON.stringify({
      model: MODEL_TOOLS,
      max_tokens: 2000,
      tools: TOOLS,
      tool_choice: { type: "auto" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Erro HTTP ${resp.status}`);
  }
  return resp.json();
}

// ── Round 2 / follow-up: streaming ──────────────────────────────────────────

async function streamRound2(messages, onChunk, tools = null) {
  const body = {
    model: MODEL_TEXT,
    max_tokens: 2000,
    stream: true,
    messages,
  };
  // Obrigatório repassar tools quando o histórico contém blocos tool_use
  if (tools) body.tools = tools;

  const resp = await fetch(API_URL, {
    method: "POST",
    headers: PROXY_HEADERS,
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Erro HTTP ${resp.status}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
          accumulated += parsed.delta.text;
          onChunk(accumulated);
        }
      } catch { /* chunk mal-formado */ }
    }
  }
  return accumulated;
}

// ── Análise principal: multi-turn com tool use ───────────────────────────────
// Round 1 (não-streaming): Claude chama renderizar_grafico → onTool(toolInput) por gráfico
// Round 2 (streaming): Claude gera texto final → onChunk(textAcumulado)
// Retorna: { text, conversationMessages } — conversationMessages permite follow-up
export async function analyzeEficienciaStream({
  grupo, lt, ef, scores, ativs, compsRaw, penSeg,
  calcAResults, rankContext,
  onTool, onChunk,
}) {
  const coerenciaAtivs = (compsRaw ?? []).map(({ atv, moRows, eqRows, equipes }) => ({
    atv,
    issues: calcCoerencia(moRows ?? [], eqRows ?? []).issues,
    equipes: equipes ?? 1,
  }));

  const prompt = buildPrompt({ grupo, lt, ef, scores, ativs, penSeg, coerenciaAtivs, compsRaw, calcAResults, rankContext });

  // Round 1: tool calls
  const round1 = await fetchRound1(prompt);
  const assistantContent = round1.content ?? [];

  const toolResults = [];
  for (const block of assistantContent) {
    if (block.type === "tool_use" && block.name === "renderizar_grafico") {
      onTool({ id: block.id, input: block.input });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: `Gráfico "${block.input.titulo}" (${block.input.tipo}) renderizado com sucesso.`,
      });
    }
  }

  // Round 2: streaming de texto
  const round2Messages = [
    { role: "user", content: prompt },
    { role: "assistant", content: assistantContent },
    ...(toolResults.length > 0 ? [{ role: "user", content: toolResults }] : []),
  ];

  // Passa tools porque o histórico contém blocos tool_use do Round 1
  const text = await streamRound2(round2Messages, onChunk, TOOLS);

  const conversationMessages = [
    ...round2Messages,
    { role: "assistant", content: text },
  ];

  return { text, conversationMessages };
}

// ── Pergunta de acompanhamento (follow-up) ───────────────────────────────────
// Retorna: { text, conversationMessages } — atualizado com a nova troca
export async function analyzeFollowUp({ conversationMessages, userQuestion, onChunk }) {
  const messages = [
    ...conversationMessages,
    { role: "user", content: userQuestion },
  ];
  // Histórico contém tool_use do Round 1 — tools obrigatório
  const text = await streamRound2(messages, onChunk, TOOLS);
  return {
    text,
    conversationMessages: [...messages, { role: "assistant", content: text }],
  };
}

// ── Análise consolidada da sessão (facilitador) ──────────────────────────────

function buildSessionPrompt({ lt, groups }) {
  const linhas = [
    `Você é um facilitador especialista em linhas de transmissão analisando os resultados de uma sessão de planejamento competitivo.`,
    ``,
    `PROJETO: ${lt.nome || "LT"} | ${lt.tensao} | ${lt.ext} km | Circuito ${lt.circ}`,
    ``,
    `RESULTADOS DA SESSÃO — ${groups.length} grupo(s):`,
  ];

  groups.forEach((g, i) => {
    const pos = g.desq ? "DESQ" : `${i + 1}º`;
    linhas.push(``, `[${pos}] ${g.nome}${g.resp ? ` (${g.resp})` : ""}`);
    linhas.push(`  Score: ${g.total ?? 0} | sC: ${g.sC ?? 0}% | sD: ${g.sD ?? 0}%`);
    linhas.push(`  Custo: ${BRL(g.ct)} | Duração: ${(g.dm ?? 0).toFixed(1)} meses`);
    if (g.desq) linhas.push(`  ❌ DESCLASSIFICADO`);
    if ((g.penSeg?.count ?? 0) > 0) linhas.push(`  Armadilhas: ${g.penSeg.count} req. indevidos (+${g.penSeg.pct}% custo)`);
    if ((g.ef?.countPrazoRisco ?? 0) > 0 || (g.ef?.countPrazoPior ?? 0) > 0)
      linhas.push(`  KPI crítico: ${g.ef.countPrazoRisco ?? 0} ativ. risco | ${g.ef.countPrazoPior ?? 0} ativ. pior`);
    if ((g.ef?.countSubAlocacao ?? 0) > 0) linhas.push(`  Sub-alocação: ${g.ef.countSubAlocacao} ativ.`);
    if (g.ef?.varMoMedia != null) linhas.push(`  Var. MO média: ${g.ef.varMoMedia > 0 ? "+" : ""}${g.ef.varMoMedia}% | Var. EQ média: ${g.ef.varEqMedia > 0 ? "+" : ""}${g.ef.varEqMedia ?? 0}%`);
  });

  linhas.push(
    ``,
    `---`,
    `Gere uma análise consolidada da sessão em 4 seções (máximo 600 palavras, português brasileiro, tom de facilitador/educador):`,
    `**1. Panorama Geral** — distribuição de scores, amplitude entre o melhor e pior grupo, grupos desclassificados`,
    `**2. Grupos Destaque** — pontos fortes do(s) líder(es) e principais deficiências dos grupos retardatários, comparação de estratégias`,
    `**3. Erros Mais Comuns** — padrões recorrentes de erro (armadilhas, sub-alocação, incoerências) e o que revelam sobre a compreensão dos participantes`,
    `**4. Pontos-Chave para o Debriefing** — 4 lições de aprendizado que o facilitador deve destacar, com exemplos concretos desta sessão`,
  );

  return linhas.join("\n");
}

export async function analyzeSessionStream({ lt, groups, onChunk }) {
  const prompt = buildSessionPrompt({ lt, groups });
  return streamRound2([{ role: "user", content: prompt }], onChunk);
}
