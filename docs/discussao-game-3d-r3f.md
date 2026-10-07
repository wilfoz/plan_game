# Discussão: transformar a sessão dos grupos em um game interativo (React Three Fiber)

> Documento de discussão — não é uma especificação fechada. O objetivo é alinhar
> **o que é o jogo**, **como ele se encaixa no código que já existe** e **de onde vêm os assets**,
> antes de escrever a primeira linha de `<Canvas>`.

> **Decisões tomadas** (07/10/2026 — ver [wilfoz/plan_game#2](https://github.com/wilfoz/plan_game/issues/2)):
> **(1) Público-alvo: desktop.** Sem celular e sem tablet.
> **(2) O 3D não entra no Ranking.** A pontuação permanece exatamente como é hoje.
>
> As duas respostas estão aplicadas ao longo do documento. O resumo do que elas mudam
> está em [§10](#10-o-que-as-decisões-de-escopo-mudaram).

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
export const MO_ASSETS: Record<string, AssetDef> = {
  mo1:  { url: "/models/worker.glb", cor: "#FBBF24", epi: ["capacete","colete"] },
  // … 16 cargos, todos reusando o MESMO glb de personagem, variando cor/EPI
};
```

Detalhe que economiza 90% do esforço de arte: **16 cargos ≠ 16 modelos.** Um personagem
rigado + variação de cor de uniforme + 3–4 acessórios de EPI (capacete, cinto paraquedista,
perneira, máscara de solda) cobre tudo e já comunica o requisito de segurança visualmente.
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
3. **Impostor** (billboard com textura alpha) para torres a mais de ~300 m na câmera.

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
| `@react-three/postprocessing` | `3.1.3` | **opcional** — ver §7 |
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

---

## 4. Modelo de dados: o que muda

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

## 5. Processo sugerido

### Fase 0 — Vertical slice (1 atividade, 1 semana)

Escolher **`a2` Montagem Mecanizada** como atividade-piloto. Motivos: tem guindaste
(regra `mo4`↔`eq1` 1:1, visualmente óbvia), tem torre, tem transporte, e é a atividade
de maior custo unitário — ou seja, é onde o erro do grupo dói mais.

Entregar: canteiro com terreno, 1 torre procedural, 1 guindaste, N trabalhadores, alerta de
coerência visual. Caixas cinzas (gray-box) no lugar dos modelos finais. **Rodar numa sessão real.**

Se a fase 0 não convencer o facilitador em 5 minutos de uso, o conceito está errado e
nenhum asset bonito vai salvar.

### Fase 1 — Canteiro Vivo completo

7 atividades, 16 cargos (1 modelo + variações), 20 equipamentos, alertas de `calcCoerencia`
e `calcSeg`, progresso de `monthlyVolumes()`. Assets reais substituindo gray-box.

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
  perfeito de guindaste antes de saber se o jogo funciona.)
- **Orçamento de performance definido no dia 1** (§7), e medido em cada PR.
- **Testar no pior dispositivo do público-alvo**, não no laptop do dev. Se a sessão tem
  participantes no celular, o celular é o alvo.
- **Rodar offline.** Treinamento presencial costuma ter wifi ruim ou nenhum.
  Isso proíbe `<Environment preset="city">` (baixa HDRI de CDN externo em runtime) —
  self-hospedar o `.hdr` em `/public`.
- **Playwright + WebGL em CI é armadilha.** Manter os testes atuais sobre funções puras
  (`buildCanteiro`, `calcCoerencia`); para a cena, no máximo um smoke test de "o canvas montou"
  com flags de GPU (`--use-angle=swiftshader`), sem comparação de pixel.

---

## 6. Onde baixar os modelos 3D

Licença importa: isso é material de treinamento corporativo — **uso comercial**.
`CC0` é o que você quer; `CC-BY` exige creditar (uma tela de créditos resolve); evite
`CC-BY-NC` e "free for personal use".

### Primeira parada — CC0, estilo coerente, game-ready

| Site | Licença | Formato | Serve para |
|---|---|---|---|
| [kenney.nl/assets](https://kenney.nl/assets) | CC0 | GLB, FBX, OBJ | kits "City"/"Vehicle"/"Platformer"; ótimo para gray-box bonito, veículos, props de canteiro |
| [quaternius.com](https://quaternius.com/) | CC0 | GLB, FBX | packs modulares (natureza, veículos, construção); estilo consistente |
| [kaylousberg.itch.io](https://kaylousberg.itch.io/) (KayKit) | CC0 | GLB, FBX | **personagens rigados com animações** (idle/walk/work) — resolve os 16 cargos |
| [polyhaven.com](https://polyhaven.com/) | CC0 | HDR, EXR, GLB | **HDRIs** (iluminação do canteiro) e texturas PBR; alguns modelos |
| [ambientcg.com](https://ambientcg.com/) | CC0 | PNG/EXR | texturas PBR de terra, cascalho, concreto, asfalto para o terreno |
| [github.com/KhronosGroup/glTF-Sample-Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) | mistas (maioria permissiva) | GLTF/GLB | validar o pipeline de compressão/animação antes de ter asset próprio |

### Acervos grandes — checar licença modelo a modelo

| Site | Licença | Nota |
|---|---|---|
| [poly.pizza](https://poly.pizza/) | maioria CC-BY, parte CC0 | herdeiro do Google Poly; download GLB direto sem conta; tem caminhões, gruas, cones, trabalhadores |
| [sketchfab.com](https://sketchfab.com/) (filtro *Downloadable* + CC0/CC-BY) | mistas | maior variedade; é onde há chance real de achar **torre de transmissão** e equipamento específico |
| [opengameart.org](https://opengameart.org/) | CC0 / CC-BY / GPL | ex.: [3D House Construction Site (CC0)](https://opengameart.org/content/3d-house-construction-site-lowpoly-cc0) — 2 gruas, caminhões, contêineres |
| [itch.io/game-assets/free/tag-3d](https://itch.io/game-assets/free/tag-3d) | varia | muitos packs CC0 de dev indie; ver cada página |
| [free3d.com](https://free3d.com/) · [cgtrader.com](https://www.cgtrader.com/free-3d-models) | mistas, muitas "personal use" | ler a licença **sempre**; qualidade irregular |

### Pago — quando precisa de equipamento específico de LT

Puller/freio, caminhão munck, escavadeira com modelo real não existem em CC0 com boa qualidade.
Vale comprar 1–2 peças-chave:

- [superhivemarket.com](https://superhivemarket.com/) (ex-Blender Market) — ex. *Heavy Machinery Low-Poly Asset Pack* (~34 modelos, GLTF)
- [cgtrader.com](https://www.cgtrader.com/) / [turbosquid.com](https://www.turbosquid.com/) — maior catálogo; filtrar por "low-poly" + "game-ready" + royalty-free
- [hum3d.com](https://hum3d.com/) — veículos precisos (caro, high-poly, exige retopologia)

### Fontes a evitar (ou usar com cuidado)

- **GrabCAD / 3D ContentCentral** — CAD real de máquinas, mas STEP/IGES: milhões de triângulos,
  sem UV, sem rig. Retopologia custa mais que modelar do zero. E os termos de uso são restritivos.
- **SketchUp 3D Warehouse** — tem muitas torres de transmissão, mas geometria suja, escala
  errática e licença nebulosa.
- **Text-to-3D (Meshy, Tripo, Luma)** — útil só como **placeholder** na fase gray-box.
  A malha sai ruim para animação e os termos de uso comercial variam; não planeje produção com isso.

### Recomendação prática de sourcing

1. Personagens: **1 modelo rigado do KayKit** (CC0) + variação de cor/EPI em código → cobre os 16 cargos.
2. Veículos leves e props: **Kenney + Quaternius** (CC0, estilo coerente entre si).
3. Equipamento pesado específico: **1 pack pago** (Superhive/CGTrader) — mais barato que o tempo de busca.
4. Torres: **procedural** (§3.4). Não baixe.
5. Ambiente: **HDRI do Poly Haven** + **texturas do ambientCG**, self-hospedados.

Manter `docs/ASSETS.md` com origem, autor, licença e link de cada arquivo em `/public/models` —
auditoria de licença é chata depois e trivial se feita na hora.

---

## 7. Performance: orçamento revisado para desktop

**O alvo não é "desktop", é notebook corporativo com GPU integrada** (Intel Iris Xe / UHD) a
1080p. Essa é a máquina real do facilitador e do participante numa sala de treinamento — não
a workstation do dev. Celular saiu do escopo, mas isso afrouxa o orçamento, não o elimina.

| Métrica | Antes (incluía celular) | **Agora (desktop)** |
|---|---|---|
| Triângulos em tela | ≤ 150k | **≤ 500k** |
| Draw calls | ≤ 60 | **≤ 150** |
| Total de GLB baixado | ≤ 8 MB | **≤ 25 MB** |
| Texturas | KTX2, ≤ 1024² | **KTX2, ≤ 2048²** |
| Luzes com sombra | 1 direcional | **1 direcional + HDRI** (sombra suave liberada) |
| Postprocessing | nenhum | **`Outline` (fase B) + `N8AO` opcional** |
| Chunk JS do 3D | lazy | **lazy — inalterado** |

O que **não** muda com desktop: `<Instances>` para trabalhadores e perfis de torre continua
obrigatório (é o que mantém draw calls baixos, e GPU integrada sofre com draw calls antes de
sofrer com triângulos), e a torre continua procedural — 500k triângulos acabam rápido se cada
torre treliçada custar 200k.

Pipeline de asset (uma vez por modelo, versionado em script npm):

```bash
# 1. Blender: limpar, decimar, aplicar escala, nomear, exportar GLB
# 2. comprimir
npx @gltf-transform/cli optimize in.glb out.glb \
    --compress meshopt --texture-compress ktx2 --texture-size 1024
# 3. gerar componente tipado
npx gltfjsx out.glb --types --transform
```

Truques que mais rendem neste caso específico:
- `<Instances>` para trabalhadores e perfis de torre (dezenas de cópias, 1 draw call)
- `<Detailed>` (LOD) nas torres ao longo do corredor
- `<PerformanceMonitor>` continua valendo (GPU integrada varia muito entre máquinas);
  `<AdaptiveDpr>` fica **opcional** — era para celular
- `frameloop="demand"` **continua valendo**, e por dois motivos que sobrevivem ao desktop:
  notebook em bateria numa sala de treinamento, e o fato de que a cena fica literalmente
  parada a maior parte do tempo (o grupo está discutindo, não mexendo)
- **Postprocessing: revisado para desktop.** `Outline` passa a valer a pena na fase B — é a
  affordance de seleção do drag-and-drop (objeto sob o cursor / slot válido de destino), e
  substitui bem truques de troca de material. `N8AO` (ambient occlusion) é defensável porque
  **ajuda a ler a profundidade da treliça da torre**, que é geometria confusa sem oclusão.
  Bloom e depth-of-field continuam fora: custam caro e não comunicam nada neste domínio.

---

## 8. Riscos e como mitigar

| Risco | Mitigação |
|---|---|
| Esforço de arte vira o projeto inteiro | gray-box primeiro; 1 personagem + variações; torre procedural |
| ~~Celular dos participantes não aguenta~~ | **fora de escopo** — público-alvo é desktop |
| Notebook corporativo com GPU integrada engasga | orçamento §7 medido desde a fase 0; `<Instances>`; `frameloop="demand"`; LOD; testar em máquina sem GPU dedicada |
| Orçamento afrouxado vira desculpa para não otimizar | o teto de draw calls (≤150) é o que GPU integrada realmente sente; medir em PR, não no fim |
| 3D vira enfeite e não ensina nada | cada elemento visual **tem** que mapear uma regra de `calculations.ts`; se não mapeia, não entra |
| Duas formas de editar o mesmo estado = bugs | o 3D só dispara ações do `AppContext`; nunca escreve direto no Supabase |
| Fase C construída sem ter quem a use | não planejar agora — sem pontuação, é debriefing opcional (§2) |
| Bundle inicial degrada o app atual | `React.lazy` + `manualChunks`; medir com `vite build --report` |
| Licença de asset em material comercial | `docs/ASSETS.md` preenchido no momento do download |
| Wifi ruim no evento | assets e HDRI self-hospedados; `useGLTF.preload` na tela anterior |
| Testes Playwright quebrando por WebGL | lógica em funções puras; smoke test apenas |

---

## 9. Perguntas abertas (para decidir antes de codar)

1. **O 3D substitui ou acompanha a tabela de composição?** (recomendação: acompanha, em split
   view — §3.7; pendente de confirmação)
2. ~~**Qual o dispositivo-alvo real dos participantes?**~~ ✅ **Desktop.**
3. **Estilo visual:** low-poly estilizado (coerente, barato, CC0 abundante) ou realista
   (caro, pesado, e cobra consistência que CC0 não dá)? Recomendação forte: **low-poly estilizado**.
4. **O jogo é competitivo em tempo real** (grupos vendo o canteiro um do outro, aproveitando o
   `useRealtimeComps`) ou cada grupo isolado até o Ranking?
5. **A sessão tem tempo para isso?** Se a dinâmica de grupo dura 90 min, quanto é composição e
   quanto é exploração 3D? O 3D não pode roubar o tempo da discussão técnica — ele existe para
   qualificá-la.
6. ~~**Entra no Ranking?**~~ ✅ **Não entra.** `Ranking.tsx`, `calcSeg` e `calcNaoAplicPenalty`
   ficam intocados.

### Ainda em aberto, e agora mais fáceis de responder

7. **O canteiro é por atividade ou um canteiro único?** O split view favorece **por atividade**
   (acompanha a aba `aTab` que já existe), mas o corredor de LT inteiro (`lt.ext` km, derivado
   de `monthlyVolumes()`) é mais impressionante na plenária. Possível: aba por atividade na
   composição + visão geral do corredor no Cronograma.
8. **O canteiro é opcional por evento?** Como não pontua, dá para ligar/desligar por evento sem
   afetar a comparação entre grupos — útil para sessão curta. O padrão `segurancaAplicavel`
   (flag no evento, checada em `App.tsx`) é o molde pronto para isso.

---

## 10. O que as decisões de escopo mudaram

Registro do efeito das duas respostas, para não reabrir discussão já fechada.

### Público-alvo: desktop

| Área | Efeito |
|---|---|
| Layout | **Split view** (tabela + canteiro simultâneos, §3.7) — o maior ganho isolado das duas decisões |
| Fase B | **Destravada.** Mouse e hover eliminam o risco que a adiava |
| Orçamento | Afrouxado ~3× (§7), mas alvo passa a ser **notebook com GPU integrada**, não workstation |
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

### O que **não** mudou

Gray-box antes de arte; torre procedural; 16 cargos com 1 modelo rigado; camada pura
`buildCanteiro()`; `React.lazy` + `manualChunks`; assets self-hospedados (wifi de evento não
melhora por ser desktop); `docs/ASSETS.md` no momento do download; Rapier continua fora;
e a regra que vale mais que todas: **todo elemento visual mapeia uma regra de
`calculations.ts`, ou não entra.**
