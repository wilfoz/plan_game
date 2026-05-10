# Configuração da LT — Specification

## Problem Statement

Parâmetros técnicos da LT (extensão, circuito, cabos por fase) determinam métricas informativas usadas como referência pelo facilitador. São persistidos no Supabase via `useLtConfig` e exibidos como contexto na tela de Composição (painel lateral).

---

## Goals

- [x] Campos: nome da LT, tensão, extensão (km), circuito (simples/duplo), cabos/fase, para-raios, OPGW
- [x] Derivação: `fator = circ === "duplo" ? 2 : 1`
- [x] Cálculo informativo: `totalCabos = (cabFase × 3 + pararaios + opgw) × fator`
- [x] Cálculo informativo: `extCondutor = extensao × cabFase × 3 × fator`
- [x] Cards de resumo: CONDUTORES, TOTAL CABOS, KM CONDUTOR, KM PARA-RAIOS
- [x] Inputs com `LocalTextInp` e `LocalNumInp` (onBlur save — sem lag)
- [x] Persistência no Supabase via `lt_config` com debounce
- [ ] Validação de campos obrigatórios antes de liberar Composição

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Backend | Tabela `lt_config`: `session_id`, `nome`, `tensao`, `ext`, `circ`, `cab_fase`, `pararaios`, `opgw` | ✅ Implementado |
| Hook | `useLtConfig(sessionId)` — query + `upsertDebounced` | ✅ Implementado |
| Estado | `lt` — estado local sincronizado de `useLtConfig` via `useEffect` | ✅ Implementado |
| Função | `uLt(k, v)` — atualiza `lt` local e chama `ltHook.upsertDebounced` | ✅ Implementado |
| Input | `LocalTextInp` para nome e tensão (onBlur save) | ✅ Implementado |
| Input | `LocalNumInp` para ext, cabFase, pararaios, opgw (onBlur save) | ✅ Implementado |
| Derivação | `fator`, `totalCabos`, `extCondutor`, `extParaRaios` derivados em AppContext | ✅ Implementado |
| Componente | Formulário de parâmetros da LT | ✅ Implementado |
| Componente | Cards de resumo (4 cards) | ✅ Implementado |
| Persistência | Supabase — dados sobrevivem a F5 e fechamento do browser | ✅ Implementado |
| Validação | Campos obrigatórios antes de liberar Composição | ❌ Backlog |

---

## Padrão de Input

Todos os campos de texto e numéricos usam `LocalTextInp` / `LocalNumInp` para evitar lag e substituição de caracteres durante digitação. O valor é salvo no Supabase (via `uLt` → `ltHook.upsertDebounced`) somente ao sair do campo (onBlur).

---

## Requirement Traceability

| Requirement ID | Story | Status |
|---|---|---|
| CFG-01 | Formulário: nome, tensão, ext, circ, cabFase, pararaios, opgw | ✅ Implementado |
| CFG-02 | `LocalTextInp`/`LocalNumInp` — sem lag na digitação | ✅ Implementado |
| CFG-03 | Select circuito simples/duplo com Pill (clique imediato, sem onBlur) | ✅ Implementado |
| CFG-04 | `totalCabos = (cabFase×3 + pararaios + opgw) × fator` | ✅ Implementado |
| CFG-05 | `extCondutor = ext × cabFase × 3 × fator` | ✅ Implementado |
| CFG-06 | Cards de resumo atualizados após onBlur | ✅ Implementado |
| CFG-07 | Persistência no Supabase — dados sobrevivem a F5 | ✅ Implementado |
| CFG-08 | Validação de completude antes de liberar Composição | ❌ Backlog |

**Coverage:** 8 total, 7 implementados, 1 em backlog.

---

## Success Criteria

- [ ] extensão=200, circ=duplo, cabFase=3 → `totalCabos = 24`, `extCondutor = 3.600 km`.
- [ ] Digitar nos campos sem lag ou substituição de caracteres.
- [ ] Alterar qualquer campo e recarregar → valores persistidos no Supabase.
- [ ] Alternar simples ↔ duplo → `fator` alterna e cards atualizam imediatamente.
