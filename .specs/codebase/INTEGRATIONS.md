# External Integrations

**Analyzed:** 2026-05-05

## Status: Nenhuma integração externa

O app `template/jornadas-lt-v5.jsx` é **completamente autocontido**. Não há chamadas de rede, sem API externa, sem banco de dados, sem serviço de autenticação, sem CDN de assets além do React em si.

```text
Integrações externas: ZERO
Backend: NENHUM
API calls: NENHUMA
Auth provider: NENHUM
Database: NENHUM
Analytics: NENHUM
```

---

## Dependências de Runtime

### React 18

**Único import no arquivo:**

```javascript
import { useState } from "react";
```

React é a única dependência. No contexto atual (sem build system), deve ser provido via CDN ou Babel standalone.

**Versão:** React 18 (hooks API)

**Por que apenas `useState`:** O app não usa `useEffect`, `useMemo`, `useCallback`, `useContext` ou `useReducer` — estado centralizado em `useState` com derivações inline.

---

## APIs de Browser Utilizadas

### `Intl.NumberFormat` (via `toLocaleString`)

**Propósito:** Formatação de valores monetários em pt-BR com separadores de milhar e decimais.

```javascript
const fmt  = n => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtI = n => n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
```

**Disponibilidade:** Nativa em todos os browsers modernos — sem polyfill necessário.

### `Math.random()` (via `uid`)

**Propósito:** Geração de IDs únicos para linhas dinâmicas de MO e EQ.

```javascript
const uid = () => Math.random().toString(36).slice(2, 8);
```

**Nota:** Não é criptograficamente seguro, mas suficiente para IDs de UI dentro de uma sessão.

---

## Persistência

**Nenhuma.** O estado vive exclusivamente em memória via `useState`. Ao recarregar a página (F5), todo o estado é perdido.

- Sem `localStorage`
- Sem `sessionStorage`
- Sem IndexedDB
- Sem cookies

**Impacto prático:** Cada sessão de dinâmica começa do zero. Se o browser for fechado acidentalmente, toda a configuração e composições dos grupos são perdidas.

**Plano futuro (V2):** Persistência opcional via `localStorage` para reutilizar configuração de LT entre sessões.

---

## Deploy / Build

**Sem configuração de build.** O arquivo JSX não pode ser executado diretamente no browser sem transpilação.

**Para rodar localmente:**

```text
Opção A (desenvolvimento): Vite + React
  1. npm create vite@latest
  2. Copiar jornadas-lt-v5.jsx como src/App.jsx
  3. npm run dev

Opção B (sem install): Babel standalone via CDN
  1. Criar index.html com script type="text/babel"
  2. Incluir React + ReactDOM + Babel via CDN
  3. Abrir no browser
```

Nenhuma das duas opções está pré-configurada no repositório.

---

## O que Deliberadamente NÃO existe

Por design (ver decisões AD-002 e AD-003 em STATE.md):

| Categoria | Decisão |
| --- | --- |
| Autenticação | Sem Auth0, Firebase, Clerk — perfis sem senha |
| Banco de dados | Sem PostgreSQL, SQLite, Firebase — sem backend |
| Roteamento | Sem React Router — navegação via estado `screen` |
| Estado global | Sem Redux, Zustand, Context API — useState no App |
| CSS framework | Sem Tailwind, MUI, Chakra — inline styles com paleta C |
| Gráficos | Sem Chart.js, Recharts — Gantt com tabela + ▓/· |
| Analytics | Sem Mixpanel, GA, Amplitude |
| Error tracking | Sem Sentry, Datadog |
| Feature flags | Sem LaunchDarkly, GrowthBook |
