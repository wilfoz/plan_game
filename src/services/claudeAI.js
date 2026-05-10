import { calcCoerencia } from "../utils/calculations";
import { ATIVS } from "../constants/catalogs";

// Chamada via proxy Vite (/api/claude → https://api.anthropic.com/v1/messages)
// Evita bloqueio CORS do browser ao chamar a API Anthropic diretamente.
const API_URL = "/api/claude";

// Ferramenta disponível para o agente
const TOOLS = [
  {
    name: "renderizar_grafico",
    description: `Renderiza um gráfico visual no painel de análise.
Use OBRIGATORIAMENTE esta ferramenta para criar os seguintes gráficos antes de escrever o texto:
1. tipo "barras_comparativas" — Coeficiente MO (Hh/unid) por atividade: série "Grupo" e série "Referência"
2. tipo "radar_performance" — Performance geral: dimensões Custo, Prazo, Segurança, Efic.MO, Efic.EQ com valores 0-100 para "Grupo" e linha de referência "Base" com todos valores 100
3. (opcional) tipo "barras_comparativas" adicional para coeficiente EQ ou custo por atividade, se relevante`,
    input_schema: {
      type: "object",
      properties: {
        tipo: {
          type: "string",
          enum: ["barras_comparativas", "radar_performance"],
          description: "barras_comparativas: barras agrupadas por atividade. radar_performance: teia de aranha com múltiplas dimensões de desempenho (valores 0-100)."
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

function buildPrompt({ grupo, lt, ef, scores, ativs, penSeg, coerenciaAtivs }) {
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

  // Valores pré-calculados para facilitar a geração dos gráficos
  const efMO = Math.max(0, Math.round(100 - Math.max(0, ef.varMoMedia ?? 0)));
  const efEQ = Math.max(0, Math.round(100 - Math.max(0, ef.varEqMedia ?? 0)));

  return `Você é um especialista em gestão de obras de linhas de transmissão elétrica com domínio em composição de equipes, produtividade e normas EMOP/SINAPI.

PROJETO: ${lt.nome || "LT"} | ${lt.tensao} | ${lt.ext} km | Circuito ${lt.circ} | ${lt.cabFase} cabos fase | ${lt.pararaios} para-raios

GRUPO ANALISADO: ${grupo.nome}${grupo.resp ? ` (${grupo.resp})` : ""}

METODOLOGIA DE SCORING:
- sC = CUSTO TOTAL DO PROJETO = custo_mensal × duração_penalizada × penalidade_segurança
- sD: atividades "risco" +20%, "pior" +40% sobre duração declarada
- PENALIDADE DE SEGURANÇA: +2% no custo por cada requisito "Não Aplicável" adicionado indevidamente
- Todos os scores já refletem estas penalidades

PENALIDADE DE SEGURANÇA DESTE GRUPO:
- Requisitos "Não Aplicável" adicionados indevidamente: ${penSeg?.count ?? 0}
- Acréscimo aplicado no custo total: +${penSeg?.pct ?? 0}%${(penSeg?.count ?? 0) > 0 ? `\n- ATENÇÃO: adição de requisitos não aplicáveis infla o escopo de segurança sem necessidade real e penaliza o custo do grupo.` : ""}

SCORES DO GRUPO (após todas as penalidades):
- Score de Custo (sC): ${scores.sC ?? "—"}% | Score de Duração (sD): ${scores.sD ?? "—"}%
- Score Total: ${scores.total ?? "—"}% (50% Custo + 50% Prazo)
- Segurança (classificatória): ${scores.desq ? "❌ DESCLASSIFICADO — requisito aplicável ausente" : "✅ APROVADO — todos os requisitos incluídos"}

EFICIÊNCIA POR ATIVIDADE:
${ativsDetalhes || "Nenhuma atividade com dados de comparação disponíveis."}

MÉDIAS GERAIS:
- Var. MO média: ${pct(ef.varMoMedia)} | Var. EQ média: ${pct(ef.varEqMedia)}
- Atividades prazo melhor: ${ef.countPrazoMelhor ?? 0} | risco: ${ef.countPrazoRisco ?? 0} | pior: ${ef.countPrazoPior ?? 0}

VALORES PRÉ-CALCULADOS PARA O RADAR (use exatamente estes):
- Custo = ${scores.sC ?? 0} | Prazo = ${scores.sD ?? 0} | Segurança = ${scores.desq ? 0 : 100}
- Efic.MO = ${efMO} | Efic.EQ = ${efEQ}
- Referência (Base) = todos os valores 100

RECURSOS OBRIGATÓRIOS AUSENTES (cargos/equipamentos obrigatórios não incluídos na composição do grupo):
${formatObrigatorioAusente(ef)}

COERÊNCIA DE RECURSOS (verificação automática operador ↔ equipamento e transporte):
${formatCoerencia(coerenciaAtivs)}

---
INSTRUÇÕES:
1. Use renderizar_grafico para criar os gráficos (obrigatório antes do texto)
2. Depois forneça análise em 4 seções (máximo 400 palavras, português brasileiro, tom técnico):
   **1. Diagnóstico de Eficiência** — padrões nos coeficientes, atividades com maior desvio
   **2. Impacto em Custo e Prazo** — relação coeficiente × KPI, atividades críticas, efeito cascata em LT sequencial
   **3. Recursos Obrigatórios e Coerência** — liste cada cargo/equipamento obrigatório ausente e explique o risco operacional específico (NR, segurança, viabilidade da frente). Para problemas de coerência operador↔equipamento: classifique como OCIOSO, RISCO OPERACIONAL ou INVIÁVEL. Se não houver problemas, confirme brevemente.
   **4. Recomendações** — 3 ações práticas específicas priorizando primeiramente a inclusão de recursos obrigatórios ausentes, depois ajustes de coerência e eficiência`;
}

async function fetchRound1(prompt) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
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

async function streamRound2(messages, onChunk) {
  const resp = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      stream: true,
      messages,
    }),
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

// Fluxo multi-turn com tool use:
//   Round 1 (não-streaming): Claude chama renderizar_grafico → onTool(toolInput) por gráfico
//   Round 2 (streaming): Claude gera texto final → onChunk(textAcumulado)
export async function analyzeEficienciaStream({ grupo, lt, ef, scores, ativs, compsRaw, penSeg, onTool, onChunk }) {

  // Verificação de coerência por atividade (determinística, antes de chamar a IA)
  const coerenciaAtivs = (compsRaw ?? []).map(({ atv, moRows, eqRows }) => ({
    atv,
    issues: calcCoerencia(moRows ?? [], eqRows ?? []).issues,
  }));

  const prompt = buildPrompt({ grupo, lt, ef, scores, ativs, penSeg, coerenciaAtivs });

  // ── Round 1: tool calls ──
  const round1 = await fetchRound1(prompt);
  const assistantContent = round1.content ?? [];

  // Processa tool calls e notifica onTool para cada gráfico
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

  // ── Round 2: streaming de texto ──
  const messages = [
    { role: "user", content: prompt },
    { role: "assistant", content: assistantContent },
    ...(toolResults.length > 0 ? [{ role: "user", content: toolResults }] : []),
  ];

  return streamRound2(messages, onChunk);
}
