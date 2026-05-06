# Ranking e Debriefing — Specification

## Problem Statement

O ranking é o momento de maior impacto pedagógico da dinâmica Jornadas LT. Após todos os grupos montarem suas composições, o facilitador exibe o placar ao vivo no telão e conduz o debriefing — revelando quais equipes fizeram escolhas mais eficientes em custo, mais rápidas em prazo e, acima de tudo, mais seguras. O objetivo não é apenas competir: é demonstrar que segurança não é custo opcional, mas componente integrante da composição de alta performance.

A fórmula de pontuação pondera três dimensões: Custo (30%), Prazo (30%) e Segurança (40%). O peso maior em segurança é intencional — reflete a realidade regulatória e ética de obras de LT. A regra de desclassificação (score de segurança < 70%) reforça a mensagem: uma equipe que economiza omitindo EPIs perde o direito ao ranking, independentemente de ter o melhor custo ou o menor prazo.

A comparação entre o gabarito ideal do facilitador e as composições reais dos grupos é o núcleo do debriefing. O gabarito representa a composição de referência para uma LT 500 kV — com os profissionais corretos, os EPIs adequados e os equipamentos necessários — e serve como base pedagógica para discutir as decisões de cada grupo.

---

## Goals

- [x] Cálculo de score de custo: `sC = round(min(100, (minCusto / r.custoTotal) × 100))`
- [x] Cálculo de score de prazo: `sD = round(min(100, (minDur / r.durMax) × 100))`
- [x] Cálculo de score de segurança: `sS = calcSegScore(gi)` retorna 0–100
- [x] Score total: `total = round(sC × 0.30 + sD × 0.30 + sS × 0.40)`
- [x] Regra de desclassificação: `sS < 70` → score exibe "—" e tag "DESCLASSIFICADO"
- [x] Ranking ordenado por score total (desclassificados no final)
- [x] Exibição dos três scores individuais por grupo (Custo, Prazo, Segurança)
- [x] Identificação do menor custo (`minCusto`) e menor prazo (`minDur`) entre os grupos para normalização
- [x] Mensagem de debriefing central com foco em segurança e liderança
- [x] Grupo sem nenhuma composição preenchida: custo = 0, duração = 0, score padrão 85
- [ ] Gabarito ideal do facilitador: exibir composição de referência para debriefing
- [ ] Exportar ranking em PDF para distribuição pós-jornada
- [ ] Histórico comparativo com jornadas anteriores

---

## Out of Scope

| Feature | Razão |
|---|---|
| Votação dos participantes sobre melhores composições | O ranking é calculado algoritmicamente — não há votação subjetiva |
| Penalidades por atraso além do prazo contratual | Modelo simplificado; penalidades contratuais adicionariam complexidade não pedagógica |
| Simulação de acidentes de trabalho | Contexto pedagógico; o impacto de segurança é representado pelo score, não por eventos dramáticos |
| Ranking em tempo real durante a composição | O ranking é revelado após todas as composições serem finalizadas, no momento do debriefing |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Cálculo | `calcSegScore(gi)` — score de segurança 0–100 baseado em `epiCargo` vs composição | ✅ Implementado |
| Cálculo | `sC = round(min(100, (minCusto / r.custoTotal) × 100))` | ✅ Implementado |
| Cálculo | `sD = round(min(100, (minDur / r.durMax) × 100))` | ✅ Implementado |
| Cálculo | `total = round(sC × 0.30 + sD × 0.30 + sS × 0.40)` | ✅ Implementado |
| Derivação | `minCusto = min(r.custoTotal)` entre grupos qualificados | ✅ Implementado |
| Derivação | `minDur = min(r.durMax)` entre grupos qualificados | ✅ Implementado |
| Derivação | `desq = sS < 70` — flag de desclassificação por grupo | ✅ Implementado |
| Derivação | Ranking ordenado: qualificados por `total desc`, desclassificados no final | ✅ Implementado |
| Componente | Tabela de ranking com colunas: posição, grupo, sC, sD, sS, total, tag | ✅ Implementado |
| Componente | Mensagem de debriefing central | ✅ Implementado |
| UI | Tag "DESCLASSIFICADO" e score "—" para grupos com `sS < 70` | ✅ Implementado |
| UI | Destaque visual do 1º lugar (medalha/cor diferenciada) | ✅ Implementado |
| Feature | Gabarito ideal do facilitador com composição de referência | ❌ Não implementado |
| Feature | Exportar ranking em PDF | ❌ Não implementado |

---

## User Stories

### P1: Calcular e Exibir Ranking dos Grupos ⭐ MVP

