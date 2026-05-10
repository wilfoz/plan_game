# Codebase Concerns

**Analysis Date:** 2026-05-09

---

## Bugs Críticos — RESOLVIDOS

### ~~BUG-001 — `addGrupo` não expande `comps`~~
✅ **Resolvido (v3):** Migração para Supabase + React Query eliminou o estado em memória. `useGrupoComps` e `useGrupos` são fontes de verdade independentes; sincronização via `useEffect` no AppContext.

### ~~BUG-002 — `calcSeg` era placeholder~~
✅ **Resolvido (v2):** `calcSeg` reescrito em `calculations.js` com comparação real de `reqIds` vs requisitos aplicáveis. Qualquer requisito aplicável ausente em atividade com recursos → desclassificação.

### ~~BUG-003 — Substituição de caracteres em inputs~~
✅ **Resolvido (v3):** `LocalNumInp`, `LocalTextInp`, `GrupoField` — estado local com save no `onBlur`. Elimina o ciclo `onChange → save → refetch → sobrescrita`.

---

## Tech Debt Ativo

### Arquivos Órfãos

- **Localização:** `src/pages/Intro.jsx`, `src/pages/GrupoLogin.jsx`, `src/pages/SessionSelect.jsx`, `src/utils/migrateToSupabase.js`
- **Problema:** Não referenciados em `App.jsx`. Aumentam ruído no codebase.
- **Fix:** Remover os 4 arquivos.
- **Risco:** Baixo — não são importados em nenhum lugar.

### NumInp/TextInp legado ainda exportados

- **Localização:** `src/components/ui/Inputs.jsx`
- **Problema:** `NumInp` e `TextInp` ainda existem para retrocompatibilidade mas representam o padrão antigo (controlado pelo servidor). Qualquer uso futuro deve adotar `LocalNumInp`/`LocalTextInp`.
- **Fix:** Auditar novos usos; marcar `NumInp`/`TextInp` como deprecated na documentação.
- **Risco:** Baixo — não causam bug por si só, apenas degradam UX se mal usados.

### Senha do facilitador hardcoded

- **Localização:** `src/pages/Login.jsx`
- **Problema:** A senha do facilitador está verificada via constante no frontend — qualquer usuário com DevTools pode descobrir.
- **Contexto:** App é dinâmica presencial controlada; sem dados sensíveis dos grupos acessíveis pelo facilitador.
- **Fix (ideal):** Mover verificação para RPC Supabase ou variável de ambiente.
- **Risco:** Baixo para o caso de uso, mas tecnicamente inseguro.

---

## Áreas Frágeis

### `gc(gi, aId)` — fallback silencioso

- **Localização:** `AppContext.jsx` linha 281
- **Problema:** `gc(gi, aId)` retorna `mkComp()` quando `comps[gi]?.[aId]` é undefined. Mascara possíveis estados inconsistentes silenciosamente.
- **Mitigação:** Com Supabase, `comps` é populado via React Query e sincronizado; o fallback só ocorre durante loading inicial.

### Debounce sem feedback visual

- **Localização:** `compsHook.upsertDebounced`, `ltHook.upsertDebounced`, `ativHook.upsertDebounced`
- **Problema:** O usuário não tem feedback visual de que os dados foram salvos. Uma perda de conexão durante o debounce descarta a última alteração silenciosamente.
- **Fix:** Indicador de "salvando..." / "salvo" no header ou por campo.

### Realtime unidirecional

- **Localização:** `useRealtimeComps`
- **Problema:** O facilitador recebe atualizações em tempo real das composições dos grupos, mas os grupos não recebem atualizações do facilitador (ex: mudança de KPI base, novos requisitos) sem recarregar.
- **Fix:** Expandir os canais de realtime para `lt_config`, `atividades_config` e `requisitos`.

---

## Gaps de Cobertura

| Área | Status | Risco |
|------|--------|-------|
| Testes automatizados | Nenhum | Alto — regressões invisíveis |
| TypeScript | Ausente | Médio — erros de tipo em catálogos não detectados |
| Feedback de save | Ausente | Médio — usuário não sabe se dado foi persistido |
| Validação de campos obrigatórios (LT, KPI) | Ausente | Baixo — dinâmica tem facilitador presente |
| Tratamento de erro de rede nas mutações | Ausente | Médio — falha silenciosa em conexão ruim |

---

_Concerns audit: 2026-05-09_
_Atualizar conforme bugs são corrigidos ou novos problemas identificados_
