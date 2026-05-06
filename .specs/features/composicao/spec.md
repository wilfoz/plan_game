# Composição por Atividade — Specification

## Problem Statement

O momento central da dinâmica Jornadas LT é a montagem de composições pelos grupos. Cada grupo precisa dimensionar, para cada uma das 16 atividades da LT, quais profissionais contratar, quais equipamentos locar, qual verba de ferramentas e materiais prever, e com quantas equipes e qual produtividade trabalhar. Essa é a tomada de decisão que será avaliada no ranking — não há resposta única correta, mas as escolhas têm consequências mensuráveis em custo, prazo e segurança.

O módulo de Composição é o mais complexo do simulador: integra dados de quatro catálogos (MO, Equipamentos, EPIs, EPCs), aplica fórmulas de custo de mão de obra (salário + alimentação + alojamento + saúde + encargos de folgas), aplica a fórmula de duração baseada em KPI, e alimenta o cronograma e o ranking. Qualquer inconsistência neste módulo — como `moRows` indefinido para um grupo recém-adicionado, ou `kpi = 0` gerando divisão por zero na fórmula de duração — se propaga para todos os módulos downstream.

A composição é atividade-específica: o grupo monta uma composição independente para cada uma das 16 atividades. O estado é isolado por `(grupoIdx, atividadeId)`. Um grupo pode alocar MONTADORES apenas para atividades de içamento e OPERADORES DE PULLER apenas para lançamento, sem que essas escolhas interfiram entre atividades.

---

## Goals

- [x] Seletor de atividade na tela de Composição (navegar entre as 16 atividades)
- [x] Tabela de MO com linhas dinâmicas: cargo, qtd, alim, aloj, saúde, folgas, total/mês
- [x] Tabela de Equipamentos com linhas dinâmicas: equipamento, qtd, custo/mês, subtotal
- [x] Seção de Verbas com campos editáveis: Ferramentas (R$) e Materiais (R$)
- [x] Campo KPI: aceita `kpiOverride` — sobrescreve o `kpiBase` do facilitador para aquela atividade
- [x] Campo Equipes: número de equipes simultâneas na atividade
- [x] Fórmula de custo MO: `totalMO/mês = (sal + alim + aloj + saude + folgas) × qtd`
- [x] Fórmula de duração: `dur = Math.ceil(esc / (equipes × kpi))`
- [x] Cálculo total da atividade: `total = (totalMO + totalEQ) × dur + verbas`
- [x] Exibição em tempo real de duração e custo total da composição
- [x] `getComp(gi, aId)` retorna composição do grupo `gi` para atividade `aId`
- [ ] Copiar composição de uma atividade para outra do mesmo grupo
- [ ] Histórico de alterações na composição durante a sessão
- [ ] Validação mínima: alertar se equipes = 0 ou kpi = 0

---

## Out of Scope

