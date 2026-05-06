# Testing Infrastructure

**Analyzed:** 2026-05-05

## Status

**Testes automatizados: NENHUM configurado.**

O projeto não possui framework de testes, runner, nem arquivos `.spec` / `.test`. Não há `package.json` e, portanto, nenhum script `npm test`. Todo o testing é manual via browser.

---

## Estratégia de Testes

### Nível 1 — Testes Manuais (único método atual)

Abrir `template/jornadas-lt-v5.jsx` via Babel standalone ou Vite e percorrer o fluxo completo:

| Fluxo | O que verificar |
| --- | --- |
| Config LT | Cálculos derivados (totalCabos, extCondutor, ESC) atualizam em tempo real |
| Gestão de Grupos | addGrupo cria grupo; grupo aparece na lista; edição inline persiste |
| Atividades/KPIs | KPI editável; escopo calculado aparece na linha |
| EPI/EPC | Checkbox toggle persiste; resumo reflete seleções |
| Composição | Add/remove MO e EQ; custo e duração recalculam; verbas somam |
| Cronograma | Gantt renderiza com ▓/· corretos; cursores cM/cL independentes |
| Ranking | Scores calculados; desclassificação para sS < 70 |

### Nível 2 — Verificação de Cálculos (manual)

Casos de cálculo crítico que devem ser verificados por inspeção dos valores exibidos:

**`calcA(comp, esc)` — custo e duração:**

```text
Dado: comp.kpi=10, comp.equipes=2, esc=100
Esperado: dur = ceil(100 / (2 × 10)) = 5 dias

Dado: comp.kpi=0 ou comp.equipes=0
Esperado: dur = 0 (sem divisão por zero)
```

**Fator de circuito:**

```text
lt.circ = "simples" → fator = 1 → totalCabos = cabFase×3 + pararaios + opgw
lt.circ = "duplo"   → fator = 2 → totalCabos = (cabFase×3 + pararaios + opgw) × 2
```

**Scoring no ranking:**

```text
Score total = sC×0.3 + sD×0.3 + sS×0.4
sS < 70 → grupo desclassificado (score = 0 ou DQ)
```

---

## Gaps de Cobertura

### Sem testes de regressão

Não há mecanismo para detectar regressões automaticamente. Uma mudança em `calcA` pode quebrar cronograma e ranking silenciosamente.

### Funções puras sem teste unitário

As funções a seguir são testáveis isoladamente mas não têm testes:

| Função | Localização | Testável? |
| --- | --- | --- |
| `calcA(comp, esc)` | linhas 286–295 | Sim — pura |
| `calcSeg(gi)` | linhas 296–308 | Sim — depende de estado mas isolável |
| `buildRank()` | linhas 309–323 | Sim — depende de estado |
| `uid()` | linha ~12 | Sim — pura |
| `fmt(n)` / `fmtI(n)` | linhas ~5–10 | Sim — puras |

### BUG-002 não detectável sem teste

O bug em `calcSeg` (req===ok sempre, score sempre 100 ou 85) nunca seria detectado por inspeção visual superficial — requer caso de teste com EPIs configurados incorretamente.

---

## Configuração Mínima Necessária para Testes Automáticos

Para introduzir testes unitários sem refatoração significativa:

```text
1. Adicionar package.json com React + Vite
2. Instalar: vitest, @testing-library/react, @testing-library/jest-dom
3. Extrair funções puras para módulo separado (calc.js)
4. Escrever testes para calcA, calcSeg, buildRank, fmt
```

Não requer TypeScript — Vitest funciona com JSX puro.

---

## Checklist de Testes Manuais Pré-Deploy

Antes de usar em uma dinâmica real, percorrer o seguinte checklist:

- [ ] Configurar LT com ext=500, circuito simples, cabFase=3, pararaios=1, opgw=1
- [ ] Verificar totalCabos = 5, extCondutor = 500×3×1 = 1500
- [ ] Adicionar 3 grupos e verificar que todos aparecem na lista
- [ ] Em PgComposicao, adicionar MO e EQ para o grupo 1, atividade a1
- [ ] Verificar custo e duração calculados no resumo lateral
- [ ] Ir ao Cronograma: verificar que o grupo 1 tem Gantt com duração correta
- [ ] Ir ao Ranking: verificar scores dos grupos configurados
- [ ] Confirmar que grupos sem composição têm score 0 ou DQ
- [ ] Testar fluxo perfil "GRUPO": navegação limitada funciona

---

## Notas sobre Testes Futuros

Ver `CONCERNS.md` para BUG-001 e BUG-002 que afetam a confiabilidade dos testes manuais:

- BUG-001 torna grupos 3+ inválidos para teste de composição
- BUG-002 torna o teste do score de segurança não confiável
