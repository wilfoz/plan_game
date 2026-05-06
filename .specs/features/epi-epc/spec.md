# EPI e EPC — Specification

## Problem Statement

Em obras de Linha de Transmissão, o trabalho em altura com cabos energizados e içamento de estruturas pesadas exige rigorosa conformidade com equipamentos de proteção. No simulador Jornadas LT, a segurança é o critério de maior peso no score final (40%), com regra de desclassificação automática para grupos que atingem menos de 70% de aderência. Esse peso elevado tem propósito pedagógico explícito: demonstrar que segurança não é custo opcional, mas componente essencial de uma composição de alta performance.

O facilitador configura o "gabarito de segurança" antes de iniciar a sessão: define quais EPIs são obrigatórios para cada cargo do catálogo de MO (estrutura `epiCargo`) e quais EPCs são necessários para cada atividade (estrutura `epcAtiv`). Esse gabarito é o padrão contra o qual as composições dos grupos são avaliadas no módulo de Ranking. Um grupo que aloca MONTADORES sem configurar seus EPIs obrigatórios, ou que executa atividades em altura sem Corda Linha de Vida, terá score de segurança reduzido.

Atualmente, a integração entre a configuração do facilitador (`epiCargo`) e o campo de seleção explícita de EPI por cargo na tela de Composição do Grupo é um gap identificado: os EPIs são computados via verbas fixas, não via seleção granular por linha de MO. O facilitador pode configurar o gabarito, mas a avaliação de aderência usa lógica simplificada nesta versão.

---

## Goals

- [x] Exibição do catálogo de 20 EPIs com nome e custo (R$ 50,00 cada)
- [x] Exibição do catálogo de 4 EPCs com nome e custo unitário
- [x] Matriz `epiCargo`: checkbox por EPI por cargo de MO — facilitador define quais EPIs são obrigatórios para cada cargo
- [x] Matriz `epcAtiv`: checkbox por EPC por atividade — facilitador define quais EPCs são necessários para cada atividade
- [x] Estado `epiCargo: { [moId]: { [epiId]: boolean } }` persistido no estado da sessão
- [x] Estado `epcAtiv: { [ativId]: { [epcId]: boolean } }` persistido no estado da sessão
- [x] Lógica de score de segurança `calcSegScore(gi)` que usa `epiCargo` como gabarito
- [ ] Seleção em lote de EPIs por perfil de cargo (ex: "trabalho em altura" marca automaticamente Cinto, Talabarte em Y, Trava Quedas)
- [ ] Visualização do gabarito consolidado por atividade (EPIs requeridos por todos os cargos presentes)
- [ ] Exportar gabarito EPI/EPC em PDF para distribuição aos grupos

---

## Out of Scope

| Feature | Razão |
|---|---|
| Gestão do catálogo de EPIs (adicionar/remover/editar itens) | Catálogo é fixo por jornada — 20 EPIs e 4 EPCs são suficientes para o escopo pedagógico |
| Cálculo de custo de EPI por grupo (custo de Segurança na composição) | Custo de EPI é incluído via verba fixa na composição — não há linha de custo de EPI explícita nesta versão |
| Normas regulamentadoras detalhadas (NR-10, NR-35 por atividade) | O objetivo é pedagógico, não de compliance regulatório |
| Seleção de EPI pelo grupo na tela de Composição (linha a linha) | Gap identificado — integração `epiCargo` → linha de MO → seleção explícita é backlog de evolução |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Constante | `EPI_CAT` — array de 20 objetos `{ id, nome, custo: 50 }` | ✅ Implementado |
| Constante | `EPC_CAT` — array de 4 objetos `{ id, nome, custo }` | ✅ Implementado |
| Estado | `epiCargo: { [moId]: { [epiId]: boolean } }` — EPIs obrigatórios por cargo | ✅ Implementado |
| Estado | `epcAtiv: { [ativId]: { [epcId]: boolean } }` — EPCs necessários por atividade | ✅ Implementado |
| Função | `calcSegScore(gi)` — calcula score de segurança 0–100 do grupo | ✅ Implementado |
| Componente | Tabela de EPIs por cargo (matriz checkbox — cargos × EPIs) | ✅ Implementado |
| Componente | Tabela de EPCs por atividade (matriz checkbox — atividades × EPCs) | ✅ Implementado |
| Integração | Seleção explícita de EPI por linha de MO na composição do grupo | ❌ Não implementado (gap) |
| UI | Seleção em lote por perfil de risco | ❌ Não implementado |

---

## User Stories

### P1: Configurar EPIs Obrigatórios por Cargo ⭐ MVP

