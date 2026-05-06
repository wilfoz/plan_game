# Tela Inicial e Controle de Acesso — Specification

## Problem Statement

A dinâmica Jornadas LT envolve dois perfis com responsabilidades e telas completamente diferentes: o Facilitador, que configura todos os parâmetros da LT e acompanha o ranking, e os Grupos, que montam composições e visualizam seus cronogramas. Se um participante acessa o perfil errado, pode inadvertidamente alterar configurações do facilitador ou visualizar resultados de outros grupos antes do momento adequado.

A tela inicial é o ponto de entrada da dinâmica — ela é projetada para uso em sala de treinamento com projetor, e precisa transmitir imediatamente o propósito do simulador para todos os participantes. A mensagem de boas-vindas e a escolha de perfil são o ritual de abertura da jornada. O tempo entre entrar na URL e começar a trabalhar deve ser mínimo — sem login, sem cadastro, sem etapas intermediárias.

O controle de acesso é intencionalmente simples: não há autenticação. A seleção de perfil define o menu de navegação visível e as telas disponíveis. Quando um grupo seleciona seu perfil, um seletor adicional permite escolher o grupo ao qual pertence (cadastrado pelo facilitador). Toda a troca de perfil é feita pelo estado `role` da aplicação — sem redirecionamento de URL, sem tokens.

---

## Goals

- [x] Tela inicial com apresentação do simulador e dois botões de acesso: Facilitador e Grupo
- [x] Estado `role: null | "F" | "G"` — controla qual perfil está ativo
- [x] Estado `screen: string` — controla qual tela está visível
- [x] Estado `gIdx: number` — índice do grupo ativo (relevante para perfil Grupo)
- [x] Perfil Facilitador: menu com telas Config LT, Grupos, Atividades/KPIs, EPI/EPC, Cronograma, Ranking
- [x] Perfil Grupo: menu com telas Composição (por atividade) e Cronograma
- [x] Botão "Trocar Perfil" ou voltar para tela inicial para mudar de role
- [x] Seletor de grupo após escolher perfil Grupo (lista os grupos cadastrados pelo facilitador)
- [x] Tela inicial exibe nome do app, descrição e contexto de LT
- [ ] Tela inicial com animação de entrada ou visual de onboarding
- [ ] Tela de instrução rápida (tutorial de 30 segundos) antes do primeiro acesso como Grupo

---

## Out of Scope

| Feature | Razão |
|---|---|
| Autenticação com login e senha | App é de sessão única em treinamento presencial controlado — autenticação é overhead sem valor |
| Roteamento por URL (React Router) | SPA com estado — não há URLs separadas por tela; facilita deploy em ambiente sem servidor |
| Sessões paralelas de diferentes grupos em dispositivos diferentes | App roda em sessão única — grupos usam o mesmo dispositivo ou o facilitador projeta o app |
| Controle de permissão granular (ex: Grupo A não pode ver Grupo B) | Grupos confiam uns nos outros em ambiente de treinamento; isolamento é garantido pelo facilitador |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Estado | `role: null \| "F" \| "G"` — null = tela intro, "F" = facilitador, "G" = grupo | ✅ Implementado |
| Estado | `screen: string` — tela ativa ("intro", "config", "composicao", "cronograma", etc.) | ✅ Implementado |
| Estado | `gIdx: number` — índice do grupo ativo no array `grupos` | ✅ Implementado |
| Componente | Tela inicial com nome do app, descrição e dois botões de perfil | ✅ Implementado |
| Componente | Menu de navegação do Facilitador (6 itens) | ✅ Implementado |
| Componente | Menu de navegação do Grupo (2 itens) | ✅ Implementado |
| Componente | Seletor de grupo (dropdown/cards com grupos cadastrados) | ✅ Implementado |
| Lógica | Navegação entre telas via `setScreen()` sem redirecionamento de URL | ✅ Implementado |
| Lógica | Botão "Trocar Perfil" reseta `role = null` e retorna à intro | ✅ Implementado |
| UI | Tela inicial com animação de entrada | ❌ Não implementado |
| UI | Tutorial de onboarding para perfil Grupo | ❌ Não implementado |

