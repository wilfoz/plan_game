# Code Conventions

**Analyzed:** 2026-05-05
**File:** `template/jornadas-lt-v5.jsx` — JSX standalone, sem TypeScript, sem build system

---

## Naming Conventions

### Componentes React

- **UI Atoms** (fora do App): PascalCase curto de 2–3 letras — `TH`, `TD`, `NumInp`, `TextInp`, `Sel`, `Pill`, `Tag`, `Hdr2`, `BtnAdd`, `BtnDel`, `TotRow`, `ScoreRing`, `Card`
- **Páginas** (closures do App): `Pg` + sufixo descritivo — `PgConfig`, `PgGrupos`, `PgAtividades`, `PgEpiEpc`, `PgComposicao`, `PgCronograma`, `PgRanking`
- **Componentes utilitários inline**: PascalCase — `Nav`, `Intro`

### Estado (useState)

- camelCase curto e descritivo: `lt`, `torres`, `grupos`, `comps`, `kpisBase`, `epiCargo`, `epcAtiv`, `screen`, `role`, `gIdx`, `aTab`, `epiCargoAtivo`

### Mutadores de Estado

- Padrão: verbo + objeto, camelCase curto
  - `uLt(key, val)` — update LT field
  - `uTorre(tipo, key, val)` — update torre field
  - `sc2(gi, aId, fn)` — set comps at \[gi\]\[aId\]
  - `moAdd(gi, aId, catId)` / `moDel(gi, aId, _id)` — add/remove MO row
  - `eqAdd(gi, aId, catId)` / `eqDel(gi, aId, _id)` — add/remove EQ row
  - `addGrupo()` — push novo grupo
  - `uGrupo(gi, key, val)` — update campo de grupo

### Catálogos e Constantes Globais

- UPPER_SNAKE_CASE para arrays de catálogo: `MO_CAT`, `EQ_CAT`, `EPI_CAT`, `EPC_CAT`, `ATIVS`
- PascalCase para objeto de paleta: `C` (17 tokens de cor)
- camelCase para funções utilitárias globais: `uid()`, `fmt()`, `fmtI()`, `sc()`
- camelCase para fábricas de estado: `mkComp()`, `mkGrupoComps()`

### Variáveis Locais

- camelCase: `fator`, `totalCabos`, `extCondutor`, `totalTorres`, `tonTotal`, `tl`, `gi`, `aId`
- Cursores de Gantt: `cM`, `cL` (curtos por contexto restrito)
- Linhas de tabela dinâmica: `moRows`, `eqRows`, cada linha com `_id` (prefixo `_` = ID interno gerado por `uid()`)

---

## Inline Style Pattern

Todos os estilos são objetos JS literais — sem CSS externo, sem classes.

### Paleta `C`

```javascript
const C = {
  bg:     "#0d1117",   // fundo principal
  card:   "#161b22",   // card/surface
  border: "#30363d",   // borda
  text:   "#e6edf3",   // texto primário
  muted:  "#8b949e",   // texto secundário
  accent: "#58a6ff",   // azul destaque
  green:  "#3fb950",
  yellow: "#d29922",
  red:    "#f85149",
  orange: "#e3b341",
  // ... até 17 tokens
};
```

### Objeto `S` (estilos reutilizáveis no App)

O App define um objeto `S` com entradas nomeadas para layouts recorrentes:

```javascript
const S = {
  row:   { display:"flex", gap:8, alignItems:"center" },
  col:   { display:"flex", flexDirection:"column", gap:8 },
  card:  { background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:16 },
  // ...
};
```

### Uso nos componentes

```jsx
// Inline direto
<div style={{ display:"flex", gap:8, padding:16 }}>

// Via objeto S
<div style={S.card}>

// Via token C
<span style={{ color: C.muted }}>texto secundário</span>
```

---

## Estrutura do Arquivo JSX

Ordem das declarações em `jornadas-lt-v5.jsx`:

```text
1. import { useState } from "react"
2. Paleta C
3. Formatadores: fmt, fmtI, sc
4. uid() — gerador de IDs
5. Catálogos globais: MO_CAT, EQ_CAT, EPI_CAT, EPC_CAT, ATIVS
6. Fábricas de estado: mkComp(), mkGrupoComps()
7. UI Atoms: TH, TD, NumInp, TextInp, Sel, Pill, Tag, Hdr2,
             ScoreRing, Card, BtnAdd, BtnDel, TotRow
8. export default function App() {
     8a. Estados (useState ×12)
     8b. Mutadores (uLt, uTorre, addGrupo, sc2, moAdd/Del, eqAdd/Del, ...)
     8c. Derivações (fator, ESC, totalCabos, ...)
     8d. Funções de cálculo: calcA, calcSeg, buildRank
     8e. Estilos S
     8f. Componentes inline: Nav, Intro
     8g. Páginas: PgConfig, PgGrupos, PgAtividades, PgEpiEpc,
                  PgComposicao, PgCronograma, PgRanking
     8h. return (JSX de roteamento por screen)
   }
```

---

## Padrões de Props em UI Atoms

Atoms recebem props explícitas, sem acesso a closure do App:

```jsx
// TH / TD — células de tabela
<TH>Cargo</TH>
<TD style={{ width: 120 }}>valor</TD>

// NumInp — input numérico controlado
<NumInp value={comp.kpi} onChange={v => sc2(gi, aId, c => ({...c, kpi: v}))} />

// Sel — select com placeholder
<Sel value={row.catId} onChange={v => uRow(v)} placeholder="Selecione cargo">
  {MO_CAT.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
</Sel>

// Pill — botão toggle de seleção de grupo
<Pill active={gIdx === i} onClick={() => setGIdx(i)}>{g.nome}</Pill>

// BtnAdd / BtnDel
<BtnAdd onClick={() => moAdd(gIdx, aTab, "")} />
<BtnDel onClick={() => moDel(gIdx, aTab, row._id)} />
```

---

## Convenções de Dados

### IDs de Catálogo

- MO: `"mo1"` ... `"mo25"` (cargo)
- EQ: `"eq1"` ... `"eq25"` (equipamento)
- EPI: `"epi1"` ... `"epi20"`
- EPC: `"epc1"` ... `"epc4"`
- Atividades: `"a1"` ... `"a16"`

### IDs de Linha Dinâmica

```javascript
const uid = () => Math.random().toString(36).slice(2, 8);
// Exemplo: "_id": "x4k9mz"
```

### Chave de Escopo (`eKey`)

Cada atividade em `ATIVS` tem um campo `eKey` que aponta para a propriedade correspondente no objeto `ESC`:

```javascript
// ATIVS[0].eKey === "totalTorres"  → ESC.totalTorres
// ATIVS[5].eKey === "extCondutor"  → ESC.extCondutor
```

---

## Não Utilizado (por design)

- Sem TypeScript — sem interfaces, tipos ou generics
- Sem CSS classes — zero `className` (exceto quando necessário para browser APIs)
- Sem `useMemo` / `useCallback` — derivações são `const` simples no corpo do App
- Sem `useEffect` — sem side effects; app é puramente síncrono
- Sem `propTypes` — sem validação de props em runtime
- Sem comentários de bloco — nomes autoexplicativos substituem documentação inline