| Feature | Razão |
|---|---|
| Compartilhar composição entre grupos | Cada grupo monta sua composição de forma independente — sem colaboração entre grupos |
| Salvar e recuperar composições entre sessões | App é sessão única — sem persistência |
| Selecionar EPIs por linha de MO (granular) | Gap identificado — integração EPI por cargo é backlog; EPIs computados via verba nesta versão |
| Validar conformidade regulatória (NRs) em tempo real | Objetivo pedagógico, não de compliance; avaliação é feita no ranking |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Estado | `comps[gi][aId]` — objeto de composição por grupo e atividade | ✅ Implementado |
| Estado | `comps[gi][aId].moRows[]` — linhas dinâmicas de MO | ✅ Implementado |
| Estado | `comps[gi][aId].eqRows[]` — linhas dinâmicas de Equipamentos | ✅ Implementado |
| Estado | `comps[gi][aId].verbas` — `{ ferramentas: 0, materiais: 0 }` | ✅ Implementado |
| Estado | `comps[gi][aId].kpi` — `kpiOverride` do grupo (0 = usar base) | ✅ Implementado |
| Estado | `comps[gi][aId].equipes` — número de equipes (padrão: 1) | ✅ Implementado |
| Função | `getComp(gi, aId)` — retorna composição garantindo objeto não-undefined | ✅ Implementado |
| Cálculo | `calcA(comp, esc)` — retorna `{ dur, custoMO, custoEQ, verbas, total }` | ✅ Implementado |
| Cálculo | `totalMO/mês = (sal + alim + aloj + saude + folgas) × qtd` por linha | ✅ Implementado |
| Cálculo | `dur = Math.ceil(esc / (equipes × kpi))` com guarda de divisão por zero | ✅ Implementado |
| Cálculo | `total = (custoMO + custoEQ) × dur + ferramentas + materiais` | ✅ Implementado |
| Componente | Seletor de atividade (tabs ou dropdown com 16 opções) | ✅ Implementado |
| Componente | Tabela MO com linhas dinâmicas e cálculo por linha | ✅ Implementado |
| Componente | Tabela Equipamentos com linhas dinâmicas | ✅ Implementado |
| Componente | Seção Verbas (ferramentas + materiais) | ✅ Implementado |
| Componente | Campos KPI e Equipes com atualização em tempo real | ✅ Implementado |
| Componente | Exibição de duração e custo total da atividade | ✅ Implementado |
| Validação | Alerta quando equipes = 0 ou kpi = 0 | ❌ Não implementado |

---

## User Stories

### P1: Montar Composição de Mão de Obra ⭐ MVP

**User Story**: As a Grupo participante, I want selecionar cargos do catálogo e definir suas quantidades e encargos so that eu possa dimensionar a equipe necessária para a atividade e ver o custo de mão de obra calculado automaticamente.

**Acceptance Criteria**:

1. WHEN o grupo acessa a aba de composição de uma atividade THEN a tabela de MO SHALL iniciar vazia com mensagem "Nenhum cargo adicionado".
2. WHEN o grupo seleciona um cargo no select de MO THEN o sistema SHALL criar uma nova linha com: nome do cargo, `qtd = 1`, `alim = 63.53`, `aloj = 19.09`, `saude = 0.77`, `folgas = 12.20` (percentuais padrão do catálogo).
3. WHEN uma linha de MO é criada THEN o sistema SHALL calcular `total/mês = (sal × (1 + alim/100 + aloj/100 + saude/100 + folgas/100)) × qtd` em tempo real.
4. WHEN o grupo altera `qtd` em uma linha THEN o `total/mês` dessa linha SHALL atualizar imediatamente sem necessidade de confirmação.
5. WHEN o grupo remove uma linha de MO THEN o cargo correspondente SHALL retornar ao select como opção disponível.
6. WHEN todos os 25 cargos foram adicionados THEN o select de MO SHALL exibir "Todos os cargos adicionados" e ficar desabilitado.

**Independent Test**: Abrir atividade "Içamento Torre Estaiada". Adicionar OPERADOR DE GUINDASTE (sal = R$ 8.614,07). Verificar total/mês da linha com qtd=1. Alterar qtd para 3. Verificar que total/mês triplicou. Remover a linha — verificar que OPERADOR DE GUINDASTE volta ao select.

---

### P1: Montar Composição de Equipamentos ⭐ MVP

**User Story**: As a Grupo participante, I want selecionar equipamentos do catálogo e definir quantidades so that eu possa dimensionar os recursos mecânicos necessários para a atividade e ver o custo de locação calculado.

**Acceptance Criteria**:

1. WHEN o grupo acessa a seção de Equipamentos THEN a tabela SHALL iniciar vazia com mensagem "Nenhum equipamento adicionado".
2. WHEN o grupo seleciona um equipamento no select THEN o sistema SHALL criar uma nova linha com o equipamento, `qtd = 1` e custo mensal do catálogo.
3. WHEN uma linha de equipamento é criada THEN `subtotal = custo/mês × qtd` SHALL ser calculado em tempo real.
4. WHEN o mesmo equipamento é selecionado múltiplas vezes THEN o sistema SHALL criar múltiplas linhas independentes — equipamentos podem ser repetidos.
5. WHEN o grupo altera `qtd` de um equipamento THEN o `subtotal` daquela linha SHALL atualizar imediatamente.
6. WHEN o grupo remove uma linha de equipamento THEN o equipamento SHALL continuar disponível no select para ser adicionado novamente.

