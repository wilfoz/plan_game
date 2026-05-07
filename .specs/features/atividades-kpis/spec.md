# Atividades e KPIs Base — Specification

## Problem Statement

Em obras de Linha de Transmissão, o planejamento de prazo de cada atividade depende de três variáveis: o volume previsto de trabalho (ex: toneladas de aço a montar), a produtividade da equipe (KPI, ex: 5 TON/equipe-dia) e o número de equipes simultâneas. A fórmula `dur = ceil(volumePrev / (equipes × kpi))` é a peça central do simulador.

O facilitador define, para cada atividade:
- **Volume Previsto** — quantidade total de trabalho esperada (editável diretamente na tela de Atividades)
- **KPI Base** — produtividade de referência em `un/dia/equipe`
- **Comentário** — observação livre sobre a atividade (opcional)

Os grupos podem sobrescrever o KPI base individualmente via `kpiOverride` na tela de Composição.

---

## Goals

- [x] Listagem das 10 atividades pré-definidas (nome e unidade fixos)
- [x] Campo **Volume Previsto** editável por atividade (substitui o escopo derivado de torres)
- [x] Campo **KPI Base** editável por atividade (un/dia/equipe)
- [x] Campo **Comentário** editável por atividade (texto livre)
- [x] Separação visual entre bloco Montagem (7 atividades) e bloco Lançamento (3 atividades)
- [x] `volumesPrev[aId]` e `comentariosAtiv[aId]` armazenados na sessão
- [x] Fórmula: `dur = ceil(volumePrev / (equipes × kpi))` onde `kpi = kpiOverride || kpiBase[aId] || 0`
- [ ] Indicador visual de atividades com KPI = 0 ou Volume Previsto = 0
- [ ] Valores padrão de KPI sugeridos por atividade (referência de mercado LT 500 kV)

---

## Out of Scope

| Feature | Razão |
|---|---|
| Adicionar ou remover atividades do catálogo | As atividades são o escopo padrão de uma LT |
| Editar nome ou unidade das atividades | Nomes são terminologia técnica de LT |
| Derivar volume automaticamente de tipos de torres | Volumes são inseridos diretamente pelo facilitador |
| KPI diferente por grupo (no facilitador) | Diferenciação por grupo via `kpiOverride` na Composição |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Constante | `ATIVS` — array de 10 objetos `{ id, grp, desc, und }` | ✅ Implementado |
| Estado | `kpisBase` — `{ [aId]: number }` KPI base por atividade | ✅ Implementado |
| Estado | `volumesPrev` — `{ [aId]: number }` Volume Previsto por atividade | ✅ Implementado |
| Estado | `comentariosAtiv` — `{ [aId]: string }` Comentário por atividade | ✅ Implementado |
| Cálculo | `calcA(comp, vol)` — retorna `{ dur, total, ... }` usando `vol = volumesPrev[aId]` | ✅ Implementado |
| Componente | Tabela com colunas: ATIVIDADE, UND, VOLUME PREVISTO, KPI BASE, COMENTÁRIO | ✅ Implementado |
| Componente | Separação visual Montagem / Lançamento | ✅ Implementado |

---

## User Stories

### P1: Definir Volume Previsto por Atividade ⭐ MVP

**User Story**: As a Facilitador, I want inserir o volume previsto de cada atividade diretamente na tela so that os grupos tenham a base correta para calcular duração e custo.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de Atividades THEN o sistema SHALL exibir as atividades com campo de Volume Previsto editável por linha.
2. WHEN o facilitador insere um valor no campo Volume Previsto THEN o sistema SHALL armazenar em `volumesPrev[aId]` e SHALL usar esse valor em `calcA()` para todos os grupos.
3. WHEN Volume Previsto = 0 THEN a duração SHALL exibir "—" no cronograma.

---

### P1: Definir KPI Base por Atividade ⭐ MVP

**Acceptance Criteria**:

1. WHEN o facilitador insere um KPI base THEN o sistema SHALL usar em `dur = ceil(vol / (equipes × kpi))`.
2. WHEN `kpiOverride` > 0 no grupo THEN SHALL usar `kpiOverride` em vez de `kpiBase`.
3. WHEN KPI = 0 THEN duração SHALL exibir "—" (sem divisão por zero).

---

### P1: Campo Comentário por Atividade ⭐ MVP

**Acceptance Criteria**:

1. WHEN o facilitador insere texto no campo Comentário THEN o sistema SHALL armazenar em `comentariosAtiv[aId]`.
2. O campo SHALL aceitar texto livre sem validação de formato.

---

## Edge Cases

- WHEN `kpi = 0` e volume > 0 THEN `dur = 0` e cronograma exibe "—"
- WHEN `volume = 0` THEN `dur = 0` independente do KPI
- WHEN `equipes = 0` THEN tratado como `dur = 0`

---

## Requirement Traceability

| Requirement ID | Story | Status |
|---|---|---|
| KPI-01 | Array `ATIVS` com atividades pré-definidas imutáveis | ✅ Implementado |
| KPI-02 | Estado `kpisBase[aId]` editável | ✅ Implementado |
| KPI-03 | Estado `volumesPrev[aId]` editável | ✅ Implementado |
| KPI-04 | Estado `comentariosAtiv[aId]` editável | ✅ Implementado |
| KPI-05 | Fórmula `dur = ceil(vol / (equipes × kpi))` em `calcA()` | ✅ Implementado |
| KPI-06 | Separação visual Montagem / Lançamento | ✅ Implementado |
| KPI-07 | Duração "—" quando KPI = 0 ou volume = 0 | ✅ Implementado |
| KPI-08 | Indicador visual de KPI = 0 ou Volume = 0 | ❌ Backlog |
| KPI-09 | Valores padrão sugeridos de KPI | ❌ Backlog |
