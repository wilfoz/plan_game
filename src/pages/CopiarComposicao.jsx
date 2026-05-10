import { useState } from "react";
import { C } from "../constants/colors";
import { S } from "../styles";
import { ATIVS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { supabase } from "../lib/supabase";

export default function CopiarComposicao() {
  const { copyOptions, setCopyOptions, updateComp, gIdx, grupos, setScreen } = useApp();
  const [copiando, setCopiando] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [erro, setErro] = useState("");

  const grupoId = grupos[gIdx]?.id;

  const pular = () => {
    setCopyOptions(null);
    setScreen("composicao");
  };

  const copiar = async (opt) => {
    if (copiando) return;
    setSelecionado(opt.session_id);
    setCopiando(true);
    setErro("");

    try {
      const { data: sourceComps, error } = await supabase
        .from("grupo_comps")
        .select("atividade_id, mo_rows, eq_rows, kpi, equipes")
        .eq("grupo_id", opt.grupo_id);

      if (error) throw error;

      const valid = (sourceComps ?? []).filter(row => {
        const hasMo = (row.mo_rows ?? []).length > 0;
        const hasEq = (row.eq_rows ?? []).length > 0;
        return (hasMo || hasEq) && ATIVS.find(a => a.id === row.atividade_id);
      });

      for (const row of valid) {
        updateComp(gIdx, row.atividade_id, (cur) => ({
          ...cur,
          moRows:  row.mo_rows  ?? [],
          eqRows:  row.eq_rows  ?? [],
          kpi:     row.kpi      ?? cur.kpi,
          equipes: row.equipes  ?? cur.equipes,
        }));
      }

      setCopyOptions(null);
      setScreen("composicao");
    } catch {
      setErro("Falha ao copiar as composições. Tente novamente.");
      setCopiando(false);
      setSelecionado(null);
    }
  };

  // Aguarda grupos do Supabase carregarem (necessário para updateComp funcionar)
  if (!grupoId) {
    return (
      <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ fontSize: 11, color: C.txt3, letterSpacing: 2 }}>CARREGANDO...</div>
      </div>
    );
  }

  if (!copyOptions?.length) {
    pular();
    return null;
  }

  return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 520, padding: "0 20px" }}>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: 4 }}>
            COMPOSIÇÃO ANTERIOR ENCONTRADA
          </h2>
          <p style={{ margin: "10px 0 0", fontSize: 11, color: C.txt3, lineHeight: 1.7 }}>
            Encontramos mão de obra e equipamentos cadastrados por você em outra sessão.<br />
            Deseja aproveitar essa composição como ponto de partida?
          </p>
        </div>

        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "24px 24px 20px"
        }}>
          <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>
            SELECIONE A SESSÃO DE ORIGEM
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {copyOptions.map((opt) => {
              const ativo = selecionado === opt.session_id && copiando;
              return (
                <button
                  key={opt.session_id}
                  onClick={() => copiar(opt)}
                  disabled={copiando}
                  style={{
                    padding: "14px 16px", borderRadius: 6,
                    cursor: copiando ? "not-allowed" : "pointer",
                    background: selecionado === opt.session_id ? C.gold + "18" : C.surf2,
                    border: `2px solid ${selecionado === opt.session_id ? C.gold : C.border}`,
                    color: C.txt, fontSize: 13, fontWeight: 600,
                    fontFamily: "inherit", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    opacity: copiando && selecionado !== opt.session_id ? 0.45 : 1,
                    transition: "border-color 0.15s, opacity 0.15s",
                  }}
                  onMouseEnter={e => { if (!copiando) e.currentTarget.style.borderColor = C.gold; }}
                  onMouseLeave={e => { if (!copiando && selecionado !== opt.session_id) e.currentTarget.style.borderColor = C.border; }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.txt }}>{opt.session_nome}</div>
                    <div style={{ fontSize: 10, color: C.txt3, marginTop: 2 }}>
                      Copia mão de obra, equipamentos e KPI
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    color: ativo ? C.goldL : C.gold, whiteSpace: "nowrap", marginLeft: 12
                  }}>
                    {ativo ? "COPIANDO..." : "USAR ESTA →"}
                  </span>
                </button>
              );
            })}
          </div>

          {erro && (
            <div style={{
              marginBottom: 14, padding: "8px 12px", borderRadius: 5,
              background: C.redL + "12", border: `1px solid ${C.redL}44`,
              fontSize: 11, color: C.redL
            }}>
              {erro}
            </div>
          )}

          <button
            onClick={pular}
            disabled={copiando}
            style={{
              width: "100%", padding: "10px",
              background: "transparent", border: `1px solid ${C.border}`,
              borderRadius: 6, color: copiando ? C.txt3 : C.txt2,
              fontSize: 11, fontWeight: 600, letterSpacing: 1,
              cursor: copiando ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            COMEÇAR DO ZERO
          </button>
        </div>
      </div>
    </div>
  );
}
