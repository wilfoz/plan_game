# Cronograma Mensal — Specification

## Problem Statement

Após montar as composições para as 16 atividades, cada grupo precisa visualizar o cronograma gerado automaticamente pela simulação. Em obras de LT, o planejamento de prazo é crítico: as atividades de Montagem e Lançamento ocorrem em paralelo (são grupos de trabalho independentes), mas dentro de cada grupo as atividades são sequenciais. Um grupo que aloca poucas equipes com KPI baixo pode ter uma atividade de içamento ocupando 12 meses, enquanto outro grupo com mais equipes conclui em 4 meses.

Sem um cronograma visual consolidado, os grupos não conseguem avaliar o impacto das suas decisões de composição no prazo total da obra — e o facilitador não tem como conduzir o debriefing comparativo de prazo entre os grupos. O Gantt mensal é o artefato de comunicação que transforma os números das composições em uma linha do tempo compreensível.

A lógica de geração do Gantt usa cursores independentes (`cM` para Montagem, `cL` para Lançamento): as atividades de Montagem se acumulam sequencialmente no cursor `cM`, e as de Lançamento no cursor `cL`. Ambas as frentes progridem em paralelo. A duração total da obra é `max(cM, cL)` — a frente que terminar mais tarde define o prazo total.

---

## Goals

- [x] Geração automática do cronograma a partir das composições do grupo ativo
- [x] Cursores independentes `cM` e `cL` para Montagem e Lançamento (execução paralela)
- [x] Cálculo de `start` e `end` por atividade baseado no cursor da frente correspondente
- [x] Cards de resumo: Montagem (duração + custo), Lançamento (duração + custo), Duração Total, Custo Total
- [x] Tabela de atividades com colunas: GRP | ATIVIDADE | UND | ESCOPO | KPI | EQ. | DURAÇÃO | CUSTO
- [x] Gantt mensal com 10 meses (Mai/26 a Fev/27), célula "▓" para ativo e "·" para inativo
- [x] Seletor de grupo na tela de cronograma (facilitador pode visualizar cronograma de qualquer grupo)
- [x] Aviso quando duração total ultrapassa os 10 meses visíveis no Gantt
- [ ] Exportar cronograma como imagem ou PDF
- [ ] Destacar atividades no caminho crítico (aquelas que definem a duração total)
- [ ] Comparar cronogramas de dois grupos lado a lado

---

## Out of Scope

| Feature | Razão |
|---|---|
| Predecessoras e dependências entre atividades da mesma frente | Sequenciamento é fixo e linear por frente; dependências entre atividades não são parte do modelo pedagógico |
| Calendário com dias úteis, feriados e chuvas | Modelo simplificado em meses — dias úteis adicionam complexidade desnecessária para a dinâmica |
| Replanejamento manual do Gantt (arrastar barras) | O cronograma é derivado das composições; para alterar, o grupo edita a composição |
| Nivelamento de recursos entre atividades | Cada atividade tem sua própria composição independente |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Cálculo | `calcA(comp, esc)` — retorna `{ dur, total, ... }` por atividade | ✅ Implementado |
| Cálculo | Lógica de Gantt com cursores `cM` e `cL` independentes | ✅ Implementado |
| Derivação | `timeline` — array com `{ ...atividade, dur, start, end, custo }` por grupo | ✅ Implementado |
| Derivação | `durM` — duração total da frente Montagem (`cM` final) | ✅ Implementado |
| Derivação | `durL` — duração total da frente Lançamento (`cL` final) | ✅ Implementado |
| Derivação | `durTotal = Math.max(durM, durL)` | ✅ Implementado |
| Derivação | `custoTotal = sum(calcA(comp, esc).total)` para todas as 16 atividades | ✅ Implementado |
| Derivação | `custoM` e `custoL` — custos por frente | ✅ Implementado |
| Componente | Cards de resumo (4 indicadores: Montagem, Lançamento, Duração Total, Custo Total) | ✅ Implementado |
| Componente | Tabela de atividades com 8 colunas | ✅ Implementado |
| Componente | Gantt mensal com 10 colunas (Mai/26 a Fev/27) | ✅ Implementado |
| Componente | Seletor de grupo (dropdown com nomes dos grupos) | ✅ Implementado |
| UI | Aviso quando `durTotal > 10` (além do Gantt visível) | ✅ Implementado |
| UI | Exportar cronograma | ❌ Não implementado |

---

## User Stories

### P1: Visualizar Cronograma Gantt do Grupo ⭐ MVP

