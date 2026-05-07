# Project Structure

**Root:** `c:\Users\Wilerson\Desktop\DEV\plan_game`

## Directory Tree

```text
plan_game/
├── .specs/                              # Documentação spec-driven
│   ├── project/
│   │   ├── PROJECT.md                   # Visão, tech stack, escopo
│   │   ├── ROADMAP.md                   # Milestones e features
│   │   └── STATE.md                     # Estado atual, bugs, decisões
│   ├── codebase/
│   │   ├── STACK.md                     # Dependências e ferramentas
│   │   ├── ARCHITECTURE.md              # Padrões arquiteturais
│   │   ├── STRUCTURE.md                 # Estrutura de diretórios (este arquivo)
│   │   ├── CONVENTIONS.md              # Convenções de código
│   │   ├── TESTING.md                  # Estratégia de testes
│   │   ├── INTEGRATIONS.md             # Integrações externas
│   │   └── CONCERNS.md                 # Tech debt e riscos
│   └── features/
│       ├── config-lt/spec.md           # CFG — Configuração da LT
│       ├── grupos/spec.md              # GRP — Gestão de Grupos
│       ├── atividades-kpis/spec.md     # KPI — Atividades e KPIs Base
│       ├── epi-epc/spec.md             # EPI — EPI e EPC
│       ├── composicao/spec.md          # COMP — Composição por Atividade
│       ├── composicao-dinamica/spec.md # DYN — Linhas Add/Remove
│       ├── cronograma/spec.md          # CRON — Cronograma Mensal
│       ├── ranking/spec.md             # RANK — Ranking e Debriefing
│       ├── intro-acesso/spec.md        # INTRO — Login e Acesso
│       └── fluxo-completo/spec.md      # FLOW — Fluxo End-to-End
│
├── src/
│   ├── main.jsx                        # Ponto de entrada — monta AppProvider
│   ├── App.jsx                         # Roteador de screen — AppInner
│   ├── styles.js                       # Estilos reutilizáveis (S.pg, S.tbl, etc.)
│   │
│   ├── constants/
│   │   ├── colors.js                   # Paleta C (dark theme — 17+ tokens)
│   │   └── catalogs.js                 # ATIVS, MO_CAT, EQ_CAT, EPI_CAT, REQ_CATEGORIAS, REQ_CAT_COLORS
│   │
│   ├── utils/
│   │   ├── formatters.js               # fmt, fmtI, sc, uid
│   │   └── calculations.js            # calcA, monthlyVolumes, calcSeg, DIAS_MES
│   │
│   ├── context/
│   │   └── AppContext.jsx              # AppProvider + useApp — estado global e mutadores
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.jsx             # Barra de navegação (navF / navG) + SESSÕES + SAIR
│   │   └── ui/
│   │       ├── Card.jsx               # Card + BtnDel
│   │       ├── Inputs.jsx             # NumInp, TextInp, Sel
│   │       ├── Table.jsx              # TH, TD, TotRow
│   │       └── Typography.jsx         # Hdr2, Tag, Pill, ScoreRing
│   │
│   └── pages/
│       ├── Login.jsx                  # ← PONTO DE ENTRADA — login universal
│       ├── SessionManager.jsx         # Facilitador — CRUD de sessões
│       ├── Engenharia.jsx             # screen: "config" — Configuração da LT
│       ├── Equipes.jsx                # screen: "grupos" — Gestão de grupos + senhas
│       ├── Atividades.jsx             # screen: "atividades" — KPIs base por atividade
│       ├── Requisitos.jsx             # screen: "requisitos" — Requisitos de segurança
│       ├── Composicao.jsx             # screen: "composicao" — Composição MO/EQ/REQ
│       ├── Cronograma.jsx             # screen: "cronograma" — Gantt com volumes mensais
│       ├── Ranking.jsx                # screen: "ranking" — Score e debriefing (F only)
│       │
│       └── [ÓRFÃOS — não referenciados em App.jsx]
│           ├── Intro.jsx              # Substituído por Login.jsx
│           ├── GrupoLogin.jsx         # Substituído por Login.jsx
│           └── SessionSelect.jsx      # Nunca finalizado
│
├── index.html
├── vite.config.js
└── package.json
```

## Onde Ficam as Coisas

### Lógica de negócio central

| Símbolo | Arquivo | Descrição |
| --- | --- | --- |
| `calcA` | `utils/calculations.js` | Custo + duração por atividade |
| `monthlyVolumes` | `utils/calculations.js` | Array de volumes por mês para o Gantt |
| `calcSeg` | `utils/calculations.js` | Score de segurança + desclassificação |
| `buildRank` | `context/AppContext.jsx` | Ranking final com scores normalizados |
| `upd(fn)` | `context/AppContext.jsx` | Mutador de sessão ativa |
| `ESC` | `context/AppContext.jsx` | Derivações de escopo por atividade |

### Catálogos de dados (constants/catalogs.js)

| Constante | Conteúdo |
| --- | --- |
| `ATIVS` | 16 atividades (10 Montagem + 6 Lançamento) com `id`, `grp`, `desc`, `und`, `eKey` |
| `MO_CAT` | 25 cargos de mão de obra com `id`, `cargo`, `sal` |
| `EQ_CAT` | 25 equipamentos com `id`, `nome`, `loc` |
| `EPI_CAT` | 20 EPIs com `id`, `desc` |
| `REQ_CATEGORIAS` | Categorias de requisitos de segurança |
| `REQ_CAT_COLORS` | Mapa categoria → cor para tags |

### Paleta de cores (constants/colors.js)

Todos os estilos inline referenciam o objeto `C`. Tokens principais:

```text
C.gold / C.goldL / C.goldDim  — destaque principal
C.blueL                        — montagem (grupo M)
C.greenL                       — lançamento (grupo L)
C.yellow                       — avisos
C.redL                         — erros / desclassificação
C.txt / C.txt2 / C.txt3        — hierarquia de texto
C.surf2 / C.surf3 / C.border   — superfícies e bordas
```
