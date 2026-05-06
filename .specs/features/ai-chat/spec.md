# AI Chat (Assistente de Obras) — Specification

## Problem Statement

Engenheiros e gestores de obras de linhas de transmissão lidam diariamente com volumes grandes de dados dispersos: produções lançadas, planejamentos, riscos, custos, status de equipes e torres. Consultar cada módulo separadamente para obter uma análise integrada é ineficiente. O assistente de IA resolve isso oferecendo uma interface conversacional em linguagem natural, capaz de buscar dados reais via ferramentas e responder perguntas como "Quais torres ainda não iniciaram montagem?" ou "Mostre a curva de produção do mês".

O módulo M3 (AI Assistant) foi marcado como COMPLETE no roadmap, mas existem gaps críticos de qualidade que impedem o uso confiável em produção: o histórico de sessão é persistido apenas no `localStorage` do browser (perdido ao trocar de dispositivo), o log de auditoria grava apenas a mensagem do usuário mas não a resposta do assistente, e não existe interface de gerenciamento de sessões no backend (listagem, exclusão). Além disso, o mecanismo de autenticação do `fetch` SSE usa extração manual do token do `localStorage` (frágil e específico para Auth0 SPA JS SDK v1).

---

## Goals

- [x] Endpoint `POST /ai-assistant/chat` com streaming SSE (Server-Sent Events) via Anthropic Claude SDK.
- [x] `SendMessageUseCase` com agentic loop: suporte a `tool_use` + `tool_result` até `end_turn`.
- [x] 8 ferramentas implementadas: `get_production_analysis`, `get_planning_status`, `get_team_performance`, `get_equipment_status`, `get_tower_progress`, `get_risk_summary`, `get_cost_summary`, `generate_chart`.
- [x] Rate limiting: 10 req/s (short) e 20 req/min (medium) via `@nestjs/throttler`.
- [x] System prompt em PT-BR contextualizado com nome e ID da obra ativa.
- [x] Janela deslizante de 20 mensagens enviadas à API Anthropic para controle de context window.
- [x] Persistência de audit log em `AiChatLog` (session_id, role, content, tokens) após cada turno.
- [x] Frontend `AiChatService` com signals Angular, SSE via `fetch` nativo e parsing de eventos `text/chart/done/error`.
- [x] Frontend `AiAssistantPageComponent` com streaming visual, chips de sugestão, nova conversa, exportar `.txt` e lista de sessões recentes.
- [x] Persistência de sessões no `localStorage` (máximo 10 sessões × 20 mensagens).
- [x] Renderização inline de gráficos Chart.js via evento SSE `chart`.
- [ ] Persistência de sessões no banco de dados (`AiChatSession`) com API de listagem e exclusão.
- [ ] Log de auditoria completo: gravar também a resposta do assistente (`role: "assistant"`) em `AiChatLog`.
- [ ] Gerenciamento de sessões no frontend: listar sessões salvas no backend, excluir sessão, renomear título.
- [ ] Substituir extração manual de token Auth0 por interceptor Angular padrão no `fetch` SSE.
- [ ] Indicador de uso de tokens (input + output) visível ao usuário após cada resposta.
- [ ] Limite de sessões por usuário no backend (ex: máx. 50 sessões por `user_id`).

---

## Out of Scope

| Feature | Razão |
|---|---|
| Geração de relatórios PDF pelo assistente | Responsabilidade do módulo `reports`; o assistente pode linkar para o relatório |
| Execução de ações (criar produção, atualizar planejamento) via chat | Requer workflow de confirmação; planejado para M5 (Agente autônomo) |
| Modelos de IA alternativos (GPT-4, Gemini) | Anthropic Claude é o provider contratado; abstração multi-modelo é over-engineering no momento |
| Voz/Speech-to-text | Interface textual é suficiente para o usuário-alvo (desktop, campo com notebook) |
| Multi-idioma | Sistema é exclusivamente PT-BR |

---

## Estado Atual do Código (Brownfield)

| Camada | Artefato | Status |
|---|---|---|
| Domínio/Banco | `AiChatSession` (id, work_id, user_id, title, timestamps) | ✅ Schema Prisma completo |
| Domínio/Banco | `AiChatLog` (id, session_id, role, content, input_tokens, output_tokens) | ✅ Schema Prisma completo |
| Aplicação | `SendMessageUseCase` — agentic loop com streaming SSE | ✅ Implementado |
| Aplicação | `AnthropicClient` — wrapper do SDK com `modelId` configurável | ✅ Implementado |
| Aplicação | `GetProductionAnalysisTool`, `GetPlanningStatusTool`, `GetTeamPerformanceTool` | ✅ Implementados |
| Aplicação | `GetEquipmentStatusTool`, `GetTowerProgressTool`, `GetRiskSummaryTool` | ✅ Implementados |
| Aplicação | `GetCostSummaryTool`, `GenerateChartTool` | ✅ Implementados |
| Infraestrutura | `AiAssistantController` — `POST /ai-assistant/chat` com `@Throttle` | ✅ Implementado |
| Infraestrutura | `AiAssistantModule` com DI de todos os use cases e tools | ✅ Implementado |
| Frontend | `AiChatService` — signals, SSE fetch, persistência localStorage | ✅ Implementado |
| Frontend | `AiAssistantPageComponent` — UI de chat com streaming visual | ✅ Implementado |
| Frontend | `ChatMessageComponent`, `SuggestionChipsComponent` | ✅ Implementados |
| Frontend | `chat.model.ts` — `ChatMessage`, `ChartSpec`, `SseEvent` | ✅ Implementado |

