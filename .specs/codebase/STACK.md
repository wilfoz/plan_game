# Tech Stack

**Analyzed:** 2026-05-06

## Core

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Framework | React | 18 |
| Linguagem | JavaScript (JSX) | sem TypeScript |
| Build | Vite | 8 |
| Runtime | Browser SPA | sem servidor |
| Package manager | npm | — |

## Frontend

- **UI:** React 18 com hooks (`useState`, `useContext`) — sem framework de componentes
- **State:** Context API (`AppContext`) com `useState` + padrão `upd(fn)` para mutações imutáveis
- **Styling:** Inline styles com objeto de constantes `C` (dark theme, IBM Plex Mono / Courier New)
- **Routing:** Nenhum — navegação por estado `screen` (SPA com switch condicional)
- **Icons:** Emojis Unicode nativos (⚡, 🏗️, 🦺, 🛡️, etc.) — sem biblioteca de ícones
- **Charts:** Nenhum — Gantt implementado com tabela HTML e volumes numéricos por célula
- **Formatação:** `Intl.NumberFormat` via `toLocaleString("pt-BR")` para valores monetários

## Backend

Nenhum. O app é frontend-only — sem servidor, sem API, sem banco de dados.

## Autenticação

Client-side apenas:

- Facilitador: credencial fixa hardcoded (`FACILITADOR` / `elecnorbrasil`)
- Grupos: nome + senha definida pelo facilitador, validada em memória contra `sessions[].grupos`
- Sem tokens, sem sessões de servidor, sem cookies

## Estado e Persistência

- Estado em memória via `useState` no `AppProvider`
- Sem `localStorage`, sem `sessionStorage`, sem IndexedDB
- Recarregar a página reinicia o app (comportamento esperado e documentado)

## Build System

```text
vite.config.js   — React plugin (@vitejs/plugin-react)
package.json     — scripts: dev, build, preview
index.html       — ponto de entrada HTML
```

## Não Utilizado (por design)

- Sem backend (sem Node.js, Express, NestJS, etc.)
- Sem banco de dados (sem Supabase, Firebase, PostgreSQL, etc.) — plano escrito, não implementado
- Sem roteamento (sem React Router)
- Sem gerenciamento de estado global externo (sem Redux, Zustand, Jotai)
- Sem CSS framework (sem Tailwind, Material UI, Chakra)
- Sem biblioteca de gráficos (sem Chart.js, Recharts, Victory)
- Sem testes automatizados (sem Jest, Vitest, Testing Library)
- Sem linting configurado (sem ESLint, Prettier)

## Dependências de Runtime

Nenhuma além do React:

```text
react
react-dom
```

Todos os catálogos de dados (MO_CAT, EQ_CAT, EPI_CAT, ATIVS) são constantes inline em `constants/catalogs.js`.