**User Story**: As a Facilitador, I want definir quais EPIs são obrigatórios para cada cargo do catálogo de MO so that o sistema possa avaliar a aderência de segurança das composições dos grupos no ranking final.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de EPI/EPC THEN o sistema SHALL exibir uma matriz de checkboxes com os 25 cargos de MO nas linhas e os 20 EPIs nas colunas (ou estrutura equivalente de painel por cargo).
2. WHEN o facilitador marca o checkbox `epiCargo[moId][epiId] = true` THEN o sistema SHALL registrar aquele EPI como obrigatório para aquele cargo no gabarito de segurança.
3. WHEN o facilitador desmarca um checkbox THEN `epiCargo[moId][epiId]` SHALL ser definido como `false` e o EPI deixará de ser exigido para aquele cargo.
4. WHEN um grupo adiciona um cargo na composição THEN o sistema SHALL verificar quais EPIs são exigidos via `epiCargo[cargo.catId]` para calcular a aderência na avaliação final.
5. WHEN nenhum EPI é configurado como obrigatório para nenhum cargo THEN `calcSegScore()` SHALL retornar 85 (score padrão para composição sem gabarito) e não SHALL penalizar os grupos.
6. WHEN o facilitador configura o gabarito THEN os dados de `epiCargo` SHALL persistir no estado da sessão até que a janela do browser seja fechada.

**Independent Test**: Configurar MONTADOR III com EPIs: Capacete MSA, Cinto de Segurança, Talabarte em Y, Trava Quedas marcados. Verificar que `epiCargo["montador-iii"]` tem esses 4 EPIs como `true`. Abrir Ranking → verificar que grupo que tem MONTADOR III na composição tem aderência calculada com base nesses 4 EPIs.

---

### P1: Configurar EPCs por Atividade ⭐ MVP

**User Story**: As a Facilitador, I want definir quais EPCs são necessários para cada atividade so that o sistema possa avaliar se os grupos estão prevendo proteção coletiva adequada em suas composições.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a seção de EPC THEN o sistema SHALL exibir as 16 atividades nas linhas e os 4 EPCs nas colunas, com checkboxes.
2. WHEN o facilitador marca `epcAtiv[ativId][epcId] = true` THEN o sistema SHALL registrar aquele EPC como necessário para aquela atividade.
3. WHEN uma atividade requer "Corda linha de vida" (R$ 1.500) THEN o custo desse EPC SHALL ser incorporado ao custo total daquela atividade na composição do grupo que o inclui.
4. WHEN o facilitador não configura nenhum EPC para uma atividade THEN a atividade terá custo de EPC = 0 e nenhuma penalidade de segurança relacionada a EPC.
5. WHEN o facilitador desmarca um EPC de uma atividade THEN `epcAtiv[ativId][epcId] = false` e o custo do EPC é removido do cálculo.

**Independent Test**: Marcar "Corda linha de vida" para "Içamento Torre Estaiada" e "Sinalização viária" para "Lançamento de Cabo Condutor". Verificar que `epcAtiv` contém os valores corretos. Verificar no ranking que grupos com essas atividades têm custo de EPC computado corretamente.

---

### P2: Visualizar Catálogo de EPIs e EPCs com Custos

**User Story**: As a Facilitador, I want visualizar o catálogo completo de EPIs e EPCs com seus custos unitários so that eu possa explicar aos grupos o impacto financeiro da segurança antes de iniciar a dinâmica.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela THEN o sistema SHALL exibir o catálogo de 20 EPIs com nome e custo unitário (R$ 50,00 cada).
2. WHEN o facilitador visualiza os EPCs THEN o sistema SHALL exibir os 4 EPCs com nome e custo: Sinalização viária (R$ 2.000), Corda linha de vida (R$ 1.500), Barreira de proteção (R$ 800), Cone de sinalização/cx (R$ 200).
3. WHEN um EPI ou EPC é marcado como obrigatório THEN a linha correspondente SHALL ter destaque visual para diferenciá-la das não obrigatórias.

**Independent Test**: Abrir tela de EPI/EPC. Verificar 20 EPIs listados com custo R$ 50,00 cada. Verificar 4 EPCs com custos corretos. Marcar Cinto de Segurança → verificar destaque visual na linha.

---

## Edge Cases

