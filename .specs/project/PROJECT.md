# Jornadas LT

**Vision:** Simulador interativo de composição de equipes de alta performance para dinâmicas de treinamento de liderança em obras de Linha de Transmissão (LT) no Brasil.

**Para:** Facilitadores de treinamento e grupos de líderes participantes de Jornadas de Liderança em obras de LT.

**Resolve:** A necessidade de uma ferramenta dinâmica, visual e sem fricção que permita grupos de líderes simularem o dimensionamento real de equipes (MO + Equipamentos + Segurança) para as 16 atividades típicas de uma LT, visualizarem o impacto de suas decisões em custo, prazo e segurança, e competirem em um ranking ao vivo com critério pedagógico explícito: segurança tem peso 40%.

## Goals

- **Simulação fiel ao domínio de LT** — Catálogos reais de 25 cargos, 25 equipamentos, 20 EPIs e atividades com KPIs diários por equipe.
- **Isolamento de grupos** — Cada grupo acessa apenas sua própria composição; não pode ver os dados dos demais.
- **Sessões reutilizáveis** — Facilitador cria sessões que encapsulam LT, grupos e composições. Múltiplas jornadas coexistem sem conflito.
- **Aprendizagem por consequência** — Cada decisão de composição tem custo e prazo calculados em tempo real. O ranking revela o impacto das escolhas.
- **Segurança como critério inegociável** — Score de segurança com peso 40% e desclassificação automática para grupos que deixam de atender qualquer requisito aplicável.

## Tech Stack

**Core:**

- Framework: React 18 (hooks — `useState`, `useContext`)
- Language: JavaScript (JSX — sem TypeScript)
- Styling: Inline styles com paleta de constantes `C` (dark theme, IBM Plex Mono)
- State: Context API (`AppContext`) com `useState` + padrão `upd(fn)` para mutações de sessão ativa
- Build: Vite 8 com React plugin
- Runtime: Browser SPA — sem backend, sem API, sem banco de dados

**Sem dependências externas de runtime:**

- Sem backend ou API
- Sem banco de dados (estado em memória — reset ao recarregar)
- Sem biblioteca de roteamento (navegação via estado `screen`)
- Sem bibliotecas de UI (Material, Chakra, etc.)

**Auth:**

- Facilitador: credencial fixa (`FACILITADOR` / `elecnorbrasil`)
- Grupos: nome do grupo + senha definida pelo facilitador na sessão
- Sem tokens, sem JWT, sem serviço de auth — validação puramente client-side

## Scope

**Implementado (v2):**

- Login universal (primeiro ponto de acesso — sem acesso antes de autenticar)
- Gerenciador de sessões (facilitador) — criar, renomear, excluir, entrar em sessões
- Configuração de LT: tensão, extensão, circuito, cabos, 4 tipos de torre
- Gestão de grupos com senha de acesso individual
- KPIs base por atividade (16 atividades pré-definidas)
- Gabarito de EPI por cargo
- Requisitos de segurança por atividade: aplicável / não aplicável; desclassificação real
- Composição dinâmica por atividade: MO (QTD, SAL/mês, TOTAL/mês) + Equipamentos (QTD, LOC/mês, TOTAL/mês) + Requisitos de segurança com add/remove
- Cronograma Gantt mensal com volumes por mês em cada célula; seletor de grupo para facilitador
- Ranking facilitador-only com score 30/30/40 e debriefing listando requisitos não atendidos por grupo

**Explicitamente fora de escopo:**

- Persistência entre reloads (sem localStorage ou banco)
- Multi-LT simultâneas por sessão
- App mobile nativo
- Integração com sistemas externos (ERP, SAP, TOTVS)
- Relatórios exportáveis (PDF, Excel) — backlog

## Constraints

- **Pedagógico:** O app é ferramenta de treinamento — não sistema de gestão de obra. Simplificações deliberadas são aceitáveis quando a complexidade reduziria o valor didático.
- **Presencial:** Concebido para uso em sala com projetor. UI deve ser legível a distância; dark theme com alto contraste.
- **Zero infra em produção:** Pode ser hospedado como SPA estática (Vercel, Netlify, GitHub Pages) sem servidor.
- **Sessão efêmera:** Estado em memória. Recarregar a página inicia nova sessão. Comportamento esperado e documentado.
