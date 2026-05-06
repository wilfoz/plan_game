# Configuração da LT — Specification

## Problem Statement

Em obras de Linha de Transmissão, todas as métricas de escopo derivam de parâmetros técnicos da LT: extensão total, tensão nominal, tipo de circuito elétrico e quantitativo de torres. No simulador Jornadas LT, sem que o facilitador preencha esses dados antes do início da sessão, os campos de escopo de todas as 16 atividades permanecem zerados — tornando as composições dos grupos sem referência real de trabalho. Um grupo que define "KPI = 5 TON/equipe-mês" para içamento de torres não consegue calcular duração se não sabe quantas toneladas de aço existem na LT.

O tipo de circuito tem impacto direto e duplicador: uma LT de circuito duplo transporta o dobro de cabos condutores, dobra a extensão de condutor a ser lançado e altera o escopo de todas as atividades de lançamento. Sem esse fator aplicado corretamente, os escopos de lançamento ficam subestimados em 50%, comprometendo toda a análise de custo e prazo das composições dos grupos.

O módulo de Configuração da LT é o pré-requisito de toda a dinâmica. O facilitador cadastra os parâmetros técnicos reais de uma LT específica (nome, tensão, extensão, circuito, cabos por fase, para-raios, OPGW) e o quantitativo de cada tipo de torre (Crossrope, Suspensão, Ancoragem, Estaiada — com quantidade e tonelagem prevista). A partir desses inputs, cálculos automáticos populam o objeto `ESC` (escopos) consumido por `calcA()` em todos os módulos subsequentes.

---

## Goals

- [x] Formulário com campos: nome da LT, tensão (kV), extensão (km), tipo de circuito (simples/duplo)
- [x] Campos de cabos: cabos por fase, para-raios, OPGW
- [x] Select de circuito com opções "simples" e "duplo"
- [x] Formulário de 4 tipos de torre — Crossrope, Suspensão, Ancoragem, Estaiada — cada um com campos `qtd` e `ton`
- [x] Derivação: `fator = circ === "duplo" ? 2 : 1`
- [x] Cálculo automático: `totalCabos = (cabFase × 3 + pararaios + opgw) × fator`
- [x] Cálculo automático: `extCondutor = extensao × cabFase × 3 × fator`
- [x] Cálculo automático: `totalTorres = torres.crossrope.qtd + torres.suspensao.qtd + torres.ancoragem.qtd + torres.estaiada.qtd`
- [x] Cálculo automático: `tonTotal = torres.crossrope.ton + torres.suspensao.ton + torres.ancoragem.ton + torres.estaiada.ton`
- [x] Objeto `ESC` derivado: `{ tonAuto, tonEstaiada, tonCrossrope, qtdEstaiada, qtdCrossrope, ext, extCondutor, totalTorres }`
- [x] Cards de resumo: CONDUTORES, PARA-RAIOS, TOTAL CABOS, KM CONDUTOR
- [x] Atualização em tempo real de todos os cálculos ao alterar qualquer campo
- [ ] Validação de campos obrigatórios antes de liberar acesso à tela de Composição
- [ ] Pré-preenchimento com valores típicos de LT 500 kV como ponto de partida
- [ ] Exportar configuração em JSON para reutilização em outra sessão

---

## Out of Scope

| Feature | Razão |
|---|---|
| Persistência da configuração entre sessões | App é sessão única em memória — dados perdidos ao recarregar a página |
| Importar configuração real de LT via arquivo | Complexidade desnecessária para dinâmica de treinamento; valores inseridos ao vivo pelo facilitador |
| Configuração de múltiplas LTs simultâneas | Cada Jornada simula uma LT específica; multi-LT não é o modelo pedagógico |
| Cálculo de impedância, queda de tensão ou dimensionamento elétrico | O escopo é planejamento de obras (prazo e custo), não projeto elétrico |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Estado | `lt` — objeto `{ nome, tensao, ext, circ, cabFase, pararaios, opgw }` | ✅ Implementado |
| Estado | `torres` — objeto `{ crossrope, suspensao, ancoragem, estaiada }` cada com `{ qtd, ton }` | ✅ Implementado |
| Derivação | `fator = circ === "duplo" ? 2 : 1` via `useMemo` | ✅ Implementado |
| Derivação | `totalCabos = (cabFase × 3 + pararaios + opgw) × fator` | ✅ Implementado |
| Derivação | `extCondutor = ext × cabFase × 3 × fator` | ✅ Implementado |
| Derivação | `totalTorres = sum(torres[tipo].qtd)` para 4 tipos | ✅ Implementado |
| Derivação | `tonTotal = sum(torres[tipo].ton)` para 4 tipos | ✅ Implementado |
| Derivação | `ESC` — objeto de escopos derivados consumido por `calcA()` | ✅ Implementado |
| Componente | Formulário de parâmetros básicos da LT com inputs numéricos e select | ✅ Implementado |
| Componente | Tabela de 4 tipos de torre com campos `qtd` e `ton` | ✅ Implementado |
| Componente | Cards de resumo (CONDUTORES, PARA-RAIOS, TOTAL CABOS, KM CONDUTOR) | ✅ Implementado |
| Validação | Campos obrigatórios antes de liberar acesso à Composição | ❌ Não implementado |

