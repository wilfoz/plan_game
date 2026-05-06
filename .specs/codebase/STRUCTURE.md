# Project Structure

**Root:** `c:\Users\Wilerson\Desktop\DEV\plan_game`

## Directory Tree

```
plan_game/
├── .specs/                          # Documentação spec-driven
│   ├── project/
│   │   ├── PROJECT.md               # Visão, tech stack, escopo
│   │   ├── ROADMAP.md               # Milestones e features
│   │   └── STATE.md                 # Estado atual, bugs, decisões
│   ├── codebase/
│   │   ├── STACK.md                 # Dependências e ferramentas
│   │   ├── ARCHITECTURE.md          # Padrões arquiteturais
│   │   ├── STRUCTURE.md             # Estrutura de diretórios (este arquivo)
│   │   ├── CONVENTIONS.md           # Convenções de código
│   │   ├── TESTING.md               # Estratégia de testes
│   │   ├── INTEGRATIONS.md          # Integrações externas
│   │   └── CONCERNS.md              # Tech debt e riscos
│   └── features/
│       ├── config-lt/spec.md        # CFG — Configuração da LT
│       ├── grupos/spec.md           # GRP — Gestão de Grupos
│       ├── atividades-kpis/spec.md  # KPI — Atividades e KPIs Base
│       ├── epi-epc/spec.md          # EPI — EPI e EPC
│       ├── composicao/spec.md       # COMP — Composição por Atividade
│       ├── composicao-dinamica/spec.md # DYN — Linhas Add/Remove
│       ├── cronograma/spec.md       # CRON — Cronograma Mensal
│       ├── ranking/spec.md          # RANK — Ranking e Debriefing
│       ├── intro-acesso/spec.md     # INTRO — Tela Inicial e Acesso
│       └── fluxo-completo/spec.md   # FLOW — Fluxo End-to-End
│
├── template/                        # Versões do app Jornadas LT
│   ├── jornadas-lt-v5.jsx           # ← ARQUIVO DE TRABALHO ATUAL (~1.214 linhas)
│   └── jornadas-lt-v2.jsx           # Versão anterior (referência / tabelas estáticas)
│
└── .claude/                         # Configuração de agentes (não modificar manualmente)
    └── worktrees/
        └── agent-aceb490b/          # Worktree do projeto LT Planner (projeto diferente)
```

## Arquivo Principal

**`template/jornadas-lt-v5.jsx`** — Arquivo único contendo todo o app (~1.214 linhas):

```
jornadas-lt-v5.jsx
├── PALETA (C — objeto de cores)
├── FORMATADORES (fmt, fmtI, sc)
├── uid() — gerador de IDs de linhas
│
├── CATÁLOGOS (constantes globais)
│   ├── MO_CAT      — 25 cargos com salário base
│   ├── EQ_CAT      — 25 equipamentos com locação/mês
│   ├── EPI_CAT     — 20 EPIs (R$ 50 cada)
│   ├── EPC_CAT     — 4 EPCs com custo
│   └── ATIVS       — 16 atividades (10M + 6L)
│
├── FÁBRICAS DE ESTADO
│   ├── mkComp()         — composição vazia por atividade
│   └── mkGrupoComps()   — composições para as 16 atividades
│
├── UI ATOMS (fora do App, reutilizáveis)
│   ├── TH, TD           — células de tabela
│   ├── NumInp, TextInp  — inputs tipados
│   ├── Sel              — select dropdown com placeholder
│   ├── Pill             — botão de seleção toggle
│   ├── Tag              — badge colorido
│   ├── Hdr2             — cabeçalho de card
│   ├── ScoreRing        — anel de score circular
│   ├── Card             — container com borda
│   ├── BtnAdd           — botão "+ ADICIONAR LINHA"
│   ├── BtnDel           — botão ✕ com hover vermelho
│   └── TotRow           — linha de total em tabela
│
└── App (componente raiz — exportado como default)
    ├── Estado (useState ×12)
    ├── Mutadores (uLt, uTorre, addGrupo, sc2, moAdd/Del, eqAdd/Del, etc.)
    ├── Derivações (fator, totalCabos, extCondutor, ESC, etc.)
    ├── Funções de cálculo (calcA, calcSeg, buildRank)
    ├── Estilos (objeto S — layouts reutilizáveis)
    ├── Nav (componente de navegação inline)
    ├── Intro (tela inicial — renderizada inline)
    └── Páginas (closures do App)
        ├── PgConfig     — Config LT
        ├── PgGrupos     — Gestão de Grupos
        ├── PgAtividades — Atividades e KPIs
        ├── PgEpiEpc     — EPI e EPC
        ├── PgComposicao — Composição por Atividade
        ├── PgCronograma — Cronograma Mensal
        └── PgRanking    — Ranking e Debriefing
```

## Onde Ficam as Coisas

**Catálogos de dados:**
- Cargos de MO: `MO_CAT` (linhas 14–40)
- Equipamentos: `EQ_CAT` (linhas 41–67)
- EPIs: `EPI_CAT` (linhas 68–89)
- EPCs: `EPC_CAT` (linhas 90–95)
- Atividades: `ATIVS` (linhas 96–113)

**Lógica de negócio central:**
- `calcA(comp, esc)` — cálculo de custo e duração por atividade (linhas 286–295)
- `calcSeg(gi)` — score de segurança (linhas 296–308) ⚠️ placeholder
- `buildRank()` — montagem do ranking final (linhas 309–323)

**Geração do Gantt:**
- `PgCronograma` — cursores `cM`/`cL` e mapeamento de timeline (linhas 1000–1117)

**Ranking e gabarito:**
- `PgRanking` — tabela de scores e gabarito hardcoded (linhas 1119–1198)
