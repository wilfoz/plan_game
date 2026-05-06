# Atividades e KPIs Base — Specification

## Problem Statement

Em obras de Linha de Transmissão, o planejamento de prazo de cada atividade depende de três variáveis: o escopo de trabalho (ex: toneladas de aço a montar), a produtividade da equipe (KPI, ex: 5 TON/equipe-mês) e o número de equipes simultâneas. A fórmula `dur = ceil(escopo / (equipes × kpi))` é a peça central do simulador — e ela só funciona se o KPI base for maior que zero.

O facilitador define esses KPIs base antes de iniciar a sessão. Se um KPI base for deixado em 0, a atividade correspondente exibe duração "—" no cronograma de todos os grupos, independentemente de quantas equipes e equipamentos o grupo aloque. Isso invalida a análise de prazo daquela atividade para todos os participantes — o facilitador perde o controle pedagógico sobre atividades específicas.

As 16 atividades são pré-definidas pelo domínio de LT e não são editáveis pelo facilitador (nome, unidade e chave de escopo são fixas). O facilitador controla apenas o KPI base de produtividade. Os grupos podem sobrescrever o KPI base individualmente via `kpiOverride` na tela de Composição — permitindo simular ganhos de produtividade como diferencial competitivo entre os grupos.

---

## Goals

- [x] Listagem das 16 atividades pré-definidas (somente leitura) — nome, unidade (TON/KM/TORRE) e grupo (Montagem/Lançamento)
- [x] Campo KPI editável por atividade (facilitador define o valor base)
- [x] Separação visual entre bloco Montagem (10 atividades) e bloco Lançamento (6 atividades)
- [x] KPI base armazenado em `kpiBase[aId]` — mapa de id de atividade → valor numérico
- [x] Exibição da chave de escopo de cada atividade (tonEstaiada, ext, extCondutor etc.) para referência do facilitador
- [x] Fórmula de duração: `dur = ceil(escopo / (equipes × kpi))` onde `kpi = kpiOverride || kpiBase[aId] || 0`
- [ ] Valores padrão de KPI sugeridos por atividade (referência de mercado LT 500 kV)
- [ ] Indicador visual de atividades com KPI = 0 (alertando facilitador antes de iniciar)
- [ ] Exportar tabela de KPIs configurados em CSV

---

## Out of Scope

| Feature | Razão |
|---|---|
| Adicionar ou remover atividades do catálogo | As 16 atividades são o escopo padrão de uma LT — editá-las quebraria o modelo pedagógico |
| Editar nome ou unidade das atividades | Nomes são terminologia técnica de LT; alterações introduziriam inconsistência no debriefing |
| KPI diferente por grupo (no facilitador) | A diferenciação por grupo é feita via `kpiOverride` na tela de Composição — responsabilidade do Grupo |
| Simular múltiplos cenários de KPI | App é sessão única; cenários hipotéticos são conduzidos pelo facilitador na conversa oral |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Constante | `ATIVIDADES` — array de 16 objetos `{ id, nome, und, grp, eKey }` | ✅ Implementado |
| Estado | `kpiBase` — objeto `{ [aId]: number }` com KPI base por atividade | ✅ Implementado |
| Cálculo | `calcA(comp, esc)` — retorna `{ dur, total, ... }` usando `kpiOverride \|\| kpiBase \|\| 0` | ✅ Implementado |
| Cálculo | `dur = Math.ceil(esc / (comp.equipes × kpi))` com guarda `kpi > 0` | ✅ Implementado |
| Componente | Tabela de atividades com campo KPI editável por linha | ✅ Implementado |
| Componente | Separação visual Montagem (10) / Lançamento (6) | ✅ Implementado |
| UI | Exibição da chave de escopo (`eKey`) por atividade | ✅ Implementado |
| UI | Indicador visual de KPI = 0 (campo destacado) | ❌ Não implementado |

---

## User Stories

### P1: Definir KPI Base por Atividade ⭐ MVP

**User Story**: As a Facilitador, I want inserir o KPI base de produtividade para cada uma das 16 atividades so that os grupos tenham uma referência de cálculo de duração ao montar suas composições.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de Atividades e KPIs THEN o sistema SHALL exibir as 16 atividades organizadas em dois blocos: Montagem (10) e Lançamento (6), com colunas: Nome, Unidade, Escopo Base (chave), e campo KPI editável.
2. WHEN o facilitador insere um valor no campo KPI de uma atividade THEN o sistema SHALL armazenar o valor em `kpiBase[aId]` e SHALL usar esse valor como base no cálculo de duração `dur = ceil(escopo / (equipes × kpi))`.
3. WHEN o KPI base de uma atividade é 0 THEN a fórmula de duração SHALL retornar 0 e o cronograma SHALL exibir "—" para essa atividade em todos os grupos.
4. WHEN um grupo define `kpiOverride` na composição THEN o cálculo SHALL usar `kpiOverride` em vez de `kpiBase[aId]` para aquele grupo e atividade específicos.
5. WHEN `kpiOverride` é 0 ou não definido THEN o cálculo SHALL usar `kpiBase[aId]` como fallback — nunca deixar `kpi` indefinido.
6. WHEN o facilitador altera o KPI base de uma atividade THEN o valor SHALL persistir no estado da sessão e ser aplicado a todos os grupos que não definiram `kpiOverride`.

**Independent Test**: Definir KPI base de "Içamento Torre Estaiada" = 10 TON/equipe-mês. Configurar torres com estaiada.ton = 50. No grupo 1, definir equipes = 2 e kpiOverride = 0 (usar base). Verificar no cronograma: dur = ceil(50 / (2 × 10)) = 3 meses. Agora definir kpiOverride = 25 para o grupo 1. Verificar: dur = ceil(50 / (2 × 25)) = 1 mês.

