# Architecture

**Pattern:** Multi-file React SPA — estado global via Context API, navegação por estado `screen`, sem backend.

## High-Level Structure

```text
┌───────────────────────────────────────────────────────┐
│                    Browser (SPA)                       │
│                                                        │
│  main.jsx → App.jsx                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AppProvider (Context)                           │  │
│  │  ├── sessions[]        ← top-level state         │  │
│  │  ├── activeSessionId                             │  │
│  │  ├── role / gIdx / screen / aTab                │  │
│  │  └── upd(fn)           ← mutador de sessão ativa │  │
│  │                                                  │  │
│  │  AppInner (roteador de screen)                   │  │
│  │  ├── "login"           → Login                   │  │
│  │  ├── "session-manager" → SessionManager          │  │
│  │  └── * (com Header)                              │  │
│  │       ├── config       → Engenharia              │  │
│  │       ├── grupos       → Equipes                 │  │
│  │       ├── atividades   → Atividades              │  │
│  │       ├── requisitos   → Requisitos              │  │
│  │       ├── composicao   → Composicao              │  │
│  │       ├── cronograma   → Cronograma              │  │
│  │       └── ranking      → Ranking                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Sem backend. Sem API. Sem banco de dados.             │
└───────────────────────────────────────────────────────┘
```

## Fluxo de Navegação

```text
App abre → screen: "login"
  │
  ├── FACILITADOR + senha → screen: "session-manager"  (role: "F")
  │     │
  │     ├── Criar/entrar sessão → screen: "config"
  │     │     └── navF: config → grupos → atividades → requisitos
  │     │                     → composicao → cronograma → ranking
  │     │
  │     └── ☰ SESSÕES (volta ao session-manager sem logout)
  │
  └── [grupo] + senha → busca em sessions[] → screen: "composicao"  (role: "G")
        └── navG: composicao → cronograma
```

## Estado Global (AppContext)

### Estado de sessão (fora de sessions\[\])

| Estado | Tipo | Descrição |
| --- | --- | --- |
| `screen` | `string` | Tela ativa — navega o app |
| `role` | `null \| "F" \| "G"` | Perfil autenticado |
| `gIdx` | `number` | Índice do grupo ativo |
| `aTab` | `string` | ID da atividade ativa na composição |
| `epiCargoAtivo` | `string` | Cargo ativo no painel EPI |
| `sessions` | `Session[]` | Todas as sessões criadas |
| `activeSessionId` | `string \| null` | Sessão em uso |

### Estrutura de uma Session

```js
{
  id: uid(),
  nome: string,
  lt: { nome, tensao, ext, circ, cabFase, pararaios, opgw },
  torres: { crossrope, suspensao, ancoragem, estaiada }, // cada: { qtd, ton }
  grupos: [{ id, nome, resp, senha }],
  comps: [                   // índice = grupo
    {                        // chave = aId
      [aId]: {
        moRows: [{ _id, catId, cargo, sal, qtd }],
        eqRows: [{ _id, catId, nome, loc, qtd }],
        reqIds: number[],    // IDs dos requisitos adicionados pelo grupo
        kpi: number,
        equipes: number
      }
    }
  ],
  kpisBase: { [aId]: number },
  requisitos: [{ _id, aId, categoria, desc, aplicavel: bool }],
  epiCargo: { [moId]: { [epiId]: bool } }
}
```

### Helper de mutação

```js
// Muta apenas a sessão ativa — imutável via map
const upd = fn => setSessions(p => p.map(s => s.id === activeSessionId ? fn(s) : s));

// Exemplo
const uLt = (k, v) => upd(s => ({ ...s, lt: { ...s.lt, [k]: v } }));
```

## Cálculos (utils/calculations.js)

### calcA(comp, esc) — função pura

```js
// Entrada: composição de um grupo para uma atividade + escopo
// Saída: métricas de custo e duração
calcA(comp, esc) → {
  custoMo,       // sum(sal × qtd)
  custoEq,       // sum(loc × qtd)
  total,         // custoMo + custoEq
  durDias,       // esc / (equipes × kpi)   [KPI = un/dia/equipe]
  durTotalDias,  // Math.ceil(durDias)
  dur,           // Math.ceil(durMeses × 100) / 100
  moQtd,         // sum(qtd) de moRows
  eqQtd          // eqRows.length
}
```

### monthlyVolumes(esc, kpi, equipes) — Gantt

```js
// Retorna array de volumes inteiros por mês
// volPerMonth = equipes × kpi × DIAS_MES (22)
// Ex: monthlyVolumes(420, 9, 2) → [396, 24]  (2,13 meses)
```

### calcSeg(requisitos, getCompFn) — segurança

```js
// Para cada atividade:
//   aplicaveis = requisitos com aplicavel !== false
//   addedIds   = comp.reqIds normalizados para Number
//   missing    = aplicaveis não adicionados pelo grupo
//
// Se missing.length > 0:
//   → { score: 0, desq: true, missing: [{atividade, categoria, desc}] }
// Senão:
//   → { score: addedAplicaveis / denominator × 100, desq: false, missing: [] }
```

**Invariante crítico:** `reqIds` são sempre `number[]`. Qualquer entrada string é coercida com `+reqId` em `toggleReq` e `.map(Number)` em `calcSeg`.

### buildRank() — ranking final

```js
// Pesos: Custo 30% + Duração 30% + Segurança 40%
// sC = (minCusto / grupoCusto) × 100   (melhor grupo = 100)
// sD = (minDur   / grupoDur)   × 100   (melhor grupo = 100)
// sS = seg.score
// total = desq ? 0 : round(sC×.3 + sD×.3 + sS×.4)
// Grupos desq ficam com total=0 e não entram no cálculo de mc/md
```

## Derivações ESC (escopo por atividade)

```js
fator       = circ === "duplo" ? 2 : 1
totalCabos  = (cabFase × 3 + pararaios + opgw) × fator
extCondutor = ext × cabFase × 3 × fator
totalTorres = sum(torres[tipo].qtd)

ESC = {
  ext, extCondutor, totalTorres,
  tonEstaiada, qtdEstaiada,
  tonCrossrope, qtdCrossrope,
  tonAuto  // suspensao.ton + ancoragem.ton
}
// ATIVS[i].eKey mapeia cada atividade para a chave correta em ESC
```

## Controle de Acesso (Role-Based)

```text
navF (role="F"):  ⚙ LT | 👥 GRUPOS | 📋 ATIVIDADES | 🛡️ REQUISITOS
                  🔧 COMPOSIÇÃO | 📅 CRONOGRAMA | 🏆 RANKING
navG (role="G"):  🔧 COMPOSIÇÃO | 📅 CRONOGRAMA

Telas sem header (livres):  login, session-manager
Seletor de grupo: visível apenas para role="F" em Composicao e Cronograma
```

## Padrões de Componentes

### UI Atoms (src/components/ui/)

Componentes de UI primitivos recebem props explícitas, sem acesso ao contexto:

```text
Card, BtnDel          → containers e ações destrutivas
TH, TD, TotRow        → células de tabela
NumInp, TextInp, Sel  → inputs tipados
Hdr2, Tag, Pill       → tipografia e badges
ScoreRing             → anel circular de score (conic-gradient)
```

### Páginas (src/pages/)

Componentes React independentes que consomem `useApp()`. Recebem todo o estado e mutadores via Context, sem props.
