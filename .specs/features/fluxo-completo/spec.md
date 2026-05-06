# Fluxo Completo da Jornada — Specification

## Problem Statement

O simulador Jornadas LT é uma experiência pedagógica end-to-end: começa com um facilitador configurando os parâmetros reais de uma Linha de Transmissão e termina com o debriefing coletivo revelando quais equipes montaram as composições mais eficientes e seguras. Cada módulo isolado pode funcionar corretamente, mas a dinâmica só é bem-sucedida se o fluxo completo — do primeiro campo preenchido na Config LT até o último score exibido no Ranking — for coerente e sem quebras de estado.

Os principais riscos de integração em um app de estado em memória são: (1) módulos que dependem de dados inicializados em módulos anteriores (ex: cronograma que usa `ESC` antes da LT ser configurada); (2) inconsistências entre o tamanho do array `grupos` e o array `comps` quando grupos são adicionados/removidos durante a sessão; (3) scores do Ranking que usam custos e durações calculados por `calcA()` de forma diferente dos valores exibidos no Cronograma.

Este spec de integração não documenta um módulo isolado, mas o contrato entre os módulos: quais dados cada módulo produz, quais módulos consomem e quais são os invariantes do sistema que devem ser verdadeiros em qualquer ponto da sessão.

---

## Goals

- [x] Fluxo Facilitador → Configuração completa de LT antes do início da sessão
- [x] Fluxo Facilitador → Cadastro de grupos com inicialização de `comps`
- [x] Fluxo Facilitador → KPIs base definidos para as 16 atividades
- [x] Fluxo Facilitador → Gabarito de EPI/EPC configurado
- [x] Fluxo Grupo → Seleção de grupo e acesso à tela de Composição
- [x] Fluxo Grupo → Montagem de composições para todas as 16 atividades
- [x] Fluxo Grupo → Visualização de cronograma gerado automaticamente
- [x] Fluxo Facilitador → Exibição de Ranking ao vivo com scores calculados
- [x] Invariante: `comps.length === grupos.length` em todo momento da sessão
- [x] Invariante: `custoTotal` no Ranking = `custoTotal` no Cronograma para o mesmo grupo
- [x] Invariante: `durTotal` no Ranking = `durTotal` no Cronograma para o mesmo grupo
- [x] Invariante: `calcA(comp, ESC)` produz o mesmo resultado em qualquer módulo que o chame
- [ ] Reset completo da sessão (nova Jornada) sem reload da página
- [ ] Checklist pré-jornada para o facilitador (confirmar LT configurada, grupos cadastrados, KPIs definidos)

---

## Out of Scope

| Feature | Razão |
|---|---|
| Múltiplas sessões simultâneas | App é sessão única em memória — isolamento entre sessões requer backend |
| Replay de decisões passo a passo | O debriefing é oral, conduzido pelo facilitador — replay automatizado é over-engineering |
| Persistência do estado da sessão para retomada | Sem backend, sem localStorage persistente entre sessões; aceito como limitação por design |
| Integração com sistemas externos (ERP, TOTVS, SAP) | App é simulador de treinamento, não sistema de gestão de obra |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Estado global | `lt`, `torres`, `kpiBase`, `epiCargo`, `epcAtiv`, `grupos`, `comps`, `role`, `screen`, `gIdx` | ✅ Implementado |
| Invariante | `comps.length === grupos.length` mantido por `addGrupo()` e `delGrupo()` | ✅ Implementado |
| Invariante | `calcA(comp, ESC)` é função pura — mesmo input sempre gera mesmo output | ✅ Implementado |
| Invariante | `ESC` derivado de `lt` e `torres` via `useMemo` — atualiza automaticamente | ✅ Implementado |
| Integração | Cronograma consome `calcA()` e `ESC` — mesmas funções usadas pelo Ranking | ✅ Implementado |
| Integração | Ranking consome `calcA()` com mesmo `ESC` do Cronograma | ✅ Implementado |
| Integração | `kpiBase[aId]` consumido por `calcA()` via `comp.kpi || kpiBase[aId] || 0` | ✅ Implementado |
| Reset | Reset completo da sessão via reload da página | ✅ Implementado (reload) |
| Reset | Reset da sessão sem reload (botão "Nova Jornada") | ❌ Não implementado |
| Checklist | Checklist pré-jornada para facilitador | ❌ Não implementado |

