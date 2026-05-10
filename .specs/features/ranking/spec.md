# Ranking e Debriefing — Specification

## Problem Statement

O ranking é o momento de maior impacto pedagógico da dinâmica Jornadas LT. Após todos os grupos montarem suas composições, o facilitador exibe o placar ao vivo no telão e conduz o debriefing — revelando quais equipes fizeram escolhas mais eficientes em custo, mais rápidas em prazo e, acima de tudo, mais seguras.

A regra de desclassificação por segurança reforça a mensagem inegociável: um grupo que omite qualquer requisito aplicável em uma atividade com recursos dimensionados é desclassificado independentemente de ter o melhor custo ou o menor prazo.

---

## Goals

- [x] Cálculo de score de custo: `sC = round(min(100, (minCusto / r.ct) × 100))`
- [x] Cálculo de score de prazo: `sD = round(min(100, (minDur / r.dm) × 100))`
- [x] Score total: `total = round(sC × 0.5 + sD × 0.5)` (50% Custo + 50% Duração)
- [x] Desclassificação por segurança: qualquer requisito aplicável ausente em atividade com recursos → `desq: true`, `total: 0`
- [x] Penalidade por requisito "Não Aplicável" adicionado indevidamente: `+2% no custo total` por requisito
- [x] Penalidade de prazo por sub-alocação: `risco → ×1.2`, `pior → ×1.4` no custo e na duração
- [x] Ranking ordenado por score total (desclassificados no final)
- [x] Exibição dos scores sC, sD, sS e total por grupo
- [x] Debriefing: tabela de requisitos aplicáveis não atendidos por grupo desclassificado
- [x] Análise de eficiência: coeficientes Hh/unid e Ch/unid vs equipe base do facilitador
- [x] Análise IA via Claude Haiku (streaming + charts) por grupo
- [x] Realtime: conectado ao vivo para o facilitador (tag "● AO VIVO")
- [ ] Exportar ranking em PDF
- [ ] Histórico comparativo com jornadas anteriores

---

## Out of Scope

| Feature | Razão |
|---|---|
| Votação dos participantes | O ranking é calculado algoritmicamente |
| Penalidades por atraso contratual | Modelo simplificado — complexidade não pedagógica |
| Ranking em tempo real durante composição | Revelado após todas as composições finalizadas |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Cálculo | `calcSeg(requisitos, getCompFn)` — desclassificação por req ausente **em atividades com recursos** | ✅ Implementado |
| Cálculo | `calcNaoAplicPenalty` — `+2% custo` por req "Não Aplicável" adicionado indevidamente | ✅ Implementado |
| Cálculo | `calcEficienciaGeral` — coeficientes por atividade e médias do grupo | ✅ Implementado |
| Cálculo | `sC = round(min(100, (minCusto / ct) × 100))` | ✅ Implementado |
| Cálculo | `sD = round(min(100, (minDur / dm) × 100))` | ✅ Implementado |
| Cálculo | `total = round(sC × 0.5 + sD × 0.5)` | ✅ Implementado |
| Derivação | `minCusto` e `minDur` calculados apenas entre grupos qualificados | ✅ Implementado |
| Derivação | `desq = seg.desq` — flag de desclassificação | ✅ Implementado |
| Derivação | Penalidade prazo: `PENALTY = { risco: 1.2, pior: 1.4 }` aplicada por atividade | ✅ Implementado |
| Componente | Tabela de ranking com sC, sD, sS, total, tag de status | ✅ Implementado |
| Componente | Debriefing: tabela de requisitos não atendidos por grupo desclassificado | ✅ Implementado |
| Componente | Análise de eficiência: tabela por atividade com VAR. MO, VAR. EQ, VAR. KPI, PRAZO | ✅ Implementado |
| Feature | Análise IA: Claude Haiku streaming com charts e texto estratégico por grupo | ✅ Implementado |
| Feature | Realtime: tag "AO VIVO" via `useRealtimeComps` | ✅ Implementado |
| Feature | Exportar ranking em PDF | ❌ Não implementado |

---

## Regra de Desclassificação — Invariante Crítico

```
calcSeg itera sobre ATIVS. Para cada atividade:
  1. SE comp.moRows.length === 0 AND comp.eqRows.length === 0 → SKIP (sem recursos)
  2. SE tem recursos → verifica requisitos aplicáveis
     - SE qualquer aplicável ausente → desq = true, score = 0
```

**Razão:** Atividades sem composição não foram dimensionadas pelo grupo — não faz sentido exigir requisitos de segurança de uma atividade que não terá execução. Apenas atividades com recursos dimensionados precisam ter os requisitos atendidos.

---

## User Stories

### P1: Calcular e Exibir Ranking dos Grupos ⭐ MVP

**User Story**: As a Facilitador, I want visualizar o ranking final com os scores de todos os grupos so that eu possa revelar os resultados e iniciar o debriefing.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de Ranking THEN o sistema SHALL calcular automaticamente `sC`, `sD` e `sS` para cada grupo.
2. WHEN `minCusto` é calculado THEN o valor SHALL ser o menor `ct` entre grupos qualificados.
3. WHEN `minDur` é calculado THEN o valor SHALL ser o menor `dm` entre grupos qualificados.
4. WHEN `total` é calculado THEN o valor SHALL ser `round(sC × 0.5 + sD × 0.5)`.
5. WHEN o ranking é exibido THEN os grupos SHALL ser ordenados por `total desc`, com desclassificados sempre no final.
6. WHEN dois grupos têm o mesmo `total` THEN o ranking SHALL exibir ambos empatados.

---

### P1: Aplicar Regra de Desclassificação por Segurança ⭐ MVP

**Acceptance Criteria**:

1. WHEN um grupo tem atividade com recursos E requisito aplicável não adicionado THEN o grupo SHALL ter `desq: true` e `total: 0`.
2. WHEN um grupo tem atividade SEM recursos THEN os requisitos dessa atividade NÃO são avaliados.
3. WHEN um grupo está desclassificado THEN o sistema SHALL exibir tag "❌ DESCLASSIFICADO" na linha do ranking.
4. WHEN grupos desclassificados existem THEN SHALL exibir tabela de debriefing com os requisitos ausentes por atividade.
5. WHEN `minCusto` e `minDur` são calculados THEN grupos desclassificados SHALL ser excluídos da base de referência.

---

### P2: Penalidade por Requisito "Não Aplicável" Adicionado Indevidamente

**Acceptance Criteria**:

1. WHEN um grupo adiciona um requisito que o facilitador marcou como "Não Aplicável" THEN o custo total do grupo SHALL ser multiplicado por `1 + count × 0.02`.
2. WHEN o grupo tem 3 requisitos n/aplic. indevidos THEN o fator SHALL ser `1.06` (+6% no custo).
3. WHEN a penalidade está ativa THEN o sistema SHALL exibir tag `+X% CUSTO (N req. n/aplic.)` na linha do grupo.

---

### P2: Análise de Eficiência vs Equipe Base

**Acceptance Criteria**:

1. WHEN a equipe base do facilitador tem dados THEN o sistema SHALL exibir seção de análise de eficiência.
2. WHEN exibido THEN mostra por grupo e atividade: COEF. MO GRUPO, COEF. MO BASE, VAR. MO, VAR. KPI, COEF. EQ, VAR. EQ, PRAZO.
3. WHEN variação > 0 (mais recurso por unidade) THEN a célula SHALL ser amarela ou vermelha.
4. WHEN variação ≤ 0 THEN SHALL ser verde.

---

### P3: Análise IA por Grupo

**Acceptance Criteria**:

1. WHEN `VITE_ANTHROPIC_API_KEY` está definida THEN o botão "Analisar com IA" SHALL ser exibido.
2. WHEN o facilitador clica em "Analisar" THEN o sistema SHALL chamar Claude Haiku via streaming.
3. WHEN a IA responde THEN SHALL exibir charts (via tool_use) e texto estratégico em streaming.

---

## Edge Cases

- WHEN `ct = 0` para todos os grupos THEN `sC = 0` — `minCusto = 0` → fallback retorna 0.
- WHEN `dm = 0` para um grupo (nenhuma composição preenchida) THEN `sD = 0`.
- WHEN apenas 1 grupo está qualificado THEN `minCusto` e `minDur` são desse único grupo → `sC = 100`, `sD = 100`.
- WHEN todos os grupos são desclassificados THEN ranking exibe todos como desclassificados sem erro.
- WHEN uma atividade tem recursos mas NENHUM requisito cadastrado pelo facilitador THEN não há nada a avaliar → não desclassifica por essa atividade.

---

## Requirement Traceability

| Requirement ID | Story | Status |
|---|---|---|
| RANK-01 | P1: `calcSeg` — desclassificação por req ausente em atividade com recursos | ✅ Implementado |
| RANK-02 | P1: `sC = round(min(100, (minCusto / ct) × 100))` | ✅ Implementado |
| RANK-03 | P1: `sD = round(min(100, (minDur / dm) × 100))` | ✅ Implementado |
| RANK-04 | P1: `total = round(sC × 0.5 + sD × 0.5)` | ✅ Implementado |
| RANK-05 | P1: Desclassificação — `desq: true`, total: 0, tag DESCLASSIFICADO | ✅ Implementado |
| RANK-06 | P1: Grupos desclassificados excluídos do cálculo de `minCusto` e `minDur` | ✅ Implementado |
| RANK-07 | P1: Ranking ordenado por total desc (desclassificados no final) | ✅ Implementado |
| RANK-08 | P1: Debriefing: tabela de requisitos ausentes por grupo desclassificado | ✅ Implementado |
| RANK-09 | P1: Atividades sem recursos são ignoradas na avaliação de requisitos | ✅ Implementado |
| RANK-10 | P2: Penalidade `+2% custo` por req "Não Aplicável" adicionado indevidamente | ✅ Implementado |
| RANK-11 | P2: Penalidade de prazo/custo por sub-alocação (risco ×1.2, pior ×1.4) | ✅ Implementado |
| RANK-12 | P2: Análise de eficiência: coeficientes vs equipe base por atividade | ✅ Implementado |
| RANK-13 | P2: Scores individuais sC, sD, sS exibidos por grupo | ✅ Implementado |
| RANK-14 | P2: Destaque visual do 1º lugar e medalhas | ✅ Implementado |
| RANK-15 | P2: Tag de realtime "AO VIVO" para facilitador | ✅ Implementado |
| RANK-16 | P3: Análise IA por grupo via Claude Haiku (streaming + charts) | ✅ Implementado |
| RANK-17 | P3: Exportar ranking em PDF | ❌ Backlog |

**Coverage:** 17 total, 16 implementados, 1 em backlog.

---

## Success Criteria

- [ ] Grupo com atividade com recursos e requisito aplicável ausente → `desq: true`, total "—".
- [ ] Grupo com atividades SEM recursos → requisitos não avaliados, não desclassifica por isso.
- [ ] Grupo com menor custo e menor prazo entre qualificados → `sC = 100`, `sD = 100`.
- [ ] `total = round(sC×0.5 + sD×0.5)` verificável manualmente.
- [ ] 3 requisitos n/aplic. adicionados indevidamente → custo ×1.06.
- [ ] Debriefing exibe tabela de requisitos ausentes com atividade, categoria e descrição.
- [ ] Análise de eficiência exibe variações percentuais por atividade.