**Independent Test**: Abrir atividade "Içamento Torre Estaiada". Adicionar GUINDASTE (R$ 150.000/mês). Verificar subtotal = R$ 150.000 com qtd=1. Adicionar GUINDASTE novamente — verificar que aparecem 2 linhas de GUINDASTE. Alterar qtd da segunda para 2 — verificar subtotal = R$ 300.000 na segunda linha.

---

### P1: Definir KPI e Equipes para Calcular Duração ⭐ MVP

**User Story**: As a Grupo participante, I want definir o número de equipes e o KPI de produtividade da atividade so that eu possa ver a duração calculada automaticamente e ajustar minha estratégia de prazo.

**Acceptance Criteria**:

1. WHEN o grupo acessa a composição de uma atividade THEN os campos KPI e Equipes SHALL exibir: KPI = 0 (grupo vai inserir ou usar o base), Equipes = 1 (padrão).
2. WHEN o campo KPI está em 0 THEN o sistema SHALL usar `kpiBase[aId]` definido pelo facilitador para o cálculo de duração.
3. WHEN o grupo insere um valor no campo KPI (`kpiOverride > 0`) THEN a fórmula SHALL usar `kpiOverride` em vez de `kpiBase`.
4. WHEN o grupo define `equipes = 2` THEN a duração SHALL ser reduzida proporcionalmente: `dur = ceil(esc / (2 × kpi))`.
5. WHEN `kpi = 0` e `kpiBase[aId] = 0` THEN o sistema SHALL exibir duração "—" e custo total refletirá apenas verbas, sem multiplicar por duração.
6. WHEN o grupo altera equipes ou KPI THEN o custo total `(custoMO + custoEQ) × dur + verbas` SHALL atualizar em tempo real.

**Independent Test**: Atividade "Içamento Torre Estaiada" com `tonEstaiada = 100`. Facilitador definiu `kpiBase = 10`. Grupo define equipes = 1, KPI = 0 (usa base). Verificar dur = ceil(100/10) = 10. Alterar equipes para 2 → dur = ceil(100/20) = 5. Inserir kpiOverride = 20 → dur = ceil(100/40) = 3.

---

### P2: Preencher Verbas da Atividade

**User Story**: As a Grupo participante, I want inserir os valores de Ferramentas e Materiais da atividade so that o custo total reflita todos os recursos necessários além de MO e equipamentos.

**Acceptance Criteria**:

1. WHEN o grupo acessa a seção de Verbas THEN o sistema SHALL exibir dois campos numéricos: Ferramentas (R$) e Materiais (R$), ambos iniciando em 0.
2. WHEN o grupo insere valor em Ferramentas ou Materiais THEN o custo total da atividade SHALL atualizar imediatamente: `total = (custoMO + custoEQ) × dur + ferramentas + materiais`.
3. WHEN a duração é 0 (KPI não configurado) THEN verbas SHALL ser somadas diretamente ao total sem multiplicação pela duração.
4. WHEN o grupo deixa os campos de verbas em 0 THEN o custo total SHALL considerar apenas MO e Equipamentos.

**Independent Test**: Composição com MO = R$ 10.000/mês, EQ = R$ 5.000/mês, dur = 3. Inserir Ferramentas = R$ 20.000 e Materiais = R$ 30.000. Verificar total = (10.000 + 5.000) × 3 + 20.000 + 30.000 = R$ 95.000.

---

## Edge Cases

