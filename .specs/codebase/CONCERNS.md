# Codebase Concerns

**Analysis Date:** 2026-05-05

---

## Bugs Críticos

### BUG-001 — `addGrupo` não expande `comps`

- **Localização:** `template/jornadas-lt-v5.jsx` linha ~229
- **Severidade:** Crítico — bloqueia dinâmicas com 3+ grupos
- **Descrição:** `addGrupo()` adiciona entrada em `grupos` mas não chama `setComps`. O estado inicial é `[mkGrupoComps(), mkGrupoComps()]` (2 grupos fixos). Ao adicionar um 3º grupo, `comps[2]` é `undefined`. O helper `gc(2, aId)` retorna `mkComp()` temporário, mas as alterações são descartadas — o grupo existe no cadastro mas nunca persiste composições.
- **Impacto pedagógico:** Dinâmicas com 3 ou mais grupos ficam com composições zeradas no ranking.
- **Fix:** Em `addGrupo`, adicionar `setComps(p => [...p, mkGrupoComps()])` junto com o `setGrupos`.
- **Trabalho adicional:** Criar `delGrupo(gi)` que remove `grupos[gi]` e `comps[gi]` simultaneamente e adicionar botão de remoção em PgGrupos.

### BUG-002 — `calcSeg` é placeholder — sempre retorna 100 ou 85

- **Localização:** `template/jornadas-lt-v5.jsx` linhas ~296–308
- **Severidade:** Crítico — invalida o critério de segurança (40% do score)
- **Descrição:** O loop em `calcSeg(gi)` incrementa `req` e `ok` pelo mesmo valor (`epis.length`), garantindo `ok/req === 1` sempre. O score de segurança é fixo em 100 (quando EPIs configurados) ou 85 (quando nenhum EPI configurado). Nenhum grupo pode ser desclassificado por falha de EPI/EPC.
- **Impacto pedagógico:** O debriefing sobre segurança perde validade — grupos com composição insegura recebem o mesmo score que grupos corretos.
- **Fix (v1.1 simples):** Comparar EPCs selecionados por atividade contra uma lista de EPCs obrigatórios por atividade (gabarito fixo). Score = atividades com EPCs corretos / total de atividades executadas.
- **Fix (v2 completo):** Adicionar seleção explícita de EPI por linha de MO na composição e comparar contra `epiCargo[mo.catId]` configurado pelo facilitador.

---

## Tech Debt

### Sem sistema de build configurado

- **Problema:** O arquivo `jornadas-lt-v5.jsx` é JSX puro — não pode ser executado diretamente no browser sem Babel ou Vite.
- **Impacto:** Barreira de entrada para desenvolvedores; sem `npm install`, sem `npm run dev` documentado.
- **Fix:** Configurar Vite + React com `package.json`. Baixo esforço, alto ganho de DX.

### Páginas como closures — remount em cada render do App

- **Localização:** `PgConfig`, `PgGrupos`, `PgAtividades`, `PgEpiEpc`, `PgComposicao`, `PgCronograma`, `PgRanking` — todas declaradas como `const` dentro de `App`
- **Problema:** React trata cada função inline como componente anônimo novo a cada render. Uso como `<PgConfig/>` causa remount completo quando o App re-renderiza, perdendo foco de inputs.
- **Sintoma observável:** Inputs perdem foco após digitar um caractere (em rerenders frequentes).
- **Fix (futura):** Extrair cada `PgX` para componente React independente fora do `App`, passando estado como props explícitas.
- **Mitigação atual:** Usar renderização por referência de função (`{screen==="config" && PgConfig()}`) em vez de JSX tag — evita o remount mas perde a semântica de componente.

### Gabarito hardcoded para LT 500 kV

- **Localização:** `PgRanking`, linhas ~1119–1198
- **Problema:** O gabarito de EPIs/EPCs corretos está hardcoded para uma LT de 500 kV específica. Se o facilitador configurar uma LT diferente (230 kV, 138 kV), o gabarito continua sendo o de 500 kV.
- **Impacto:** Debriefing incorreto para configurações de LT diferentes da referência.
- **Fix (v2):** Gabarito dinâmico calculado com base nos parâmetros da LT configurada; ou facilitador configura o gabarito antes de revelar.

### Estado inicial fixo em 2 grupos

- **Localização:** `useState([mkGrupoComps(), mkGrupoComps()])` linha ~210
- **Problema:** Relacionado ao BUG-001 — o estado inicial pressupõe exatamente 2 grupos. Dinâmicas com 1 grupo (teste) ou 3+ grupos (turmas maiores) exigem o fix do BUG-001 para funcionar.

### Sem persistência de sessão

- **Problema:** Estado vive apenas em memória. F5 ou fechamento acidental apaga tudo.
- **Risco operacional:** Em uma dinâmica real (2–3 horas), uma queda de energia ou reload acidental perde toda a configuração.
- **Mitigação futura:** `localStorage` com serialização do estado completo a cada mudança.

---

## Áreas Frágeis

### Função `gc(gi, aId)` — acesso a `comps[gi]`

- **Localização:** Helper inline no App
- **Problema:** `gc(gi, aId)` retorna `comps[gi]?.[aId] ?? mkComp()`. O fallback `mkComp()` mascara o BUG-001 — não há erro visível, apenas dados silenciosamente descartados.
- **Por que frágil:** Qualquer lógica que dependa de `gc()` para grupos 3+ retornará valores corretos temporariamente mas não persistirá alterações.

### Cálculo do Gantt — cursores mutáveis

- **Localização:** `PgCronograma`, cursores `cM`/`cL`
- **Problema:** Cursores são variáveis `let` mutadas em loop. Se `ATIVS` for reordenado ou uma atividade mudar de grupo (`grp: "M"` vs `grp: "L"`), o Gantt produz resultados incorretos silenciosamente.
- **Por que frágil:** Sem teste automatizado para o mapeamento da timeline.

---

## Gaps de Cobertura

| Área | Status | Risco |
| --- | --- | --- |
| Testes automatizados | Nenhum | Alto — regressões invisíveis |
| TypeScript | Ausente | Médio — erros de tipo em catálogos não detectados |
| Linting (ESLint) | Ausente | Baixo — estilo inconsistente |
| Build reproducível | Ausente | Médio — sem lock de versões |
| Persistência | Ausente | Alto — perda de dados em sessões longas |

---

_Concerns audit: 2026-05-05_
_Atualizar conforme bugs são corrigidos ou novos problemas identificados_
