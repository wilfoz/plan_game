# State

**Last Updated:** 2026-05-07
**Current Milestone:** V2.1 — refatoração de volumes e atividades

---

## Status Geral

O app está **funcionalmente completo** para o fluxo principal da Jornada v2. A arquitetura foi migrada de arquivo único (~1.200 linhas) para SPA multi-arquivo com Vite + Context API + Sessions. Todos os módulos críticos estão implementados e os bugs de tipo (type mismatch em reqIds) foram corrigidos.

---

## Implementações Concluídas (v2.1)

### Refatoração de Volumes e Atividades

- [x] Campo `torres` removido do estado da sessão e de toda a interface
- [x] `ESC` (objeto de escopos derivados de torres) removido do AppContext
- [x] `volumesPrev: { [aId]: number }` — volume previsto editável diretamente por atividade
- [x] `comentariosAtiv: { [aId]: string }` — comentário livre editável por atividade
- [x] Tela Atividades: coluna ESCOPO (read-only) substituída por VOLUME PREVISTO (editável); coluna COMENTÁRIO adicionada
- [x] Tela Engenharia: bloco "TIPOS DE TORRES" removido; cards simplificados para 3 (CONDUTORES, TOTAL CABOS, KM CONDUTOR)
- [x] Composição e Cronograma: `ESC[a.eKey]` substituído por `volumesPrev[a.id]` em todos os cálculos
- [x] `buildRank` e `calcA` atualizados para usar `volumesPrev[a.id]`
- [x] `eKey` removido de todos os objetos `ATIVS` em catalogs.js
- [x] `TextInp` agora aceita prop `w` para controle de largura

---

## Implementações Concluídas (v2)

### Arquitetura

- [x] Migração de arquivo único (`jornadas-lt-v5.jsx`) para SPA multi-arquivo com Vite
- [x] Context API (`AppContext`) substituindo prop-drilling via closures
- [x] Sessions como top-level state — `sessions[]`, `activeSessionId`, `upd(fn)`
- [x] Separação em módulos: constants, utils, components, pages

### Autenticação e Acesso

- [x] Página de Login universal (primeiro ponto de acesso; sem acesso antes de autenticar)
- [x] Facilitador: `FACILITADOR` + `elecnorbrasil` → Session Manager
- [x] Grupos: nome do grupo + senha → busca em todas as sessões, acesso direto à composição
- [x] Isolamento completo de grupos (sem visibilidade cruzada de composições)
- [x] Session Manager protegido (acessível apenas após login como facilitador)
- [x] Header: **☰ SESSÕES** (facilitador volta ao gerenciador sem logout) + **SAIR** (logout total)

### Sessões

- [x] CRUD de sessões (criar, renomear, excluir, entrar)
- [x] Encapsulamento: cada sessão tem seu `lt`, `torres`, `grupos`, `comps`, `kpisBase`, `requisitos`, `epiCargo`
- [x] Grupos + senhas definidos pelo facilitador dentro da sessão

### Composição

- [x] MO simplificada: apenas QTD, SALÁRIO/MÊS, TOTAL/MÊS (SAL editável)
- [x] Equipamentos simplificados: apenas QTD, LOCAÇÃO/MÊS, TOTAL/MÊS (LOC editável)
- [x] Verbas diversas removidas completamente
- [x] KPI label corrigido para `KPI (un/dia/eq)`
- [x] Requisitos de segurança via add/remove (mesma UX de MO/Equipamentos)
- [x] Facilitador vê seletor de grupo (pills) para trocar entre grupos; grupo não vê switcher

### Requisitos de Segurança

- [x] Campo `tempo` e campo `score` removidos
- [x] Campo `aplicavel` (Aplicável / Não Aplicável) por requisito
- [x] Grupos adicionam requisitos via dropdown (categoria + descrição)
- [x] `calcSeg` real: desclassificado se qualquer requisito aplicável não for adicionado pelo grupo
- [x] Score: `addedAplicaveis / (addedAplicaveis + addedNaoAplicaveis) × 100`
- [x] Bug de type mismatch (string vs number em reqIds) corrigido em 3 camadas: `toggleReq`, `calcSeg`, display

