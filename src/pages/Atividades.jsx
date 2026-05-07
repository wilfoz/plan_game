import { C } from "../constants/colors";
import { S } from "../styles";
import { ATIVS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { NumInp, TextInp } from "../components/ui/Inputs";

export default function Atividades() {
  const { kpisBase, setKpisBase, volumesPrev, setVolumesPrev, comentariosAtiv, setComentariosAtiv } = useApp();
  return (
    <div style={S.pg}>
      {[["M", C.blueL, "🏗️ MONTAGEM"], ["L", C.greenL, "🔌 LANÇAMENTO"]].map(([grp, col, label]) => (
        <Card key={grp}>
          <Hdr2 col={col} ch={label} />
          <table style={S.tbl}>
            <thead><tr>
              <TH ch="ATIVIDADE" w={320} /><TH ch="UND" right w={60} />
              <TH ch="VOLUME PREVISTO" right w={130} accent />
              <TH ch="KPI BASE (un/dia/equipe)" right w={150} />
              <TH ch="COMENTÁRIO" w={220} />
            </tr></thead>
            <tbody>
              {ATIVS.filter(a => a.grp === grp).map((a, i) => (
                <tr key={a.id} style={S.trOff(i)}>
                  <TD ch={a.desc} />
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    <Tag text={a.und} col={col} />
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    <NumInp
                      v={volumesPrev[a.id] || ""}
                      onChange={e => setVolumesPrev(p => ({ ...p, [a.id]: +e.target.value || 0 }))}
                      w={100}
                    />
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    <NumInp
                      v={kpisBase[a.id] || ""}
                      onChange={e => setKpisBase(p => ({ ...p, [a.id]: +e.target.value || 0 }))}
                      w={90}
                    />
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <TextInp
                      v={comentariosAtiv[a.id] || ""}
                      onChange={e => setComentariosAtiv(p => ({ ...p, [a.id]: e.target.value }))}
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
