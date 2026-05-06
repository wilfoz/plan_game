# Architecture

**Pattern:** Single-File React SPA — estado centralizado com derivações memoizadas

## High-Level Structure

```
┌─────────────────────────────────────────────────┐
│              Browser (SPA)                       │
│                                                  │
│  template/jornadas-lt-v5.jsx                     │
│  ┌───────────────────────────────────────────┐   │
│  │  App (componente raiz)                    │   │
│  │  ├── Estado global (useState ×N)          │   │
│  │  ├── Derivações (useMemo / cálculos)      │   │
│  │  ├── Mutadores (moAdd, eqAdd, etc.)       │   │
│  │  └── Páginas (PgConfig, PgGrupos, etc.)  │   │
│  │       └── UI Atoms (TH, TD, Sel, etc.)   │   │
│  └───────────────────────────────────────────┘   │
│                                                  │
│  Sem backend. Sem API. Sem banco de dados.        │
└─────────────────────────────────────────────────┘
```

## Estado Global

Todo o estado vive em `useState` hooks dentro de `App`:

| Estado | Tipo | Descrição |
|---|---|---|
| `screen` | `string` | Tela ativa ("intro", "config", "grupos", etc.) |
| `role` | `null \| "F" \| "G"` | Perfil ativo |
| `gIdx` | `number` | Índice do grupo ativo |
| `aTab` | `string` | ID da atividade ativa na composição |
| `epiCargoAtivo` | `string` | ID do cargo ativo no painel EPI |
| `lt` | `object` | Parâmetros da LT (nome, tensão, ext, circ, etc.) |
| `torres` | `object` | Quantitativos de 4 tipos de torre |
| `grupos` | `array` | Grupos participantes |
| `kpisBase` | `object` | KPI base por atividade `{ [aId]: number }` |
| `epiCargo` | `object` | EPIs obrigatórios por cargo `{ [moId]: { [epiId]: bool } }` |
| `epcAtiv` | `object` | EPCs por atividade `{ [aId]: { [epcId]: bool } }` |
| `comps` | `array` | Composições `[gi][aId]` com moRows, eqRows, verbas, kpi, equipes |

## Derivações (Cálculos Derivados)

Calculadas inline a cada render (não useMemo explícito — declarações `const` no corpo do `App`):

```
fator = circ === "duplo" ? 2 : 1
totalCabos = (cabFase × 3 + pararaios + opgw) × fator
extCondutor = ext × cabFase × 3 × fator
totalTorres = sum(torres[tipo].qtd)
tonTotal = sum(torres[tipo].ton)
ESC = { ext, extCondutor, totalTorres, tonEstaiada, qtdEstaiada,
        tonCrossrope, qtdCrossrope, tonAuto }
```

## Padrões Identificados

### Páginas como Closures do App

As "páginas" (`PgConfig`, `PgGrupos`, `PgAtividades`, `PgEpiEpc`, `PgComposicao`, `PgCronograma`, `PgRanking`) são funções declaradas com `const` dentro de `App` — não são componentes React independentes. Elas acessam estado e mutadores do `App` por closure, sem receber props.

**Consequência:** Cada render do `App` recria essas funções. Quando usadas como `<PgConfig/>`, React as trata como componentes anônimos e faz remount completo a cada render do parent.

### UI Atoms Globais

Componentes de UI primitivos (`TH`, `TD`, `NumInp`, `TextInp`, `Sel`, `Pill`, `Tag`, `Hdr2`, `ScoreRing`, `Card`, `BtnAdd`, `BtnDel`) são definidos fora do `App` e recebem props. São reutilizados em todas as páginas.

### Mutadores de Estado Granulares

Padrão de funções de mutação especializadas ao invés de um dispatcher genérico:

```javascript
// Atualiza campo da LT
uLt(key, value) → setLt(p => ({...p, [key]: value}))

// Atualiza campo de torre
uTorre(tipo, key, value) → setTorres(p => ({...p, [tipo]: {...p[tipo], [key]: +value}}))

// Atualiza composição de (grupo, atividade) com função transformadora
sc2(gi, aId, fn) → setComps(p => { n[gi][aId] = fn(n[gi][aId]); return n; })

// Add/Del linha dinâmica de MO
moAdd(gi, aId, catId) → sc2(gi, aId, c => ({...c, moRows: [...c.moRows, {...}]}))
moDel(gi, aId, _id)  → sc2(gi, aId, c => ({...c, moRows: c.moRows.filter(r => r._id !== _id)}))
```

### Cálculo de Composição (Função Pura)

`calcA(comp, esc)` é uma função pura que recebe composição e escopo e retorna métricas calculadas:

```javascript
calcA(comp, esc) → { custoMo, custoEq, custoVb, total, dur, moQtd, eqQtd }
```

Usada tanto na tela de Composição (tempo real) quanto no Cronograma e Ranking, garantindo consistência.

### Geração do Gantt (Cursores Independentes)

```javascript
let cM = 0, cL = 0;  // cursores por frente
tl = ATIVS.map(a => {
  const {dur} = calcA(gc(gIdx, a.id), ESC[a.eKey] || 0);
  const st = a.grp === "M" ? cM : cL;
  if (dur > 0) { if (isM) cM += dur; else cL += dur; }
  return { ...a, dur, start: st, end: st + (dur || 0) };
});
```

## Data Flow

```
Facilitador configura LT
  → lt + torres → ESC (derivado inline)
    → calcA(comp, ESC[eKey]) em toda composição

Grupo monta composição
  → moAdd/eqAdd → comps[gi][aId].moRows / eqRows
    → calcA() → custoMo, custoEq, dur

Cronograma
  → calcA() para cada atividade do grupo
    → cursores cM, cL → timeline com start/end

Ranking
  → calcA() para todas atividades de todos grupos
    → custoTotal, durMax, calcSeg()
      → sC, sD, sS → total (pesos 30/30/40)
```
