# Composição por Atividade — Specification

## Problem Statement

O momento central da dinâmica Jornadas LT é a montagem de composições pelos grupos. Cada grupo dimensiona, para cada uma das 16 atividades, quais profissionais contratar, quais equipamentos locar, com quantas equipes e qual produtividade (KPI) trabalhar. As escolhas têm consequências mensuráveis em custo, prazo e segurança.

A composição é atividade-específica: estado isolado por `(grupoIdx, atividadeId)`. O estado é persistido no Supabase via `useGrupoComps` com debounce de 800ms, e sincronizado em tempo real para o facilitador via `useRealtimeComps`.

---

## Goals

- [x] Seletor de atividade (16 atividades — 7 Montagem + 9 Lançamento)
- [x] Tabela de MO com linhas dinâmicas: cargo, QTD, HRS/DIA, SALÁRIO/MÊS
- [x] Tabela de Equipamentos: equipamento, QTD, HRS/DIA, LOCAÇÃO/MÊS
- [x] Campo KPI e campo Equipes com cálculo de duração em tempo real
- [x] Seção de Requisitos de Segurança: add/remove via dropdown
- [x] Análise de eficiência vs equipe base (coef. Hh/unid e Ch/unid)
- [x] Alertas de coerência: operador sem equipamento, capacidade de transporte insuficiente
- [x] Alertas de sub-alocação por cargo vs piso mínimo (obrigatórios ausentes)
- [x] Persistência via Supabase (`grupo_comps`) com debounce
- [x] Inputs com `LocalNumInp` (onBlur save) — sem lag de digitação
- [ ] Copiar composição de uma atividade para outra
- [ ] Validação mínima: alerta quando equipes = 0 ou kpi = 0

---

## Out of Scope

| Feature | Razão |
|---|---|
| Compartilhar composição entre grupos | Cada grupo monta de forma independente |
| Verbas diversas (ferramentas, materiais) | Removido na v2 — simplificação pedagógica |
| Validação conformidade NRs em tempo real | Objetivo pedagógico, não de compliance |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Backend | Tabela `grupo_comps`: `grupo_id`, `atividade_id`, `mo_rows[]`, `eq_rows[]`, `req_ids[]`, `kpi`, `equipes` | ✅ Implementado |
| Hook | `useGrupoComps(sessionId, grupos)` — query + `upsertDebounced` | ✅ Implementado |
| Realtime | `useRealtimeComps(sessionId)` — sincroniza composições dos grupos ao vivo | ✅ Implementado |
| Cálculo | `calcA(comp, esc)` → `{ custoMo, custoEq, total, dur, durDias, moQtd, coefMo, coefEq }` | ✅ Implementado |
| Cálculo | `calcEficiencia(comp, baseComp, kpiBase, aId)` → eficiência vs equipe base | ✅ Implementado |
| Cálculo | `calcCoerencia(moRows, eqRows)` → issues de operador↔equipamento e transporte | ✅ Implementado |
| Componente | Tabela MO com linhas dinâmicas | ✅ Implementado |
| Componente | Tabela Equipamentos com linhas dinâmicas | ✅ Implementado |
| Componente | Seção Requisitos de Segurança (add/remove via Sel) | ✅ Implementado |
| Componente | Campos KPI e Equipes com duração em tempo real | ✅ Implementado |
| Componente | Alertas de sub-alocação e obrigatórios ausentes (role != "G") | ✅ Implementado |
| Input | `LocalNumInp` para todos os campos numéricos editáveis (onBlur save) | ✅ Implementado |
| Função | `gc(gi, aId)` — retorna composição; fallback `mkComp()` se indefinido | ✅ Implementado |
| Função | `moAdd/moDel/moUpd`, `eqAdd/eqDel/eqUpd`, `uKpi/uEq` via `updateComp` | ✅ Implementado |
| Função | `toggleReq(gi, aId, reqId)` — adiciona/remove reqId em `comp.reqIds` | ✅ Implementado |
| Validação | Alerta equipes=0 ou kpi=0 | ❌ Backlog |

---

## Padrão de Input

**Problema anterior:** `NumInp` controlado por `comp.kpi` + `onChange → uKpi` a cada tecla:
- Disparava `updateComp` → `compsHook.upsertDebounced` → Re-render local → lag e substituição.

**Solução — `LocalNumInp`:**

```jsx
// Em vez de:
<NumInp v={comp.kpi || ""} onChange={e => uKpi(gIdx, aObj.id, e.target.value)} w={80} />

// Usar:
<LocalNumInp v={comp.kpi || ""} onSave={v => uKpi(gIdx, aObj.id, v)} w={80} />
```

Aplicado em: KPI, Equipes, QTD/HRS/SAL de moRows, QTD/HRS/LOC de eqRows.

---

## User Stories

### P1: Montar Composição de Mão de Obra ⭐ MVP

**Acceptance Criteria**:

1. WHEN o grupo seleciona um cargo no select THEN o sistema SHALL criar linha com: cargo, `qtd=1`, `horasDia=8.5`, `sal` do catálogo.
2. WHEN o grupo altera QTD ou HRS/DIA THEN os totais SHALL recalcular após sair do campo (onBlur).
3. WHEN o grupo remove uma linha THEN o cargo SHALL retornar ao select como opção disponível.
4. WHEN todos os cargos foram adicionados THEN o select SHALL exibir "Todos os cargos adicionados".

