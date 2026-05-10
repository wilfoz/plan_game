# Atividades e KPIs Base — Specification

## Problem Statement

O facilitador define, para cada uma das 16 atividades da LT, o volume previsto de trabalho e o KPI base de referência. Esses valores alimentam os cálculos de custo e prazo de todos os grupos e são persistidos no Supabase via `useAtividadesConfig`.

---

## Goals

- [x] Listagem das 16 atividades pré-definidas (7 Montagem + 9 Lançamento)
- [x] Campo **Volume Previsto** editável por atividade (`LocalNumInp` — onBlur save)
- [x] Campo **KPI Base** editável por atividade (`LocalNumInp` — onBlur save)
- [x] Campo **Comentário** editável por atividade (`LocalTextInp` — onBlur save)
- [x] Separação visual entre bloco Montagem e Lançamento
- [x] Persistência no Supabase via `atividades_config` com debounce
- [x] Seed automático de `BASE_COMPOSITIONS[aId].kpi` ao criar sessão nova
- [ ] Indicador visual de atividades com KPI = 0 ou Volume = 0
- [ ] Valores padrão de KPI sugeridos por atividade

---

## Out of Scope

| Feature | Razão |
|---|---|
| Adicionar ou remover atividades do catálogo | Escopo padrão de uma LT — imutável |
| Editar nome ou unidade das atividades | Terminologia técnica de LT |
| KPI diferente por grupo no facilitador | Diferenciação via `kpiOverride` na tela de Composição do grupo |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Constante | `ATIVS` — array de 16 objetos `{ id, grp, desc, und }` | ✅ Implementado |
| Backend | Tabela `atividades_config`: `session_id`, `atividade_id`, `kpi_base`, `volume_prev`, `comentario` | ✅ Implementado |
| Hook | `useAtividadesConfig(sessionId)` — query + `upsertDebounced` | ✅ Implementado |
| Estado | `kpisBase` — `{ [aId]: number }` derivado de `ativLocal` | ✅ Implementado |
| Estado | `volumesPrev` — `{ [aId]: number }` derivado de `ativLocal` | ✅ Implementado |
| Estado | `comentariosAtiv` — `{ [aId]: string }` derivado de `ativLocal` | ✅ Implementado |
| Input | `LocalNumInp` para Volume Previsto e KPI Base (onBlur save) | ✅ Implementado |
| Input | `LocalTextInp` para Comentário (onBlur save) | ✅ Implementado |
| Seed | `setKpisBase` com `BASE_COMPOSITIONS[aId].kpi` em nova sessão | ✅ Implementado |
| Componente | Tabela: ATIVIDADE, UND, VOLUME PREVISTO, KPI BASE, COMENTÁRIO | ✅ Implementado |
| Componente | Separação visual Montagem / Lançamento | ✅ Implementado |
| Indicador | Visual de KPI = 0 ou Volume = 0 | ❌ Backlog |

---

## Padrão de Input

**Problema anterior:** `NumInp` com `onChange → setKpisBase(p => ...)` a cada tecla disparava `_saveAtiv` → `upsertDebounced`, e o `useEffect` de sincronização sobrescrevia o estado local ao retornar do servidor.

**Solução:**

```jsx
// Em vez de:
<NumInp v={kpisBase[a.id] || ""} onChange={e => setKpisBase(p => ({ ...p, [a.id]: +e.target.value || 0 }))} w={90} />

// Usar:
<LocalNumInp v={kpisBase[a.id] || ""} onSave={v => setKpisBase(p => ({ ...p, [a.id]: +v || 0 }))} w={90} />
```

---

## User Stories

### P1: Definir Volume Previsto por Atividade ⭐ MVP

**Acceptance Criteria**:

1. WHEN o facilitador insere um valor no campo Volume Previsto e sai do campo THEN o sistema SHALL armazenar em `volumesPrev[aId]` via `setVolumesPrev` e persistir no Supabase.
2. WHEN Volume Previsto = 0 THEN a duração SHALL exibir "—" no cronograma.
3. WHEN facilitador digita no campo THEN NÃO deve haver lag nem substituição de caracteres.

---

### P1: Definir KPI Base por Atividade ⭐ MVP

**Acceptance Criteria**:

1. WHEN o facilitador insere KPI base e sai do campo THEN `calcA` SHALL usar em `dur = ceil(vol / (equipes × kpi))`.
2. WHEN `kpiOverride > 0` no grupo THEN SHALL usar `kpiOverride` em vez de `kpiBase`.
3. WHEN KPI = 0 THEN duração SHALL exibir "—" (sem divisão por zero).
4. WHEN sessão nova é criada THEN KPIs são pré-preenchidos de `BASE_COMPOSITIONS[aId].kpi`.

---

### P1: Campo Comentário por Atividade ⭐ MVP

**Acceptance Criteria**:

1. WHEN o facilitador insere texto e sai do campo THEN o sistema SHALL armazenar em `comentariosAtiv[aId]`.
2. WHEN há comentário THEN a tab da atividade na tela de Composição SHALL exibir o texto em itálico abaixo do nome.

---

## Edge Cases

- WHEN `kpi = 0` e volume > 0 THEN `dur = 0` e cronograma exibe "—"
- WHEN `volume = 0` THEN `dur = 0` independente do KPI
- WHEN sessão sem dados → seed automático executa uma única vez (guard via `seededSessionsRef`)

---

## Requirement Traceability

| Requirement ID | Story | Status |
|---|---|---|
| KPI-01 | `ATIVS` com 16 atividades pré-definidas imutáveis | ✅ Implementado |
| KPI-02 | `kpisBase[aId]` editável via `LocalNumInp` (onBlur) | ✅ Implementado |
| KPI-03 | `volumesPrev[aId]` editável via `LocalNumInp` (onBlur) | ✅ Implementado |
| KPI-04 | `comentariosAtiv[aId]` editável via `LocalTextInp` (onBlur) | ✅ Implementado |
| KPI-05 | Fórmula `dur = ceil(vol / (equipes × kpi))` em `calcA()` | ✅ Implementado |
| KPI-06 | Separação visual Montagem / Lançamento | ✅ Implementado |
| KPI-07 | Duração "—" quando KPI = 0 ou volume = 0 | ✅ Implementado |
| KPI-08 | Seed automático de KPIs base de `BASE_COMPOSITIONS` | ✅ Implementado |
| KPI-09 | Persistência no Supabase (`atividades_config`) com debounce | ✅ Implementado |
| KPI-10 | Indicador visual de KPI = 0 ou Volume = 0 | ❌ Backlog |
| KPI-11 | Valores padrão sugeridos de KPI por atividade | ❌ Backlog |

**Coverage:** 11 total, 9 implementados, 2 em backlog.
