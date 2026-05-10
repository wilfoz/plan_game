# State

**Last Updated:** 2026-05-09
**Current Milestone:** V3 — Supabase + React Query + Input Fixes

---

## Status Geral

O app está **completamente integrado ao Supabase** (backend, autenticação de sessão, realtime). A arquitetura migrou de estado em memória para persistência completa via PostgreSQL + React Query. Inputs de edição foram corrigidos para usar estado local com save no onBlur, eliminando o problema de substituição de caracteres e lentidão durante digitação.

---

## Implementações Concluídas (v3)

### Supabase + React Query

- [x] Supabase como backend: tabelas `sessions`, `grupos`, `grupo_comps`, `lt_config`, `atividades_config`, `equipe_base_mo`, `equipe_base_eq`, `requisitos`, `epi_cargo`
- [x] React Query (TanStack Query) para data fetching e cache — hooks: `useSessions`, `useGrupos`, `useGrupoComps`, `useLtConfig`, `useAtividadesConfig`, `useEquipeBase`, `useRequisitos`, `useEpiCargo`
- [x] `compsHook.upsertDebounced` — debounce de 800ms antes de persistir composições no Supabase
- [x] Realtime via `useRealtimeComps` — composições dos grupos sincronizadas ao vivo para o facilitador
- [x] Seed automático de sessão nova: `BASE_COMPOSITIONS`, `BASE_REQUIREMENTS` e KPIs base inseridos ao criar nova sessão sem dados

### Padrão de Input (onBlur)

- [x] `LocalNumInp` — input numérico com estado local; persiste no servidor somente no `onBlur`
- [x] `LocalTextInp` — input de texto com estado local; persiste no servidor somente no `onBlur`
- [x] `GrupoField` — mesmo padrão para campos de grupos (nome, responsável)
- [x] Sincronização inteligente via `useRef`: atualiza local state a partir do servidor apenas quando a mudança vem de outra fonte (não do próprio usuário)
- [x] Aplicado em: Atividades, Composição, EquipeBase, Requisitos, Engenharia, Equipes

### Regras de Segurança

- [x] `calcSeg` atualizado: **só avalia requisitos de atividades que possuem recursos** (`moRows.length > 0 || eqRows.length > 0`) — atividades sem composição são ignoradas
- [x] Desclassificação absoluta: qualquer requisito aplicável ausente em composição com recursos → `desq: true`
- [x] Penalidade por requisito "Não Aplicável" adicionado indevidamente: `+2% no custo total` por requisito
- [x] `calcNaoAplicPenalty` — calcula fator de penalidade e lista detalhes para debriefing

### Grupos

- [x] Senha dos grupos hasheada via RPC `set_grupo_senha` (bcrypt) — nunca armazenada em plaintext
- [x] Edição de nome e responsável via `GrupoField` (onBlur save) — elimina lag de digitação
- [x] Isolamento completo: grupos só acessam próprias composições

---

## Implementações Concluídas (v2.1)

- [x] `volumesPrev: { [aId]: number }` — volume previsto editável por atividade
- [x] `comentariosAtiv: { [aId]: string }` — comentário livre por atividade
- [x] Campo `torres` e objeto `ESC` removidos completamente
- [x] `eKey` removido dos objetos `ATIVS`
- [x] 16 atividades definidas em `ATIVS` (não 10)

---

## Implementações Concluídas (v2)

- [x] SPA multi-arquivo com Vite + Context API
- [x] Login universal: Facilitador (`FACILITADOR` + senha) → Session Manager; Grupos (nome + senha) → Composição
- [x] CRUD de sessões (criar, renomear, excluir, entrar)
- [x] MO simplificada: QTD, HRS/DIA, SALÁRIO/MÊS
- [x] Equipamentos: QTD, HRS/DIA, LOCAÇÃO/MÊS
- [x] Verbas diversas removidas
- [x] `calcSeg` real — desclassificação por requisito aplicável ausente
- [x] Cronograma Gantt com `monthlyVolumes`
- [x] Análise de eficiência: coeficientes Hh/unid e Ch/unid vs equipe base
- [x] `calcEficiencia`, `calcEficienciaGeral` — sub-alocação, obrigatórios ausentes
- [x] `calcCoerencia` — verifica coerência operador↔equipamento e capacidade de transporte
- [x] Análise IA via Claude Haiku streaming (charts + texto)
- [x] Equipe Base: composição de referência do facilitador para cálculo de eficiência

---

## Bugs Corrigidos

| Bug | Causa | Fix |
|-----|-------|-----|
| Substituição de caracteres em inputs | `onChange` chamava mutação Supabase a cada tecla → refetch sobrescrevia o estado local | `LocalNumInp`/`LocalTextInp`/`GrupoField` com onBlur save |
| `calcSeg` avaliava atividades sem recursos | Loop sem guarda de `moRows`/`eqRows` | Adicionado `if (!hasResources) return` antes de avaliar requisitos |
| `addGrupo` não expandia `comps` | Bug arquitetural do arquivo único | Resolvido ao migrar para Supabase + React Query |
| `calcSeg` sempre retornava 100 | Placeholder sem lógica real | Reescrito com comparação real em `calculations.js` |
| Type mismatch em `reqIds` | `uid()` retorna string, comparação falhava | `toggleReq` normaliza para `String()`; `calcSeg` usa `.map(String)` |

---

## Arquivos Órfãos

| Arquivo | Situação |
|---------|----------|
| `src/pages/Intro.jsx` | Não referenciado — pode ser removido |
| `src/pages/GrupoLogin.jsx` | Não referenciado — pode ser removido |
| `src/pages/SessionSelect.jsx` | Nunca finalizado — não referenciado |
| `src/utils/migrateToSupabase.js` | Script utilitário de migração — pode ser removido |

---

## Backlog / Deferred

- [ ] Exportar ranking PNG/PDF
- [ ] Reset de sessão sem reload ("Nova Jornada")
- [ ] Tutorial de onboarding para perfil Grupo
- [ ] Limpeza dos arquivos órfãos
- [ ] Suporte a TypeScript nos catálogos
- [ ] Indicador visual de atividades com KPI = 0 ou Volume Previsto = 0
- [ ] Copiar composição de uma atividade para outra
- [ ] Validação mínima: alerta quando equipes = 0 ou kpi = 0