**Gaps identificados:**
- `persistLog` no `SendMessageUseCase` grava apenas `role: "user"` e o conteúdo da última mensagem do usuário. A resposta do assistente nunca é gravada em `AiChatLog`, tornando o audit trail incompleto.
- `AiChatSession` existe no banco mas o `SendMessageUseCase` não cria nem valida se a sessão existe antes de tentar persistir o log — o bloco `persistLog` faz `findUnique` na sessão e retorna silenciosamente se não encontrar, sem criar a sessão automaticamente.
- O frontend gera `sessionId` local (`session-${Date.now()}-${random}`), nunca criando um registro em `AiChatSession` no banco. Sessões ficam apenas no `localStorage`.
- `getAuthToken()` no `AiChatService` faz parsing manual do `localStorage` procurando chave `@@auth0spajs@@`. Quebra em versões futuras do Auth0 SDK ou ao usar tokens refresh.
- Não existe endpoint para listar, renomear ou excluir sessões (`GET /ai-assistant/sessions`, `DELETE /ai-assistant/sessions/:id`).
- O rate limiter usa o guard `@Throttle` mas não há feedback ao usuário quando o limite é atingido (HTTP 429 sem mensagem amigável no frontend).

---

## User Stories

### P1: Enviar Mensagem e Receber Resposta em Streaming ⭐ MVP

**User Story**: As a Engenheiro de Obras, I want enviar uma pergunta em linguagem natural sobre a obra e receber uma resposta em streaming com dados reais so that eu possa obter análises contextualizadas sem precisar navegar por múltiplos módulos.

**Acceptance Criteria**:

1. WHEN o usuário digita uma pergunta e clica em Enviar (ou Ctrl+Enter) THEN o sistema SHALL enviar `POST /ai-assistant/chat` com `workId`, `sessionId` e histórico das últimas 20 mensagens.
2. WHEN o assistente responde THEN o frontend SHALL exibir o texto progressivamente à medida que os eventos SSE `delta` chegam, com indicador visual de streaming ativo.
3. WHEN o assistente invoca uma ferramenta interna (ex: `get_production_analysis`) THEN o backend SHALL executar a tool, incorporar o resultado e continuar gerando a resposta — o usuário não vê o loop interno, apenas a resposta final em markdown.
4. WHEN o assistente invoca `generate_chart` THEN o frontend SHALL renderizar um gráfico Chart.js inline na bolha da mensagem, derivado do evento SSE `chart`.
5. WHEN o streaming termina com evento `done` THEN o campo de input SHALL ser re-habilitado e o indicador de streaming SHALL ser removido.
6. WHEN `workId` não está selecionado no `WorkContextService` THEN o sistema SHALL exibir mensagem "Selecione uma obra para conversar com o assistente" e bloquear o envio.

**Independent Test**: Selecionar obra X. Enviar "Quantas torres foram executadas esta semana?". Verificar que a resposta inclui dados numéricos reais da obra X (não placeholders), que o streaming visual funciona e que a mensagem foi salva no `localStorage` após o evento `done`.

---

### P1: Persistir Sessão no Backend e Audit Log Completo ⭐ MVP

**User Story**: As a Administrador, I want que cada sessão de chat seja registrada no banco de dados com logs completos de perguntas e respostas so that eu possa auditar o uso do assistente e monitorar custos de tokens por obra.

**Acceptance Criteria**:

1. WHEN o usuário inicia uma nova conversa THEN o sistema SHALL criar um registro em `AiChatSession` com `work_id`, `user_id` (do JWT) e `sessionId` gerado pelo frontend.
2. WHEN o assistente termina de responder THEN o sistema SHALL gravar em `AiChatLog`: um registro `role: "user"` com o conteúdo da pergunta e um registro `role: "assistant"` com a resposta completa gerada.
3. WHEN `input_tokens` e `output_tokens` são retornados pelo evento `done` THEN esses valores SHALL ser salvos no log de auditoria.
4. WHEN a sessão especificada no `sessionId` não existe no banco THEN o sistema SHALL criar automaticamente a sessão antes de tentar gravar o log.
5. WHEN `GET /ai-assistant/sessions` é chamado pelo usuário autenticado THEN o sistema SHALL retornar lista de sessões do usuário ordenadas por `createdAt desc`, paginada.
6. WHEN `DELETE /ai-assistant/sessions/:id` é chamado THEN o sistema SHALL excluir a sessão e todos os logs vinculados via cascade.

