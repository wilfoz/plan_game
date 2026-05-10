# Gestão de Grupos — Specification

## Problem Statement

O facilitador precisa cadastrar os grupos participantes antes de iniciar a sessão. Cada grupo tem um nome, um responsável e uma senha de acesso (usada na tela de Login para que o grupo entre diretamente na composição).

A senha nunca é armazenada em plaintext — é hasheada via bcrypt por RPC Supabase (`set_grupo_senha`). A verificação no login usa `verify_grupo_senha`.

---

## Goals

- [x] Formulário para adicionar grupo com campos: nome do grupo e responsável
- [x] Listagem dos grupos cadastrados com nome, responsável e campo de senha
- [x] Editar nome e responsável após cadastro (via `GrupoField` — onBlur save)
- [x] Definir / redefinir senha (hash bcrypt via RPC)
- [x] Botão de remoção de grupo
- [ ] Limite máximo de grupos configurável
- [ ] Reordenar grupos via drag-and-drop

---

## Out of Scope

| Feature | Razão |
|---|---|
| Divisão de grupos por tipo | Todos os grupos montam as 16 atividades |
| Exportar lista com resultados | Responsabilidade do módulo de Ranking |
| Histórico de participantes entre jornadas | Sessões são independentes |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Backend | Tabela `grupos` no Supabase: `id`, `session_id`, `nome`, `resp`, `senha_hash`, `ordem` | ✅ Implementado |
| Hook | `useGrupos(sessionId)` — query + mutations (add, update, remove) via React Query | ✅ Implementado |
| Senha | RPC `set_grupo_senha(g_id, plaintext)` — bcrypt hash no banco; `verify_grupo_senha` no login | ✅ Implementado |
| Componente | `GrupoField` — estado local + onBlur save; sincroniza do servidor via `useRef` | ✅ Implementado |
| Componente | `SenhaInput` — estado local, save no onBlur/Enter; limpa campo após salvar | ✅ Implementado |
| Função | `addGrupo(nome, resp)` — insere no Supabase; invalidate automático via React Query | ✅ Implementado |
| Função | `uGrupo(id, campo, valor)` — update via `useGrupos.update.mutate` | ✅ Implementado |
| Função | `delGrupo(gi)` — remove do Supabase; React Query atualiza `grupos[]` | ✅ Implementado |
| Sync | `comps` sincronizado com `grupos.length` via `useEffect` no AppContext | ✅ Implementado |
| UI | Restrição: não permite remover o último grupo | ✅ Implementado |
| UI | Editar nome ou responsável | ✅ Implementado (era backlog) |
| UI | Limite máximo de grupos | ❌ Backlog |

---

## Padrão de Input — GrupoField

**Problema anterior:** `TextInp` controlado por `g.nome` (dado do servidor) + `onChange → uGrupo` a cada tecla causava: mutação → invalidateQueries → refetch → re-render com dado defasado → substituição de caracteres + lag.

**Solução:**

```js
function GrupoField({ value, onSave, placeholder }) {
  const [v, setV] = useState(value ?? "");
  const savedRef = useRef(value ?? "");
  useEffect(() => {
    if (value !== savedRef.current) { setV(value ?? ""); savedRef.current = value ?? ""; }
  }, [value]);
  const handleBlur = () => {
    if (v !== savedRef.current) { onSave(v); savedRef.current = v; }
  };
  return <input value={v} onChange={e => setV(e.target.value)} onBlur={handleBlur} />;
}
```

**Regra:** Todos os campos de texto editáveis persistidos no Supabase devem usar `GrupoField` ou `LocalTextInp`.

---

## User Stories

### P1: Cadastrar Novo Grupo ⭐ MVP

**Acceptance Criteria**:

1. WHEN o facilitador clica em "+ ADICIONAR" THEN o sistema SHALL inserir um novo grupo no Supabase e exibi-lo na lista.
2. WHEN o grupo é adicionado THEN `comps` SHALL ser expandido com entrada `mkGrupoComps()`.
3. WHEN o facilitador edita nome ou responsável THEN o sistema SHALL salvar no Supabase ao sair do campo (onBlur).
4. WHEN o facilitador define uma senha THEN o sistema SHALL enviar para RPC `set_grupo_senha` — NUNCA armazenar plaintext.

---

### P1: Remover Grupo ⭐ MVP

**Acceptance Criteria**:

1. WHEN o facilitador clica no botão de remover THEN o sistema SHALL deletar o grupo do Supabase.
2. WHEN o grupo é removido THEN `comps` SHALL ser atualizado via React Query.
3. WHEN existe apenas 1 grupo THEN o botão de remover SHALL estar oculto.

---

## Edge Cases

- WHEN o facilitador remove o grupo que está sendo editado THEN o índice `gIdx` SHALL ser ajustado para o grupo anterior válido.
- WHEN dois grupos têm o mesmo nome THEN o sistema SHALL permitir (nomes não são únicos — distinção pelo `id`).
- WHEN a senha está em branco no `SenhaInput` THEN `onBlur` não dispara save (campo opcional na edição).

---

## Requirement Traceability

| Requirement ID | Story | Status |
|---|---|---|
| GRP-01 | Listagem de grupos com nome, responsável e campo de senha | ✅ Implementado |
| GRP-02 | `addGrupo()` insere no Supabase e expande `comps` | ✅ Implementado |
| GRP-03 | Senha hasheada via RPC `set_grupo_senha` | ✅ Implementado |
| GRP-04 | `delGrupo(gi)` remove do Supabase | ✅ Implementado |
| GRP-05 | `GrupoField` — edição de nome/responsável sem lag (onBlur save) | ✅ Implementado |
| GRP-06 | Restrição: não remove o último grupo | ✅ Implementado |
| GRP-07 | Limite máximo de grupos configurável | ❌ Backlog |
| GRP-08 | Reordenar grupos via drag-and-drop | ❌ Backlog |

**Coverage:** 8 total, 6 implementados, 2 em backlog.