---

## User Stories

### P1: Fluxo de Configuração pelo Facilitador ⭐ MVP

**User Story**: As a Facilitador, I want configurar todos os parâmetros da jornada (LT, grupos, KPIs, EPI/EPC) em sequência so that os grupos tenham todas as informações necessárias para montar composições coerentes com a LT real.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela Config LT e preenche todos os campos THEN o objeto `ESC` SHALL ser derivado automaticamente e estar disponível para `calcA()` em todos os módulos.
2. WHEN o facilitador acessa Gestão de Grupos e adiciona N grupos THEN `grupos.length === N` e `comps.length === N` após cada adição.
3. WHEN o facilitador acessa Atividades/KPIs e define KPI base para cada atividade THEN `kpiBase[aId]` SHALL estar disponível para todos os grupos que não definirem `kpiOverride`.
4. WHEN o facilitador acessa EPI/EPC e configura o gabarito THEN `epiCargo` e `epcAtiv` SHALL ser usados por `calcSegScore()` no Ranking.
5. WHEN o facilitador completa a configuração THEN qualquer grupo que acessar a tela de Composição SHALL ver escopos não-zerados nas suas atividades.
6. WHEN o facilitador configura a LT com circuito duplo THEN `ESC.extCondutor` SHALL usar `fator = 2` e o cronograma de todos os grupos SHALL refletir o escopo dobrado de lançamento.

**Independent Test**: Preencher LT: 500 kV, 200 km, duplo, 3 cabos/fase. Adicionar 2 grupos. Definir KPI = 10 para todas as atividades. Configurar EPIs mínimos para MONTADORES. Entrar como Grupo 1 → abrir "Lançamento de Cabo Condutor" → verificar que escopo exibe `extCondutor = 200×3×3×2 = 3.600 km`. Definir KPI override = 20, equipes = 2 → dur = ceil(3600/(2×20)) = 90.

---

### P1: Fluxo de Composição pelo Grupo ⭐ MVP

**User Story**: As a Grupo participante, I want montar composições para todas as atividades relevantes e visualizar o cronograma gerado so that eu possa tomar decisões estratégicas de custo e prazo antes do ranking.

**Acceptance Criteria**:

1. WHEN o grupo seleciona seu nome e acessa Composição THEN o sistema SHALL exibir as 16 atividades para montagem com escopos derivados da configuração da LT.
2. WHEN o grupo preenche composições para N atividades (de 1 a 16) THEN as atividades sem composição SHALL ter custo = 0 e duração = 0 no cronograma e ranking.
3. WHEN o grupo acessa o Cronograma THEN `durTotal`, `custoTotal`, `durM` e `durL` SHALL refletir exatamente as composições preenchidas.
4. WHEN o grupo vê o Cronograma e depois retorna à Composição para alterar uma atividade THEN ao retornar ao Cronograma o valor alterado SHALL ser refletido automaticamente.
5. WHEN o grupo define `kpiOverride` em uma atividade THEN apenas aquela atividade daquele grupo SHALL usar o override — outros grupos e outras atividades não são afetados.

**Independent Test**: Grupo 1 monta 3 composições. Grupo 2 monta as mesmas 3 atividades com valores diferentes. Verificar no Cronograma de cada grupo que os valores são independentes. Alterar composição do Grupo 1 → verificar que Cronograma do Grupo 2 não mudou.

---

### P1: Fluxo de Ranking e Debriefing ⭐ MVP

**User Story**: As a Facilitador, I want exibir o ranking final no telão e conduzir o debriefing so that os participantes entendam o impacto das suas decisões e internalizem a mensagem sobre liderança e segurança.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de Ranking THEN os scores de todos os grupos SHALL ser calculados usando os mesmos `calcA()` e `ESC` do Cronograma — não pode haver discrepância.
2. WHEN `custoTotal` no Ranking de um grupo difere do `custoTotal` no Cronograma do mesmo grupo THEN isso constitui bug crítico de integridade — os dois valores devem ser idênticos.
3. WHEN `durTotal` no Ranking de um grupo difere do `durTotal` no Cronograma THEN isso constitui bug crítico de integridade.
4. WHEN o ranking é exibido THEN o facilitador SHALL ver os scores de Custo (30%), Prazo (30%) e Segurança (40%) de todos os grupos simultaneamente.
5. WHEN a mensagem de debriefing é exibida THEN ela SHALL contextualizar a regra de desclassificação por segurança e abrir espaço para discussão sobre as composições.

