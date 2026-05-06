# Composição Dinâmica (Linhas Add/Remove) — Specification

## Problem Statement

Durante as versões anteriores do simulador Jornadas LT, as tabelas de Mão de Obra e Equipamentos exibiam todos os 25 cargos e 25 equipamentos do catálogo em linhas fixas pré-preenchidas. Isso causava dois problemas críticos nas sessões: (1) poluição visual que dificultava a tomada de decisão dos grupos em tempo limitado — a maioria das linhas ficava zerada e os grupos perdiam tempo scrollando por 50 linhas irrelevantes; (2) impossibilidade de comparar rapidamente as escolhas entre grupos no debriefing, pois o relatório final listava todas as 50 linhas em vez de apenas o que foi intencionalmente selecionado.

A solução é uma interface de linhas dinâmicas: tabelas começam vazias, o grupo adiciona apenas os recursos que precisa via select dropdown, e pode remover qualquer linha com um clique. Para MO, o select filtra cargos já adicionados (evitando duplicata de cargo na mesma atividade). Para Equipamentos, o select não filtra — o mesmo equipamento pode aparecer em múltiplas linhas, refletindo a realidade de obras que locam mais de uma unidade de um equipamento específico.

Cada linha recebe um `_id` único gerado por `uid()` para evitar colisões de key entre atividades diferentes e para garantir que `moDel()` e `eqDel()` removam a linha correta sem ambiguidade quando existem múltiplas linhas do mesmo tipo.

---

## Goals

- [x] Tabela MO inicia vazia — sem linhas pré-preenchidas
- [x] Select de MO lista cargos disponíveis (excluindo já adicionados)
- [x] Ao selecionar cargo no select, nova linha é criada com dados do catálogo
- [x] Botão ✕ remove linha e devolve cargo ao select disponível
- [x] Tabela Equipamentos inicia vazia
- [x] Select de Equipamentos lista todos os 25 itens (sem filtragem — podem repetir)
- [x] Ao selecionar equipamento, nova linha é criada
- [x] Botão ✕ remove linha de equipamento
- [x] Mensagem "Nenhum cargo adicionado" quando tabela MO está vazia
- [x] Mensagem "Nenhum equipamento adicionado" quando tabela Equip. está vazia
- [x] Contador "X/25 cargos" atualizado dinamicamente
- [x] `uid()` gera IDs únicos incrementais para cada linha
- [x] `moUsados` derivado via `Set` para filtrar o select de MO
- [ ] Animação de entrada ao adicionar nova linha (feedback visual)
- [ ] Arrastar e reordenar linhas (drag-and-drop)

---

## Out of Scope

| Feature | Razão |
|---|---|
| Importar composição de outra atividade | Complexidade de UX; grupos devem montar cada atividade conscientemente |
| Salvar composição como template | App é sessão única — sem persistência entre jornadas |
| Validação de composição mínima | Grupos podem submeter composições vazias — é uma escolha estratégica válida |
| Busca/filtro no select por texto | Catálogos são pequenos (25 itens) e conhecidos pelos participantes |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Estado | `comps[gi][aId].moRows[]` — array dinâmico de linhas MO | ✅ Implementado |
| Estado | `comps[gi][aId].eqRows[]` — array dinâmico de linhas Equip. | ✅ Implementado |
| Função | `moAdd(gi, aId, catId)` — adiciona linha MO com dados do catálogo | ✅ Implementado |
| Função | `moDel(gi, aId, _id)` — remove linha MO pelo `_id` único | ✅ Implementado |
| Função | `eqAdd(gi, aId, catId)` — adiciona linha de Equipamento | ✅ Implementado |
| Função | `eqDel(gi, aId, _id)` — remove linha específica de Equipamento | ✅ Implementado |
| Utilitário | `uid()` — gerador de IDs incrementais para linhas (`let c = 0; return () => ++c`) | ✅ Implementado |
| Componente | `<BtnDel>` — botão ✕ com hover vermelho | ✅ Implementado |
| Componente | `<Sel>` — select dropdown com placeholder e opção desabilitada | ✅ Implementado |
| Derivação | `moUsados = new Set(comp.moRows.map(r => r.catId))` | ✅ Implementado |
| Derivação | `moOpts = MO_CAT.filter(r => !moUsados.has(r.id))` | ✅ Implementado |
| UI | Mensagem "Nenhum cargo adicionado" quando `moRows.length === 0` | ✅ Implementado |
| UI | Mensagem "Nenhum equipamento adicionado" quando `eqRows.length === 0` | ✅ Implementado |
| UI | Contador "X/25 cargos" abaixo do select de MO | ✅ Implementado |
| UI | Animação de entrada ao adicionar linha | ❌ Não implementado |

---

## User Stories

### P1: Adicionar Cargo via Select ⭐ MVP

