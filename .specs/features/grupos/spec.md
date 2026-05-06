# Gestão de Grupos — Specification

## Problem Statement

A dinâmica Jornadas LT envolve múltiplas equipes de líderes competindo entre si. O facilitador precisa cadastrar os grupos participantes antes de iniciar a sessão, para que cada grupo possa depois selecionar seu nome e montar suas composições. Sem o cadastro dos grupos, não existe estado de composição para registrar as escolhas de MO, equipamentos e verbas — e a tela de Composição não pode ser acessada.

Existe uma regra de negócio crítica e não óbvia neste módulo: ao adicionar um novo grupo, o estado `comps` (composições) deve ser expandido simultaneamente com um novo objeto inicializado por `mkGrupoComps()`. Se o grupo for cadastrado no array `grupos` mas `comps` não for atualizado, o grupo aparece no menu de seleção mas não tem estado de composição associado, causando erro de runtime (`TypeError: Cannot read properties of undefined`) ao tentar montar qualquer atividade.

Da mesma forma, ao remover um grupo, o índice correspondente em `comps` deve ser excluído para evitar corrupção de estado — composições de grupos removidos persisteriam em memória e seriam exibidas no ranking como grupos "fantasma" com dados inválidos.

---

## Goals

- [x] Formulário para adicionar grupo com campos: nome do grupo e responsável
- [x] Ao adicionar grupo: array `grupos` recebe novo item AND `comps` recebe entrada inicializada por `mkGrupoComps()`
- [x] Listagem dos grupos cadastrados com nome e responsável
- [x] Botão para remover grupo que exclui entrada em `grupos` e em `comps` simultaneamente
- [x] Estado vazio: mensagem "Nenhum grupo cadastrado" quando lista está vazia
- [ ] Editar nome ou responsável de um grupo após cadastro
- [ ] Limite máximo de grupos configurável (ex: máx. 10 grupos por jornada)
- [ ] Reordenar grupos via drag-and-drop

---

## Out of Scope

| Feature | Razão |
|---|---|
| Divisão de grupos por tipo (Montagem vs. Lançamento) | Todos os grupos montam as 16 atividades — não há divisão por especialidade |
| Autenticação de grupo com senha | Acesso por perfil, não por credencial; a dinâmica é presencial e controlada pelo facilitador |
| Exportar lista de grupos com seus resultados | Responsabilidade do módulo de Ranking; Gestão de Grupos cuida apenas do cadastro |
| Histórico de participantes entre jornadas | App é sessão única — sem persistência entre sessões |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Estado | `grupos` — array de objetos `{ nome: string, resp: string }` | ✅ Implementado |
| Estado | `comps` — array paralelo de objetos de composição por grupo | ✅ Implementado |
| Função | `mkGrupoComps()` — cria objeto vazio de composições para todas as 16 atividades | ✅ Implementado |
| Função | `addGrupo(nome, resp)` — adiciona em `grupos` e inicializa entrada em `comps` | ✅ Implementado |
| Função | `delGrupo(gi)` — remove índice `gi` de `grupos` e de `comps` simultaneamente | ✅ Implementado |
| Componente | Formulário de cadastro de grupo (nome + responsável) | ✅ Implementado |
| Componente | Lista de grupos cadastrados com botão de remoção | ✅ Implementado |
| UI | Mensagem "Nenhum grupo cadastrado" quando `grupos.length === 0` | ✅ Implementado |
| Edição | Editar nome ou responsável após cadastro | ❌ Não implementado |

---

## User Stories

### P1: Cadastrar Novo Grupo ⭐ MVP

**User Story**: As a Facilitador, I want adicionar grupos participantes com nome e responsável so that cada equipe de líderes tenha uma identidade na dinâmica e possa selecionar seu grupo para montar composições.

**Acceptance Criteria**:

1. WHEN o facilitador acessa a tela de Gestão de Grupos THEN o sistema SHALL exibir formulário com campos "Nome do Grupo" e "Responsável" e botão "Adicionar".
2. WHEN o facilitador preenche nome e responsável e clica em "Adicionar" THEN o sistema SHALL incluir o grupo no array `grupos` e SHALL inicializar uma entrada em `comps` via `mkGrupoComps()`.
3. WHEN o grupo é adicionado THEN o sistema SHALL limpar os campos do formulário para permitir cadastro do próximo grupo sem necessidade de apagar manualmente.
4. WHEN o grupo é adicionado THEN o grupo SHALL aparecer imediatamente na lista abaixo do formulário com nome e responsável visíveis.
5. WHEN `grupos` tem pelo menos 1 grupo THEN a mensagem "Nenhum grupo cadastrado" SHALL ser ocultada.
6. WHEN o facilitador tenta adicionar um grupo com nome em branco THEN o sistema SHALL impedir o cadastro e SHALL manter o formulário com foco no campo nome.

**Independent Test**: Abrir tela de Grupos (lista vazia). Preencher "Equipe Alpha" / "João Silva" e clicar Adicionar. Verificar que a lista exibe o grupo. Verificar que `comps[0]` existe e tem estrutura de `mkGrupoComps()`. Preencher "Equipe Beta" / "Maria Souza" e adicionar. Verificar que `comps[1]` existe. Acessar tela de Composição como Grupo → selecionar "Equipe Alpha" → verificar que nenhum erro ocorre.

---

### P1: Inicializar Estado de Composição ao Adicionar Grupo ⭐ MVP

**User Story**: As a Facilitador, I want que cada grupo cadastrado tenha automaticamente um estado de composição vazio e válido so that os grupos possam montar suas composições sem erros de runtime por estado indefinido.

**Acceptance Criteria**:

1. WHEN um novo grupo é adicionado THEN o array `comps` SHALL ter comprimento igual a `grupos.length` — nunca maior ou menor.
2. WHEN `mkGrupoComps()` é executado THEN o objeto retornado SHALL conter uma entrada para cada uma das 16 atividades, cada uma com: `moRows: []`, `eqRows: []`, `verbas: { ferramentas: 0, materiais: 0 }`, `kpi: 0`, `equipes: 1`.
3. WHEN um grupo é adicionado THEN `comps[grupos.length - 1]` SHALL estar definido e acessível sem erro de `undefined`.
4. WHEN `getComp(gi, aId)` é chamado para o novo grupo THEN SHALL retornar o objeto de composição vazio (não `undefined`).
5. WHEN o grupo é o segundo adicionado THEN `comps[1]` SHALL existir independentemente de `comps[0]` — estados são isolados por índice.

**Independent Test**: Adicionar 3 grupos. Verificar via console/devtools que `comps.length === 3`. Verificar que `comps[0]`, `comps[1]` e `comps[2]` têm a estrutura correta. Selecionar grupo 3 na tela de Composição → abrir qualquer atividade → verificar que nenhum `TypeError` ocorre.

---

### P1: Remover Grupo ⭐ MVP

**User Story**: As a Facilitador, I want remover um grupo cadastrado so that equipes que não participarão da jornada não apareçam no ranking com dados zerados ou inválidos.

**Acceptance Criteria**:

1. WHEN o facilitador clica no botão de remover de um grupo THEN o sistema SHALL excluir o grupo do array `grupos` no índice correspondente.
2. WHEN o grupo é removido THEN o sistema SHALL excluir simultaneamente a entrada em `comps` no mesmo índice, garantindo que `comps.length === grupos.length` após a remoção.
3. WHEN o grupo removido não era o último THEN os índices dos grupos restantes SHALL ser reajustados corretamente (ex: remover grupo 1 de 3 → grupos 0 e 2 se tornam 0 e 1).
4. WHEN o último grupo é removido THEN o sistema SHALL exibir a mensagem "Nenhum grupo cadastrado".
5. WHEN um grupo com composições preenchidas é removido THEN os dados de composição desse grupo SHALL ser descartados junto com a remoção.

**Independent Test**: Adicionar 3 grupos (A, B, C). Remover grupo B (índice 1). Verificar que lista exibe apenas A e C com índices 0 e 1. Verificar que `comps.length === 2`. Acessar Composição para o grupo C (agora índice 1) e verificar que não há dados do grupo B.

---

## Edge Cases

- WHEN o facilitador tenta adicionar grupo com nome em branco THEN o sistema SHALL bloquear o cadastro sem lançar exceção.
- WHEN o facilitador remove todos os grupos durante a sessão THEN `comps` SHALL estar vazio (`[]`) e a tela de Composição SHALL exibir mensagem de que não há grupos.
- WHEN dois grupos têm o mesmo nome THEN o sistema SHALL permitir (nomes não são únicos) — a distinção é pelo índice no array.
- WHEN um grupo é removido enquanto outro grupo está com a tela de Composição aberta THEN os índices de navegação SHALL ser atualizados para evitar acesso a índice inválido.
- WHEN `mkGrupoComps()` é chamado THEN deve cobrir exatamente as 16 atividades definidas em `ATIVIDADES` — adicionar ou remover atividade do catálogo requer atualizar `mkGrupoComps()`.
- WHEN o facilitador adiciona um grupo sem preencher o campo "Responsável" THEN o sistema SHALL permitir cadastro com responsável vazio (campo opcional).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| GRP-01 | P1: Formulário de cadastro com nome e responsável | Done | ✅ Implementado |
| GRP-02 | P1: `addGrupo()` adiciona em `grupos` e inicializa `comps` | Done | ✅ Implementado |
| GRP-03 | P1: `mkGrupoComps()` retorna estrutura válida para 16 atividades | Done | ✅ Implementado |
| GRP-04 | P1: `comps.length === grupos.length` após adicionar | Done | ✅ Implementado |
| GRP-05 | P1: Listagem dos grupos cadastrados com nome e responsável | Done | ✅ Implementado |
| GRP-06 | P1: Formulário limpa campos após cadastro | Done | ✅ Implementado |
| GRP-07 | P1: Mensagem "Nenhum grupo cadastrado" quando vazio | Done | ✅ Implementado |
| GRP-08 | P1: `delGrupo(gi)` remove de `grupos` e de `comps` simultaneamente | Done | ✅ Implementado |
| GRP-09 | P1: Reajuste de índices após remoção (sem buracos no array) | Done | ✅ Implementado |
| GRP-10 | P1: Bloqueio de cadastro com nome em branco | Done | ✅ Implementado |
| GRP-11 | P2: Editar nome ou responsável após cadastro | Backlog | ❌ Não implementado |
| GRP-12 | P3: Limite máximo de grupos configurável | Backlog | ❌ Não implementado |
| GRP-13 | P3: Reordenar grupos via drag-and-drop | Backlog | ❌ Não implementado |

**Coverage:** 13 total, 10 implementados, 3 em backlog.

---

## Success Criteria

- [ ] Adicionar 5 grupos → `grupos.length === 5` e `comps.length === 5`.
- [ ] `comps[i]` para qualquer `i < grupos.length` retorna objeto com `moRows: []` e `equipes: 1` — nunca `undefined`.
- [ ] Remover grupo do meio → índices reajustados e `comps.length === grupos.length` após remoção.
- [ ] Acessar tela de Composição para qualquer grupo cadastrado → nenhum `TypeError` por `undefined` em `comps`.
- [ ] Lista exibe "Nenhum grupo cadastrado" quando `grupos.length === 0`.
- [ ] Campo responsável pode ser deixado em branco — cadastro não é bloqueado.