### Cronograma

- [x] Seletor de grupo apenas para facilitador (grupos veem apenas o próprio cronograma)
- [x] Gantt mensal com volumes por célula via `monthlyVolumes(esc, kpi, equipes)`
- [x] Tabela de duração sem coluna redundante de volumes (migrado para o Gantt)

### Ranking

- [x] Acessível apenas para facilitador (removido do navG)
- [x] Debriefing mostra tabela de requisitos não atendidos por grupo desclassificado
- [x] `buildRank` usa `seg.desq` diretamente; grupos desq têm `total: 0`

---

## Bugs Corrigidos (v2)

| Bug | Causa | Fix |
|-----|-------|-----|
| `addGrupo` não expandia `comps` | Bug arquitetural do arquivo único | Resolvido ao migrar para Sessions architecture |
| `calcSeg` sempre retornava 100 | Placeholder sem lógica real | Reescrito com comparação real em `calculations.js` |
| Score SEG não mudava após adicionar requisito | Type mismatch: `uid()` retorna `number`, `e.target.value` é `string` | `toggleReq` normaliza com `+reqId`; `calcSeg` usa `.map(Number)` + `+r._id` |
| Composição não persistia ao trocar grupo | Mesma raiz que BUG-001 | Resolvido pela Sessions architecture |

---

## Arquivos Órfãos

| Arquivo | Situação |
|---------|----------|
| `src/pages/Intro.jsx` | Substituído por `Login.jsx` — não referenciado em App.jsx |
| `src/pages/GrupoLogin.jsx` | Substituído por `Login.jsx` — não referenciado em App.jsx |
| `src/pages/SessionSelect.jsx` | Nunca finalizado — não referenciado em App.jsx |

---

## Decisões Arquiteturais

### AD-001: Sessions como top-level state

**Decisão:** Toda a configuração da jornada (LT, grupos, composições, requisitos) aninhada dentro de `sessions[]`. `activeSessionId` seleciona a sessão ativa. `upd(fn)` muta apenas a sessão ativa.

**Razão:** Permitir múltiplas jornadas coexistindo sem conflito; isolamento completo entre sessões.

**Trade-off:** Mais profundidade no estado; `sess?.lt ?? _empty` em toda derivação.

### AD-002: Login universal como ponto de entrada

**Decisão:** App inicia em `screen: "login"`. Nenhuma tela é acessível antes de autenticar.

**Razão:** Requisito de isolamento de grupos — grupos não devem ver dados de outros grupos ou criar sessões.

**Trade-off:** Facilitador precisa se autenticar a cada recarga (estado efêmero).

### AD-003: KPI como unidade diária (un/dia/eq)

**Decisão:** `durDias = esc / (equipes × kpi)` — KPI é unidades por dia por equipe.

**Razão:** Fidelidade ao domínio real de LT (produtividade diária por equipe).

**Impact:** `monthlyVolumes = equipes × kpi × DIAS_MES (22)` por mês.

### AD-004: Requisitos — desclassificação absoluta

**Decisão:** Um único requisito aplicável não atendido desclassifica o grupo (`desq: true`, `score: 0`).

**Razão:** Critério pedagógico inegociável — segurança não tem tolerância parcial.

**Trade-off:** Grupos precisam ser diligentes em adicionar todos os requisitos para cada atividade.

---

## Backlog / Deferred

- [ ] Supabase integration (plano escrito — não implementado)
- [ ] Exportar ranking PNG/PDF
- [ ] Reset de sessão sem reload ("Nova Jornada")
- [ ] Tutorial de onboarding para perfil Grupo
- [ ] Limpeza dos arquivos órfãos (Intro.jsx, GrupoLogin.jsx, SessionSelect.jsx)
- [ ] Suporte a TypeScript nos catálogos