---

## User Stories

### P1: Selecionar Perfil na Tela Inicial ⭐ MVP

**User Story**: As a Participante da Jornada, I want selecionar meu perfil (Facilitador ou Grupo) na tela inicial so that o sistema me direcione para as telas corretas e eu possa começar a trabalhar imediatamente.

**Acceptance Criteria**:

1. WHEN o app é aberto THEN o sistema SHALL exibir a tela inicial com: nome "Jornadas LT", descrição do simulador, contexto de Linhas de Transmissão, e dois botões: "Entrar como Facilitador" e "Entrar como Grupo".
2. WHEN o facilitador clica em "Entrar como Facilitador" THEN `role` SHALL ser definido como "F" e o sistema SHALL exibir o menu de navegação do facilitador com acesso a: Config LT, Grupos, Atividades/KPIs, EPI/EPC, Cronograma e Ranking.
3. WHEN um participante clica em "Entrar como Grupo" THEN `role` SHALL ser definido como "G" e o sistema SHALL exibir o seletor de grupos cadastrados.
4. WHEN `role = null` THEN o menu de navegação SHALL estar oculto e apenas a tela inicial SHALL ser visível.
5. WHEN o usuário clica em "Trocar Perfil" THEN `role` SHALL ser resetado para `null` e a tela inicial SHALL ser exibida novamente.
6. WHEN a tela inicial é exibida THEN ela SHALL ser responsiva e legível em projetor (fontes grandes, alto contraste).

**Independent Test**: Abrir o app. Verificar tela inicial com nome "Jornadas LT" e 2 botões. Clicar "Entrar como Facilitador" → verificar menu com 6 itens. Clicar "Trocar Perfil" → verificar retorno à tela inicial. Clicar "Entrar como Grupo" → verificar seletor de grupos.

---

### P1: Selecionar Grupo após Escolher Perfil Grupo ⭐ MVP

**User Story**: As a Participante com perfil Grupo, I want selecionar o grupo ao qual pertenço so that minhas composições sejam registradas no estado correto e o cronograma exibido seja o meu.

**Acceptance Criteria**:

1. WHEN o participante escolhe "Entrar como Grupo" THEN o sistema SHALL exibir lista dos grupos cadastrados pelo facilitador com nome e responsável.
2. WHEN o participante clica no seu grupo THEN `gIdx` SHALL ser definido com o índice do grupo selecionado e o sistema SHALL navegar para a tela de Composição.
3. WHEN nenhum grupo foi cadastrado pelo facilitador THEN o sistema SHALL exibir mensagem "Aguardando cadastro de grupos pelo facilitador" e o botão de acesso ao grupo SHALL ficar desabilitado.
4. WHEN `gIdx` é definido THEN todas as operações de composição (`moAdd`, `eqAdd`, `getComp`) SHALL usar `gIdx` como índice do grupo ativo.
5. WHEN o grupo deseja trocar de grupo (selecionou errado) THEN o sistema SHALL permitir retornar ao seletor sem perder as composições já preenchidas dos outros grupos.

**Independent Test**: Facilitador cadastra 3 grupos. Participante entra como Grupo. Verificar lista com 3 grupos. Selecionar "Equipe Beta" → verificar `gIdx = 1`. Acessar Composição → verificar que as ações de MO alteram `comps[1]` e não `comps[0]`.

---

### P2: Navegação entre Telas por Perfil

**User Story**: As a Usuário, I want navegar entre as telas disponíveis para meu perfil via menu so that eu possa acessar qualquer funcionalidade sem perder o contexto atual.

**Acceptance Criteria**:

1. WHEN o perfil é "F" (Facilitador) THEN o menu SHALL exibir: Config LT, Grupos, Atividades/KPIs, EPI/EPC, Cronograma, Ranking.
2. WHEN o perfil é "G" (Grupo) THEN o menu SHALL exibir apenas: Composição e Cronograma.
3. WHEN o usuário clica em um item do menu THEN `screen` SHALL ser atualizado e a tela correspondente SHALL ser renderizada.
4. WHEN o perfil é Grupo e a tela ativa é "cronograma" THEN o cronograma SHALL exibir automaticamente o cronograma do `gIdx` ativo.
5. WHEN o item de menu da tela ativa é destacado THEN o usuário SHALL identificar visualmente em qual tela está.