**Independent Test**: Montar composições conhecidas para 2 grupos com custos e prazos diferentes. Verificar no Cronograma o `custoTotal` de cada grupo. Ir para Ranking → verificar que os valores de custo usados no score batem com o Cronograma. Grupo com sS < 70 → verificar desclassificação.

---

### P2: Invariantes do Sistema em Toda a Sessão

**User Story**: As a Desenvolvedor, I want que os invariantes do sistema sejam mantidos em qualquer sequência de operações so that nenhuma combinação de ações do facilitador e dos grupos cause estado inválido ou erros de runtime.

**Acceptance Criteria**:

1. WHEN `addGrupo()` ou `delGrupo()` é chamado THEN `comps.length === grupos.length` SHALL ser verdadeiro após a operação.
2. WHEN `getComp(gi, aId)` é chamado com qualquer `gi < grupos.length` e qualquer `aId` válido THEN SHALL retornar objeto não-undefined.
3. WHEN `calcA(comp, ESC)` é chamado com `comp` vazio e `ESC` zerado THEN SHALL retornar `{ dur: 0, total: 0 }` sem exceção.
4. WHEN `ESC` é recalculado após mudança na Config LT THEN `useMemo` SHALL propagar o novo valor para todos os módulos que consomem `ESC` sem necessidade de reload.
5. WHEN o facilitador altera `kpiBase[aId]` durante a sessão THEN grupos sem `kpiOverride` para aquela atividade SHALL ter suas durações recalculadas automaticamente no Cronograma.

**Independent Test**: Adicionar grupo → adicionar 3 MO ao grupo → remover o grupo → adicionar novo grupo → verificar que `comps.length === grupos.length` em cada passo. Verificar que o novo grupo tem `moRows` vazio sem dados do grupo removido.

---

### P3: Reset de Sessão para Nova Jornada

**User Story**: As a Facilitador, I want reiniciar o simulador para uma nova jornada so that eu possa reutilizar o app em múltiplos treinamentos sem precisar fechar e reabrir o browser.

**Acceptance Criteria**:

1. WHEN o facilitador clica em "Nova Jornada" THEN o sistema SHALL resetar todos os estados para os valores iniciais: `lt = {}`, `torres = {}`, `kpiBase = {}`, `epiCargo = {}`, `epcAtiv = {}`, `grupos = []`, `comps = []`, `role = null`.
2. WHEN o reset é executado THEN a tela SHALL retornar à tela inicial (intro).
3. WHEN o reset é executado THEN nenhum dado da jornada anterior SHALL persistir na memória — sem vazamento de estado entre jornadas.
4. WHEN o facilitador acidentalmente clica em "Nova Jornada" THEN o sistema SHALL exibir diálogo de confirmação antes de executar o reset.

**Independent Test**: Completar uma jornada com 3 grupos e composições preenchidas. Clicar "Nova Jornada" → confirmar → verificar que `grupos.length === 0`, `kpiBase === {}` e a tela inicial é exibida.

---

## Edge Cases

- WHEN a LT não é configurada antes dos grupos montarem composições THEN `ESC` terá todos os escopos em 0 e as durações serão 0 — os grupos devem ser orientados a aguardar a configuração.
- WHEN o facilitador muda a extensão da LT depois de os grupos já terem montado composições THEN `ESC.extCondutor` atualiza via `useMemo`, cronogramas atualizam automaticamente, mas `kpiOverride` dos grupos não é alterado.
- WHEN o facilitador remove um grupo que outro participante está usando (com a tela de composição aberta em outro dispositivo/aba) THEN o estado em memória é compartilhado — remoção afeta imediatamente.
- WHEN `calcA()` é chamado no Ranking com o mesmo `comp` e `ESC` do Cronograma THEN os resultados DEVEM ser idênticos — qualquer divergência indica chamada inconsistente.
- WHEN todos os grupos estão com composições vazias THEN o Ranking SHALL exibir todos com score baseado no padrão (sS = 85, custo = 0, dur = 0) sem erro.
- WHEN `kpiBase` é alterado pelo facilitador durante a composição dos grupos THEN grupos que já definiram `kpiOverride` não são afetados — apenas os que dependem do base.
- WHEN `comps` e `grupos` têm comprimentos diferentes por bug de estado THEN `getComp(gi, aId)` com `gi >= comps.length` retorna undefined — o sistema deve prevenir esse estado nos pontos de mutação.

