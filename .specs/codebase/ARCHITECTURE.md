# Architecture

**Pattern:** Multi-file React SPA — estado global via Context API + React Query, navegação por estado `screen`, backend Supabase (PostgreSQL).

## High-Level Structure

```text
┌────────────────────────────────────────────────────────┐
│                    Browser (SPA)                        │
│                                                         │
│  main.jsx → QueryProvider → App.jsx                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AppProvider (Context)                            │  │
│  │  ├── screen / role / gIdx / aTab                 │  │
│  │  ├── activeSessionId                             │  │
│  │  ├── React Query hooks (Supabase)                │  │
│  │  │   ├── useSessions        → sessions[]         │  │
│  │  │   ├── useLtConfig        → lt                 │  │
│  │  │   ├── useAtividadesConfig→ kpisBase/volumes   │  │
│  │  │   ├── useEquipeBase      → equipesBase        │  │
│  │  │   ├── useGrupos          → grupos[]           │  │
│  │  │   ├── useGrupoComps      → comps[]            │  │
│  │  │   ├── useRequisitos      → requisitos[]       │  │
│  │  │   └── useEpiCargo        → epiCargo           │  │
│  │  └── Funções derivadas: calcA, calcSeg, buildRank│  │
│  │                                                   │  │
│  │  AppInner (roteador de screen)                    │  │
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
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Backend: Supabase (PostgreSQL + Realtime + bcrypt RPC) │
└────────────────────────────────────────────────────────┘
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
  └── [grupo] + senha → RPC `verify_grupo_senha` → screen: "composicao"  (role: "G")
        └── navG: composicao → cronograma
```

## Estado Global (AppContext)

### Dados da Sessão Ativa (React Query — Supabase)

| Hook | Tabela Supabase | Dado derivado |
|------|-----------------|---------------|
| `useSessions` | `sessions` | `sessions[]` |
| `useLtConfig` | `lt_config` | `lt` |
| `useAtividadesConfig` | `atividades_config` | `kpisBase`, `volumesPrev`, `comentariosAtiv` |
| `useEquipeBase` | `equipe_base_mo`, `equipe_base_eq` | `equipesBase` |
| `useGrupos` | `grupos` | `grupos[]` |
| `useGrupoComps` | `grupo_comps` | `comps[]` |
| `useRequisitos` | `requisitos` | `requisitos[]` |
| `useEpiCargo` | `epi_cargo` | `epiCargo` |

### Estado Local de UI (React useState)

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `screen` | `string` | Tela ativa — navega o app |
| `role` | `null \| "F" \| "G"` | Perfil autenticado |
| `gIdx` | `number` | Índice do grupo ativo |
| `aTab` | `string` | ID da atividade ativa na composição |
| `epiCargoAtivo` | `string` | Cargo ativo no painel EPI |
| `activeSessionId` | `string \| null` | Sessão em uso |
| `lt` | `object` | Estado local sincronizado de `useLtConfig` |
| `ativLocal` | `object` | Estado local sincronizado de `useAtividadesConfig` |
| `comps` | `array` | Estado local sincronizado de `useGrupoComps` |

### Estrutura de uma Composição

```js
// comps[gi][aId]
{
  moRows: [{ _id, catId, cargo, sal, qtd, horasDia }],
  eqRows: [{ _id, catId, nome, loc, qtd, horasDia }],
  reqIds: string[],   // IDs dos requisitos adicionados pelo grupo
  kpi: number,
  equipes: number
}
```

### Padrão de Persistência (Debounce)

```js
// Mutações diretas (sem debounce): add, del, toggle
// Mutações com debounce (evita writes excessivos enquanto usuário edita):
ltHook.upsertDebounced(lt)              // 800ms
ativHook.upsertDebounced(aId, dados)    // 800ms
compsHook.upsertDebounced(grupoId, aId, comp)  // 800ms
ebHook.updMo.mutate / ebHook.updEq.mutate      // imediato (onBlur)
```

## Padrão de Input (Anti-substituição de caracteres)

**Problema:** inputs controlados por dado do servidor + `onChange → save` causam:
1. Mutação Supabase a cada tecla
2. `invalidateQueries` → refetch
3. Dado do servidor sobrescreve o que o usuário digitou → caracteres substituídos + lag

**Solução — `LocalNumInp` e `LocalTextInp`:**

```js
// Estado local para digitação fluida; save apenas no onBlur.
// Sincroniza do servidor somente quando a mudança vem de fora
// (não do próprio usuário) via useRef + useEffect.
export const LocalNumInp = ({ v, onSave, w }) => {
  const [local, setLocal] = useState(toStr(v));
  const savedRef = useRef(toStr(v));
  useEffect(() => {
    const s = toStr(v);
    if (s !== savedRef.current) { setLocal(s); savedRef.current = s; }
  }, [v]);
  const handleBlur = () => {
    if (local !== savedRef.current) { onSave(local); savedRef.current = local; }
  };
  return <input type="number" value={local} onChange={e => setLocal(e.target.value)} onBlur={handleBlur} />;
};
```