**Independent Test**: Entrar como Facilitador. Verificar 6 itens no menu. Clicar em "Atividades/KPIs" → verificar que a tela correta é exibida e o item do menu está destacado. Entrar como Grupo → verificar apenas 2 itens no menu.

---

## Edge Cases

- WHEN o participante abre o app com `role = null` e não seleciona perfil THEN nenhuma tela de funcionalidade SHALL ser acessível — apenas a intro é exibida.
- WHEN o facilitador navega para "Cronograma" pelo menu THEN `gIdx` pode ser 0 (primeiro grupo) ou o último selecionado — o cronograma deve ter seu próprio seletor de grupo.
- WHEN o perfil Grupo tenta acessar a URL diretamente de uma tela de facilitador (ex: Config LT via estado forçado) THEN o sistema não tem restrição técnica, mas o menu do Grupo não exibe esse item — navegação só é possível pelo menu.
- WHEN nenhum grupo foi cadastrado e um participante escolhe "Entrar como Grupo" THEN o seletor SHALL exibir mensagem de espera sem lançar erro de array vazio.
- WHEN `gIdx` é 2 e o facilitador remove o grupo de índice 2 via Gestão de Grupos THEN `gIdx` pode apontar para índice inválido — o sistema SHALL verificar `gIdx < grupos.length` antes de renderizar composições.
- WHEN o app é recarregado (F5) THEN todo o estado é perdido e a tela inicial é exibida — comportamento esperado para sessão em memória.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| INTRO-01 | P1: Tela inicial com nome, descrição e 2 botões de perfil | Done | ✅ Implementado |
| INTRO-02 | P1: Estado `role: null \| "F" \| "G"` | Done | ✅ Implementado |
| INTRO-03 | P1: Estado `screen` para controle de tela ativa | Done | ✅ Implementado |
| INTRO-04 | P1: Estado `gIdx` para grupo ativo | Done | ✅ Implementado |
| INTRO-05 | P1: Menu de Facilitador com 6 itens | Done | ✅ Implementado |
| INTRO-06 | P1: Menu de Grupo com 2 itens (Composição e Cronograma) | Done | ✅ Implementado |
| INTRO-07 | P1: Botão "Trocar Perfil" reseta `role = null` | Done | ✅ Implementado |
| INTRO-08 | P1: Seletor de grupos após escolher perfil Grupo | Done | ✅ Implementado |
| INTRO-09 | P1: Mensagem de espera quando nenhum grupo cadastrado | Done | ✅ Implementado |
| INTRO-10 | P2: Destaque visual no item de menu da tela ativa | Done | ✅ Implementado |
| INTRO-11 | P2: Tela de cronograma usa `gIdx` automaticamente ao acessar como Grupo | Done | ✅ Implementado |
| INTRO-12 | P2: Verificação de `gIdx < grupos.length` antes de renderizar composição | Done | ✅ Implementado |
| INTRO-13 | P3: Animação de entrada na tela inicial | Backlog | ❌ Não implementado |
| INTRO-14 | P3: Tutorial de onboarding de 30 segundos para perfil Grupo | Backlog | ❌ Não implementado |

**Coverage:** 14 total, 12 implementados, 2 em backlog.

---

## Success Criteria

- [ ] App abre na tela inicial com nome "Jornadas LT" e 2 botões — sem estado de perfil pré-selecionado.
- [ ] Clicar "Entrar como Facilitador" → menu com 6 itens visíveis, sem seletor de grupo.
- [ ] Clicar "Entrar como Grupo" → seletor com grupos cadastrados pelo facilitador.
- [ ] Selecionar grupo → `gIdx` correto, composição abre para o grupo selecionado.
- [ ] Menu do Grupo exibe apenas Composição e Cronograma — Config LT e Ranking não são visíveis.
- [ ] "Trocar Perfil" retorna à tela inicial com `role = null` e menu oculto.
- [ ] Nenhum grupo cadastrado → seletor exibe mensagem de espera sem erro de runtime.