- WHEN o facilitador configura `epiCargo` para um cargo mas nenhum grupo seleciona esse cargo na composição THEN a configuração não afeta o score de segurança de nenhum grupo.
- WHEN `calcSegScore(gi)` é chamado para um grupo com `moRows` vazio THEN SHALL retornar score padrão (85) sem divisão por zero.
- WHEN todos os EPIs são marcados como obrigatórios para todos os cargos THEN o score de segurança exige conformidade total — grupos que omitem EPIs serão penalizados em 40% do score final.
- WHEN um cargo tem todos os 20 EPIs marcados como obrigatórios THEN a lógica de score deve iterar sobre todos os 20 sem erro de índice.
- WHEN `epcAtiv` é configurado para uma atividade com escopo = 0 THEN o custo de EPC para essa atividade SHALL ser 0 (sem escopo, sem execução, sem custo).
- WHEN o facilitador marca um EPC de alto custo (ex: Sinalização viária R$ 2.000) para múltiplas atividades THEN o custo total de EPC no ranking SHALL somar corretamente por atividade.

---

## Catálogo de Referência

**EPIs (20 itens — R$ 50,00 cada):**

| # | Nome |
|---|---|
| 1 | Calças operacionais |
| 2 | Camisas operacionais |
| 3 | Touca árabe |
| 4 | Botina biqueira de PVC |
| 5 | Luva de vaqueta |
| 6 | Óculos escuro antirrisco |
| 7 | Perneira bindim c/ velcro 3T |
| 8 | Capacete MSA aba frontal c/ carneira |
| 9 | Protetor solar FPS60 |
| 10 | Colete refletivo laranja |
| 11 | Protetor auricular tipo plug |
| 12 | Cinto de Segurança |
| 13 | Talabarte em Y |
| 14 | Trava Quedas |
| 15 | Talabarte Abdominal |
| 16 | Bolsa para Cinto |
| 17 | Botina para operador de motosserra |
| 18 | Calça para operador de motosserra |
| 19 | Camisa para operador de motosserra |
| 20 | Luva vaqueta motosserrista |

**EPCs (4 itens):**

| # | Nome | Custo |
|---|---|---|
| 1 | Sinalização viária | R$ 2.000 |
| 2 | Corda linha de vida | R$ 1.500 |
| 3 | Barreira de proteção | R$ 800 |
| 4 | Cone de sinalização/cx | R$ 200 |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| EPI-01 | P1: Catálogo `EPI_CAT` com 20 itens a R$ 50 | Done | ✅ Implementado |
| EPI-02 | P1: Catálogo `EPC_CAT` com 4 itens e custos | Done | ✅ Implementado |
| EPI-03 | P1: Estado `epiCargo` — matriz moId × epiId | Done | ✅ Implementado |
| EPI-04 | P1: Estado `epcAtiv` — matriz ativId × epcId | Done | ✅ Implementado |
| EPI-05 | P1: Matriz de checkboxes EPI por cargo na UI | Done | ✅ Implementado |
| EPI-06 | P1: Matriz de checkboxes EPC por atividade na UI | Done | ✅ Implementado |
| EPI-07 | P1: `calcSegScore(gi)` usa `epiCargo` como gabarito | Done | ✅ Implementado |
| EPI-08 | P1: Score padrão 85 quando `epiCargo` vazio | Done | ✅ Implementado |
| EPI-09 | P2: Exibição de custo unitário de EPI e EPC | Done | ✅ Implementado |
| EPI-10 | P2: Destaque visual em EPIs/EPCs marcados | Done | ✅ Implementado |
| EPI-11 | P2: Custo de EPC incorporado ao custo total da atividade | Done | ✅ Implementado |
| EPI-12 | P2: Seleção em lote por perfil de risco | Backlog | ❌ Não implementado |
| EPI-13 | P3: Visualização de gabarito consolidado por atividade | Backlog | ❌ Não implementado |
| EPI-14 | P3: Integração `epiCargo` → seleção explícita de EPI por linha de MO | Backlog | ❌ Gap identificado |
| EPI-15 | P3: Exportar gabarito EPI/EPC em PDF | Backlog | ❌ Não implementado |

**Coverage:** 15 total, 11 implementados, 4 em backlog.

---

## Success Criteria

- [ ] Tela exibe 20 EPIs e 4 EPCs com custos corretos (R$ 50 e tabela de EPCs).
- [ ] Marcar Capacete + Cinto + Talabarte em Y para MONTADOR III → `epiCargo["montador-iii"]` contém os 3 como `true`.
- [ ] `calcSegScore(gi)` para grupo sem composição → retorna 85 sem erro de runtime.
- [ ] Grupo que aloca cargo com EPIs obrigatórios não configurados na composição → score < 100 no ranking.
- [ ] Desclassificação ativa quando score de segurança < 70 — verificável no ranking com grupo intencionalmente negligenciando EPIs.
- [ ] `epcAtiv` configurado → custo de EPC reflete no custo total da atividade correspondente no ranking.
