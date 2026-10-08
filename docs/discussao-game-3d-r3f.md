# Discussão: transformar a sessão dos grupos em um game interativo (React Three Fiber)

> Documento de discussão — não é uma especificação fechada. O objetivo é alinhar
> **o que é o jogo**, **como ele se encaixa no código que já existe** e **de onde vêm os assets**,
> antes de escrever a primeira linha de `<Canvas>`.

> **Decisões tomadas** (ver [wilfoz/plan_game#2](https://github.com/wilfoz/plan_game/issues/2)):
> **(1) Público-alvo: desktop.** Sem celular e sem tablet.
> **(2) O 3D não entra no Ranking.** A pontuação permanece exatamente como é hoje.
> **(3) Cenários em 3D, personagens em pixel art, câmera isométrica.** → [§4](#4-direção-de-arte-isométrico-21--pixel-art)
> **(4) Infra: Vercel + Supabase** (a que já existe). → [§5](#5-infraestrutura-vercel--supabase)
>
> As respostas estão aplicadas ao longo do documento. O resumo do que cada uma mudou
> está em [§12](#12-o-que-as-decisões-de-escopo-mudaram).

---

## 1. Diagnóstico: o que a sessão dos grupos é hoje

A sessão dos grupos hoje é uma planilha muito bem feita. O fluxo real é:

| Tela | Arquivo | O que o grupo faz |
|---|---|---|
| Grupos | `src/pages/Equipes.tsx` | nomeia equipes, define senha |
| Composição | `src/pages/Composicao.tsx` (902 linhas) | para cada uma das 7 atividades: adiciona linhas de MO, equipamento, insumo, define KPI, nº de equipes, mês de início, marca requisitos de segurança |
| Cronograma | `src/pages/Cronograma.tsx` | vê o Gantt resultante e o custo |
| Ranking | `src/pages/Ranking.tsx` (904 linhas) | compara-se com os outros grupos |

O motor de regras já existe e é **bom** — está em `src/utils/calculations.ts`:

- `calcA()` — custo mensal, duração (`esc / (equipes × kpi)`), coeficientes Hh/Ch, fator de mobilização (+20% por equipe adicional)
- `calcEficiencia()` — compara o grupo com a equipe base do facilitador; devolve `subAlocacao` e `obrigatorioAusente`
- `calcCoerencia()` — **já é mecânica de jogo**: regras operador↔equipamento (`mo4`↔`eq1` guindaste 1:1, `mo6`↔`eq2` puller/freio 2:1, …) e capacidade de transporte (`CAPACIDADE_TRANSPORTE`)
- `calcSeg()` — desqualifica quem não marcou todos os requisitos aplicáveis
- `monthlyVolumes()` — volume produzido mês a mês

### Onde dói

1. **A decisão é abstrata.** "Coloquei 8 montadores e 1 guindaste" não tem consequência visível. O grupo erra sem entender por quê.
2. **O erro só aparece no fim.** A coerência vira um aviso de texto; a falta de transporte vira uma linha amarela no Ranking.
3. **O engajamento depende do facilitador.** Quem não é da área de LT não enxerga a obra atrás dos números.
4. **Não há tempo.** O cronograma é um Gantt estático. A sensação de "a obra está andando / está atrasando" não existe.

O 3D não é enfeite: ele é a forma de **tornar a consequência imediata e legível**.

---

## 2. A pergunta central: que jogo é esse?

Três conceitos possíveis. Eles não são excludentes, mas o esforço é muito diferente.

### Conceito A — "Canteiro Vivo" (visualizador reativo) — *baixo risco*

O 3D é uma **segunda representação do mesmo estado**. O grupo continua editando a tabela;
ao lado (ou acima) há uma cena 3D que reage em tempo real:

- adiciona 1 `GUINDASTE` → um guindaste aparece no canteiro
- adiciona 8 `MONTADOR` → 8 bonecos aparecem na torre
- `calcCoerencia` devolve `sem_operador` → o guindaste fica **parado, cinza, com ícone vermelho**
- `transporte_insuficiente` com déficit 6 → 6 bonecos ficam **no portão do canteiro, esperando ônibus**
- requisito de segurança não marcado → trabalhador **sem capacete**, aura vermelha

**Zero mudança de regra de negócio.** `gc(gIdx, aId)` entra, cena sai. É uma função pura
`Comp → cena`. Dá para entregar em semanas e já resolve os problemas 1, 2 e 3.

### Conceito B — "Monte a Equipe no Canteiro" (composição via 3D) — *médio risco*

Inverte o input: o grupo **arrasta** recursos de uma bandeja lateral para o canteiro.
Soltar um `OPERADOR DE GUINDASTE` na cabine do guindaste chama `moAdd(gIdx, aTab, "mo4")`.
A tabela continua existindo (como "modo avançado" / auditoria), mas não é mais o caminho principal.

Ganho: a mecânica operador↔equipamento deixa de ser regra escrita e passa a ser **affordance** —
o slot da cabine existe, está vazio, pisca. Ninguém precisa ler `COERENCIA_REGRAS`.

Risco: drag-and-drop 3D em telas de celular, acessibilidade, e a tabela viraria fonte secundária
de verdade (duas formas de editar o mesmo estado = bug novo garantido). Mitigação: a tabela
permanece a **única** fonte; o 3D só dispara as mesmas ações do contexto.

### Conceito C — "Simulação de Obra" (tempo + eventos) — *alto risco*

O Cronograma vira um **play/pause**. O mês avança, as torres sobem usando `monthlyVolumes()`,
o cabo é lançado vão por vão, e o facilitador injeta eventos: *chuva no mês 3*, *guindaste quebrado*,
*embargo ambiental no trecho 12–18*. O grupo reage realocando equipes.

Ganho: é aqui que vira **jogo** de verdade, com decisão sob incerteza — o que é o objetivo
pedagógico real de um planejamento de LT.

Risco: exige modelo de eventos, replanejamento, novo modelo de dados, nova lógica de pontuação.
É um produto novo, não uma tela nova.

### Recomendação

**A → B, em fases, com A entregue e usado numa sessão real antes de começar B. C fica em aberto.**

O erro clássico aqui é começar pelo C porque é o mais empolgante. A fase A já captura a maior
parte do valor pedagógico com uma fração do risco, e ela constrói toda a infraestrutura
(assets, pipeline, performance, integração com o `AppContext`) que B e C vão precisar de qualquer forma.

**Com as decisões de escopo, o cálculo das três mudou:**

- **A ficou mais forte.** Desktop permite **split view** — tabela e canteiro lado a lado, na
  mesma tela (§3.7). O grupo vê o número e a consequência no mesmo olhar, que é precisamente
  o problema #1 do diagnóstico. Em celular isso teria que ser abas, e metade do efeito morreria.
- **B foi destravada.** O risco declarado de B era drag-and-drop em tela pequena e
  acessibilidade de toque. Desktop-only elimina os dois: mouse, hover, cursor preciso,
  menu de contexto, atalhos de teclado. B passa de "médio risco" a extensão natural de A.
- **C perdeu o incentivo.** Sem entrar no Ranking, replanejar diante de uma chuva no mês 3
  não tem consequência competitiva — o grupo pode simplesmente ignorar o evento.
  C deixa de ser "fase competitiva" e vira **ferramenta de debriefing do facilitador**:
  roda-se a simulação *depois* da composição, em plenária, para discutir por que o plano do
  grupo X aguenta um imprevisto e o do grupo Y não. Isso continua sendo valioso, mas é um
  objetivo diferente e muito menos urgente. **Recomendação: não planejar C agora.**

---

## 3. Arquitetura técnica

### 3.1 Princípio: o 3D é uma projeção do estado, não um estado paralelo

```
Supabase (grupo_comps)
   ↓  useGrupoComps / useRealtimeComps
AppContext  ──── comps[gIdx][aId]: Comp ────┐
   ↓                                        │
Composicao.tsx (tabela)              Canteiro3D.tsx (cena)
   ↓ moAdd/eqAdd/uKpi …                     ↓ mesmas ações
   └──────────── upsertDebounced ───────────┘
```

Regra dura: **a cena 3D não tem estado próprio de domínio.** Ela pode ter estado de
apresentação (câmera, animação em curso, hover), nunca de negócio. Nada de `useState` com
quantidade de montadores dentro do `<Canvas>`.

Isso também significa que o `useRealtimeComps` já existente dá **multiplayer de graça**:
quando o facilitador muda algo, o canteiro de todos os grupos atualiza.

### 3.2 Camada de derivação (a parte mais importante do projeto)

Entre `Comp` e a cena entra um módulo puro, **testável sem WebGL**:

```ts
// src/game/scene/buildCanteiro.ts
export interface SceneSpec {
  terreno:   { tipo: "pátio" | "corredor"; extKm: number };
  torres:    TorreSpec[];     // derivado de lt.ext + volumesPrev[aId]
  cabos:     CaboSpec[];      // derivado de lt.cabFase, circ, pararaios, opgw
  atores:    AtorSpec[];      // 1 por unidade de MoRow.qtd  → { moCatId, pos, anim, slot? }
  maquinas:  MaquinaSpec[];   // 1 por unidade de EqRow.qtd   → { eqCatId, pos, estado }
  alertas:   AlertaSpec[];    // ← calcCoerencia().issues + calcEficiencia().obrigatorioAusente
  progresso: number;          // 0..1, de monthlyVolumes()
}

export function buildCanteiro(
  comp: Comp, atividade: AtividadeItem, lt: LtConfig,
  volumePrev: number, coer: CoerenciaIssue[], ef: CalcEficienciaResult
): SceneSpec
```

Ganhos: testes rápidos em Playwright/Vitest sobre objetos, não sobre pixels; a cena é
"burra" (renderiza `SceneSpec`); e trocar o visual não toca em regra.

### 3.3 Mapa de catálogo → asset

Um único registro declarativo, uma entrada por `id` dos catálogos existentes:

```ts
// src/game/assets/registry.ts
export const EQ_ASSETS: Record<string, AssetDef> = {
  eq1:  { url: "/models/guindaste.glb",  escala: 1,    slots: { cabine: [0, 2.1, 0.4] }, anim: ["idle","icar"] },
  eq2:  { url: "/models/puller.glb",     escala: 1,    slots: { cabine: [0, 1.4, 0] } },
  eq6:  { url: "/models/pickup_4x4.glb", escala: 1,    assentos: 5 },  // = CAPACIDADE_TRANSPORTE.eq6
  // … 20 equipamentos
};
// Personagens são SPRITES (ver §4), não modelos — um atlas para todos os cargos
export const MO_ASSETS: Record<string, SpriteDef> = {
  mo1:  { atlas: "/sprites/workers.png", linha: 0, paleta: "ajudante",  epi: ["capacete","colete"] },
  mo4:  { atlas: "/sprites/workers.png", linha: 0, paleta: "operador",  epi: ["capacete"] },
  // … 16 cargos, todos na MESMA linha do atlas, variando paleta + overlay de EPI
};
```

Detalhe que economiza quase todo o esforço de arte: **16 cargos ≠ 16 assets.** Um sprite base
de trabalhador + troca de paleta + 3–4 overlays de EPI (capacete, cinto paraquedista, perneira,
máscara de solda) cobre tudo e já comunica o requisito de segurança visualmente.
O mesmo vale para `CAPACIDADE_TRANSPORTE`: a capacidade do veículo é um número no registry,
não geometria.

### 3.4 Torres de LT: o caso especial (não baixe esse modelo)

Torre de transmissão é estrutura treliçada. Um modelo realista baixado tem facilmente
200k–2M triângulos — e a cena precisa de **dezenas delas**. Caminho recomendado, em ordem:

1. **Procedural em código.** Uma torre autoportante é tronco-piramidal com montantes e
   diagonais — gerável com `<Instances>` do drei a partir de ~6 primitivas (perfis L) e um
   parâmetro de altura/base. Funciona para `a1`–`a4` com níveis de montagem parcial
   (banzo → tronco → mísula → cabeça), que é **exatamente** o que a animação de progresso precisa.
2. **Geometry Nodes no Blender** se quiser mais fidelidade, exportando LODs 0/1/2.
3. **Impostor** (billboard com textura alpha) para torres distantes no corredor.

⚠️ **Ajuste obrigatório pela direção de arte (§4):** num framebuffer de ~640×360, um perfil de
treliça com espessura realista ocupa menos de 1 pixel e **cintila ou desaparece**. A torre tem
que ser **estilizada e "gorda"**: cada membro com espessura suficiente para render ≥ 2–3 px em
tela. Treliça fiel aqui não é só caro, é *ilegível*. Isso empurra a geometria para caixas e
perfis grossos — que é exatamente o que combina com pixel art, e mais barato ainda de gerar.

Cabos: `CatmullRomCurve3` / catenária aproximada + `TubeGeometry` com poucos segmentos
radiais (3–4 bastam — ninguém olha a seção do cabo), derivando a quantidade de
`lt.cabFase * 3 * fator + lt.pararaios * fator + lt.opgw * fator` (já calculado em
`AppContext.tsx:407`).

### 3.5 Stack e versões (verificadas no registry npm em 07/10/2026)

O projeto está em **React 19.2.5 / Vite 8 / TypeScript 6**. Combinação compatível:

| Pacote | Versão | Nota |
|---|---|---|
| `three` | `0.186.1` | |
| `@react-three/fiber` | `9.8.1` | peer: `react >=19 <19.4` ✓ |
| `@react-three/drei` | `10.7.9` | peer: `react ^19` ✓ |
| ~~`@react-three/postprocessing`~~ | — | **não entra** — ver §9 |
| `@react-three/rapier` | `2.2.0` | **provavelmente desnecessário** — ver abaixo |
| `zustand` | `5.0.15` | só se precisar de estado de apresentação fora do React tree |

⚠️ **Não usar R3F v10 / drei v11**: estão em alpha (migração para WebGPU). Fique no v9/v10 estáveis.

**Sobre física:** a tentação de instalar Rapier é grande e quase sempre errada aqui.
Não existe simulação física no domínio — nada cai, nada colide de forma significativa.
Posicionamento é determinístico (`buildCanteiro`), animação é `useFrame` + interpolação.
Rapier custaria ~600 KB de WASM para nada. Se depois aparecer "o guindaste tomba se a carga
exceder a capacidade nominal" (que é um requisito de segurança real no catálogo!), isso é
melhor como **regra + animação roteirizada** do que como física.

**Do drei, o que realmente importa:** `useGLTF` (+ `preload`), `Instances`/`Merged`,
`Environment`, `OrbitControls`/`MapControls`, `Html`, `Billboard`, `useAnimations`,
`AdaptiveDpr`, `Detailed` (LOD), `Bvh`, `PerformanceMonitor`, `SoftShadows` (com parcimônia).

### 3.6 Código: lazy-load obrigatório

`src/App.tsx` é um switch de telas simples — perfeito para isolar o custo:

```tsx
const Canteiro3D = React.lazy(() => import("./game/Canteiro3D"));
// …
{screen === "canteiro" && <Suspense fallback={<LoadingBar visible />}><Canteiro3D /></Suspense>}
```

Three.js + drei adicionam ~600–800 KB gzip. **Nenhum facilitador deve pagar isso ao abrir o
Login.** Com `manualChunks` no `vite.config.ts`, separar `three` em chunk próprio e deixar
o cache do navegador trabalhar entre sessões.

### 3.7 Híbrido 3D + DOM, em split view

Não tente colocar números dentro do 3D. Texto 3D é caro, pesado de traduzir e ruim de ler. Use:

- **3D** → canteiro, atores, máquinas, torres, cabos, progresso, alertas espaciais
- **DOM** (com os estilos de `src/styles.ts` e a paleta `C`) → custo, duração,
  coeficientes Hh/Ch, KPI, tabelas
- **`<Html>` do drei** → só para o rótulo que precisa seguir um objeto (ex.: badge "⚠ sem operador"
  grudado no guindaste), com `occlude` e `distanceFactor`

**Layout (decidido por ser desktop):** não é uma tela nova que substitui a `Composicao`, é uma
divisão da tela que ela já tem. A tabela de MO/equipamento/insumo fica à esquerda, o canteiro
à direita, ambos visíveis ao mesmo tempo:

```
┌─────────────────────────────┬───────────────────────────┐
│  tabela MO / EQ / insumo    │                           │
│  KPI · equipes · mês        │     <Canvas> canteiro     │
│  requisitos de segurança    │                           │
│  (edição — fonte da verdade)│  (consequência imediata)  │
└─────────────────────────────┴───────────────────────────┘
│  barra de resumo: custo · duração · coef Hh/Ch · alertas │
└──────────────────────────────────────────────────────────┘
```

Isso é o que faz a fase A valer a pena: **a edição e a consequência no mesmo olhar.**
Em tela de celular seria obrigatoriamente em abas, e o efeito se perderia.

Consequências de interação que só existem porque é desktop, e que devem ser usadas:
**hover** (passar o mouse no guindaste mostra operador alocado e coeficiente, sem poluir a cena
com badges permanentes), **cursor de precisão** (slots pequenos como a cabine são alvos válidos),
e **teclado** — `Composicao.tsx` já tem `ArrowLeft`/`ArrowRight` para navegar entre as abas de
atividade, e esse atalho **tem que continuar funcionando** com o canvas em foco.

A paleta já existe e deve ser respeitada: `C.gold #F37C02` (destaque), `C.blueL #004F86`
(grupo M — montagem), `C.greenL #10B981` (grupo L — lançamento), `C.redL`/`C.yellow` (alertas).
E **tudo** que for texto passa por `t()` — o app é PT/ES.

**Divisão de trabalho com a vista isométrica:** ninguém conta 40 bonecos numa tela isométrica.
Quem informa quantidade é a tabela à esquerda; o canteiro informa **relação** (quem opera o quê,
quem está parado, quem não cabe no transporte). Por isso os trabalhadores devem ser dispostos
em **formação legível — agrupados por cargo** — e não espalhados de forma realista. Realismo de
disposição aqui destrói a informação.

---

## 4. Direção de arte: isométrico 2:1 + pixel art

**Decisão:** cenários em 3D, personagens em pixel art, câmera isométrica. Essa é a decisão de
maior alcance tomada até aqui — ela muda custo de arte, performance, postprocessing e
praticamente toda a seção de assets. E ela resolve, de graça, o maior risco do projeto.

### 4.1 Por que isso é a melhor escolha e não só uma estética

O risco nº 1 que eu havia levantado era **esforço de arte virar o projeto inteiro**, e o
corolário era que misturar assets CC0 de autores diferentes em estilo realista fica feio.
Pixel art desarma os dois:

- **Pixel art perdoa inconsistência.** O que em 3D realista lê como "asset de outro autor",
  em pixel art lê como estilo. Basta **uma paleta fixa compartilhada** para coisas de origens
  diferentes conviverem.
- **Um sprite de 32×32 com 4 quadros é viável internamente.** Isso é o desbloqueio real:
  modelar, texturizar e riggar um personagem 3D é trabalho de semanas e de especialista;
  desenhar um trabalhador em pixel é trabalho de um dia e de qualquer pessoa com paciência.
  Os 16 cargos saem de **um** sprite base + troca de paleta + chapéu/EPI.
- **A câmera fixa elimina metade dos problemas de 3D.** Sem rotação livre: só um lado de cada
  modelo é visto, oclusão é previsível, sombra é estável, sprites nunca "giram errado".
- **Performance deixa de ser assunto** (§9). Renderizar em framebuffer pequeno e ampliar é
  ordens de magnitude mais barato que renderizar 1080p — o notebook corporativo com GPU
  integrada deixa de ser restrição.

### 4.2 O que é 3D e o que é sprite

| Elemento | Técnica | Por quê |
|---|---|---|
| Terreno, pátio, corredor | **3D** (plano/heightfield, flat shading) | é o palco; precisa de profundidade |
| Torres | **3D estilizado e "gordo"** (§3.4) | mostra montagem parcial em 4 estágios e sustenta o corredor em profundidade |
| Cabos | **3D** (catenária + `TubeGeometry`) | geometria contínua que acompanha as torres |
| Máquinas (guindaste, puller, caminhões) | **3D low-poly, flat shading** | **orientação importa** — lança do guindaste, alcance, para onde o caminhão aponta. É a informação espacial que o grupo precisa ler |
| **Pessoas** | **Sprite pixel art** (billboard) | nunca precisam de orientação real; e é onde o custo de 3D explodiria |

O que faz os dois conviverem não é disciplina de modelagem, é o **framebuffer de baixa
resolução** (§4.4): o 3D é pixelado pelo próprio render, então sai no mesmo "material" visual
que os sprites. Sem isso, 3D liso ao lado de sprite pixelado parece bug.

### 4.3 A câmera: 2:1 dimétrico, não isométrico verdadeiro

Para pixel art a projeção certa é **2:1 dimétrico**, não isometria verdadeira:

| | Pitch | Resultado |
|---|---|---|
| Isométrico verdadeiro | `atan(1/√2)` ≈ **35,264°** | eixos igualmente encurtados, mas diagonais "sujas" em pixel |
| **2:1 dimétrico** ✅ | **30°** | tile projeta 2:1; diagonal na tela fica em `atan(0.5)` ≈ 26,57° — a escadinha limpa de 2 px na horizontal por 1 na vertical que pixel art usa |

Yaw de 45° nos dois casos. Com `OrthographicCamera` (sem perspectiva), olhando a origem:

```tsx
const d = 40;                                   // distância; não afeta escala em ortográfica
const y = d * Math.SQRT2 * Math.tan(Math.PI / 6);  // = 0.8165·d  →  pitch de 30°
// posição [d, y, d] com lookAt(0,0,0) dá yaw 45° + pitch 30°
```

Escala de zoom e `near`/`far` negativos (ex. `near: -1000`) para não ter que posicionar a
câmera longe. **Sem `OrbitControls` livre:** rotação só em passos de 90° (4 ângulos), que é o
que mantém os sprites corretos e a leitura estável.

### 4.4 Pixel-perfect: onde implementações ingênuas falham

Esta é a parte que dá errado silenciosamente. Checklist:

1. **Resolução interna fixa + upscale inteiro.** Renderize em algo como **640×360** e amplie
   para o container no maior múltiplo inteiro que couber (2×, 3×…), com letterbox nas sobras.
   Isso garante **pixel quadrado**. O atalho `dpr={0.25}` + CSS `image-rendering: pixelated`
   funciona, mas em container de tamanho arbitrário gera pixel retangular e escadinha irregular.
2. **`antialias: false`** no `gl`. AA suaviza justamente a borda que deve ser dura.
3. **`<Canvas flat>`** — e isso é o erro clássico: R3F aplica `ACESFilmicToneMapping` por
   padrão, que **desloca todas as cores** e destrói a paleta. `flat` troca para `NoToneMapping`.
   Vale testar também `linear` se as cores precisarem sair exatamente como autoradas.
4. **Textura de sprite:** `magFilter = minFilter = THREE.NearestFilter`,
   `generateMipmaps = false`, `colorSpace = THREE.SRGBColorSpace`. Sem isso o sprite vira borrão.
5. **Sem postprocessing** (§3.5).
6. **Iluminação:** 1 luz direcional + ambiente fraco, `flatShading: true`, materiais
   Lambert/Toon. **Nada de PBR, nada de HDRI** — o que elimina a dependência de
   `<Environment>` e, com ela, a preocupação de wifi do evento para HDRI.
7. **Paleta única e explícita** para 3D e sprites, derivada das cores da marca
   (`C.gold`, `C.blueL`, `C.greenL`). É o que faz tudo parecer uma coisa só.

Sobre instancing: a contagem real de gente é pequena (a composição base de `a1` tem 17 pessoas;
um grupo exagerado chega a ~50). Um atlas + `InstancedMesh` com offset de UV por instância dá
1 draw call, mas **não é obrigatório nessa escala** — plano individual compartilhando material
já resolve. Não otimize antes de medir.

### 4.5 O risco novo que a isometria traz: oclusão

Vista isométrica tem um problema próprio: **torre alta esconde o que está atrás dela.** Como
a informação importante é justamente "quem está operando o quê", isso não é detalhe. Opções,
em ordem de simplicidade:

1. **Rotação em 4 passos de 90°** (teclas `Q`/`E`) — resolve quase tudo e é barato.
2. **Fade do oclusor** quando há ator atrás (transparência por altura).
3. Dispor os atores **à frente** dos volumes altos na formação legível (§3.7).

Começar por (1) + (3). O (2) só se a sessão real mostrar que ainda incomoda.

---

## 5. Infraestrutura: Vercel + Supabase

Confirmado que fica na infra atual. Isso **não** adiciona superfície de servidor: o 3D é 100%
cliente, `api/claude.js` segue sendo a única função. Mas há dois achados concretos no
`vercel.json` que mudam o plano.

### 5.1 Achado 1 — o CSP atual já proíbe asset de CDN externo

O `vercel.json` entrega:

```
connect-src 'self' https://*.supabase.co wss://*.supabase.co
img-src     'self' data:
script-src  'self'
```

`connect-src` restrito a `self` + Supabase significa que **buscar `.glb`, `.hdr` ou textura de
qualquer CDN externo é bloqueado pelo navegador**, não só inadvisável. Em particular,
`<Environment preset="city" />` do drei — que baixa HDRI do CDN da pmndrs em runtime — **seria
bloqueado hoje**. A recomendação de self-hospedar assets, que eu havia feito por causa do wifi
de evento, portanto **já é obrigatória pela política de segurança do projeto**. Bom: a decisão
estava certa e o CSP a garante. (E com a direção de arte, HDRI sai de cena de todo jeito.)

`img-src 'self' data:` cobre os PNGs de sprite servidos de `/public`. Sem mudança.

### 5.2 Achado 2 — Draco/KTX2 exigiriam afrouxar o CSP (e dá para evitá-los)

Se compressão de malha ou textura entrar, o CSP **precisa de duas concessões**:

- **`'wasm-unsafe-eval'` em `script-src`** — sob CSP, WebAssembly é bloqueado sem essa palavra-chave
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)).
  Decoder Draco, transcoder KTX2 e Rapier são todos WASM.
- **`worker-src 'self' blob:`** — `DRACOLoader` e `KTX2Loader` do three criam o worker a partir de
  `URL.createObjectURL(new Blob(...))`; sem `worker-src`, o fallback é `default-src 'self'`, que
  não cobre `blob:`
  ([discussão three.js](https://discourse.threejs.org/t/how-to-set-content-security-policy-for-usegltfs/51398)).

**E aqui está o prêmio da direção de arte:** com cenário low-poly flat-shaded e textura em
pixel art, os assets são pequenos o bastante para **dispensar Draco e KTX2 por completo** —
PNG de paleta reduzida comprime muito bem sozinho. **Recomendação: não mexer no CSP.** Manter
`script-src 'self'` sem `wasm-unsafe-eval` é ganho de segurança real, não só conveniência.

Se algum dia for inevitável, confirme no console do navegador antes de editar: a mensagem de
erro nomeia a diretiva que bloqueou.

### 5.3 Onde os assets moram

**Em `/public`, servido pelo CDN da Vercel.** Não em Supabase Storage. Motivo: com pixel art o
total fica na casa de **poucos MB**, versionado junto com o deploy, sem chamada extra, sem
bucket para administrar, e já dentro do que o CSP permite (`'self'`).

Supabase Storage só passa a fazer sentido se os assets virarem **por evento** (projetos de LT
diferentes com cenário próprio). É especulação — não construir agora.

Limites da Vercel que importam (conferir na [página oficial](https://vercel.com/docs/limits),
que muda com o tempo): **upload de arquivos estáticos 100 MB no Hobby / 1 GB no Pro** e
**transferência 100 GB / 1 TB**. Com poucos MB de asset, nenhum dos dois é assunto — mais um
ponto para a direção de arte.

### 5.4 Duas pendências concretas de configuração

1. **Cache dos assets.** O Vite põe hash no nome dos arquivos que ele empacota, **mas não nos
   que estão em `/public`** — esses mantêm o nome. Sem header, o CDN pode servir sprite velho.
   Adicionar ao `vercel.json`:

   ```json
   {
     "source": "/(sprites|models)/(.*)",
     "headers": [
       { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
     ]
   }
   ```

   e versionar no nome do arquivo (`workers-v2.png`) quando a arte mudar.

2. **`manualChunks` não existe hoje.** O `vite.config.ts` atual não tem bloco `build`. Separar
   `three` em chunk próprio é o que viabiliza o `React.lazy` da §3.6 — sem isso o three pode
   acabar no bundle do `Login`.

### 5.5 O que não muda

Supabase intocado: `grupo_comps` já guarda tudo que a cena precisa (§6), `useRealtimeComps`
continua dando sincronização de graça, RLS e autenticação de grupo seguem como são. Nenhuma
migração nas fases A e B. E, como o 3D não pontua, nada em `Ranking.tsx`.

---

## 6. Modelo de dados: o que muda

**Fase A (Canteiro Vivo): nada.** Zero migração. A cena é derivada de `grupo_comps`, que já tem
`mo_rows`, `eq_rows`, `insumo_rows`, `req_ids`, `kpi`, `equipes`, `mes_inicia`.

**Fase B (drag-and-drop):** talvez um campo opcional de layout (`pos` por linha) se a posição
escolhida pelo grupo importar. Sugestão: **não persistir** — gerar posição deterministicamente
a partir do `_id` da linha (hash → slot), para o canteiro ficar estável entre reloads sem
inventar coluna nova.

**Fase C (simulação):** aí sim há dado novo — eventos, estado por mês, replanejamentos.
Tabela nova (`sim_eventos`, `sim_estado`), e provavelmente nova aba no Ranking.
É a fase que justifica discussão de schema; as outras duas não.

---

## 7. Processo sugerido

### Fase 0 — Vertical slice (1 atividade, 1 semana)

Escolher **`a2` Montagem Mecanizada** como atividade-piloto. Motivos: tem guindaste
(regra `mo4`↔`eq1` 1:1, visualmente óbvia), tem torre, tem transporte, e é a atividade
de maior custo unitário — ou seja, é onde o erro do grupo dói mais.

Entregar: canteiro com terreno, 1 torre procedural, 1 guindaste, N trabalhadores, alerta de
coerência visual. Caixas cinzas (gray-box) no lugar dos modelos finais. **Rodar numa sessão real.**

**Antes disso, um spike de meio dia: validar o pixel-perfect (§4.4).** Câmera ortográfica 2:1,
framebuffer de ~640×360 com upscale inteiro, `<Canvas flat>`, `NearestFilter`, um cubo 3D e um
sprite lado a lado. Se 3D e sprite não casarem visualmente nesse teste, a direção de arte tem
problema — e é melhor descobrir em meio dia do que depois de desenhar 16 cargos. É o item de
maior risco técnico e o mais barato de testar.

E **fixar a paleta antes de desenhar qualquer coisa** (§8.5): paleta trocada no meio obriga a
redesenhar tudo.

Se a fase 0 não convencer o facilitador em 5 minutos de uso, o conceito está errado e
nenhum asset bonito vai salvar.

### Fase 1 — Canteiro Vivo completo

7 atividades, 16 cargos (1 sprite base + paleta + overlay de EPI), 20 equipamentos, alertas de
`calcCoerencia` e `calcSeg`, progresso de `monthlyVolumes()`. Assets reais substituindo gray-box.

### Fase 2 — Composição via 3D (se a fase 1 provar valor)

Drag-and-drop da bandeja para os slots, com `Outline` marcando destino válido. A tabela
continua sendo a fonte da verdade e permanece visível no split view — o 3D só dispara
`moAdd`/`eqAdd`/`moDel`. Destravada por ser desktop.

### Fase 3 — Simulação temporal e eventos — **não planejar agora**

Play/pause no Cronograma, eventos do facilitador, replanejamento. Como o 3D não pontua,
esta fase perdeu o incentivo que a justificava (§2) e passa a ser ferramenta de debriefing.
Só entra em pauta se o facilitador pedir explicitamente, depois de A e B rodando.

### Disciplina de processo

- **Gray-box antes de arte.** Toda feature nasce com `<boxGeometry>`. Arte é a última etapa,
  nunca a primeira. (O erro mais comum em projetos 3D é passar 3 semanas procurando o modelo
  perfeito de guindaste antes de saber se o jogo funciona.) Com pixel art a arte ficou barata,
  o que torna a tentação de começar por ela **maior**, não menor — a regra continua valendo.
- **Orçamento de performance definido no dia 1** (§9), e medido em cada PR.
- **Testar no pior dispositivo do público-alvo**, não no laptop do dev. Se a sessão tem
  participantes no celular, o celular é o alvo.
- **Rodar offline.** Treinamento presencial costuma ter wifi ruim ou nenhum.
  Isso proíbe `<Environment preset="city">` (baixa HDRI de CDN externo em runtime) —
  self-hospedar o `.hdr` em `/public`.
- **Playwright + WebGL em CI é armadilha.** Manter os testes atuais sobre funções puras
  (`buildCanteiro`, `calcCoerencia`); para a cena, no máximo um smoke test de "o canvas montou"
  com flags de GPU (`--use-angle=swiftshader`), sem comparação de pixel.

---

## 8. Onde baixar os assets

A direção de arte (§4) parte a lista em duas: **sprites pixel art** para pessoas e **modelos
low-poly** para cenário e máquinas. Licença importa — isto é material de treinamento
corporativo, portanto **uso comercial**. `CC0` é o ideal; `CC-BY` serve com tela de créditos;
evite `CC-BY-NC` e "free for personal use".

### 8.1 Pixel art — pessoas, ícones, overlays de EPI

| Fonte | Licença | Serve para |
|---|---|---|
| [itch.io/game-assets/tag-pixel-art](https://itch.io/game-assets/tag-pixel-art) | varia por pack (muitos CC0) | **o maior mercado de pixel art que existe**; buscar por *worker*, *construction*, *industrial*, *isometric* |
| [kenney.nl/assets](https://kenney.nl/assets) | CC0 | packs 1-bit e pixel, ícones, UI — mesma casa dos modelos 3D, o que ajuda na coerência |
| [opengameart.org](https://opengameart.org/) | CC0 / CC-BY / OGA-BY | catálogo antigo e forte em sprite; filtrar por licença na busca |
| [lospec.com/palette-list](https://lospec.com/palette-list) | paletas livres | **a peça mais importante da coerência visual.** Escolher UMA paleta e derivá-la das cores da marca (`C.gold`, `C.blueL`, `C.greenL`) |
| [LimeZu](https://limezu.itch.io/) (itch) | comercial, pago e barato | *Modern Interiors / Exteriors* — personagens modernos e props urbanos, enorme e muito consistente |
| [0x72](https://0x72.itch.io/), [ansimuz](https://ansimuz.itch.io/), [Penzilla](https://penzilla.itch.io/) | varia (vários CC0) | artistas de pixel conhecidos, packs pequenos e limpos |

⚠️ **CraftPix** aparece em toda busca e precisa de ressalva: os assets gratuitos **permitem uso
comercial, mas proíbem revender ou redistribuir os arquivos originais**, e **não são CC0** —
alguns packs exigem atribuição. Os termos citam a loja CraftPix mesmo quando o download veio do
itch.io. Se usar, leia o arquivo de licença *dentro do pack* e guarde uma cópia com a data do
download.

### 8.2 Modelos 3D — terreno, torres, máquinas, props

Os mesmos de sempre, e aqui o pixel art ajuda: com `flatShading` e framebuffer pequeno,
low-poly CC0 fica indistinguível de arte feita sob medida.

| Fonte | Licença | Serve para |
|---|---|---|
| [kenney.nl/assets](https://kenney.nl/assets) | CC0 | kits *City* / *Vehicle*; veículos leves e props de canteiro |
| [quaternius.com](https://quaternius.com/) | CC0 | packs modulares (natureza, veículos, construção); estilo consistente |
| [poly.pizza](https://poly.pizza/) | maioria CC-BY, parte CC0 | download GLB direto sem conta; tem caminhões, gruas, cones |
| [sketchfab.com](https://sketchfab.com/) (filtro *Downloadable* + CC0/CC-BY) | mistas | maior variedade; onde há chance real de achar equipamento específico |
| [superhivemarket.com](https://superhivemarket.com/) · [cgtrader.com](https://www.cgtrader.com/) | pago | 1 pack de maquinário pesado (puller/freio, munck) — mais barato que o tempo de procurar |

**Saíram da lista** por causa da direção de arte: **Poly Haven** e **ambientCG** (HDRI e
texturas PBR — não há PBR nem HDRI aqui, §4.4) e **KayKit** (personagens riggados 3D — agora
são sprites). Isso também encerra a preocupação de wifi do evento com HDRI.

**Continuam fora:** GrabCAD e 3D Warehouse (CAD sujo, licença nebulosa); text-to-3D só como
placeholder de gray-box.

### 8.3 Ferramentas

- **[Aseprite](https://www.aseprite.org/)** (~US$ 20) é o padrão de pixel art; **[LibreSprite](https://libresprite.github.io/)**
  e **[Piskel](https://www.piskelapp.com/)** são alternativas livres. Exportam sprite sheet + JSON de frames direto.
- **Blender** para o cenário low-poly, com export GLB.
- **Pipeline alternativo que vale conhecer:** renderizar um modelo 3D no ângulo isométrico,
  reduzir para 64 px e quantizar na paleta → sai um sprite perfeitamente coerente com o resto.
  É a saída se as máquinas também virarem sprite, e garante consistência que mão livre não dá.

### 8.4 Avaliação dos packs de itch.io candidatos

> Levantamento feito por busca, **sem abrir as páginas**: a política de rede deste ambiente
> bloqueia `itch.io`. Tudo abaixo vem de resultados de busca que citam as páginas — **confirme o
> texto da licença na página antes de pagar ou publicar.**

#### A percepção que reenquadra a busca

Quase todo pack de personagem em pixel art é vendido por **número de direções** (4 ou 8
facings), e pack isométrico de 8 direções é a categoria mais rara e mais cara. **Nós não
precisamos disso.** Na nossa arquitetura os personagens são *billboards diante de uma câmera
fixa* (§4.2–4.3), e trabalhador em canteiro **fica parado operando**, não caminha em 8 direções
— ele é um recurso de composição, não uma unidade de RTS. **Uma única direção basta**, duas no
máximo. Isso abre enormemente o leque de packs utilizáveis e torna a opção de desenhar
internamente mais realista ainda.

#### Cenário, props e referência visual — **melhor achado**

**[Cute SCKR](https://comshadow.itch.io/)** (`comshadow.itch.io`) — o conteúdo é o encaixe mais
direto que existe para este projeto:

| Pack | Conteúdo relevante | Preço |
|---|---|---|
| [Modern Construction Site Tileset](https://comshadow.itch.io/modern-construction-site-pixel-art-tileset-pack) | escavadeiras, guindastes, andaimes, materiais, maquinário pesado, instalações de obra, **placas de sinalização e barreiras de segurança** | US$ 3,99 |
| [Construction Site Top-Down Tileset (DLC)](https://comshadow.itch.io/construction-site-topdown-pixel-art-tileset-dlc) | mesma família, **perspectiva top-down** — a mais próxima da isométrica | — |
| [Tileset bundle](https://itch.io/s/181841/tileset-bundle) | 384 packs do autor | US$ 29,99 |

Licença (texto verificado no pack irmão, mesmo template do autor): **uso pessoal e comercial
liberado em projetos de jogo; proibido revender ou redistribuir como asset standalone;
atribuição apreciada mas não obrigatória.** Compatível com o nosso caso.

Duas ressalvas honestas:

1. **É tileset 2D, e o nosso cenário é 3D (§4.2).** Não entra como cenário: entra como
   **textura de solo, props em billboard, sinalização, barreiras** e — o uso mais valioso —
   **referência visual e fonte de paleta** para modelar o cenário 3D e desenhar os sprites.
   Quem esperar "comprei o cenário" vai se frustrar.
2. A página do Modern Construction Site declara **"AI Assisted, Graphics"**. Para material de
   treinamento corporativo isso pode ou não importar — é decisão de quem assina o material,
   mas melhor saber antes.

#### Personagens — nenhum acerto direto, e a licença decide

| Pack | Encaixe técnico | Licença | Veredito |
|---|---|---|---|
| **[Kenney](https://kenney.nl/assets)** — *Tiny Town* (130 assets, 16×16), *Pixel Platformer Industrial Expansion* (110+), *New Platformer Pack* (440), *Toon Characters* | personagens genéricos, não-operários | **CC0** — sem atribuição, sem restrição, **derivar e redistribuir liberado** | ✅ **recomendado** |
| **[LimeZu](https://limezu.itch.io/modernexteriors)** — *Modern Interiors / Exteriors* | 16×16 top-down, civis modernos; personagens ficam no *Interiors*; download ~222 MB | comercial OK, **crédito obrigatório com link**, sem redistribuição (~US$ 5) | 🟡 plano B |
| **[Mana Seed Character Base](https://seliel-the-shaper.itch.io/character-base)** (Seliel the Shaper) | **tecnicamente perfeito**: sistema *paper doll* em camadas, roupas/cabelo/ferramentas em sheets de layout idêntico, trocáveis em runtime — é literalmente o nosso desenho de 16 cargos | US$ 19,98; demo grátis de uso comercial | ❌ **não usar** — ver abaixo |
| **[RigelRiv — FREE Isometric Modern Character](https://gelgel.itch.io/isometric-modern-character)** | 7 personagens, **isométrico nativo, 1 direção**, idle de 2 quadros | "personal/commercial", name-your-price | 🟡 vale olhar — **1 direção é exatamente o que precisamos** |
| **[crabcrabcrabs — isometric character](https://crabcrabcrabs.itch.io/isometric-character)** | 8 direções, genérico, **protótipo** (só movimento) | name-your-price, texto não confirmado | 🟡 imaturo |
| **[Elthen — Dwarf Worker Sprites](https://elthen.itch.io/2d-pixel-art-dwarf-worker-sprites)** | conjunto de animação **ideal: Idle, Movement, Build, Carry** | a partir de US$ 3 | ❌ é um **anão** — visual errado para equipe de LT |
| **[Free Game Assets](https://free-game-assets.itch.io/)** (*Free Industrial Zone Tileset* etc.) | tilesets industriais gratuitos | ⚠️ **é a conta itch.io da CraftPix** — vale a ressalva da §8.1, não é CC0 | 🟡 ler a licença do pack |

#### ⚠️ Por que o Mana Seed está fora, apesar de ser o melhor encaixe

O autor declara que **código gerado por IA no projeto proíbe o uso da arte dele** ("any
AI-generated code in your game would prohibit the use of my art"), além de excluir web3/NFT.
Este projeto tem `src/services/claudeAI.ts`, a função `api/claude.js`, usa Claude para as
análises do Ranking **e é desenvolvido com assistência de IA**. Usar Mana Seed aqui seria
violar a licença. Vale registrar porque é o pack que todo mundo recomenda para exatamente o
nosso caso de uso, e o problema só aparece lendo os comentários do autor —
a [licença](https://selieltheshaper.weebly.com/user-license.html) é o documento a ler se
alguém quiser contestar.

#### Conclusão

1. **Comprar o Cute SCKR** (US$ 3,99, ou o bundle a US$ 29,99 se for querer mais cenário).
   Melhor conteúdo disponível, licença compatível — usado como props, sinalização e
   **referência de paleta**, não como cenário.
2. **Personagens: Kenney CC0 como base, editado internamente.** Não por ser o mais bonito, mas
   porque **CC0 é a única licença que permite derivar as 16 variações de cargo sem preocupação**
   — e o plano da §4.1 sempre foi "1 base + paleta + overlay de EPI", ou seja, íamos editar de
   todo jeito. Com câmera fixa e 1 direção, o trabalho é pequeno.
3. **Não usar Mana Seed.**
4. LimeZu como plano B se o Kenney não servir visualmente, aceitando a tela de créditos.

Resposta à pergunta 12 da §11 ("quem desenha os sprites?"): com **1 direção**, base **CC0
editável** e o Cute SCKR como referência de estilo, a resposta "nós mesmos" fica bem mais
viável do que parecia.

### 8.5 Recomendação prática de sourcing

1. **Fixar a paleta primeiro** (Lospec + cores da marca). Antes de baixar qualquer coisa.
2. **Pessoas:** 1 sprite base desenhado internamente (32×32, 4 quadros) + paleta por cargo +
   overlay de EPI. Pack de itch.io só como referência ou atalho inicial.
3. **Cenário e props:** Kenney + Quaternius (CC0, coerentes entre si), flat-shaded.
4. **Maquinário pesado específico:** 1 pack pago.
5. **Torres:** procedurais e "gordas" (§3.4).

Manter `docs/ASSETS.md` com origem, autor, licença e link de cada arquivo — e, para packs de
licença própria como CraftPix, a cópia do texto da licença com a data.

---

## 9. Performance: o assunto praticamente fechou

Este orçamento mudou duas vezes: subiu quando o alvo virou desktop, e agora **deixa de ser
restrição** por causa do framebuffer de baixa resolução (§4.4). Vale registrar a evolução para
ninguém reabrir a discussão com o número errado:

| Métrica | v1 (incluía celular) | v2 (desktop) | **v3 (pixel art, §4)** |
|---|---|---|---|
| Resolução de render | nativa | nativa (1080p) | **~640×360, upscale inteiro** |
| Fragmentos por frame | ~2 M | ~2 M | **~0,23 M (≈9× menos)** |
| Triângulos em tela | ≤ 150k | ≤ 500k | **≤ 100k** (sem esforço — cenário é low-poly e torre é caixa) |
| Draw calls | ≤ 60 | ≤ 150 | **≤ 60** |
| Total de asset | ≤ 8 MB | ≤ 25 MB | **≤ 3 MB** (sprite PNG + GLB flat) |
| Texturas | KTX2 ≤ 1024² | KTX2 ≤ 2048² | **PNG de paleta, ≤ 256²** |
| Compressão | Draco + KTX2 | Draco + KTX2 | **nenhuma** → CSP intocado (§5.2) |
| Postprocessing | nenhum | `Outline` + `N8AO` | **nenhum** |

O gargalo de GPU integrada é **fragmento e draw call**, e o framebuffer pequeno resolve o
primeiro de forma quase absurda. Notebook corporativo deixa de ser risco.

**O que continua valendo, apesar da folga:**

- `frameloop="demand"` — a cena fica parada a maior parte do tempo (o grupo está discutindo),
  e notebook em bateria numa sala de treinamento agradece.
- `React.lazy` + `manualChunks` (§3.6, §5.4) — isso é sobre **bundle JS**, que o pixel art não
  reduz: `three` continua custando ~600 KB gzip. Segue obrigatório.
- `<Instances>` onde for trivial, mas **sem otimizar antes de medir** (§4.4).
- Cache dos assets em `/public` via header (§5.4).

**O que saiu:** `<AdaptiveDpr>` (era para celular), `<Detailed>`/LOD (desnecessário nessa
escala), pipeline de `gltf-transform` com Draco/KTX2 (assets pequenos demais para justificar).
O pipeline de asset virou simplesmente: Blender → GLB flat-shaded → `/public/models`;
Aseprite → PNG + JSON → `/public/sprites`.

---

## 10. Riscos e como mitigar

| Risco | Mitigação |
|---|---|
| Esforço de arte vira o projeto inteiro | **muito reduzido pelo pixel art (§4.1)**: 1 sprite base + paleta; gray-box primeiro; torre procedural |
| Setup de pixel-perfect errado (tone mapping, filtro, escala) | spike de meio dia na fase 0; checklist da §4.4 — `<Canvas flat>` é o erro silencioso mais comum |
| Treliça fina desaparece/cintila em 640×360 | torre estilizada com membros ≥ 2–3 px em tela (§3.4) |
| Oclusão isométrica esconde quem opera o quê | rotação em 4 passos (`Q`/`E`) + formação legível (§4.5) |
| Licença de pack pixel mal entendida (CraftPix e afins) | `docs/ASSETS.md` com cópia da licença e data do download (§8.1) |
| CSP bloquear loader se Draco/KTX2 entrarem | não usar nenhum dos dois — assets pequenos demais para justificar (§5.2) |
| ~~Celular dos participantes não aguenta~~ | **fora de escopo** — público-alvo é desktop |
| Notebook corporativo com GPU integrada engasga | **em grande parte resolvido pelo framebuffer pequeno (§4.4)**; orçamento §9 medido desde a fase 0; `frameloop="demand"`; testar em máquina sem GPU dedicada |
| Orçamento afrouxado vira desculpa para não otimizar | o teto de draw calls (≤150) é o que GPU integrada realmente sente; medir em PR, não no fim |
| 3D vira enfeite e não ensina nada | cada elemento visual **tem** que mapear uma regra de `calculations.ts`; se não mapeia, não entra |
| Duas formas de editar o mesmo estado = bugs | o 3D só dispara ações do `AppContext`; nunca escreve direto no Supabase |
| Fase C construída sem ter quem a use | não planejar agora — sem pontuação, é debriefing opcional (§2) |
| Bundle inicial degrada o app atual | `React.lazy` + `manualChunks`; medir com `vite build --report` |
| Licença de asset em material comercial | `docs/ASSETS.md` preenchido no momento do download |
| Wifi ruim no evento | assets self-hospedados em `/public` — **já obrigatório pelo CSP** (§5.1); HDRI deixou de existir (§4.4); `useGLTF.preload` na tela anterior |
| Testes Playwright quebrando por WebGL | lógica em funções puras; smoke test apenas |

---

## 11. Perguntas abertas (para decidir antes de codar)

1. **O 3D substitui ou acompanha a tabela de composição?** (recomendação: acompanha, em split
   view — §3.7; pendente de confirmação)
2. ~~**Qual o dispositivo-alvo real dos participantes?**~~ ✅ **Desktop.**
3. ~~**Estilo visual: low-poly estilizado ou realista?**~~ ✅ **Resolvido, e melhor do que eu
   havia proposto:** cenário low-poly 3D + personagens em pixel art, câmera isométrica (§4).
4. **O jogo é competitivo em tempo real** (grupos vendo o canteiro um do outro, aproveitando o
   `useRealtimeComps`) ou cada grupo isolado até o Ranking?
5. **A sessão tem tempo para isso?** Se a dinâmica de grupo dura 90 min, quanto é composição e
   quanto é exploração 3D? O 3D não pode roubar o tempo da discussão técnica — ele existe para
   qualificá-la.
6. ~~**Entra no Ranking?**~~ ✅ **Não entra.** `Ranking.tsx`, `calcSeg` e `calcNaoAplicPenalty`
   ficam intocados.

### Novas, criadas pela direção de arte

9. **Qual a resolução interna exata?** `640×360` é um bom ponto de partida, mas depende da
   largura que o canvas terá no split view (§3.7) — o upscale tem que ser inteiro para o pixel
   sair quadrado. Decidir junto com o layout, não antes.
10. **Rotação em 4 passos resolve a oclusão?** (§4.5) Se não, entra fade de oclusor — mais
    trabalho, e melhor saber antes de modelar as torres.
11. **Máquinas em 3D ou sprite?** Recomendo 3D, porque orientação (lança do guindaste, para
    onde o caminhão aponta) é informação que o grupo precisa ler. Mas o pipeline de
    render-para-sprite (§8.3) é saída legítima se a coerência visual incomodar.
12. **Quem desenha os sprites?** 🟡 **Bem mais fácil depois da §8.4:** como a câmera é fixa,
    **1 direção basta** (não 4 nem 8), a base do Kenney é CC0 e portanto editável sem
    restrição, e o pack do Cute SCKR serve de referência de estilo. Ainda depende de alguém —
    não precisa ser artista — aceitar a tarefa, mas o tamanho dela caiu bastante.

### Ainda em aberto das rodadas anteriores

7. **O canteiro é por atividade ou um canteiro único?** O split view favorece **por atividade**
   (acompanha a aba `aTab` que já existe), mas o corredor de LT inteiro (`lt.ext` km, derivado
   de `monthlyVolumes()`) é mais impressionante na plenária. Possível: aba por atividade na
   composição + visão geral do corredor no Cronograma.
8. **O canteiro é opcional por evento?** Como não pontua, dá para ligar/desligar por evento sem
   afetar a comparação entre grupos — útil para sessão curta. O padrão `segurancaAplicavel`
   (flag no evento, checada em `App.tsx`) é o molde pronto para isso.

---

## 12. O que as decisões de escopo mudaram

Registro do efeito das duas respostas, para não reabrir discussão já fechada.

### Público-alvo: desktop

| Área | Efeito |
|---|---|
| Layout | **Split view** (tabela + canteiro simultâneos, §3.7) — o maior ganho isolado das duas decisões |
| Fase B | **Destravada.** Mouse e hover eliminam o risco que a adiava |
| Orçamento | Afrouxado ~3×, mas alvo passa a ser **notebook com GPU integrada**, não workstation — depois revisto de novo pela direção de arte (§9) |
| Interação | Hover para detalhe, cursor preciso para slots pequenos, teclado preservado |
| Postprocessing | `Outline` entra (seleção na fase B); `N8AO` opcional para ler a treliça |
| `<AdaptiveDpr>` | Vira opcional |
| `frameloop="demand"` | **Continua** — bateria e cena estática na maior parte do tempo |

### O 3D não entra no Ranking

| Área | Efeito |
|---|---|
| Arquitetura | "O 3D é projeção, não estado" deixa de ser recomendação e vira **invariante**. Sem pontuação, não há por que validar estado de cena no servidor nem defender contra manipulação |
| Banco | **Zero migração nas fases A e B.** Nenhuma coluna de pontuação, nada em `Ranking.tsx`, `calcSeg` ou `calcNaoAplicPenalty` |
| Fase C | **Perdeu o incentivo** (§2). Vira debriefing do facilitador; sai do plano |
| Adoção | O 3D fica **descartável sem efeito colateral** — facilitador que não abrir a tela tem a mesma sessão de hoje. Isso permite liberar por evento (pergunta 8) e torna o rollout quase sem risco |
| Pedagogia | Os alertas de coerência podem ser mostrados com todo o detalhe, sem o receio de "entregar pontos" |

### Cenários 3D + personagens pixel art + câmera isométrica

A decisão de maior alcance das quatro. Detalhe em [§4](#4-direção-de-arte-isométrico-21--pixel-art).

| Área | Efeito |
|---|---|
| Risco nº 1 do projeto | **Desarmado.** "Esforço de arte vira o projeto" e "CC0 de autores diferentes fica feio" se resolvem: pixel art lê inconsistência como estilo, e paleta fixa costura o resto |
| Personagens | Deixam de ser modelo 3D rigado e passam a **sprite**. Morre o pipeline de rig/animação, morre a dependência de KayKit. 16 cargos = 1 sprite base + paleta + overlay de EPI |
| Viabilidade interna | **Desenhar 32×32 com 4 quadros é trabalho de um dia**, não de semanas de especialista. É o desbloqueio prático |
| Câmera | `OrthographicCamera` **2:1 dimétrico — pitch 30°, yaw 45°**, não isometria verdadeira (35,264°, diagonal suja). Sem órbita livre; rotação em 4 passos |
| Performance | **Deixa de ser restrição.** Framebuffer de ~640×360 = ~9× menos fragmento que 1080p. Orçamento v3 na [§9](#9-performance-o-assunto-praticamente-fechou) |
| Postprocessing | **Reverti a rodada anterior:** `Outline` e `N8AO` saem — linha suave e AO calculada são o oposto de pixel art. Seleção por troca de paleta. `@react-three/postprocessing` não entra |
| PBR / HDRI | **Saem.** Flat shading + 1 luz direcional. Poly Haven e ambientCG saem da lista de fontes, e com eles a preocupação de HDRI em wifi ruim |
| Compressão | Draco e KTX2 **dispensáveis** — e isso mantém o CSP intocado (§5.2) |
| Torres | Continuam procedurais, mas **"gordas"**: membro fino desaparece em 640×360 |
| Risco novo | **Oclusão isométrica** — torre alta esconde quem opera o quê (§4.5) |
| Risco novo | **Setup de pixel-perfect** silenciosamente errado; `<Canvas flat>` é o erro clássico (§4.4) |

### Infra: Vercel + Supabase

Detalhe em [§5](#5-infraestrutura-vercel--supabase). Nenhuma superfície nova de servidor — o 3D
é 100% cliente.

| Área | Efeito |
|---|---|
| **CSP (achado)** | `connect-src 'self' https://*.supabase.co` **já bloqueia asset de CDN externo**. `<Environment preset="city">` seria barrado hoje. A regra "self-hospedar" não é conselho: é política vigente do projeto |
| **CSP (achado)** | Draco/KTX2 exigiriam `'wasm-unsafe-eval'` em `script-src` e `worker-src 'self' blob:`. Com pixel art, **evitáveis** → não mexer no CSP |
| Onde os assets moram | `/public` + CDN da Vercel, **não** Supabase Storage: poucos MB, versionado com o deploy, zero bucket para administrar |
| Limites da Vercel | 100 MB de estático no Hobby / 1 GB no Pro; transferência 100 GB / 1 TB. Com poucos MB, irrelevante |
| Pendência | **Header de cache** para `/sprites` e `/models` — o Vite não põe hash em arquivos de `/public` (§5.4) |
| Pendência | **`manualChunks` não existe** no `vite.config.ts` hoje; é o que viabiliza o `React.lazy` da §3.6 |
| Supabase | **Intocado.** `grupo_comps` já guarda tudo; `useRealtimeComps` segue dando sincronização de graça; zero migração em A e B |

### O que **não** mudou

Gray-box antes de arte (agora com tentação maior de furar a regra); torre procedural;
"16 cargos ≠ 16 assets"; camada pura `buildCanteiro()`; `React.lazy` + `manualChunks`;
assets self-hospedados; `docs/ASSETS.md` no momento do download; Rapier continua fora;
split view; e a regra que vale mais que todas: **todo elemento visual mapeia uma regra de
`calculations.ts`, ou não entra.**