**User Story**: As a Grupo participante, I want selecionar um cargo do catálogo para adicionar à composição da atividade so that eu possa montar exatamente a equipe que preciso sem poluição visual de linhas vazias.

**Acceptance Criteria**:

1. WHEN o grupo acessa uma atividade pela primeira vez THEN a tabela MO SHALL exibir a mensagem "Nenhum cargo adicionado" e nenhuma linha de dados.
2. WHEN o grupo clica no select de MO THEN o sistema SHALL exibir apenas os cargos que ainda não foram adicionados à composição desta atividade.
3. WHEN o grupo seleciona um cargo no select THEN o sistema SHALL criar uma nova linha na tabela com: cargo, `qtd = 1`, `alim = 63.53`, `aloj = 19.09`, `saude = 0.77`, `folgas = 12.20` (valores padrão do catálogo) e calcular o `total/mês`.
4. WHEN uma linha é adicionada THEN o cargo selecionado SHALL desaparecer do select para evitar duplicata.
5. WHEN todos os 25 cargos foram adicionados THEN o select SHALL exibir "✅ Todos os cargos adicionados" e ficar desabilitado.
6. WHEN o grupo altera o campo `qtd` de uma linha THEN o sistema SHALL recalcular o `total/mês` daquela linha em tempo real.

**Independent Test**: Abrir atividade "Içamento Torre Estaiada". Verificar mensagem vazia. Selecionar "MONTADOR III" — verificar que linha aparece com qtd=1 e total calculado. Verificar que "MONTADOR III" sumiu do select. Selecionar "TÉCNICO DE SEGURANÇA DO TRABALHO" — verificar 2 linhas. Alterar qtd do MONTADOR III para 4 — verificar que total atualiza em tempo real.

---

### P1: Remover Cargo via Botão ✕ ⭐ MVP

**User Story**: As a Grupo participante, I want remover uma linha de cargo da composição so that eu possa corrigir escolhas erradas e devolver o cargo ao pool disponível para reutilização.

**Acceptance Criteria**:

1. WHEN o grupo clica no botão ✕ de uma linha de MO THEN o sistema SHALL remover a linha pelo `_id` único via `moDel(gi, aId, _id)`.
2. WHEN a linha é removida THEN o `catId` do cargo SHALL retornar ao set de disponíveis e aparecer novamente no select.
3. WHEN a última linha de MO é removida THEN a tabela SHALL exibir a mensagem "Nenhum cargo adicionado".
4. WHEN dois cargos diferentes estão na tabela e o segundo é removido THEN apenas o segundo SHALL ser removido — o primeiro permanece intacto.
5. WHEN o botão ✕ é visualizado THEN SHALL ter feedback de hover em vermelho para indicar ação destrutiva.

**Independent Test**: Adicionar MONTADOR I e MONTADOR II. Clicar ✕ em MONTADOR I. Verificar que apenas MONTADOR II permanece e que MONTADOR I voltou ao select. Clicar ✕ em MONTADOR II — verificar mensagem "Nenhum cargo adicionado".

---

### P1: Adicionar e Remover Equipamentos ⭐ MVP

**User Story**: As a Grupo participante, I want adicionar equipamentos do catálogo à composição e remover os desnecessários so that eu possa definir exatamente a frota de máquinas para a atividade, incluindo múltiplas unidades do mesmo equipamento.

**Acceptance Criteria**:

1. WHEN o grupo acessa a seção de Equipamentos THEN a tabela SHALL exibir mensagem "Nenhum equipamento adicionado" e nenhuma linha.
2. WHEN o grupo seleciona um equipamento no select THEN o sistema SHALL criar nova linha via `eqAdd(gi, aId, catId)` com `qtd = 1` e custo do catálogo.
3. WHEN o mesmo equipamento é selecionado novamente THEN o sistema SHALL criar uma segunda linha independente — equipamentos NÃO são filtrados do select após adição.
4. WHEN o grupo clica ✕ em uma linha de equipamento THEN `eqDel(gi, aId, _id)` SHALL remover apenas aquela linha pelo `_id`, sem afetar outras linhas do mesmo equipamento.
5. WHEN a última linha de equipamento é removida THEN a tabela SHALL exibir "Nenhum equipamento adicionado".
6. WHEN o grupo altera `qtd` de um equipamento THEN `subtotal = custo/mês × qtd` SHALL atualizar em tempo real.

**Independent Test**: Abrir atividade "Lançamento de Cabo Condutor". Adicionar CONJUNTO LANÇAMENTO CONDUTOR. Adicionar novamente — verificar 2 linhas do mesmo equipamento. Remover a primeira linha — verificar que apenas a segunda permanece. Verificar que o select ainda oferece CONJUNTO LANÇAMENTO CONDUTOR.

---

### P2: Contador de Cargos e Feedback de Estado