- WHEN `equipes = 0` THEN a fórmula de duração geraria divisão por zero — o sistema SHALL tratar como `equipes = 1` ou exibir "—" sem erro de runtime.
- WHEN o grupo monta composição com apenas verbas (sem MO e sem EQ) THEN custo total = verbas e duração = "—" (sem MO e EQ, o sistema não pode calcular duração por KPI de mão de obra).
- WHEN `escopo = 0` para a atividade (LT sem torres estaiadas, por exemplo) THEN `dur = 0` e custo total = verbas — a atividade não tem trabalho a executar.
- WHEN `kpiOverride` é maior que o escopo inteiro THEN `dur = 1` (mínimo de 1 mês via `Math.ceil`).
- WHEN o grupo remove toda a MO de uma atividade após ter adicionado THEN `moRows = []` e custo MO = 0, mas a composição permanece válida.
- WHEN a mesma atividade é visualizada em dois grupos diferentes THEN os estados `comps[0][aId]` e `comps[1][aId]` são completamente isolados — alteração em um não afeta o outro.
- WHEN `getComp(gi, aId)` é chamado para atividade que não existe em `comps[gi]` THEN SHALL retornar objeto padrão vazio em vez de `undefined`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| COMP-01 | P1: Estado `comps[gi][aId]` isolado por grupo e atividade | Done | ✅ Implementado |
| COMP-02 | P1: `moRows[]` com linhas dinâmicas de MO | Done | ✅ Implementado |
| COMP-03 | P1: Cálculo `total/mês` por linha de MO em tempo real | Done | ✅ Implementado |
| COMP-04 | P1: `eqRows[]` com linhas dinâmicas de equipamentos | Done | ✅ Implementado |
| COMP-05 | P1: `subtotal` por linha de equipamento | Done | ✅ Implementado |
| COMP-06 | P1: Campo KPI com fallback para `kpiBase` | Done | ✅ Implementado |
| COMP-07 | P1: Campo Equipes com padrão 1 | Done | ✅ Implementado |
| COMP-08 | P1: `dur = Math.ceil(esc / (equipes × kpi))` em `calcA()` | Done | ✅ Implementado |
| COMP-09 | P1: `total = (custoMO + custoEQ) × dur + verbas` | Done | ✅ Implementado |
| COMP-10 | P1: Exibição de duração e custo total em tempo real | Done | ✅ Implementado |
| COMP-11 | P1: `getComp(gi, aId)` garante retorno de objeto não-undefined | Done | ✅ Implementado |
| COMP-12 | P1: Seletor de atividade (navegar entre 16 atividades) | Done | ✅ Implementado |
| COMP-13 | P2: Seção de Verbas (ferramentas + materiais) editável | Done | ✅ Implementado |
| COMP-14 | P2: Verbas somadas ao total sem multiplicar por duração quando dur=0 | Done | ✅ Implementado |
| COMP-15 | P2: Validação: alerta quando equipes=0 ou kpi=0 | Backlog | ❌ Não implementado |
| COMP-16 | P3: Copiar composição de uma atividade para outra | Backlog | ❌ Não implementado |
| COMP-17 | P3: Histórico de alterações durante a sessão | Backlog | ❌ Não implementado |

**Coverage:** 17 total, 14 implementados, 3 em backlog.

---

## Success Criteria

- [ ] Adicionar MONTADOR III (R$ 3.401,83) com qtd=2 → `total/mês` da linha = R$ 3.401,83 × 2 × (1 + encargos) calculado corretamente.
- [ ] Definir equipes=2 e KPI=5 com escopo=50 TON → `dur = ceil(50/10) = 5 meses`.
- [ ] Inserir Ferramentas = R$ 10.000, Materiais = R$ 5.000 → custo total reflete verba somada ao (MO+EQ) × dur.
- [ ] `comps[gi][aId]` para dois grupos diferentes são isolados — alterar MO do grupo 0 não afeta grupo 1.
- [ ] Equipamento pode ser adicionado duas vezes na mesma atividade — duas linhas independentes no `eqRows`.
- [ ] KPI = 0 e kpiBase = 0 → dur exibe "—" sem erro de runtime.
- [ ] Remover linha de MO → cargo retorna ao select da mesma atividade.
