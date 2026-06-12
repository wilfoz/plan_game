import { C } from "../../constants/colors";

interface ManualParticipanteProps {
  lang: "pt" | "es";
}

export default function ManualParticipante({ lang }: { lang: "pt" | "es" }) {
  const calloutStyle = {
    padding: "12px 16px",
    borderRadius: 6,
    marginBottom: 16,
    lineHeight: 1.5,
    fontSize: 12,
  };

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
    marginBottom: 16,
    fontSize: 11,
  };

  const thStyle = {
    background: C.surf2,
    borderBottom: `2px solid ${C.border}`,
    color: C.txt2,
    padding: "8px",
    textAlign: "left" as const,
    fontWeight: 700,
  };

  const tdStyle = {
    borderBottom: `1px solid ${C.border}`,
    padding: "8px",
    color: C.txt,
  };

  if (lang === "es") {
    return (
      <div style={{ fontSize: 13, lineHeight: 1.6, color: C.txt }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.gold, margin: "0 0 12px" }}>Manual del Participante — Jornadas LT</h1>
        <p style={{ color: C.txt2, marginBottom: 20, fontSize: 12 }}>Dinámica de Creación de Composiciones de Equipo</p>

        <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>1. ¿Qué es esta dinámica?</h2>
        <p>La <strong>Dinámica de Creación de Composiciones</strong> simula el proceso real de armado de una propuesta técnica para obras de <strong>Líneas de Transmisión Eléctrica (LT)</strong>. Los participantes, organizados en grupos, asumen el rol de ingenieros y gestores responsables de dimensionar equipos, seleccionar maquinaria y garantizar los requisitos de seguridad para la ejecución de una LT específica.</p>
        <p>Al final, las composiciones de todos los grupos se comparan en un <strong>ranking competitivo</strong> que evalúa costo, plazo y seguridad — los tres pilares de cualquier obra exitosa.</p>

        <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>2. Objetivo de la Aplicación</h2>
        <p>La aplicación <strong>Jornadas LT</strong> es la plataforma digital de la dinámica. En ella podrás:</p>
        <ul>
          <li>Armar la composición de mano de obra (MO) y equipos (EQ) para cada actividad de la LT.</li>
          <li>Estimar la productividad (KPI) de tus cuadrillas de trabajo.</li>
          <li>Seleccionar los requisitos de seguridad aplicables a cada frente de obra.</li>
          <li>Monitorear en tiempo real el costo y el plazo estimados de tu propuesta.</li>
          <li>Visualizar el ranking comparativo con todos los grupos al finalizar.</li>
        </ul>

        <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>3. Estructura de la Dinámica</h2>
        <p>La obra de la LT se ejecuta en <strong>dos fases secuenciales</strong>, sumando un total de <strong>7 actividades</strong>:</p>
        
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: "14px 0 8px", color: C.txt }}>Fase M — Montaje de Torres</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Actividad</th>
              <th style={thStyle}>Unidad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Premontaje de Torre</td>
              <td style={tdStyle}>TON (Toneladas)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Montaje Mecanizado</td>
              <td style={tdStyle}>TON (Toneladas)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Montaje Manual</td>
              <td style={tdStyle}>TON (Toneladas)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Revisión de Torre</td>
              <td style={tdStyle}>TON (Toneladas)</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ fontSize: 13, fontWeight: 700, margin: "14px 0 8px", color: C.txt }}>Fase L — Tendido de Conductores</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Actividad</th>
              <th style={thStyle}>Unidad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>Tendido de Cable Piloto</td>
              <td style={tdStyle}>KM (Kilómetros)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Tendido de Cable Conductor</td>
              <td style={tdStyle}>KM (Kilómetros)</td>
            </tr>
            <tr>
              <td style={tdStyle}>Engrapado de Cable Conductor</td>
              <td style={tdStyle}>TORRE (Unidades de Estructura)</td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>4. ¿Cómo Llenar la Composición?</h2>
        <p>Para cada una de las 7 actividades, el grupo debe completar cuatro secciones:</p>
        <p><strong>Mano de Obra (MO):</strong> Agrega los profesionales que componen el equipo para esta actividad (ej. Linieros, Montadores, Ayudantes). Define cantidad, jornada laboral diaria (Horas/Día) y el salario mensual de referencia.</p>
        <p><strong>Equipos (EQ):</strong> Agrega las máquinas necesarias (ej. Camión Grúa, Puller, Vehículos de Transporte). Define cantidad, horas de operación diurna y el costo de locación mensual.</p>
        <p><strong>Productividad y Frentes (KPI y Equipos):</strong></p>
        <ul>
          <li><strong>KPI:</strong> Rendimiento diario estimado por cuadrilla de trabajo (en unidades por día). *Sé realista: un KPI excesivo generará penalizaciones severas.*</li>
          <li><strong>Nº de Equipos:</strong> Cantidad de cuadrillas trabajando en paralelo. Más frentes reducen la duración total, pero incrementan los costos de movilización.</li>
        </ul>
        <p><strong>Requisitos de Seguridad:</strong> Selecciona los procedimientos, elementos de protección colectiva (EPC) y elementos de protección individual (EPI) obligatorios. *Presta atención: ¡esta sección es eliminatoria!*</p>

        <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>5. Sistema de Puntuación y Descalificación</h2>
        <p>La nota final de cada grupo se compone de dos puntajes clave con pesos del 50% cada uno:</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Indicador</th>
              <th style={thStyle}>Peso</th>
              <th style={thStyle}>Criterio de Cálculo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}><strong>Score de Costo (sC)</strong></td>
              <td style={tdStyle}>50%</td>
              <td style={tdStyle}>Se calcula como: <code>(Mejor costo del ranking / Costo de tu grupo) × 100</code></td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Score de Plazo (sD)</strong></td>
              <td style={tdStyle}>50%</td>
              <td style={tdStyle}>Se calcula como: <code>(Mejor plazo del ranking / Plazo de tu grupo) × 100</code></td>
            </tr>
            <tr>
              <td style={tdStyle}><strong>Seguridad 🦺</strong></td>
              <td style={tdStyle}>Classif.</td>
              <td style={tdStyle}><strong>Requisitos obligatorios completos:</strong> Sí → Apto para el ranking. No → Desclasificación.</td>
            </tr>
          </tbody>
        </table>

        <div style={{ ...calloutStyle, background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)", color: C.redL }}>
          <strong>🚨 Regla Crítica de Seguridad:</strong> Si el grupo deja de incluir tan solo un requisito de seguridad calificado como aplicable por el facilitador, quedará automáticamente <strong>desclasificado</strong> del ranking con puntaje cero.
        </div>

        <div style={{ ...calloutStyle, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.4)", color: C.yellow }}>
          <strong>⚠️ Penalizaciones Adicionales:</strong>
          <ul>
            <li><strong>Costo por Ítems Inadecuados:</strong> Cada requisito innecesario (marcado como "No Aplicable" en la realidad) que se incluya, agregará un <strong>+2% de costo de penalización</strong> al proyecto total.</li>
            <li><strong>Penalización por Plazo:</strong> Si el grupo reduce drásticamente la tripulación de MO sin justificar un rendimiento alto, el sistema aplicará un estatus de <strong>Riesgo (+20% de plazo/costo)</strong> o <strong>Peor Performance (+40% de plazo/costo)</strong>.</li>
          </ul>
        </div>

        <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>6. Preguntas Frecuentes</h2>
        <p><strong>¿Varios miembros pueden editar al mismo tiempo?</strong> Sí. El sistema es colaborativo en tiempo real. Los cambios realizados por un integrante se reflejan para los demás de manera inmediata.</p>
        <p><strong>¿Qué pasa si no completo todas las actividades?</strong> Las actividades sin configurar generarán costo y duración cero, lo cual causará incoherencias graves en el cálculo. Debes completar las 7 actividades.</p>
        <p><strong>¿Hay algún límite para el KPI?</strong> El sistema acepta cualquier valor, pero si excede el límite físico razonable de la cuadrilla (más de 200% de la referencia), recibirás alertas de inconsistencia física y penalizaciones técnicas de plazo en el cálculo final.</p>
      </div>
    );
  }

  return (
    <div style={{ fontSize: 13, lineHeight: 1.6, color: C.txt }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.gold, margin: "0 0 12px" }}>Manual do Participante — Jornadas LT</h1>
      <p style={{ color: C.txt2, marginBottom: 20, fontSize: 12 }}>Dinâmica de Criação de Composições de Equipe</p>

      <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>1. O que é esta dinâmica?</h2>
      <p>A <strong>Dinâmica de Criação de Composições</strong> simula o processo real de montagem de uma proposta técnica para obras de <strong>Linhas de Transmissão Elétrica (LT)</strong>. Os participantes, organizados em grupos, assumem o papel de engenheiros e gestores responsáveis por dimensionar equipes, selecionar equipamentos e garantir os requisitos de segurança para a execução de uma LT específica.</p>
      <p>Ao final, as composições de todos os grupos são comparadas em um <strong>ranking competitivo</strong> que avalia custo, prazo e segurança — os três pilares de qualquer obra bem-sucedida.</p>

      <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>2. Objetivo do App</h2>
      <p>O aplicativo <strong>Jornadas LT</strong> é a plataforma digital da dinâmica. Nele você vai:</p>
      <ul>
        <li>Montar a composição de mão de obra (MO) e equipamentos (EQ) para cada atividade da LT.</li>
        <li>Estimar a produtividade (KPI) das suas equipes.</li>
        <li>Selecionar os requisitos de segurança aplicáveis a cada frente de trabalho.</li>
        <li>Acompanhar em tempo real o custo e o prazo estimados da sua proposta.</li>
        <li>Visualizar o ranking comparativo com todos os grupos ao final.</li>
      </ul>

      <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>3. Estrutura da Dinâmica</h2>
      <p>A LT é executada em <strong>duas fases sequenciais</strong>, totalizando <strong>7 atividades</strong>:</p>
      
      <h3 style={{ fontSize: 13, fontWeight: 700, margin: "14px 0 8px", color: C.txt }}>Fase M — Montagem de Torres</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Atividade</th>
            <th style={thStyle}>Unidade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Pré Montagem de Torre</td>
            <td style={tdStyle}>TON (Toneladas)</td>
          </tr>
          <tr>
            <td style={tdStyle}>Montagem Mecanizada</td>
            <td style={tdStyle}>TON (Toneladas)</td>
          </tr>
          <tr>
            <td style={tdStyle}>Montagem Manual</td>
            <td style={tdStyle}>TON (Toneladas)</td>
          </tr>
          <tr>
            <td style={tdStyle}>Revisão de Torre</td>
            <td style={tdStyle}>TON (Toneladas)</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ fontSize: 13, fontWeight: 700, margin: "14px 0 8px", color: C.txt }}>Fase L — Lançamento de Cabos</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Atividade</th>
            <th style={thStyle}>Unidade</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}>Lançamento de Cabo Piloto</td>
            <td style={tdStyle}>KM (Quilômetros)</td>
          </tr>
          <tr>
            <td style={tdStyle}>Lançamento de Cabo Condutor</td>
            <td style={tdStyle}>KM (Quilômetros)</td>
          </tr>
          <tr>
            <td style={tdStyle}>Grampeação de Cabo Condutor</td>
            <td style={tdStyle}>TORRE (Estrutura)</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>4. Preenchendo a Composição</h2>
      <p>Para cada uma das 7 atividades, o grupo deve preencher quatro seções:</p>
      <p><strong>Mão de Obra (MO):</strong> Adicione os profissionais (ex. Montadores, Linheiros, Ajudantes). Defina quantidade, jornada diária de trabalho (Horas/Dia) e salário mensal.</p>
      <p><strong>Equipamentos (EQ):</strong> Adicione os maquinários (ex. Guindastes, Caminhões, Pullers). Defina quantidade, horas de operação e locação mensal.</p>
      <p><strong>Produtividade e Equipes (KPI e Equipes):</strong></p>
      <ul>
        <li><strong>KPI:</strong> Produção diária por equipe (em unidades/dia). *Seja realista — KPI excessivo será penalizado.*</li>
        <li><strong>Nº de Equipes:</strong> Quantas frentes de trabalho paralelas. Mais equipes reduzem o prazo, mas aumentam custo de mobilização.</li>
      </ul>
      <p><strong>Requisitos de Segurança:</strong> Marque os itens aplicáveis para evitar a desclassificação. *Cuidado: esta seção é o coração eliminatório do jogo!*</p>

      <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>5. Sistema de Pontuação e Desclassificação</h2>
      <p>A nota final do grupo é formada por dois scores de peso 50% cada:</p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Score</th>
            <th style={thStyle}>Peso</th>
            <th style={thStyle}>Como é calculado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={tdStyle}><strong>Score de Custo (sC)</strong></td>
            <td style={tdStyle}>50%</td>
            <td style={tdStyle}>Calculado como: <code>(Melhor custo do ranking ÷ custo do grupo) × 100</code></td>
          </tr>
          <tr>
            <td style={tdStyle}><strong>Score de Prazo (sD)</strong></td>
            <td style={tdStyle}>50%</td>
            <td style={tdStyle}>Calculado como: <code>(Melhor prazo do ranking ÷ prazo do grupo) × 100</code></td>
          </tr>
          <tr>
            <td style={tdStyle}><strong>Segurança 🦺</strong></td>
            <td style={tdStyle}>classif.</td>
            <td style={tdStyle}>Todos os requisitos aplicáveis incluídos? Sim → elegível. Não → desclassificado.</td>
          </tr>
        </tbody>
      </table>

      <div style={{ ...calloutStyle, background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)", color: C.redL }}>
        <strong>🚨 Desclassificação por Segurança:</strong> Se o grupo deixar de incluir qualquer requisito aplicável — mesmo que seja apenas um item —, é automaticamente <strong>desclassificado</strong> e recebe nota zero no ranking.
      </div>

      <div style={{ ...calloutStyle, background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.4)", color: C.yellow }}>
        <strong>⚠️ Penalizações e Acréscimos:</strong>
        <ul>
          <li><strong>Penalização de Segurança (Itens Não Aplicáveis):</strong> Cada requisito marcado indevidamente (armadilhas de não-aplicáveis) gera +2% de acréscimo de custo do projeto.</li>
          <li><strong>Penalização de Prazo:</strong> Equipes sub-dimensionadas ou com pouca MO em relação ao KPI levam status de <strong>Risco (+20% na duração/custo)</strong> ou <strong>Pior (+40% na duração/custo)</strong>.</li>
        </ul>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, borderBottom: `1px solid ${C.border}`, paddingBottom: 6, margin: "24px 0 12px", color: C.goldL }}>6. Perguntas Frequentes</h2>
      <p><strong>Vários membros podem preencher ao mesmo tempo?</strong> Sim. O sistema é colaborativo em tempo real. As alterações de um membro aparecem na hora para os demais.</p>
      <p><strong>O que acontece se não preencher todas as atividades?</strong> Atividades vazias resultam em custo/prazo zero, distorcendo o cálculo do projeto e gerando inconsistências. É obrigatório configurar as 7 atividades.</p>
      <p><strong>O KPI tem algum limite?</strong> O sistema aceita qualquer número, mas KPIs acima da coerência da equipe (mais de 200% da referência) serão alertados na interface e penalizados no prazo e custo do ranking final.</p>
    </div>
  );
}