**User Story**: As a Facilitador, I want visualizar o ranking final com os scores de todos os grupos so that eu possa revelar os resultados e iniciar o debriefing sobre as melhores estratégias de composição.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de Ranking THEN o sistema SHALL calcular automaticamente `sC`, `sD` e `sS` para cada grupo com base nas composições preenchidas.
2. WHEN `minCusto` é calculado THEN o valor SHALL ser o menor `custoTotal` entre todos os grupos qualificados (com `sS >= 70`).
3. WHEN `minDur` é calculado THEN o valor SHALL ser o menor `durMax` entre todos os grupos qualificados.
4. WHEN `sC` é calculado para um grupo THEN o valor SHALL ser `round(min(100, (minCusto / r.custoTotal) × 100))` — o grupo com menor custo recebe 100.
5. WHEN `sD` é calculado para um grupo THEN o valor SHALL ser `round(min(100, (minDur / r.durMax) × 100))` — o grupo com menor prazo recebe 100.
6. WHEN `total` é calculado THEN o valor SHALL ser `round(sC × 0.30 + sD × 0.30 + sS × 0.40)`.
7. WHEN dois grupos têm o mesmo score total THEN o ranking SHALL desempatá-los pelo score de segurança (maior `sS` fica à frente).
8. WHEN o ranking é exibido THEN os grupos SHALL ser ordenados por `total desc`, com desclassificados sempre no final independentemente do score.

**Independent Test**: Criar 3 grupos. Grupo A: custo menor, prazo menor, sS = 80. Grupo B: custo maior, prazo maior, sS = 90. Grupo C: sS = 60 (desclassificado). Verificar: Grupo A tem sC = 100, sD = 100, total = round(100×0.30 + 100×0.30 + 80×0.40) = round(92) = 92. Grupo C aparece no final com "—" e tag DESCLASSIFICADO.

---

### P1: Aplicar Regra de Desclassificação por Segurança ⭐ MVP

**User Story**: As a Facilitador, I want que grupos com score de segurança abaixo de 70% sejam automaticamente desclassificados so that a mensagem pedagógica sobre a não-negociabilidade da segurança seja reforçada de forma inequívoca.

**Acceptance Criteria**:

1. WHEN `calcSegScore(gi)` retorna valor menor que 70 THEN o grupo SHALL ter `desq = true` e seu score total SHALL ser exibido como "—".
2. WHEN um grupo está desclassificado THEN o sistema SHALL exibir tag "DESCLASSIFICADO" em destaque na linha do ranking.
3. WHEN todos os grupos qualificados têm score calculado THEN os grupos desclassificados SHALL aparecer abaixo dos qualificados, independentemente de seu score de custo ou prazo.
4. WHEN `minCusto` e `minDur` são calculados para normalização THEN grupos desclassificados SHALL ser excluídos da base de referência.
5. WHEN um único grupo está qualificado THEN `minCusto = r.custoTotal` e `sC = 100` — o grupo qualificado é referência de si mesmo.
6. WHEN todos os grupos são desclassificados THEN o ranking SHALL exibir todos como desclassificados sem erro de divisão por zero no cálculo de `minCusto`.

**Independent Test**: Criar 2 grupos. Configurar `epiCargo` com EPIs críticos. Grupo A monta composição sem os EPIs exigidos → `calcSegScore` retorna < 70 → tag DESCLASSIFICADO + score "—". Grupo B monta composição com EPIs → aparece em 1º lugar. Verificar que `minCusto` usa apenas o custo do grupo B.

---

### P1: Exibir Mensagem de Debriefing ⭐ MVP

**User Story**: As a Facilitador, I want ver a mensagem central de debriefing na tela de ranking so that eu tenha um ponto de partida para a reflexão sobre liderança e segurança ao final da dinâmica.

**Acceptance Criteria**:

1. WHEN a tela de Ranking é exibida THEN o sistema SHALL mostrar a mensagem: "A Liderança que Protege sabe dimensionar o recurso certo para o risco da atividade. Segurança não é custo — é parte da composição de alta performance."
2. WHEN a mensagem é exibida THEN ela SHALL ter destaque visual que a diferencie da tabela de ranking (ex: card ou banner separado).
3. WHEN o facilitador rola a página para o ranking THEN a mensagem SHALL ser visível sem necessidade de scroll adicional.

**Independent Test**: Abrir tela de Ranking. Verificar que a mensagem de debriefing está visível na página junto com a tabela de ranking.

---

### P2: Visualizar Scores Individuais por Dimensão

**User Story**: As a Grupo participante, I want ver meus três scores individuais (Custo, Prazo, Segurança) so that eu possa entender em qual dimensão minha composição foi mais forte ou mais fraca.

**Acceptance Criteria**:

1. WHEN o ranking é exibido THEN cada linha SHALL mostrar: posição, nome do grupo, score de Custo (sC), score de Prazo (sD), score de Segurança (sS) e score Total.
2. WHEN `sS < 70` THEN a coluna de segurança SHALL exibir o valor real do score com cor vermelha, para que o grupo entenda por que foi desclassificado.
3. WHEN `sS >= 70` THEN a coluna de segurança SHALL exibir o valor com cor neutra ou verde.
4. WHEN o score Total é 100 (máximo possível) THEN o grupo SHALL ter destaque visual especial (ex: troféu ou cor dourada).

**Independent Test**: Grupo com sS = 65 → coluna de segurança exibe "65" em vermelho e score total exibe "—". Grupo com sC = 100, sD = 85, sS = 80 → total = round(30 + 25,5 + 32) = round(87,5) = 88.