---

### P1: Visualizar Catálogo de Atividades com Escopos ⭐ MVP

**User Story**: As a Facilitador, I want visualizar todas as 16 atividades com seus escopos e unidades so that eu possa explicar aos grupos como cada atividade é dimensionada e qual KPI é referência para cada tipo de trabalho.

**Acceptance Criteria**:

1. WHEN a tela de Atividades é aberta THEN o sistema SHALL exibir exatamente 10 atividades de Montagem e 6 de Lançamento, sem possibilidade de adicionar ou remover.
2. WHEN o facilitador visualiza a lista THEN cada linha SHALL mostrar: nome da atividade, unidade de produtividade (TON, KM ou TORRE) e a chave de escopo correspondente (ex: `tonEstaiada`, `extCondutor`).
3. WHEN o facilitador passa o mouse sobre a chave de escopo THEN o sistema SHALL exibir o valor calculado atual (derivado da configuração da LT) para referência visual.
4. WHEN a configuração da LT não foi preenchida THEN as chaves de escopo SHALL exibir valor "0" ao lado.

**Independent Test**: Abrir tela sem configurar a LT → verificar 16 atividades listadas, escopos exibindo 0. Configurar LT com extensão 100 km → voltar à tela de atividades → verificar que atividades de KM exibem escopo = 100.

---

### P2: Identificar Atividades sem KPI Configurado

**User Story**: As a Facilitador, I want identificar visualmente quais atividades estão com KPI = 0 before iniciar a sessão so that eu possa garantir que todos os grupos terão cálculos válidos de duração.

**Acceptance Criteria**:

1. WHEN uma atividade tem `kpiBase[aId] = 0` ou não definido THEN o campo KPI dessa linha SHALL exibir destaque visual (ex: borda laranja ou ícone de alerta).
2. WHEN todas as 16 atividades têm KPI > 0 THEN nenhum destaque de alerta SHALL ser exibido.
3. WHEN o facilitador define KPI > 0 para uma atividade com alerta THEN o alerta dessa linha SHALL desaparecer imediatamente.

**Independent Test**: Abrir tela sem nenhum KPI definido → verificar que todas as 16 linhas têm destaque de alerta. Preencher KPI = 5 na primeira linha → verificar que apenas essa linha perde o destaque.

---

## Edge Cases

- WHEN `kpi = kpiOverride || kpiBase[aId] || 0` e ambos são 0 THEN `dur = 0` e o cronograma SHALL exibir "—" para esta atividade.
- WHEN `escopo = 0` (ex: torres estaiadas não configuradas) THEN `dur = 0` independentemente do KPI — a atividade tem escopo nulo na LT configurada.
- WHEN `equipes = 0` THEN `dur` seria divisão por zero — o sistema SHALL tratar como `dur = 0` ou "—" sem erro de runtime.
- WHEN o facilitador insere KPI negativo THEN o sistema SHALL tratar como 0 (KPI negativo não tem sentido físico).
- WHEN `kpiOverride > kpiBase` THEN o grupo tem produtividade superior — isso é válido e SHALL ser refletido em menor duração.
- WHEN o KPI base é muito alto (ex: 9999) e o escopo é pequeno THEN `dur = ceil(1/9999)` = 1 mês mínimo — `Math.ceil` garante que qualquer atividade com escopo > 0 tem pelo menos 1 mês.
- WHEN `ATIVIDADES` tem a lista completa de 16 e `kpiBase` tem apenas 10 chaves THEN as 6 atividades sem chave em `kpiBase` SHALL usar `kpi = 0` via fallback `|| 0`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| KPI-01 | P1: Array `ATIVIDADES` com 16 atividades pré-definidas imutáveis | Done | ✅ Implementado |
| KPI-02 | P1: Estado `kpiBase[aId]` editável por atividade | Done | ✅ Implementado |
| KPI-03 | P1: Fórmula `dur = ceil(esc / (equipes × kpi))` em `calcA()` | Done | ✅ Implementado |
| KPI-04 | P1: Fallback `kpi = kpiOverride \|\| kpiBase[aId] \|\| 0` | Done | ✅ Implementado |
| KPI-05 | P1: Separação visual Montagem (10) / Lançamento (6) | Done | ✅ Implementado |
| KPI-06 | P1: Exibição da chave de escopo (`eKey`) por linha | Done | ✅ Implementado |
| KPI-07 | P1: Duração "—" quando KPI = 0 ou escopo = 0 | Done | ✅ Implementado |
| KPI-08 | P2: Exibição do valor de escopo calculado ao lado da chave | Done | ✅ Implementado |
| KPI-09 | P2: Indicador visual de atividades com KPI = 0 | Backlog | ❌ Não implementado |
| KPI-10 | P3: Valores padrão sugeridos de KPI por atividade | Backlog | ❌ Não implementado |
| KPI-11 | P3: Exportar tabela de KPIs em CSV | Backlog | ❌ Não implementado |

**Coverage:** 11 total, 8 implementados, 3 em backlog.

---

## Success Criteria

- [ ] Tela exibe exatamente 16 atividades: 10 de Montagem e 6 de Lançamento, sem possibilidade de adicionar ou remover.
- [ ] Preencher KPI = 10 em "Lançamento de Cabo Condutor" e extensão da LT = 200 km → grupo com equipes = 2 e sem override → cronograma exibe dur = ceil(200×fator / (2×10)).
- [ ] `kpiOverride` na composição substitui `kpiBase` para aquele grupo específico sem afetar outros grupos.
- [ ] KPI = 0 em qualquer atividade → cronograma exibe "—" sem erro de runtime (sem divisão por zero).
- [ ] Alterar KPI base → todos os grupos que não têm `kpiOverride` para aquela atividade refletem a nova duração no cronograma.