---

### P1: Montar Composição de Equipamentos ⭐ MVP

**Acceptance Criteria**:

1. WHEN o grupo seleciona um equipamento THEN o sistema SHALL criar linha com: equipamento, `qtd=1`, `horasDia=8.5`, `loc` do catálogo.
2. WHEN o mesmo equipamento é selecionado múltiplas vezes THEN SHALL criar múltiplas linhas independentes.
3. WHEN o grupo remove uma linha THEN o equipamento SHALL continuar disponível no select.

---

### P1: Definir KPI e Equipes ⭐ MVP

**Acceptance Criteria**:

1. WHEN campo KPI está em 0 THEN `calcA` SHALL usar `kpiBase[aId]` definido pelo facilitador.
2. WHEN grupo insere `kpiOverride > 0` THEN SHALL usar `kpiOverride` na fórmula de duração.
3. WHEN `kpi = 0` e `kpiBase = 0` THEN duração SHALL exibir "—" sem erro de runtime.
4. WHEN equipes ou KPI alterados (onBlur) THEN duração e custo SHALL recalcular imediatamente.

---

### P1: Requisitos de Segurança na Composição ⭐ MVP

**Acceptance Criteria**:

1. WHEN requisitos foram cadastrados pelo facilitador para a atividade THEN SHALL exibir select para o grupo adicionar requisitos.
2. WHEN o grupo adiciona um requisito THEN `comp.reqIds` SHALL incluir o `_id` do requisito.
3. WHEN o grupo remove um requisito THEN `comp.reqIds` SHALL excluir o `_id`.
4. WHEN todos os requisitos estão adicionados THEN o select SHALL exibir "Todos os requisitos adicionados".

---

### P2: Alertas de Coerência e Sub-alocação (Facilitador)

**Acceptance Criteria**:

1. WHEN operador tem equipamento correspondente ausente THEN SHALL exibir alerta de coerência.
2. WHEN capacidade de transporte é insuficiente para o total de profissionais THEN SHALL exibir alerta.
3. WHEN cargo obrigatório (definido em `BASE_COMPOSITIONS`) está ausente THEN SHALL exibir alerta.
4. WHEN coeficiente do grupo está abaixo do piso mínimo por cargo THEN SHALL exibir badge "⚠️ SUB".
5. WHEN `role === "G"` THEN os alertas de sub-alocação/coerência NÃO são exibidos.

---

## Edge Cases

- WHEN `equipes = 0` THEN fórmula usa 1 (guarda de divisão por zero em `calcA`).
- WHEN grupo remove toda a MO THEN `moRows = []` e custo MO = 0; composição permanece válida.
- WHEN a mesma atividade é visualizada em dois grupos THEN `comps[0][aId]` e `comps[1][aId]` são completamente isolados.
- WHEN `gc(gi, aId)` é chamado para grupo/atividade sem dados THEN retorna `mkComp()` — nunca `undefined`.

---

## Requirement Traceability

| Requirement ID | Story | Status |
|---|---|---|
| COMP-01 | Estado `comps[gi][aId]` isolado, persistido no Supabase | ✅ Implementado |
| COMP-02 | `moRows[]` com linhas dinâmicas de MO | ✅ Implementado |
| COMP-03 | `calcA()` retorna `custoMo`, `custoEq`, `total`, `dur` | ✅ Implementado |
| COMP-04 | `eqRows[]` com linhas dinâmicas de Equipamentos | ✅ Implementado |
| COMP-05 | KPI com fallback para `kpiBase`; Equipes com padrão 1 | ✅ Implementado |
| COMP-06 | `toggleReq` — add/remove requisitos em `comp.reqIds` | ✅ Implementado |
| COMP-07 | `LocalNumInp` — sem lag nos campos numéricos (onBlur save) | ✅ Implementado |
| COMP-08 | `calcEficiencia` — coeficientes vs equipe base, sub-alocação | ✅ Implementado |
| COMP-09 | `calcCoerencia` — operador↔equipamento e transporte | ✅ Implementado |
| COMP-10 | Realtime sync via `useRealtimeComps` | ✅ Implementado |
| COMP-11 | Seletor de atividade (16 atividades em tabs) | ✅ Implementado |
| COMP-12 | Alertas de coerência/sub-alocação visíveis apenas para facilitador | ✅ Implementado |
| COMP-13 | Validação: alerta equipes=0 ou kpi=0 | ❌ Backlog |
| COMP-14 | Copiar composição entre atividades | ❌ Backlog |

**Coverage:** 14 total, 12 implementados, 2 em backlog.

---

## Success Criteria

- [ ] Adicionar cargo → linha criada com valores do catálogo. Alterar QTD (onBlur) → total recalcula.
- [ ] `comps[gi][aId]` para dois grupos são isolados — alterar MO do grupo 0 não afeta grupo 1.
- [ ] `gc(gi, aId)` para grupo/atividade sem dados → retorna `mkComp()` sem erro.
- [ ] KPI = 0 e kpiBase = 0 → dur exibe "—" sem erro de runtime.
- [ ] Grupo adiciona requisito → `comp.reqIds` inclui o id; remove → exclui.
- [ ] Campos numéricos: digitar sem lag, salvar ao sair do campo.
