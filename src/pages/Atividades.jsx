import { C } from "../constants/colors";
import { S } from "../styles";
import { ATIVS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { LocalNumInp, LocalTextInp } from "../components/ui/Inputs";

export default function Atividades() {
  const {
    kpisBase, setKpisBase, volumesPrev, setVolumesPrev,
    comentariosAtiv, setComentariosAtiv, mesIniciaBase, setMesIniciaBase,
    calcA, duracaoSomada, escAutoMap,
  } = useApp();

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
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 10, color: C.txt3, fontWeight: 600, letterSpacing: 1 }}>DURAÇÃO BASE (equipe referência)</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: duracaoTotal > 0 ? C.gold : C.txt3, lineHeight: 1 }}>
            {duracaoTotal > 0 ? duracaoTotal : "—"}
          </span>
          {duracaoTotal > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: C.txt2 }}>MESES</span>}
          {!duracaoSomada && mesMin != null && (
            <span style={{ fontSize: 10, color: C.txt3, marginLeft: 8 }}>— mês {mesMin} ao mês {mesFimMax}</span>
          )}
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5 }}>
                      {escAutoMap[a.id] > 0 && volumesPrev[a.id] === escAutoMap[a.id] && (
                        <span title="Valor derivado automaticamente da configuração da LT" style={{
                          fontSize: 8, fontWeight: 700, letterSpacing: 1,
                          color: C.goldL, background: C.goldL + "18",
                          border: `1px solid ${C.goldL}44`, borderRadius: 3, padding: "1px 5px",
                        }}>↗ LT</span>
                      )}
                      <LocalNumInp
                        v={volumesPrev[a.id] || ""}
                        onSave={v => setVolumesPrev(p => ({ ...p, [a.id]: +v || 0 }))}
                        w={100}
                      />
                    </div>
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
