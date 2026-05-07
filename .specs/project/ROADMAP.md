# Roadmap

**Current Milestone:** V2 — implementado e estável
**Próximo:** V3 — Persistência (Supabase)

---

## V1 — MVP Arquivo Único (CONCLUÍDO)

**Goal:** App funcional ponta-a-ponta em arquivo único JSX.

**Entregues:**

- Configuração de LT (tensão, extensão, torres)
- Gestão de grupos
- Composição dinâmica MO + Equipamentos + Verbas
- Cronograma Gantt mensal (10 meses)
- Ranking 30/30/40 com debriefing básico

**Arquivo:** `template/jornadas-lt-v5.jsx` (~1.214 linhas) — mantido como referência histórica

---

## V2 — SPA Multi-Arquivo + Sessions + Auth (CONCLUÍDO)

**Goal:** Arquitetura escalável, isolamento real de grupos, requisitos de segurança funcionais.

### Arquitetura

- [x] Migração para Vite + React multi-arquivo
- [x] Context API (`AppContext`) com padrão `upd(fn)`
- [x] Sessions como top-level state — múltiplas jornadas coexistem

### Autenticação e Acesso

- [x] Login universal como ponto de entrada obrigatório
- [x] Facilitador: `FACILITADOR` + `elecnorbrasil`
- [x] Grupos: nome + senha definida pelo facilitador
- [x] Busca de grupo em todas as sessões no login
- [x] Isolamento completo — grupos não veem composições uns dos outros
- [x] Ranking acessível apenas pelo facilitador

### Composição

- [x] MO simplificada (QTD, SAL, TOTAL — sem verbas)
- [x] Equipamentos simplificados (QTD, LOC, TOTAL)
- [x] KPI como `un/dia/eq` (label e cálculo alinhados)
- [x] Requisitos de segurança via add/remove (UX idêntica a MO/EQ)

### Requisitos de Segurança

- [x] `aplicavel` (Aplicável / Não Aplicável) por requisito
- [x] `calcSeg` real com desclassificação absoluta
- [x] Bug de type mismatch em `reqIds` corrigido nas 3 camadas

### Cronograma

- [x] Volumes mensais por célula no Gantt (`monthlyVolumes`)
- [x] Seletor de grupo visível apenas para facilitador

### Ranking

- [x] Debriefing com tabela de requisitos não atendidos por grupo
- [x] `buildRank` com desclassificação direta via `seg.desq`

---

## V3 — Persistência com Supabase (PLANEJADO)

**Goal:** Estado persistido em banco de dados — facilitador retoma sessões entre recarregamentos; grupos se reconectam sem perder composições.

**Plano escrito:** disponível no histórico de conversação. Não implementado ainda.

### Features Planejadas

**Banco de dados (PostgreSQL via Supabase):**

- Tabelas: `sessions`, `lt_config`, `torres`, `grupos`, `atividades_kpi`, `requisitos`, `composicoes`, `mo_rows`, `eq_rows`, `req_ids`, `epi_cargo`
- RLS (Row Level Security): facilitadores veem todas as sessões; grupos veem apenas a própria sessão
- Realtime subscriptions para ranking ao vivo

**Auth:**

- Facilitadores: Supabase Auth (email/senha)
- Grupos: JWT customizado via Edge Function (valida nome + senha sem criar usuário)

**Refactoring:**

- `AppContext` passa a buscar/salvar via TanStack Query (async state)
- `upd(fn)` local substituído por mutations com optimistic updates

**Deploy:** Vercel (SPA estática) + Supabase (DB + Auth + Edge Functions)

---

## V4 — Features Incrementais (BACKLOG)

**Goal:** Valor pedagógico adicional sem comprometer a simplicidade.

- [ ] Exportar ranking em PNG/PDF para distribuição pós-jornada
- [ ] Exportar Gantt como imagem
- [ ] Reset de sessão sem reload ("Nova Jornada" com confirmação)
- [ ] Tutorial de onboarding de 30 segundos para perfil Grupo
- [ ] Gabarito dinâmico baseado na LT configurada (substituir hardcoded)
- [ ] Comparação side-by-side de dois cronogramas no debriefing
- [ ] Suporte a até 8 grupos simultâneos

---

## Deferred / Fora de Escopo

- Suporte a TypeScript nos catálogos
- App mobile nativo
- Integração com ERP/SAP/TOTVS
- Multi-LT simultâneas por sessão
- Limpeza dos arquivos órfãos (`Intro.jsx`, `GrupoLogin.jsx`, `SessionSelect.jsx`)
