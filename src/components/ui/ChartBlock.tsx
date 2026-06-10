import React from "react";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const SERIES_COLORS = ["#3B82F6", "#94A3B8", "#F59E0B", "#10B981", "#EF4444", "#A78BFA"];

const darkTooltip = {
  contentStyle: {
    background: "#0A1628", border: "1px solid #1E3A5F",
    borderRadius: 5, fontSize: 10, color: "#CBD5E1"
  },
  labelStyle: { color: "#94A3B8", fontSize: 9 },
  cursor: { fill: "#FFFFFF08" },
};

interface BarComparativoProps {
  titulo: string;
  categorias: string[];
  series: Array<{ nome: string; valores: number[] }>;
  unidade?: string;
}

function BarComparativo({ titulo, categorias, series, unidade }: BarComparativoProps) {
  const data = categorias.map((cat, i) => {
    const entry: Record<string, any> = { cat: cat.length > 12 ? cat.slice(0, 12) + "…" : cat };
    series.forEach(s => { entry[s.nome] = +(s.valores[i] ?? 0).toFixed(2); });
    return entry;
  });

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: 1 }}>
        {titulo}
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} barGap={3} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize: 8.5, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 8.5, fill: "#64748B" }} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}${unidade ? " " + unidade : ""}`} width={60} />
          <Tooltip {...darkTooltip} formatter={(v: any, name: any) => [`${v} ${unidade ?? ""}`, name]} />
          <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
          {series.map((s, i) => (
            <Bar key={s.nome} dataKey={s.nome} fill={SERIES_COLORS[i] ?? "#888"}
              radius={[3, 3, 0, 0]} maxBarSize={32} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface RadarPerformanceProps {
  titulo: string;
  categorias: string[];
  series: Array<{ nome: string; valores: number[] }>;
}

function RadarPerformance({ titulo, categorias, series }: RadarPerformanceProps) {
  const data = categorias.map((cat, i) => {
    const entry: Record<string, any> = { dim: cat };
    series.forEach(s => { entry[s.nome] = Math.max(0, Math.min(100, +(s.valores[i] ?? 0))); });
    return entry;
  });

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: 1 }}>
        {titulo}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius={80}>
          <PolarGrid stroke="#1E3A5F" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: "#94A3B8" }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8, fill: "#475569" }}
            tickCount={4} axisLine={false} />
          <Tooltip {...darkTooltip} formatter={(v: any, name: any) => [`${v}%`, name]} />
          <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
          {series.map((s, i) => (
            <Radar key={s.nome} name={s.nome} dataKey={s.nome}
              stroke={SERIES_COLORS[i] ?? "#888"} fill={SERIES_COLORS[i] ?? "#888"}
              fillOpacity={i === 0 ? 0.25 : 0.08} strokeWidth={i === 0 ? 2 : 1}
              strokeDasharray={i > 0 ? "4 2" : undefined} />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BarCustoAtividadeProps {
  titulo: string;
  categorias: string[];
  series: Array<{ nome: string; valores: number[] }>;
}

function BarCustoAtividade({ titulo, categorias, series }: BarCustoAtividadeProps) {
  const MO_COLOR = "#3B82F6";
  const EQ_COLOR = "#F59E0B";
  const data = categorias.map((cat, i) => {
    const entry: Record<string, any> = { cat: cat.length > 12 ? cat.slice(0, 12) + "…" : cat };
    series.forEach(s => { entry[s.nome] = +(s.valores[i] ?? 0); });
    return entry;
  });
  const fmtVal = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 8, letterSpacing: 1 }}>
        {titulo}
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} barGap={2} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" vertical={false} />
          <XAxis dataKey="cat" tick={{ fontSize: 8.5, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 8.5, fill: "#64748B" }} axisLine={false} tickLine={false}
            tickFormatter={fmtVal} width={48} />
          <Tooltip {...darkTooltip}
            formatter={(v: any, name: any) => [`R$ ${Math.round(v).toLocaleString("pt-BR")}`, name]} />
          <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
          {series.map((s, i) => (
            <Bar key={s.nome} dataKey={s.nome} stackId="cost"
              fill={i === 0 ? MO_COLOR : EQ_COLOR}
              radius={i === series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={40} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface ChartInput {
  tipo: "barras_comparativas" | "radar_performance" | "barras_custo_atividade";
  titulo: string;
  categorias: string[];
  series: Array<{ nome: string; valores: number[] }>;
  unidade?: string;
}

interface ChartBlockProps {
  input: ChartInput;
}

// Renderiza um bloco de gráfico a partir do input da tool `renderizar_grafico`
export function ChartBlock({ input }: ChartBlockProps) {
  const { tipo, titulo, categorias, series, unidade } = input ?? {};
  if (!tipo || !categorias?.length || !series?.length) return null;

  return (
    <div style={{
      padding: "12px 14px", borderRadius: 5,
      background: "#0A1628", border: "1px solid #1E3A5F",
      marginBottom: 8
    }}>
      {tipo === "barras_comparativas" && (
        <BarComparativo titulo={titulo} categorias={categorias} series={series} unidade={unidade} />
      )}
      {tipo === "radar_performance" && (
        <RadarPerformance titulo={titulo} categorias={categorias} series={series} />
      )}
      {tipo === "barras_custo_atividade" && (
        <BarCustoAtividade titulo={titulo} categorias={categorias} series={series} />
      )}
    </div>
  );
}