---

### P3: Exibir Gabarito Ideal do Facilitador

**User Story**: As a Facilitador, I want revelar a composição ideal de referência para as atividades so that os grupos possam comparar suas escolhas com o gabarito e identificar oportunidades de aprendizado.

**Acceptance Criteria**:

1. WHEN o facilitador clica em "Exibir Gabarito" THEN o sistema SHALL revelar a composição de referência por atividade (profissionais, equipamentos e EPIs recomendados para LT 500 kV).
2. WHEN o gabarito é exibido THEN o sistema SHALL mostrar lado a lado: composição do grupo selecionado vs. composição de referência.
3. WHEN o grupo está desclassificado THEN o gabarito SHALL destacar especificamente quais EPIs estavam faltando na composição do grupo.

**Independent Test**: Clicar em "Exibir Gabarito". Verificar que a composição de referência é exibida com os profissionais e EPIs corretos para LT 500 kV.

---

## Edge Cases

- WHEN `custoTotal = 0` para todos os grupos THEN `sC = 0` para todos (divisão por zero — `minCusto = 0`) — o sistema SHALL tratar `minCusto > 0 ? ... : 0`.
- WHEN `durMax = 0` para um grupo (sem composições preenchidas) THEN `sD` SHALL usar o fallback do score padrão (85) ou 0, conforme regra definida.
- WHEN apenas 1 grupo está qualificado THEN `minCusto` e `minDur` são os valores desse único grupo — e `sC = 100`, `sD = 100`.
- WHEN um grupo tem custoTotal muito maior que `minCusto` THEN `sC = round(min(100, minCusto/custoTotal × 100))` — scores são limitados a 100 superiormente.
- WHEN `calcSegScore(gi)` retorna exatamente 70 THEN o grupo NÃO é desclassificado (o limiar é `< 70`, não `<= 70`).
- WHEN `round(sC × 0.30 + sD × 0.30 + sS × 0.40)` resulta em um float THEN `Math.round` garante inteiro — verificar arredondamento simétrico.
- WHEN grupo sem composição preenchida é avaliado THEN custo = 0, duração = 0, sS = 85 (default) → sS >= 70 → não desclassificado — mas sC = 0 e sD = 0 resultam em total baixo.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| RANK-01 | P1: `calcSegScore(gi)` — score de segurança 0–100 | Done | ✅ Implementado |
| RANK-02 | P1: `sC = round(min(100, (minCusto / custoTotal) × 100))` | Done | ✅ Implementado |
| RANK-03 | P1: `sD = round(min(100, (minDur / durMax) × 100))` | Done | ✅ Implementado |
| RANK-04 | P1: `total = round(sC × 0.30 + sD × 0.30 + sS × 0.40)` | Done | ✅ Implementado |
| RANK-05 | P1: Desclassificação quando `sS < 70` — exibe "—" e tag | Done | ✅ Implementado |
| RANK-06 | P1: Grupos desclassificados excluídos do cálculo de `minCusto` e `minDur` | Done | ✅ Implementado |
| RANK-07 | P1: Ranking ordenado por total desc (desclassificados no final) | Done | ✅ Implementado |
| RANK-08 | P1: Mensagem de debriefing central sobre liderança e segurança | Done | ✅ Implementado |
| RANK-09 | P1: Tratamento de divisão por zero em `sC` quando `minCusto = 0` | Done | ✅ Implementado |
| RANK-10 | P2: Exibição de sC, sD, sS individuais por grupo na tabela | Done | ✅ Implementado |
| RANK-11 | P2: Score sS exibido em vermelho quando < 70 | Done | ✅ Implementado |
| RANK-12 | P2: Destaque visual do 1º lugar | Done | ✅ Implementado |
| RANK-13 | P2: Score padrão 85 para grupos sem composição preenchida | Done | ✅ Implementado |
| RANK-14 | P3: Gabarito ideal do facilitador (composição de referência) | Backlog | ❌ Não implementado |
| RANK-15 | P3: Exportar ranking em PDF | Backlog | ❌ Não implementado |
| RANK-16 | P3: Comparativo grupo vs. gabarito por atividade | Backlog | ❌ Não implementado |

**Coverage:** 16 total, 13 implementados, 3 em backlog.

---

## Success Criteria

- [ ] Grupo com menor custo e menor prazo entre os qualificados recebe sC = 100 e sD = 100.
- [ ] Score total = round(sC×0.30 + sD×0.30 + sS×0.40) — verificável manualmente para cada grupo.
- [ ] Grupo com sS = 69 → exibe tag "DESCLASSIFICADO" e score "—", posicionado após todos os qualificados.
- [ ] Grupo com sS = 70 → NÃO é desclassificado (limiar exclusivo `< 70`).
- [ ] `minCusto` e `minDur` calculados apenas entre grupos qualificados — desclassificados não afetam a base de normalização.
- [ ] Mensagem de debriefing visível na tela de Ranking sem scroll adicional.
- [ ] Zero grupos com composição preenchida: custo = 0 e duração = 0 → sC = 0 via `minCusto = 0` (fallback retorna 0).
