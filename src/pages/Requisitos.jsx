import { C } from "../constants/colors";
import { S } from "../styles";
import { ATIVS, REQ_CATEGORIAS, REQ_TEMPOS, REQ_CAT_COLORS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { BtnDel } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH } from "../components/ui/Table";
import { TextInp, NumInp } from "../components/ui/Inputs";

export default function Requisitos() {
  const { requisitos, addRequisito, delRequisito, updRequisito } = useApp();
  const totalReqs = requisitos.length;
  const catCount = REQ_CATEGORIAS.map(cat => ({ cat, count: requisitos.filter(r => r.categoria === cat).length }));

  return (
    <div style={S.pg}>
      {/* Resumo por categoria */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 14 }}>
        {catCount.map(({ cat, count }) => (
          <div key={cat} style={{ ...S.stat, borderColor: (REQ_CAT_COLORS[cat] || C.border) + "44" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: REQ_CAT_COLORS[cat] || C.txt }}>{count}</div>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 1 }}>{cat.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Lista por grupo de atividades */}
      {[["M", C.blueL, "🏗️ MONTAGEM"], ["L", C.greenL, "🔌 LANÇAMENTO"]].map(([grp, col, label]) => (
        <Card key={grp}>
          <Hdr2 col={col} ch={label} />
          {ATIVS.filter(a => a.grp === grp).map(a => {
            const reqsA = requisitos.filter(r => r.aId === a.id);
            return (
              <div key={a.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", background: C.surf2 + "66"
                }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>{a.desc}</span>
                    <span style={{ marginLeft: 8 }}><Tag text={a.und} col={col} /></span>
                    {reqsA.length > 0 && (
                      <span style={{ marginLeft: 8 }}><Tag text={`${reqsA.length} req.`} col={C.gold} /></span>
                    )}
                  </div>
                  <button style={S.btnS} onClick={() => addRequisito(a.id)}>+ REQUISITO</button>
                </div>

                {reqsA.length > 0 && (
                  <div style={{ padding: "0 14px 10px" }}>
                    <table style={{ ...S.tbl, marginTop: 6 }}>
                      <thead><tr>
                        <TH ch="CATEGORIA" w={130} />
                        <TH ch="DESCRIÇÃO DO REQUISITO" />
                        <TH ch="TEMPO IMPL." right w={110} />
                        <TH ch="SCORE" right w={70} />
                        <TH ch="" w={30} />
                      </tr></thead>
                      <tbody>
                        {reqsA.map((req, i) => (
                          <tr key={req._id} style={S.trOff(i)}>
                            <td style={{ padding: "5px 8px" }}>
                              <select value={req.categoria}
                                onChange={e => updRequisito(req._id, "categoria", e.target.value)}
                                style={{
                                  width: "100%",
                                  background: (REQ_CAT_COLORS[req.categoria] || C.border) + "18",
                                  border: `1px solid ${(REQ_CAT_COLORS[req.categoria] || C.border) + "55"}`,
                                  borderRadius: 3, color: REQ_CAT_COLORS[req.categoria] || C.txt,
                                  padding: "4px 6px", fontSize: 10, fontWeight: 700, fontFamily: "inherit", cursor: "pointer"
                                }}>
                                {REQ_CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: "4px 8px" }}>
                              <TextInp v={req.desc}
                                onChange={e => updRequisito(req._id, "desc", e.target.value)}
                                placeholder="Descreva o requisito..." />
                            </td>
                            <td style={{ padding: "4px 8px" }}>
                              <select value={req.tempo}
                                onChange={e => updRequisito(req._id, "tempo", +e.target.value)}
                                style={{
                                  width: "100%", background: C.surf3, border: `1px solid ${C.border2}`,
                                  borderRadius: 3, color: C.txt, padding: "4px 6px", fontSize: 10,
                                  fontFamily: "inherit", textAlign: "right", cursor: "pointer"
                                }}>
                                {REQ_TEMPOS.map(t => <option key={t} value={t}>{t} min</option>)}
                              </select>
                            </td>
                            <td style={{ padding: "4px 8px" }}>
                              <NumInp v={req.score} onChange={e => {
                                let val = +e.target.value;
                                if (val < 1) val = 1;
                                if (val > 100) val = 100;
                                updRequisito(req._id, "score", val);
                              }} w={55} />
                            </td>
                            <td style={{ padding: "3px 6px", textAlign: "center" }}>
                              <BtnDel onClick={() => delRequisito(req._id)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{
                      display: "flex", gap: 14, marginTop: 6, padding: "6px 10px",
                      background: col + "0A", borderRadius: 4, border: `1px solid ${col}22`, fontSize: 10
                    }}>
                      <span style={{ color: C.txt2 }}>⏱️ Tempo total: <strong style={{ color: col }}>
                        {reqsA.reduce((s, r) => s + (r.tempo || 0), 0)} min/un
                      </strong></span>
                      <span style={{ color: C.txt2 }}>🎯 Score máximo: <strong style={{ color: C.gold }}>
                        {reqsA.reduce((s, r) => s + (r.score || 0), 0)} pts
                      </strong></span>
                      <span style={{ color: C.txt2 }}>📋 Categorias: {[...new Set(reqsA.map(r => r.categoria))].map(cat => (
                        <Tag key={cat} text={cat} col={REQ_CAT_COLORS[cat]} />
                      ))}</span>
                    </div>
                  </div>
                )}

                {reqsA.length === 0 && (
                  <div style={{ padding: "8px 14px", fontSize: 10, color: C.txt3, fontStyle: "italic" }}>
                    Nenhum requisito cadastrado para esta atividade.
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      ))}

      {/* Resumo geral */}
      <Card>
        <Hdr2 ch={`📊 RESUMO — ${totalReqs} REQUISITOS CADASTRADOS`} />
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["M", C.blueL, "🏗️ MONTAGEM"], ["L", C.greenL, "🔌 LANÇAMENTO"]].map(([grp, col, label]) => {
              const reqsGrp = requisitos.filter(r => {
                const atv = ATIVS.find(a => a.id === r.aId);
                return atv && atv.grp === grp;
              });
              return (
                <div key={grp}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: col, letterSpacing: 2, marginBottom: 6 }}>{label}</div>
                  {ATIVS.filter(a => a.grp === grp).map(a => {
                    const cnt = requisitos.filter(r => r.aId === a.id).length;
                    if (!cnt) return null;
                    const tempoTotal = requisitos.filter(r => r.aId === a.id).reduce((s, r) => s + (r.tempo || 0), 0);
                    return (
                      <div key={a.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "4px 0", borderBottom: `1px solid ${C.border}`, fontSize: 10
                      }}>
                        <span style={{ color: C.txt2 }}>{a.desc.slice(0, 36)}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Tag text={`${cnt} req.`} col={col} />
                          <Tag text={`${tempoTotal} min`} col={C.gold} />
                        </div>
                      </div>
                    );
                  })}
                  {reqsGrp.length === 0 && (
                    <div style={{ fontSize: 10, color: C.txt3, fontStyle: "italic" }}>Nenhum requisito neste grupo.</div>
                  )}
                </div>
              );
            })}
          </div>
          {totalReqs === 0 && (
            <div style={{ textAlign: "center", padding: 20, color: C.txt3, fontSize: 12 }}>
              🛡️ Nenhum requisito de segurança cadastrado. Use o botão "+ REQUISITO" em cada atividade acima para começar.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