---

## User Stories

### P1: Cadastrar Parâmetros Básicos da LT ⭐ MVP

**User Story**: As a Facilitador, I want preencher os dados técnicos da LT (tensão, extensão, tipo de circuito e cabos) so that os grupos tenham escopos reais calculados automaticamente para dimensionar suas composições.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de Configuração da LT THEN o sistema SHALL exibir formulário com campos: nome da LT, tensão (kV), extensão (km), circuito (select "simples"/"duplo"), cabos por fase, para-raios e OPGW.
2. WHEN o facilitador altera o campo extensão ou cabos por fase THEN o sistema SHALL recalcular `extCondutor` em tempo real e atualizar o card KM CONDUTOR.
3. WHEN o circuito é alterado para "duplo" THEN o sistema SHALL aplicar `fator = 2` e recalcular `totalCabos = (cabFase × 3 + pararaios + opgw) × 2` instantaneamente.
4. WHEN o circuito está definido como "simples" THEN o sistema SHALL aplicar `fator = 1` e `totalCabos` refletirá exatamente um conjunto de cabos.
5. WHEN `extCondutor` é calculado THEN o valor SHALL ser `extensao × cabFase × 3 × fator` exibido no card KM CONDUTOR em km.
6. WHEN qualquer campo numérico está vazio ou zerado THEN o sistema SHALL tratar o valor como 0 e SHALL exibir "0" nos cards sem gerar NaN ou erro de runtime.

**Independent Test**: Preencher extensão = 100 km, circuito = simples, cabos/fase = 2, para-raios = 1, OPGW = 1. Verificar: totalCabos = (2×3 + 1 + 1) × 1 = 8, extCondutor = 100 × 2 × 3 × 1 = 600 km. Trocar circuito para "duplo" — verificar: totalCabos = 16, extCondutor = 1.200 km. Cards devem atualizar sem reload.

---

### P1: Configurar Quantitativos de Torres ⭐ MVP

**User Story**: As a Facilitador, I want inserir a quantidade e tonelagem prevista de cada tipo de torre so that as atividades de montagem tenham escopos de TON e TORRE calculados e disponíveis para as composições dos grupos.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a seção de torres THEN o sistema SHALL exibir quatro linhas: Crossrope, Suspensão, Ancoragem e Estaiada — cada uma com campos `qtd` (unidades) e `ton` (toneladas).
2. WHEN o facilitador altera `qtd` ou `ton` de qualquer tipo de torre THEN `totalTorres` e `tonTotal` SHALL ser recalculados em tempo real.
3. WHEN `totalTorres` é calculado THEN o valor SHALL ser a soma exata de `qtd` dos 4 tipos de torre.
4. WHEN `tonTotal` é calculado THEN o valor SHALL ser a soma exata de `ton` dos 4 tipos de torre.
5. WHEN `tonAuto` é derivado THEN o valor SHALL ser `torres.suspensao.ton + torres.ancoragem.ton` (torres autoportantes).
6. WHEN o objeto `ESC` é construído THEN SHALL conter: `tonEstaiada = torres.estaiada.ton`, `tonCrossrope = torres.crossrope.ton`, `qtdEstaiada = torres.estaiada.qtd`, `qtdCrossrope = torres.crossrope.qtd`, `totalTorres`, `ext`, `extCondutor`.

**Independent Test**: Preencher: Crossrope qtd=10 ton=50, Suspensão qtd=80 ton=400, Ancoragem qtd=20 ton=120, Estaiada qtd=5 ton=80. Verificar: totalTorres = 115, tonTotal = 650, tonAuto = 520 (400+120), tonEstaiada = 80, tonCrossrope = 50. Verificar que esses valores são consumidos corretamente em `calcA()` na tela de Composição.

---

### P2: Visualizar Cards de Resumo da LT

**User Story**: As a Facilitador, I want visualizar um painel de resumo com os totais calculados da configuração so that eu possa confirmar que os dados inseridos geram os escopos corretos antes de iniciar a sessão com os grupos.

**Acceptance Criteria**:

1. WHEN a configuração da LT é preenchida THEN o sistema SHALL exibir 4 cards: CONDUTORES (cabos condutores = `cabFase × 3 × fator`), PARA-RAIOS (`pararaios × fator`), TOTAL CABOS (`totalCabos`) e KM CONDUTOR (`extCondutor`).
2. WHEN qualquer campo da LT é alterado THEN todos os 4 cards SHALL atualizar instantaneamente sem necessidade de clique em botão.
3. WHEN um campo numérico está zerado THEN os cards afetados SHALL exibir "0" e não SHALL exibir erro de cálculo.
4. WHEN o card KM CONDUTOR exibe o valor THEN o formato SHALL ser em km com separador de milhar (ex: "1.200 km").

**Independent Test**: Preencher LT 500 kV, extensão = 300 km, circuito = duplo, cabos/fase = 3, para-raios = 2, OPGW = 1. Verificar cards: CONDUTORES = 18, PARA-RAIOS = 4, TOTAL CABOS = 22, KM CONDUTOR = 1.800 km. Zerar um campo e verificar atualização sem crash.

---

## Edge Cases

- WHEN o facilitador deixa extensão em branco THEN o sistema SHALL tratar como 0 e `extCondutor` SHALL exibir 0, sem NaN ou erro de runtime.
- WHEN circuito é alterado de "duplo" para "simples" THEN todos os cálculos dependentes SHALL recalcular com `fator = 1` imediatamente.
- WHEN todos os campos de torres estão zerados THEN `totalTorres = 0` e atividades de montagem exibirão duração "—" no cronograma dos grupos.
- WHEN `cabFase = 0` THEN `extCondutor = 0` e o card KM CONDUTOR SHALL exibir 0 sem erro de divisão.
- WHEN `tonAuto = 0` (suspensão e ancoragem zeradas) THEN as 4 atividades de torre autoportante terão escopo 0 e duração "—".
- WHEN o nome da LT contém caracteres especiais (acentos, /, :) THEN o sistema SHALL aceitar e exibir sem sanitização — campo de display apenas, não afeta cálculos.
- WHEN `tensao` é inserida como decimal (ex: 500,5 kV) THEN o campo SHALL aceitar — tensão é informativa e não participa de nenhum cálculo.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CFG-01 | P1: Formulário de parâmetros básicos da LT (nome, tensão, ext, circ) | Done | ✅ Implementado |
| CFG-02 | P1: Campos de cabos (cabFase, pararaios, opgw) | Done | ✅ Implementado |
| CFG-03 | P1: Select circuito simples/duplo com derivação de fator | Done | ✅ Implementado |
| CFG-04 | P1: Cálculo automático de `totalCabos` | Done | ✅ Implementado |
| CFG-05 | P1: Cálculo automático de `extCondutor` | Done | ✅ Implementado |
| CFG-06 | P1: Formulário de 4 tipos de torre (qtd + ton) | Done | ✅ Implementado |
| CFG-07 | P1: Cálculo de `totalTorres` | Done | ✅ Implementado |
| CFG-08 | P1: Cálculo de `tonTotal` | Done | ✅ Implementado |
| CFG-09 | P1: Derivação de `tonAuto`, `tonEstaiada`, `tonCrossrope`, `qtdEstaiada`, `qtdCrossrope` | Done | ✅ Implementado |
| CFG-10 | P1: Objeto `ESC` construído e disponível globalmente | Done | ✅ Implementado |
| CFG-11 | P2: Cards de resumo (4 indicadores) com atualização em tempo real | Done | ✅ Implementado |
| CFG-12 | P2: Tratamento de campos vazios como 0 (sem NaN) | Done | ✅ Implementado |
| CFG-13 | P2: Validação de completude antes de liberar Composição | Backlog | ❌ Não implementado |
| CFG-14 | P3: Pré-preenchimento com valores típicos de LT 500 kV | Backlog | ❌ Não implementado |
| CFG-15 | P3: Exportar configuração em JSON | Backlog | ❌ Não implementado |

**Coverage:** 15 total, 12 implementados, 3 em backlog.

---

## Success Criteria

- [ ] Preencher extensão=200, circ=duplo, cabFase=3, pararaios=2, OPGW=1 → `totalCabos = (9+2+1)×2 = 24`, `extCondutor = 200×3×3×2 = 3.600 km`.
- [ ] Alterar qualquer campo da LT → todos os 4 cards atualizam sem reload da página.
- [ ] Configurar 4 tipos de torre → `totalTorres` e `tonTotal` refletem soma exata sem discrepância.
- [ ] Objeto `ESC` disponível globalmente após configuração para consumo em `calcA()` e no cronograma.
- [ ] Campos zerados ou vazios → nenhum NaN, undefined ou erro de runtime nos cards ou nas derivações.
- [ ] Alternar circuito simples ↔ duplo → `fator` alterna entre 1 e 2 e todos os cálculos dependentes atualizam imediatamente.
- [ ] `tonAuto = torres.suspensao.ton + torres.ancoragem.ton` — verificável somando os dois campos manualmente.