**User Story**: As a Grupo participante, I want ver quantos cargos já foram adicionados à composição so that eu possa gerenciar o tamanho da equipe e saber quantos ainda estão disponíveis.

**Acceptance Criteria**:

1. WHEN o grupo adiciona um cargo THEN o contador abaixo do select SHALL atualizar de "X/25 cargos" para "(X+1)/25 cargos" imediatamente.
2. WHEN o grupo remove um cargo THEN o contador SHALL decrementar de volta.
3. WHEN nenhum cargo foi adicionado THEN o contador SHALL exibir "0/25 cargos".
4. WHEN todos os 25 cargos foram adicionados THEN o contador SHALL exibir "25/25 cargos" e o select SHALL ficar desabilitado.

**Independent Test**: Composição vazia → contador "0/25". Adicionar 3 cargos → contador "3/25". Remover 1 → contador "2/25".

---

## Edge Cases

- WHEN `uid()` é chamado simultaneamente para duas atividades diferentes THEN os IDs gerados SHALL ser únicos globalmente — colisão de `_id` causaria remoção de linha errada.
- WHEN `moDel(gi, aId, _id)` é chamado com `_id` que não existe em `moRows` THEN o array SHALL permanecer inalterado sem lançar exceção.
- WHEN o grupo navega para outra atividade e volta THEN as linhas adicionadas anteriormente SHALL persistir (estado mantido em `comps[gi][aId]`).
- WHEN `moOpts` é computado e `MO_CAT` tem 25 cargos mas `moUsados` tem 25 entradas THEN `moOpts.length === 0` e o select SHALL ficar desabilitado sem erro.
- WHEN `eqDel` é chamado e há duas linhas do mesmo `catId` THEN apenas a linha com o `_id` correto SHALL ser removida — identificação é por `_id`, não por `catId`.
- WHEN a atividade muda (seletor de atividade) THEN `moUsados` e `moOpts` SHALL ser rederivados a partir do `moRows` da nova atividade, não da anterior.
- WHEN um grupo com 0 linhas de MO e 0 linhas de EQ tem a composição calculada THEN `calcA()` SHALL retornar `{ dur: 0, total: verbas.ferramentas + verbas.materiais }` sem erro.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| DYN-01 | P1: Tabela MO inicia vazia com mensagem de estado | Done | ✅ Implementado |
| DYN-02 | P1: `moAdd(gi, aId, catId)` adiciona linha com dados do catálogo | Done | ✅ Implementado |
| DYN-03 | P1: `moUsados` filtra `moOpts` — cargos usados somem do select | Done | ✅ Implementado |
| DYN-04 | P1: `moDel(gi, aId, _id)` remove linha e devolve catId ao pool | Done | ✅ Implementado |
| DYN-05 | P1: Select desabilitado quando todos os 25 cargos são adicionados | Done | ✅ Implementado |
| DYN-06 | P1: Tabela EQ inicia vazia com mensagem de estado | Done | ✅ Implementado |
| DYN-07 | P1: `eqAdd(gi, aId, catId)` adiciona linha (sem filtrar catId) | Done | ✅ Implementado |
| DYN-08 | P1: `eqDel(gi, aId, _id)` remove linha específica de EQ por `_id` | Done | ✅ Implementado |
| DYN-09 | P1: `uid()` gera IDs únicos incrementais | Done | ✅ Implementado |
| DYN-10 | P1: `<BtnDel>` com hover vermelho | Done | ✅ Implementado |
| DYN-11 | P1: `<Sel>` select dropdown com placeholder desabilitado | Done | ✅ Implementado |
| DYN-12 | P2: Contador "X/25 cargos" atualizado dinamicamente | Done | ✅ Implementado |
| DYN-13 | P2: Estado persiste ao navegar entre atividades | Done | ✅ Implementado |
| DYN-14 | P3: Animação de entrada ao adicionar nova linha | Backlog | ❌ Não implementado |
| DYN-15 | P3: Arrastar e reordenar linhas (drag-and-drop) | Backlog | ❌ Não implementado |

**Coverage:** 15 total, 13 implementados, 2 em backlog.

---

## Success Criteria

- [ ] Tabela MO exibe "Nenhum cargo adicionado" ao abrir atividade pela primeira vez.
- [ ] Adicionar MONTADOR III → linha aparece, MONTADOR III some do select, contador "1/25".
- [ ] Remover linha → MONTADOR III volta ao select, contador "0/25".
- [ ] Adicionar GUINDASTE duas vezes → 2 linhas independentes, select ainda oferece GUINDASTE.
- [ ] Remover uma das linhas de GUINDASTE pelo ✕ → apenas aquela linha é removida.
- [ ] Navegar para outra atividade e voltar → linhas adicionadas continuam presentes.
- [ ] `uid()` gera IDs únicos mesmo após múltiplas adições e remoções na mesma sessão.