**Regra:** Todo campo editável que persiste no Supabase deve usar `LocalNumInp`, `LocalTextInp` ou `GrupoField` — nunca `NumInp`/`TextInp` diretamente com `onChange → save`.

## Cálculos (utils/calculations.js)

### calcA(comp, esc) — função pura

```js
calcA(comp, esc) → {
  custoMo,       // sum(sal × qtd)
  custoEq,       // sum(loc × qtd)
  total,         // custoMo + custoEq
  durDias,       // esc / (equipes × kpi)
  durTotalDias,  // Math.ceil(durDias)
  dur,           // durMeses arredondado
  durMeses,      // durDias / DIAS_MES (22)
  moQtd,         // sum(qtd) de moRows
  coefMo,        // Hh por unidade (somaHh/kpi)
  coefEq         // Ch por unidade (somaCh/kpi)
}
```

### calcSeg(requisitos, getCompFn) — segurança e desclassificação

```js
// REGRA CRÍTICA: só avalia requisitos de atividades que têm recursos.
// Se moRows.length === 0 && eqRows.length === 0 → pula a atividade.
//
// Para atividades com recursos:
//   aplicaveis = requisitos com aplicavel !== false
//   addedIds   = comp.reqIds normalizados para String
//   missing    = aplicaveis não adicionados pelo grupo
//
// Se missing.length > 0:
//   → { score: 0, desq: true, missing: [{atividade, categoria, desc}] }
// Senão:
//   → { score: 100, desq: false, missing: [] }
```

**Invariante:** `reqIds` são sempre `string[]`. Coerção via `.map(String)` em `calcSeg` e `toggleReq`.

### calcNaoAplicPenalty(requisitos, getCompFn) — penalidade

```js
// Requisitos marcados como "Não Aplicável" pelo facilitador que o grupo
// adicionou indevidamente → cada um penaliza +2% no custo total.
// Retorna { count, fator (ex: 1.06 para 3 req), pct, detalhes[] }
```

### calcEficiencia(comp, baseComp, kpiBase, aId) — eficiência vs referência

```js
// Compara coeficientes do grupo (Hh/unid, Ch/unid) com a equipe base.
// Detecta sub-alocação por cargo e obrigatórios ausentes (BASE_COMPOSITIONS).
// Retorna { varMoPct, varEqPct, varKpiPct, impactoPrazo, subAlocacao[], obrigatorioAusente[] }
```

### calcCoerencia(moRows, eqRows) — coerência operador↔equipamento

```js
// Verifica: operador sem equipamento, equipamento sem operador,
// quantidade insuficiente/excessiva, capacidade de transporte.
// Retorna { issues[] }
```

### buildRank() — ranking final

```js
// Score: sC × 0.5 + sD × 0.5  (50% Custo + 50% Duração)
// Penalidade: custo multiplicado por fator de naoAplic (ex: ×1.06)
// Penalidade prazo: PENALTY[impactoPrazo] = { risco: 1.2, pior: 1.4 }
// Desclassificação: calcSeg detecta req aplicável ausente em atividade com recursos
// Desclassificados: total = 0, excluídos do cálculo de minCusto/minDur
```

## Controle de Acesso (Role-Based)

```text
navF (role="F"):  ⚙ LT | 👥 GRUPOS | 📋 ATIVIDADES | 🛡️ REQUISITOS
                  🔧 COMPOSIÇÃO | 📅 CRONOGRAMA | 🏆 RANKING

navG (role="G"):  🔧 COMPOSIÇÃO | 📅 CRONOGRAMA

Telas sem header (livres):  login, session-manager
Seletor de grupo: visível apenas para role="F" em Composicao e Cronograma
Alertas de sub-alocação/coerência: visíveis apenas para role!="G"
```

## Padrões de Componentes

### UI Atoms (src/components/ui/)

```text
Card, BtnDel             → containers e ações destrutivas
TH, TD                   → células de tabela
NumInp, TextInp, Sel     → inputs controlados (uso legacy)
LocalNumInp, LocalTextInp→ inputs com estado local + onBlur (padrão atual)
GrupoField               → LocalTextInp especializado para campos de grupo
Hdr2, Tag, Pill          → tipografia e badges
ScoreRing                → anel circular de score (conic-gradient)
ChartBlock               → gráfico gerado pela análise IA
```

### Páginas (src/pages/)

Componentes React independentes que consomem `useApp()`. Sem props — todo estado via Context.