**Independent Test**: Enviar 2 mensagens na obra X. Verificar via Prisma Studio que `AiChatSession` foi criada e que `AiChatLog` tem 4 registros (user + assistant por mensagem). Verificar que `input_tokens` e `output_tokens` são > 0.

---

### P2: Gerenciar Histórico de Sessões no Frontend

**User Story**: As a Usuário, I want ver e carregar minhas conversas anteriores com o assistente so that eu possa retomar análises de dias anteriores sem precisar reformular as perguntas.

**Acceptance Criteria**:

1. WHEN o painel de AI Assistant é aberto THEN o sistema SHALL exibir lista de até 10 sessões recentes do usuário (carregadas do backend ou do `localStorage` como fallback).
2. WHEN o usuário clica em uma sessão anterior THEN o sistema SHALL carregar as mensagens dessa sessão no painel de chat.
3. WHEN o usuário clica em "Nova Conversa" THEN o sistema SHALL limpar as mensagens, gerar novo `sessionId` e focar no campo de input.
4. WHEN o usuário clica em "Exportar" THEN o sistema SHALL baixar um arquivo `.txt` com todas as mensagens formatadas com timestamp, role e conteúdo.
5. WHEN o usuário clica em excluir sessão THEN o sistema SHALL solicitar confirmação e, após confirmar, excluir a sessão no backend e remover da lista.

**Independent Test**: Criar 3 sessões em datas diferentes. Verificar que a listagem exibe as 3, que carregar a sessão mais antiga restaura as mensagens corretas e que exportar gera arquivo com todos os pares user/assistant.

---

### P2: Rate Limiting com Feedback Amigável

**User Story**: As a Usuário, I want receber uma mensagem clara quando atingir o limite de mensagens por minuto so that eu entenda por que o envio falhou e saiba quando posso tentar novamente.

**Acceptance Criteria**:

1. WHEN o usuário envia mais de 20 mensagens em 60 segundos THEN o backend SHALL retornar HTTP 429 com mensagem `"Muitas requisições. Aguarde 1 minuto antes de enviar nova mensagem."`.
2. WHEN o frontend recebe HTTP 429 THEN SHALL exibir toast de aviso com a mensagem do backend e desabilitar o botão de envio por 60 segundos com countdown visível.
3. WHEN o limite de 10 req/s (burst) é atingido THEN a mesma lógica de feedback SHALL ser aplicada com mensagem "Aguarde alguns segundos".
4. WHEN o rate limit expira THEN o botão de envio SHALL ser re-habilitado automaticamente sem necessidade de refresh.

**Independent Test**: Enviar 21 mensagens em sequência rápida. Verificar que a 21ª retorna 429 e o frontend exibe countdown de 60s no botão.

---

### P3: Chips de Sugestão Contextualizados por Obra

**User Story**: As a Usuário novo, I want ver sugestões de perguntas relevantes para minha obra so that eu possa descobrir rapidamente o que o assistente é capaz de responder.

**Acceptance Criteria**:

1. WHEN nenhuma mensagem foi enviada na sessão atual THEN o sistema SHALL exibir chips de sugestão pré-definidos (ex: "Como está o avanço físico da obra?", "Quais equipes têm menor produtividade?").
2. WHEN o usuário clica em um chip de sugestão THEN o texto SHALL ser inserido no campo de input e enviado automaticamente.
3. WHEN o usuário começa a digitar THEN os chips de sugestão SHALL ser ocultados.
4. WHEN há mensagens na conversa THEN os chips SHALL permanecer ocultos para não poluir o histórico visual.

**Independent Test**: Abrir assistente com conversa vazia. Verificar que 6 chips aparecem. Clicar em "Como está o avanço físico da obra?" — verificar que a mensagem é enviada e os chips somem.

---

## Edge Cases

