# Configuração da LT — Specification

## Problem Statement

Em obras de Linha de Transmissão, parâmetros técnicos da LT (extensão, circuito, cabos por fase) determinam métricas informativas usadas como referência pelo facilitador. O tipo de circuito tem impacto direto: uma LT duplo tem o dobro de cabos condutores e dobra a extensão de condutor a ser lançado.

Os volumes de trabalho por atividade (ex: toneladas de aço, km de condutor) são informados diretamente pelo facilitador na tela de Atividades — não são mais derivados automaticamente de tipos de torres.

---

## Goals

- [x] Formulário com campos: nome da LT, tensão (kV), extensão (km), tipo de circuito (simples/duplo)
- [x] Campos de cabos: cabos por fase, para-raios, OPGW
- [x] Derivação: `fator = circ === "duplo" ? 2 : 1`
- [x] Cálculo informativo: `totalCabos = (cabFase × 3 + pararaios + opgw) × fator`
- [x] Cálculo informativo: `extCondutor = extensao × cabFase × 3 × fator`
- [x] Cards de resumo: CONDUTORES, TOTAL CABOS, KM CONDUTOR
- [x] Atualização em tempo real de todos os cálculos ao alterar qualquer campo
- [ ] Validação de campos obrigatórios antes de liberar acesso à tela de Composição

---

## Out of Scope

| Feature | Razão |
|---|---|
| Formulário de tipos de torres (qtd/ton) | Volumes são inseridos diretamente por atividade na tela de Atividades |
| Objeto ESC derivado de torres | Substituído por `volumesPrev[aId]` editável pelo facilitador |
| Persistência entre sessões | App em memória — dados perdidos ao recarregar |
| Importar configuração real de LT via arquivo | Complexidade desnecessária para a dinâmica |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Estado | `lt` — `{ nome, tensao, ext, circ, cabFase, pararaios, opgw }` | ✅ Implementado |
| Derivação | `fator = circ === "duplo" ? 2 : 1` | ✅ Implementado |
| Derivação | `totalCabos = (cabFase × 3 + pararaios + opgw) × fator` | ✅ Implementado |
| Derivação | `extCondutor = ext × cabFase × 3 × fator` | ✅ Implementado |
| Componente | Formulário de parâmetros básicos da LT | ✅ Implementado |
| Componente | Cards de resumo (CONDUTORES, TOTAL CABOS, KM CONDUTOR) | ✅ Implementado |
| Validação | Campos obrigatórios antes de liberar Composição | ❌ Não implementado |

---

## User Stories

### P1: Cadastrar Parâmetros Básicos da LT ⭐ MVP

**User Story**: As a Facilitador, I want preencher os dados técnicos da LT so that os grupos tenham referência do projeto e os cálculos de cabos e extensão sejam informativos.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de Configuração da LT THEN o sistema SHALL exibir formulário com: nome, tensão, extensão, circuito, cabos/fase, para-raios e OPGW.
2. WHEN extensão ou cabFase é alterado THEN `extCondutor` SHALL recalcular em tempo real.
3. WHEN circuito é "duplo" THEN `fator = 2` e todos os cálculos de cabo SHALL usar esse fator.
4. WHEN campo numérico está vazio THEN o sistema SHALL tratar como 0 sem NaN.

**Independent Test**: extensão=100, circ=simples, cabFase=2 → extCondutor=600 km. Trocar para "duplo" → extCondutor=1200 km.

---

### P2: Visualizar Cards de Resumo da LT

**Acceptance Criteria**:

1. WHEN a LT é preenchida THEN o sistema SHALL exibir cards: CONDUTORES, TOTAL CABOS, KM CONDUTOR.
2. WHEN qualquer campo é alterado THEN os cards SHALL atualizar instantaneamente.

---

## Edge Cases

- WHEN extensão está em branco THEN `extCondutor = 0`, sem NaN.
- WHEN `cabFase = 0` THEN `extCondutor = 0`, sem erro.
- WHEN circuito alterna simples ↔ duplo THEN `fator` alterna entre 1 e 2 imediatamente.

---

## Requirement Traceability

| Requirement ID | Story | Status |
|---|---|---|
| CFG-01 | Formulário de parâmetros básicos (nome, tensão, ext, circ) | ✅ Implementado |
| CFG-02 | Campos de cabos (cabFase, pararaios, opgw) | ✅ Implementado |
| CFG-03 | Select circuito simples/duplo com derivação de fator | ✅ Implementado |
| CFG-04 | Cálculo de `totalCabos` | ✅ Implementado |
| CFG-05 | Cálculo de `extCondutor` | ✅ Implementado |
| CFG-06 | Cards de resumo com atualização em tempo real | ✅ Implementado |
| CFG-07 | Tratamento de campos vazios como 0 | ✅ Implementado |
| CFG-08 | Validação de completude antes de liberar Composição | ❌ Backlog |

---

## Success Criteria

- [ ] extensão=200, circ=duplo, cabFase=3 → `totalCabos = 24`, `extCondutor = 3.600 km`.
- [ ] Alterar qualquer campo → cards atualizam sem reload.
- [ ] Campos zerados → nenhum NaN ou erro de runtime.
- [ ] Alternar simples ↔ duplo → `fator` alterna e cálculos atualizam imediatamente.
