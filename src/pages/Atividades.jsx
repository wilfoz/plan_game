import { C } from "../constants/colors";
import { S } from "../styles";
import { ATIVS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { LocalNumInp, LocalTextInp } from "../components/ui/Inputs";

export default function Atividades() {
  const { kpisBase, setKpisBase, volumesPrev, setVolumesPrev, comentariosAtiv, setComentariosAtiv, mesIniciaBase, setMesIniciaBase, calcA, duracaoSomada, setDuracaoSomada } = useApp();

  const ativDurs = ATIVS.map(a => {
    const comp = { kpi: kpisBase[a.id] || 0, equipes: 1, moRows: [], eqRows: [] };
    return { id: a.id, dur: calcA(comp, volumesPrev[a.id] || 0).dur, mes: mesIniciaBase[a.id] || 0 };
  });

  const validos = ativDurs.filter(x => x.dur > 0 && x.mes > 0);
  const mesMin = validos.length ? Math.min(...validos.map(x => x.mes)) : null;
  const mesFimMax = validos.length ? Math.max(...validos.map(x => x.mes + Math.ceil(x.dur) - 1)) : null;

  const duracaoTotal = (() => {
    if (duracaoSomada) return Math.round(ativDurs.reduce((s, x) => s + x.dur, 0) * 100) / 100;
    if (!validos.length) return 0;
    return mesFimMax - mesMin + 1;
  })();

  return (
    <div style={S.pg}>
      <Card>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.txt2, letterSpacing: 1 }}>MODO DURAÇÃO</span>
            <div
              onClick={() => setDuracaoSomada(v => !v)}
              title={duracaoSomada ? "Soma de todas as durações" : "Período: início da 1ª até fim da última atividade"}
              style={{
                width: 38, height: 20, borderRadius: 10, cursor: "pointer",
                background: duracaoSomada ? C.gold : C.border2,
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 2, left: duracaoSomada ? 20 : 2,
                width: 16, height: 16, borderRadius: "50%", background: "#FFF",
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
              }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: duracaoSomada ? C.goldL : C.txt2 }}>
              {duracaoSomada ? "SOMA DAS ATIVIDADES" : "PERÍODO (INÍCIO → FIM)"}
            </span>
            {!duracaoSomada && mesMin != null && (
              <span style={{ fontSize: 10, color: C.txt3 }}>
                — mês {mesMin} ao mês {mesFimMax}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 10, color: C.txt3, fontWeight: 600, letterSpacing: 1 }}>DURAÇÃO TOTAL</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: duracaoTotal > 0 ? C.gold : C.txt3, lineHeight: 1 }}>
              {duracaoTotal > 0 ? duracaoTotal : "—"}
            </span>
            {duracaoTotal > 0 && (
              <span style={{ fontSize: 10, fontWeight: 600, color: C.txt2 }}>MESES</span>
            )}
          </div>
        </div>
      </Card>

      {[["M", C.blueL, "🏗️ MONTAGEM"], ["L", C.greenL, "🔌 LANÇAMENTO"]].map(([grp, col, label]) => (
        <Card key={grp}>
          <Hdr2 col={col} ch={label} />
          <table style={S.tbl}>
            <thead><tr>
              <TH ch="ATIVIDADE" w={290} /><TH ch="UND" right w={60} />
              <TH ch="VOLUME PREVISTO" right w={130} accent />
              <TH ch="KPI BASE (un/dia/equipe)" right w={150} />
              <TH ch="MÊS INICIA" right w={100} />
              <TH ch="COMENTÁRIO" w={200} />
            </tr></thead>
            <tbody>
              {ATIVS.filter(a => a.grp === grp).map((a, i) => (
                <tr key={a.id} style={S.trOff(i)}>
                  <TD ch={a.desc} />
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    <Tag text={a.und} col={col} />
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    <LocalNumInp
                      v={volumesPrev[a.id] || ""}
                      onSave={v => setVolumesPrev(p => ({ ...p, [a.id]: +v || 0 }))}
                      w={100}
                    />
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    <LocalNumInp
                      v={kpisBase[a.id] || ""}
                      onSave={v => setKpisBase(p => ({ ...p, [a.id]: +v || 0 }))}
                      w={90}
                    />
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    <LocalNumInp
                      v={mesIniciaBase[a.id] || ""}
                      onSave={v => setMesIniciaBase(p => ({ ...p, [a.id]: +v || 0 }))}
                      w={70}
                    />
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <LocalTextInp
                      v={comentariosAtiv[a.id] || ""}
                      onSave={v => setComentariosAtiv(p => ({ ...p, [a.id]: v }))}
                      placeholder="Observação..."
                      w="100%"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
