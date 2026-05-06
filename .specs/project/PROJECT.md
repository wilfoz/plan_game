# Jornadas LT

**Vision:** Simulador interativo de composição de equipes de alta performance para dinâmicas de treinamento de liderança em obras de Linha de Transmissão (LT) no Brasil.

**Para:** Facilitadores de treinamento e grupos de líderes participantes de Jornadas de Liderança em obras de LT.

**Resolve:** A necessidade de uma ferramenta dinâmica, visual e sem fricção de setup que permita grupos de líderes simularem o dimensionamento real de equipes (MO + Equipamentos + Segurança) para as 16 atividades típicas de uma LT, visualizarem o impacto de suas decisões em custo, prazo e segurança, e competirem em um ranking ao vivo com critério pedagógico explícito: segurança tem peso 40%.

## Goals

- **Simulação fiel ao domínio de LT** — Catálogos reais de 25 cargos, 25 equipamentos, 20 EPIs e 4 EPCs com salários e custos de mercado.
- **Zero fricção de setup** — App abre no browser, sem login, sem instalação, sem backend. Facilitador configura em minutos.
- **Aprendizagem por consequência** — Cada decisão de composição tem custo e prazo calculados em tempo real. O ranking revela o impacto das escolhas.
- **Segurança como critério inegociável** — Score de segurança com peso 40% e regra de desclassificação para grupos com aderência < 70%.
- **Reutilização de sessão para sessão** — Facilitador configura a LT real do treinamento; grupos compõem com escopos derivados dos dados reais.

## Tech Stack

**Core:**

- Framework: React 18 (hooks — `useState`, `useMemo`)
- Language: JavaScript (JSX, sem TypeScript)
- Styling: Inline styles com paleta de constantes `C` (dark theme, IBM Plex Mono)
- State: `useState` local no componente `App` — sem Redux, sem Context API
- Build: Sem build system configurado — JSX puro (requer Babel/Vite para execução)

**Sem dependências externas de runtime:**

- Sem backend ou API
- Sem banco de dados
- Sem autenticação
- Sem roteamento (SPA com estado `screen`)
- Sem bibliotecas de UI (Material, Chakra, etc.)

## Scope

**v1 inclui:**

- Tela inicial com seleção de perfil (Facilitador / Grupo) sem autenticação
- Configuração de LT: tensão, extensão, circuito, cabos, 4 tipos de torre
- Gestão de grupos participantes (nome + responsável)
- KPIs base por atividade (16 atividades pré-definidas)
- Gabarito de EPI por cargo e EPC por atividade
- Composição dinâmica por atividade: tabelas MO e Equipamentos com add/remove, Verbas, KPI override, Equipes
- Cronograma Gantt mensal com cursores independentes Montagem/Lançamento (10 meses)
- Ranking final com score 30/30/40 (Custo/Prazo/Segurança) e desclassificação por segurança < 70%
- Gabarito do facilitador com composição ideal por frente

**Explicitamente fora de escopo:**

- Persistência de dados entre sessões (sem localStorage ou banco)
- Autenticação ou controle de acesso granular
- Multi-LT simultâneas por sessão
- App mobile nativo
- Integração com sistemas externos (ERP, SAP, TOTVS)
- Relatórios exportáveis (PDF, Excel) — backlog

## Constraints

- **Pedagógico:** O app é ferramenta de treinamento — não sistema de gestão de obra. Simplificações deliberadas são aceitáveis quando a complexidade reduziria o valor didático.
- **Presencial:** Concebido para uso em sala com projetor. UI deve ser legível a distância; dark theme com alto contraste.
- **Zero dependência de infra:** Funciona sem servidor, sem conexão à internet (após carregamento do JSX). Portabilidade máxima para ambientes de treinamento.
- **Sessão única:** Estado em memória. Recarregar a página inicia nova sessão. Comportamento esperado e documentado.
