# State

**Last Updated:** 2026-05-05
**Current Work:** V1 implementado — Prioridade em V1.1 (correções críticas de bugs em `addGrupo` e `calcSeg`)

---

## Status do App

O app `template/jornadas-lt-v5.jsx` está **funcionalmente completo** para o fluxo principal da Jornada. Todos os módulos P1 (MVP) estão implementados. Existem dois bugs críticos identificados e 29 itens de backlog distribuídos nos 10 módulos.

**Arquivo de trabalho:** `template/jornadas-lt-v5.jsx` (~1.214 linhas)
**Versão anterior (referência):** `template/jornadas-lt-v2.jsx`

---

## Bugs Críticos Identificados

### BUG-001: addGrupo não expande comps

**Localização:** `jornadas-lt-v5.jsx` linha 229
**Descrição:** `addGrupo()` adiciona entrada em `grupos` mas não chama `setComps` para expandir o array de composições. O estado inicial de `comps` é `[mkGrupoComps(), mkGrupoComps()]` (2 grupos fixos). Ao adicionar um 3º grupo via botão "+ ADICIONAR", `grupos[2]` existe mas `comps[2]` é `undefined`. `gc(2, aId)` retorna `mkComp()` temporário mas alterações são perdidas — o grupo existe no cadastro mas não persiste composições.
**Impacto:** Dinâmicas com mais de 2 grupos funcionam incorretamente.
**Fix:** Em `addGrupo`, adicionar `setComps(p => [...p, mkGrupoComps()])`.

### BUG-002: calcSeg é placeholder — sempre retorna 100 ou 85

**Localização:** `jornadas-lt-v5.jsx` linhas 296–308
**Descrição:** `calcSeg(gi)` incrementa `req` e `ok` pelo mesmo valor (`epis.length`), fazendo `ok/req = 1` sempre. O score de segurança é sempre 100 (quando EPIs configurados) ou 85 (quando nenhum EPI configurado). Nenhum grupo pode ser desclassificado por segurança independentemente da composição montada.
**Impacto:** Critério pedagógico central (segurança 40%) não funciona corretamente. O debriefing perde impacto.
**Fix:** Implementar comparação real entre EPIs exigidos pelo gabarito e EPIs fornecidos pela composição do grupo.

---

## Recent Decisions

### AD-001: Linhas dinâmicas em vez de tabelas estáticas (v5 vs v2)

**Decision:** Substituir tabelas estáticas com 25 cargos/equipamentos fixos por tabelas vazias com add/remove dinâmico.
**Reason:** Em sessões com a v2, os grupos se perdiam em 50 linhas maioritariamente zeradas; o debriefing ficava ilegível.
**Trade-off:** Mais complexidade na lógica de estado (uid, moUsados, moAdd/Del); comportamento mais intuitivo para os grupos.
**Impact:** `moRows[]` e `eqRows[]` por atividade; `uid()` para IDs únicos; `moUsados` derivado via Set; Sel filtrado.

### AD-002: Estado centralizado no App (sem Context API)

**Decision:** Todo o estado da aplicação vive em um único componente `App` via `useState`.
**Reason:** App de sessão única com escopo limitado; Context API adicionaria complexidade sem benefício real.
**Trade-off:** Prop drilling via closures (PgConfig, PgGrupos, etc. acessam estado do App diretamente por closure, não por props).
**Impact:** Componentes de página definidos como funções internas ao App — não são componentes React independentes.

### AD-003: Inline styles com paleta constante C

**Decision:** Usar inline styles com objeto de constantes `C` em vez de CSS externo ou framework.
**Reason:** Portabilidade máxima — funciona sem sistema de build configurado; paleta consistente sem cascata de CSS.
**Trade-off:** Verbosidade nos componentes; sem responsividade automática; difícil extrair para CSS externo.
**Impact:** Paleta `C` com 17 tokens de cor; todos os estilos como objetos JS literais.

---

## Active Blockers

- **BUG-001 bloqueia dinâmicas com 3+ grupos** — impacto direto na experiência pedagógica.
- **Sem sistema de build configurado** — o JSX não pode ser executado diretamente no browser sem um transpilador (Babel/Vite). Atualmente requer configuração manual ou CDN.

---

## Lessons Learned

### L-001: calcSeg exige comparação explícita de EPIs por cargo

**Context:** A lógica original assumiu que bastava iterar sobre EPIs configurados pelo facilitador.
**Problem:** O loop incrementa `req` e `ok` pelo mesmo valor — nunca há divergência. A comparação deve verificar se o cargo existe na composição do grupo E se os EPIs exigidos estão sendo fornecidos.
**Solution (pendente):** Para v1.1 mais simples: checar apenas EPCs por atividade (binário: atividade tem/não tem os EPCs exigidos). Para v2 completo: adicionar seleção explícita de EPI por linha de MO na composição.

### L-002: Funções de página definidas dentro de App não são componentes React

**Context:** `PgConfig`, `PgGrupos`, etc. são funções declaradas com `const` dentro de `App`.
**Problem:** Ao usar `{screen==="config" && <PgConfig/>}`, React trata como elemento de função anônima a cada render — causará remount completo se `screen` não mudar. Não é um bug visível, mas pode causar perda de foco de input em rerenders.
**Solution (futura):** Extrair PgX para componentes React independentes recebendo props explícitas.

---

## Todos

- [x] Corrigir BUG-001: `addGrupo` deve expandir `comps` com `mkGrupoComps()`
- [x] Corrigir BUG-001: Criar `delGrupo(gi)` e botão de remoção em PgGrupos
- [x] Corrigir BUG-002: `calcSeg` com lógica real de aderência de EPIs/EPCs
- [x] Configurar sistema de build (Vite + React) com package.json
- [x] Validação: mostrar aviso quando LT não configurada antes de acessar Composição

---

## Deferred Ideas

- [ ] Reset sem reload ("Nova Jornada") — V1.2
- [ ] Gabarito dinâmico baseado na LT configurada — V2
- [ ] Exportar ranking em PNG/PDF — V2
- [ ] Tutorial de onboarding para perfil Grupo — V2
- [ ] Seletor de grupo na intro (antes de acessar Composição) — V1.2
- [ ] Suporte a TypeScript — V2