**User Story**: As a Grupo participante, I want visualizar o cronograma mensal gerado pelas minhas composições so that eu possa avaliar se o prazo total está dentro do esperado e identificar quais atividades são mais demoradas.

**Acceptance Criteria**:

1. WHEN o grupo acessa a tela de Cronograma THEN o sistema SHALL gerar automaticamente o `timeline` a partir das composições do grupo ativo sem necessidade de confirmação.
2. WHEN o `timeline` é gerado THEN cada atividade SHALL ter `start`, `end` e `dur` calculados com cursores `cM` (Montagem) e `cL` (Lançamento) independentes.
3. WHEN a atividade tem `dur = 0` (KPI = 0 ou escopo = 0) THEN o cursor correspondente SHALL não avançar e a atividade SHALL aparecer na tabela com duração "—".
4. WHEN a atividade tem `dur > 0` THEN o Gantt SHALL exibir células "▓" nas colunas `start+1` a `end` e células "·" nas demais.
5. WHEN `durTotal > 10` THEN o sistema SHALL exibir aviso indicando que a obra ultrapassa os meses visíveis no Gantt.
6. WHEN o grupo altera qualquer composição THEN o cronograma SHALL ser recalculado automaticamente ao retornar à tela de Cronograma.

**Independent Test**: Configurar LT com extensão = 100 km, torres estaiadas = 5 (50 ton). Definir KPI base = 10 para todas as atividades. Grupo define equipes = 1 e sem override. Verificar "Içamento Torre Estaiada": esc=50, dur=ceil(50/10)=5. Verificar que no Gantt essa atividade ocupa 5 colunas contíguas. Verificar que "Içamento Torre Crossrope" começa no mês 5+1 (após Içamento Estaiada, que veio antes na sequência de Montagem).

---

### P1: Visualizar Cards de Resumo do Cronograma ⭐ MVP

**User Story**: As a Grupo participante, I want ver os totais de prazo e custo por frente so that eu possa entender rapidamente o impacto financeiro e temporal das minhas decisões de composição.

**Acceptance Criteria**:

1. WHEN a tela de Cronograma é aberta THEN o sistema SHALL exibir 4 cards: MONTAGEM (duração em meses + custo R$), LANÇAMENTO (duração em meses + custo R$), DURAÇÃO TOTAL (`max(durM, durL)` em meses), CUSTO TOTAL (soma de todos os custos).
2. WHEN `durM > durL` THEN DURAÇÃO TOTAL SHALL exibir `durM` — Montagem é o caminho crítico.
3. WHEN `custoTotal` é calculado THEN o valor SHALL ser a soma de `calcA(comp, esc).total` para todas as 16 atividades do grupo.
4. WHEN o grupo tem composições vazias para algumas atividades THEN essas atividades contribuem com custo = verbas e duração = 0 para os totais.

**Independent Test**: Preencher composições de 3 atividades com valores conhecidos. Somar manualmente os custos e verificar que CUSTO TOTAL bate. Verificar que DURAÇÃO TOTAL é o máximo entre a soma de durações de Montagem e a soma de durações de Lançamento.

---

### P2: Selecionar Grupo para Visualização

**User Story**: As a Facilitador, I want selecionar qualquer grupo no seletor de cronograma so that eu possa visualizar e comparar os cronogramas de diferentes equipes durante o debriefing.

**Acceptance Criteria**:

1. WHEN a tela de Cronograma é aberta como Facilitador THEN o sistema SHALL exibir seletor de grupo com os nomes de todos os grupos cadastrados.
2. WHEN o facilitador seleciona um grupo diferente THEN o cronograma SHALL ser regerado com as composições do grupo selecionado.
3. WHEN apenas 1 grupo está cadastrado THEN o seletor SHALL exibir apenas 1 opção e o cronograma SHALL ser gerado para esse grupo automaticamente.
4. WHEN nenhuma composição foi preenchida pelo grupo selecionado THEN o Gantt SHALL exibir todas as atividades com duração "—" e custo total = 0.

**Independent Test**: Cadastrar 3 grupos. Montar composições diferentes para cada. Abrir Cronograma → trocar seletor entre grupos → verificar que Gantt e cards mudam corretamente para cada grupo.

---

### P2: Tabela de Detalhamento por Atividade

**User Story**: As a Grupo participante, I want ver a tabela detalhada com escopo, KPI e duração de cada atividade so that eu possa identificar quais atividades têm maior impacto no prazo e entender os parâmetros que geraram o cronograma.

**Acceptance Criteria**:

1. WHEN a tabela é exibida THEN cada linha SHALL conter: GRP (M ou L), ATIVIDADE (nome), UND (TON/KM/TORRE), ESCOPO (valor derivado da configuração da LT), KPI (override ou base), EQ. (número de equipes), DURAÇÃO (meses ou "—"), CUSTO (R$).
2. WHEN a atividade tem duração "—" THEN a linha SHALL ser exibida com estilo visual diferenciado (ex: texto cinza) para indicar que está fora do cronograma.
3. WHEN o KPI exibido na tabela é o `kpiOverride` do grupo THEN ele SHALL ser visualmente distinguível do KPI base.

**Independent Test**: Abrir tabela do cronograma. Verificar que a coluna ESCOPO de "Lançamento de Cabo Condutor" exibe `extCondutor` calculado. Verificar que atividade com KPI=0 exibe "—" na coluna DURAÇÃO.

---

## Edge Cases

- WHEN todas as atividades de Montagem têm `dur = 0` THEN `cM = 0`, `durM = 0` e DURAÇÃO TOTAL = `durL`.
- WHEN `durTotal = 0` (nenhuma atividade tem KPI configurado) THEN os cards exibem 0 e o Gantt exibe todas as colunas com "·".
- WHEN `durTotal > 10` THEN as atividades além do mês 10 não têm representação visual no Gantt — o aviso deve indicar quantos meses além do Gantt a obra se estende.
- WHEN o grupo tem `equipes = 1` e `kpi = 1` para todas as atividades THEN a obra pode facilmente ultrapassar 10 meses — o aviso SHALL aparecer.
- WHEN `calcA()` retorna `dur` não inteiro por erro de arredondamento THEN `Math.ceil` garante valor inteiro — `start` e `end` devem ser sempre inteiros.
- WHEN o facilitador alterna grupos rapidamente no seletor THEN o cronograma SHALL recalcular sem acumular estado do grupo anterior.
- WHEN o Gantt exibe mês `n` THEN a célula será "▓" se `start < n && n <= end` — verificar que a condição de borda está correta (meses 1-indexed ou 0-indexed).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CRON-01 | P1: Geração de `timeline` com cursores `cM` e `cL` independentes | Done | ✅ Implementado |
| CRON-02 | P1: `start` e `end` por atividade baseados no cursor | Done | ✅ Implementado |
| CRON-03 | P1: Gantt com 10 colunas (Mai/26 a Fev/27) e símbolos ▓/· | Done | ✅ Implementado |
| CRON-04 | P1: Atividade com `dur = 0` não avança cursor e exibe "—" | Done | ✅ Implementado |
| CRON-05 | P1: Aviso quando `durTotal > 10` | Done | ✅ Implementado |
| CRON-06 | P1: Cards de resumo (Montagem, Lançamento, Duração Total, Custo Total) | Done | ✅ Implementado |
| CRON-07 | P1: `durTotal = Math.max(durM, durL)` | Done | ✅ Implementado |
| CRON-08 | P1: `custoTotal = sum(calcA().total)` para 16 atividades | Done | ✅ Implementado |
| CRON-09 | P2: Seletor de grupo na tela de Cronograma | Done | ✅ Implementado |
| CRON-10 | P2: Recalculo automático ao trocar grupo no seletor | Done | ✅ Implementado |
| CRON-11 | P2: Tabela detalhada por atividade (8 colunas) | Done | ✅ Implementado |
| CRON-12 | P2: Estilo diferenciado para atividades com dur = "—" | Done | ✅ Implementado |
| CRON-13 | P3: Exportar cronograma como imagem ou PDF | Backlog | ❌ Não implementado |
| CRON-14 | P3: Destacar caminho crítico no Gantt | Backlog | ❌ Não implementado |
| CRON-15 | P3: Comparar dois grupos lado a lado | Backlog | ❌ Não implementado |

**Coverage:** 15 total, 12 implementados, 3 em backlog.

---

## Success Criteria

- [ ] Montagem e Lançamento progridem com cursores independentes — atividade de Montagem não interfere no `start` de atividades de Lançamento.
- [ ] Atividade com `dur = 5` ocupa exatamente 5 colunas no Gantt visual.
- [ ] `durTotal = max(durM, durL)` — verificável comparando a soma das durações de cada frente.
- [ ] `custoTotal` bate com a soma manual dos custos de todas as 16 composições.
- [ ] Trocar grupo no seletor → Gantt recalcula corretamente para o novo grupo.
- [ ] `dur = 0` → cursor não avança e célula do Gantt exibe "·" em todas as colunas.
- [ ] Duração total > 10 → aviso exibido e Gantt exibe até o mês 10 sem erro de índice.