- WHEN o stream SSE é interrompido antes do evento `done` (rede instável) THEN o frontend SHALL marcar a mensagem como `isStreaming: false` no `finally` do `sendMessage`, evitando UI travada.
- WHEN `workId` pertence a uma obra deletada THEN o `SendMessageUseCase` SHALL emitir evento SSE `error` com mensagem "Obra não encontrada." e encerrar o stream imediatamente.
- WHEN o `AbortController` é acionado (usuário clica em "Parar") THEN o erro `AbortError` SHALL ser silenciado (não exibido como erro) e `isStreaming` definido como `false`.
- WHEN a tool `generate_chart` retorna JSON malformado THEN o backend SHALL registrar warning no logger e emitir `tool_result` com `is_error: true`, permitindo ao modelo continuar sem travar.
- WHEN a ferramenta referenciada no `tool_use` não existe no `toolMap` THEN o backend SHALL retornar `tool_result` com `is_error: true` e mensagem descritiva, sem lançar exceção não tratada.
- WHEN o `localStorage` está cheio e `persistSession` falha THEN o frontend SHALL silenciar o erro (bloco try/catch implícito) sem quebrar o fluxo do chat.
- WHEN o `sessionId` gerado pelo frontend colide com um existente no banco THEN a criação via `upsert` ou `findOrCreate` SHALL evitar duplicata.
- WHEN `max_tokens: 4096` é atingido antes do `end_turn` THEN o modelo para com `stop_reason: "max_tokens"` — o loop SHALL encerrar (`continueLoop = false`) e o frontend SHALL exibir a resposta parcial sem mensagem de erro.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CHAT-01 | P1: `POST /ai-assistant/chat` com SSE streaming | Done | ✅ Implementado |
| CHAT-02 | P1: Agentic loop (tool_use → tool_result → end_turn) | Done | ✅ Implementado |
| CHAT-03 | P1: 8 ferramentas registradas e executáveis | Done | ✅ Implementado |
| CHAT-04 | P1: Rate limiting short (10/s) e medium (20/min) | Done | ✅ Implementado |
| CHAT-05 | P1: System prompt PT-BR contextualizado com nome da obra | Done | ✅ Implementado |
| CHAT-06 | P1: Janela de 20 mensagens para context window | Done | ✅ Implementado |
| CHAT-07 | P1: Frontend SSE fetch com parsing text/chart/done/error | Done | ✅ Implementado |
| CHAT-08 | P1: Chips de sugestão e nova conversa | Done | ✅ Implementado |
| CHAT-09 | P1: Renderização de gráfico Chart.js inline | Done | ✅ Implementado |
| CHAT-10 | P1: Criar `AiChatSession` no banco ao iniciar conversa | Backlog | ❌ Sessão não criada no banco |
| CHAT-11 | P1: Gravar log `role: "assistant"` em `AiChatLog` | Backlog | ❌ Apenas role: "user" é gravado |
| CHAT-12 | P1: Gravar tokens no audit log | Backlog | ❌ Tokens não gravados no log |
| CHAT-13 | P1: Auto-criar sessão se `sessionId` não existe no banco | Backlog | ❌ Retorna silenciosamente sem criar |
| CHAT-14 | P2: `GET /ai-assistant/sessions` — listar sessões do usuário | Backlog | ❌ Endpoint não existe |
| CHAT-15 | P2: `DELETE /ai-assistant/sessions/:id` com cascade | Backlog | ❌ Endpoint não existe |
| CHAT-16 | P2: Frontend carrega sessões do backend (não apenas localStorage) | Backlog | ❌ Apenas localStorage |
| CHAT-17 | P2: Rate limit retorna mensagem amigável (HTTP 429 com body PT-BR) | Backlog | ❌ Retorna resposta padrão do throttler |
| CHAT-18 | P2: Frontend exibe countdown ao receber 429 | Backlog | ❌ Não implementado |
| CHAT-19 | P2: Exportar conversa em `.txt` | Done | ✅ Implementado |
| CHAT-20 | P3: Autenticação SSE via interceptor Angular (não extração manual de localStorage) | Backlog | ❌ Parsing manual do localStorage |
| CHAT-21 | P3: Indicador de tokens (input + output) visível ao usuário | Backlog | ❌ Não exibido |
| CHAT-22 | Edge: AbortError silenciado corretamente | Done | ✅ Implementado |
| CHAT-23 | Edge: Tool inválida retorna tool_result com is_error | Done | ✅ Implementado |

**Coverage:** 23 total, 11 implementados, 12 em backlog.

---

## Success Criteria

- [ ] `POST /ai-assistant/chat` retorna primeiro evento SSE em menos de 2s após o envio.
- [ ] Pergunta "Quais torres ainda não iniciaram montagem?" retorna resposta com dados reais da obra, invocando `get_tower_progress`.
- [ ] Após resposta, `AiChatLog` contém exatamente 2 registros: `role: "user"` e `role: "assistant"` com `input_tokens > 0` e `output_tokens > 0`.
- [ ] `AiChatSession` existe no banco com `work_id` e `user_id` corretos ao final da conversa.
- [ ] 21ª mensagem em 60s retorna HTTP 429 e o frontend exibe countdown de 60s.
- [ ] Clicar em "Parar" durante streaming não deixa a UI em estado de loading permanente.
- [ ] `generate_chart` emite evento SSE `chart` e o frontend renderiza gráfico inline na bolha da mensagem.