---

## Invariantes do Sistema

| Invariante | Expressão | Módulo Responsável |
|---|---|---|
| INV-01 | `comps.length === grupos.length` | Gestão de Grupos (`addGrupo`, `delGrupo`) |
| INV-02 | `getComp(gi, aId) !== undefined` para `gi < grupos.length` | Composição (`mkGrupoComps`) |
| INV-03 | `calcA(comp, ESC)` é função pura (sem efeitos colaterais) | Composição (`calcA`) |
| INV-04 | `custoTotal` no Ranking === `custoTotal` no Cronograma para mesmo grupo | Ranking + Cronograma |
| INV-05 | `durTotal` no Ranking === `durTotal` no Cronograma para mesmo grupo | Ranking + Cronograma |
| INV-06 | `ESC` atualiza via `useMemo` quando `lt` ou `torres` mudam | Config LT |
| INV-07 | `uid()` nunca retorna o mesmo valor duas vezes na mesma sessão | Composição Dinâmica |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| FLOW-01 | P1: `ESC` derivado de `lt` e `torres` disponível globalmente | Done | ✅ Implementado |
| FLOW-02 | P1: `comps.length === grupos.length` após qualquer addGrupo/delGrupo | Done | ✅ Implementado |
| FLOW-03 | P1: `kpiBase` propagado para `calcA()` via fallback | Done | ✅ Implementado |
| FLOW-04 | P1: `epiCargo` e `epcAtiv` consumidos por `calcSegScore()` | Done | ✅ Implementado |
| FLOW-05 | P1: Cronograma e Ranking usam mesma `calcA()` e mesmo `ESC` | Done | ✅ Implementado |
| FLOW-06 | P1: `kpiOverride` isolado por `(gi, aId)` — não afeta outros grupos | Done | ✅ Implementado |
| FLOW-07 | P1: `getComp(gi, aId)` retorna objeto válido para qualquer grupo cadastrado | Done | ✅ Implementado |
| FLOW-08 | P1: Alteração em composição reflete no Cronograma ao retornar à tela | Done | ✅ Implementado |
| FLOW-09 | P1: custoTotal Ranking === custoTotal Cronograma (mesmo grupo) | Done | ✅ Implementado |
| FLOW-10 | P1: durTotal Ranking === durTotal Cronograma (mesmo grupo) | Done | ✅ Implementado |
| FLOW-11 | P2: Invariante INV-01 a INV-07 mantidos em toda a sessão | Done | ✅ Implementado |
| FLOW-12 | P2: `ESC` atualiza via `useMemo` quando LT é alterada mid-session | Done | ✅ Implementado |
| FLOW-13 | P3: Reset completo da sessão ("Nova Jornada") sem reload | Backlog | ❌ Não implementado |
| FLOW-14 | P3: Checklist pré-jornada para facilitador | Backlog | ❌ Não implementado |
| FLOW-15 | P3: Confirmação antes de reset para evitar perda acidental de dados | Backlog | ❌ Não implementado |

**Coverage:** 15 total, 12 implementados, 3 em backlog.

---

## Success Criteria

- [ ] Fluxo completo executável ponta a ponta: Config LT → Grupos → KPIs → EPI/EPC → Composição → Cronograma → Ranking — sem erro de runtime em nenhuma etapa.
- [ ] `comps.length === grupos.length` verificável via console após cada adição ou remoção de grupo.
- [ ] `custoTotal` exibido no Cronograma do Grupo 1 é idêntico ao `custoTotal` usado no score do Ranking para o Grupo 1.
- [ ] `durTotal` exibido no Cronograma do Grupo 1 é idêntico ao `durMax` usado no score do Ranking para o Grupo 1.
- [ ] Grupo com `sS < 70` desclassificado no Ranking — seus dados de custo e prazo não afetam `minCusto` e `minDur`.
- [ ] Alterar `kpiBase` durante a sessão → grupos sem override atualizam durações no Cronograma automaticamente.
- [ ] `calcA({moRows:[], eqRows:[], verbas:{ferramentas:0,materiais:0}, kpi:0, equipes:1}, {})` → retorna `{ dur:0, total:0 }` sem exceção.
