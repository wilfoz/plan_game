# Tech Stack

**Analyzed:** 2026-05-05

## Core

- Framework: React 18 (hooks)
- Language: JavaScript (JSX — sem TypeScript)
- Runtime: Browser (SPA estática)
- Package manager: Não configurado (arquivo JSX standalone)

## Frontend

- UI Framework: React 18 (`useState`, `useMemo`) — sem framework de componentes
- Styling: Inline styles com objeto de constantes `C` (paleta dark theme)
- State Management: `useState` local no componente `App` — sem Redux, Context API ou Zustand
- Font: IBM Plex Mono / Courier New (monospace, via `fontFamily` inline)
- Icons: Emojis Unicode nativos (⚡, 🏗️, 🦺, etc.) — sem biblioteca de ícones
- Charts: Nenhum — Gantt implementado com tabela HTML e símbolos ▓/·
- Formatação: `Intl.NumberFormat` via `toLocaleString("pt-BR")` para valores monetários

## Backend

- **Nenhum.** O app é frontend-only, sem servidor, sem API, sem banco de dados.

## Build System

- **Não configurado.** O arquivo `jornadas-lt-v5.jsx` é JSX puro e requer transpilação para execução no browser.
- **Para desenvolvimento:** Requer Babel standalone (CDN) ou configuração de Vite/CRA.
- **Ausência de:** `package.json`, `vite.config.js`, `webpack.config.js`, `tsconfig.json`.

## Não Utilizado (por design)

- Sem autenticação (sem Auth0, Firebase, Clerk, etc.)
- Sem roteamento (sem React Router — navegação via estado `screen`)
- Sem gerenciamento de estado global (sem Redux, Zustand, Jotai)
- Sem CSS framework (sem Tailwind, Material UI, Chakra)
- Sem biblioteca de gráficos (sem Chart.js, Recharts, Victory)
- Sem testes automatizados (sem Jest, Vitest, Testing Library)
- Sem linting configurado (sem ESLint, Prettier)

## Dependências de Runtime

**Nenhuma.** O único import no arquivo é `import { useState } from "react"`.
Todos os catálogos de dados (MO_CAT, EQ_CAT, EPI_CAT, EPC_CAT, ATIVS) são constantes inline.
