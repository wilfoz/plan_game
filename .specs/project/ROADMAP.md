# Roadmap

**Current Milestone:** V1 — Simulador Completo (MVP funcional)
**Status:** Implementado — Backlog de qualidade e features incrementais em aberto

---

## V1 — Simulador Completo (MVP)

**Goal:** App funcional ponta-a-ponta: do facilitador configurando a LT até o ranking ao vivo com debriefing.
**Target:** ✅ Implementado em `template/jornadas-lt-v5.jsx`

### Features

**Tela Inicial e Controle de Acesso** — COMPLETE

- Seleção de perfil (Facilitador / Grupo) sem autenticação
- Menu de navegação diferenciado por perfil
- Botão de retorno à intro (Trocar Perfil)

**Configuração da LT** — COMPLETE

- Formulário completo: nome, tensão, extensão, circuito (simples/duplo), cabos/fase, para-raios, OPGW
- Tabela de 4 tipos de torre (Crossrope, Suspensão, Ancoragem, Estaiada) com qtd e tonelagem
- Cálculos automáticos: `totalCabos`, `extCondutor`, `totalTorres`, `tonTotal`, `ESC`
- Cards de resumo: CONDUTORES, PARA-RAIOS, TOTAL CABOS, KM CONDUTOR

**Gestão de Grupos** — COMPLETE (⚠️ com bug conhecido — ver CONCERNS.md)

- Formulário de adição com nome e responsável
- Listagem de grupos
- Edição inline de nome e responsável
- ⚠️ Bug: `addGrupo()` não expande `comps` — grupos adicionados após a inicialização não têm estado de composição

**Atividades e KPIs Base** — COMPLETE

- 16 atividades pré-definidas, read-only (10 Montagem + 6 Lançamento)
- Campo KPI editável por atividade
- Exibição de escopo derivado da LT configurada

**EPI e EPC** — COMPLETE (⚠️ score com placeholder — ver CONCERNS.md)

- Catálogo de 20 EPIs com seleção por cargo (painel interativo)
- Matriz EPC × Atividade com checkboxes
- Resumo de configuração (EPIs por cargo, EPCs por atividade)
- ⚠️ Placeholder: `calcSeg()` não avalia aderência real — sempre retorna 100 ou 85

**Composição por Atividade** — COMPLETE

- Tabela MO dinâmica: select de cargos filtrado (sem duplicatas), add/remove com BtnDel
- Tabela Equipamentos dinâmica: select sem filtro (pode repetir), add/remove
- Seção Verbas: Ferramentas + Materiais editáveis
- Campos KPI override e Equipes com cálculo de duração em tempo real
- Resumo lateral: custo por componente, duração, EPIs requeridos, EPCs necessários
- Barra de custo total (todas atividades)

**Cronograma Mensal** — COMPLETE

- Cursores independentes `cM` (Montagem) e `cL` (Lançamento)
- Cards de resumo: Montagem, Lançamento, Duração Total, Custo Total
- Tabela de atividades (8 colunas: GRP, ATIVIDADE, UND, ESCOPO, KPI, EQ., DURAÇÃO, CUSTO)
- Gantt visual: 10 meses (Mai/26 a Fev/27) com ▓/·
- Seletor de grupo

**Ranking e Debriefing** — COMPLETE

- Score 30% Custo + 30% Prazo + 40% Segurança
- Desclassificação automática para sS < 70
- ScoreRings visuais por dimensão
- Gabarito hardcoded do facilitador (Montagem + Lançamento com itens corretos para LT 500 kV)
- Mensagem de debriefing sobre liderança e segurança

---

## V1.1 — Correções Críticas

**Goal:** Resolver os dois bugs que comprometem a fidelidade pedagógica da dinâmica.
**Target:** Backlog prioritário

### Features

**Correção: addGrupo expande comps** — BACKLOG

- `addGrupo()` deve chamar `setComps(p => [...p, mkGrupoComps()])` além de atualizar `grupos`
- `delGrupo(gi)` deve remover `grupos[gi]` e `comps[gi]` simultaneamente
- Adicionar botão de remoção de grupo na PgGrupos

**Correção: calcSeg com aderência real** — BACKLOG

- Implementar verificação real: para cada `moRow` na composição do grupo, verificar se os EPIs exigidos por `epiCargo[mo.catId]` estão sendo fornecidos
- Como EPIs não são selecionados explicitamente na composição, definir estratégia: (a) score baseado apenas em EPCs obrigatórios por atividade, ou (b) adicionar seleção explícita de EPI por linha de MO
- A variante (a) é mais simples e suficiente para v1.1

---

## V1.2 — Qualidade e UX

**Goal:** Melhorias de UX identificadas em sessões de jornada.
**Target:** Backlog

### Features

**Reset de sessão sem reload** — BACKLOG

- Botão "Nova Jornada" que reseta todos os estados para valores iniciais sem F5
- Diálogo de confirmação antes do reset

**Validação de LT antes de Composição** — BACKLOG

- Alerta ou bloqueio quando extensão = 0 ou todas as torres = 0
- Indicador visual de atividades com KPI = 0

**Seletor de grupo na tela Intro (perfil Grupo)** — BACKLOG

- Atualmente o grupo seleciona via Pill na tela de Composição
- Mover seleção de grupo para logo após clicar "GRUPO" na intro
- Mensagem de espera quando nenhum grupo foi cadastrado

---

## V2 — Features Incrementais

**Goal:** Features de valor pedagógico adicional sem comprometer a simplicidade do app.
**Target:** Planejado

### Features

**Gabarito Dinâmico** — PLANNED

- Substituir gabarito hardcoded por composição calculada dinamicamente com base na LT configurada
- Facilitador pode ajustar o gabarito antes de revelar

**Exportar Ranking** — PLANNED

- Botão para baixar ranking em PNG/PDF para distribuição pós-jornada

**Exportar Cronograma** — PLANNED

- Botão para baixar Gantt como imagem

**Configurar até 8 grupos** — PLANNED

- Layout do ranking adaptado para até 8 grupos simultâneos

---

## Future Considerations

- Build system configurado (Vite + React) para facilitar deploy
- Suporte a TypeScript para maior segurança de tipos nos catálogos
- Persistência opcional via localStorage (reutilizar configuração de LT entre sessões)
- Tutorial de onboarding de 30 segundos para perfil Grupo
- Comparação side-by-side de dois cronogramas no debriefing
