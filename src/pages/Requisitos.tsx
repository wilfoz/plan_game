import { useTranslation } from "react-i18next";
import { C } from "../constants/colors";
import { S } from "../styles";
import { ATIVS, REQ_CATEGORIAS, REQ_CAT_COLORS, REQ_TRANSLATIONS, CAT_TRANSLATIONS } from "../constants/catalogs";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { BtnDel } from "../components/ui/Card";
import { Hdr2, Tag } from "../components/ui/Typography";
import { TH } from "../components/ui/Table";
import { LocalTextInp } from "../components/ui/Inputs";

const selStyle = (col?: string): React.CSSProperties => ({
  width: "100%", background: col ? col + "18" : C.surf3,
  border: `1px solid ${col ? col + "55" : C.border2}`,
  borderRadius: 3, color: col || C.txt,
  padding: "4px 6px", fontSize: 10, fontWeight: 700,
  fontFamily: "inherit", cursor: "pointer", outline: "none"
});

export default function Requisitos() {
  const { t } = useTranslation();
  const { requisitos, addRequisito, delRequisito, updRequisito, resetRequisitosToDefault, lang } = useApp();
  
  const currentLang = (lang === "es" ? "es" : "pt") as "pt" | "es";

  const totalReqs = requisitos.length;
  const aplicaveis = requisitos.filter(r => r.aplicavel !== false).length;
  const naoAplicaveis = requisitos.filter(r => r.aplicavel === false).length;

  const handlePadronizar = () => {
    if (window.confirm(t("requirements.resetConfirm"))) {
      resetRequisitosToDefault();
    }
  };

  return (
    <div style={S.pg}>
      {/* Resumo topo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          [t("requirements.summary.total"), totalReqs, C.gold],
          [t("requirements.summary.applicable"), aplicaveis, C.greenL],
          [t("requirements.summary.notApplicable"), naoAplicaveis, C.yellow],
        ].map(([l, v, col]) => (
          <div key={l as string} style={{ ...S.stat, borderColor: (col as string) + "44" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: col as string }}>{v}</div>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 1 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <button
          style={{ ...S.btnS, background: C.yellow + "22", borderColor: C.yellow + "66", color: C.yellow }}
          onClick={handlePadronizar}
          title={t("requirements.reset")}
        >
          {t("requirements.resetButton")}
        </button>
      </div>

      {[
        ["M", C.blueL, t("activities.groups.M")],
        ["L", C.greenL, t("activities.groups.L")]
      ].map(([grp, col, label]) => (
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.txt }}>{a.desc[currentLang]}</span>
                    <span style={{ marginLeft: 8 }}><Tag text={a.und[currentLang]} col={col} /></span>
                    {reqsA.length > 0 && (
                      <span style={{ marginLeft: 8 }}>
                        <Tag 
                          text={t("requirements.tagApplicable", { count: reqsA.filter(r => r.aplicavel !== false).length })} 
                          col={C.greenL} 
                        />
                      </span>
                    )}
                    {reqsA.some(r => r.aplicavel === false) && (
                      <span style={{ marginLeft: 4 }}>
                        <Tag 
                          text={t("requirements.tagNotApplicable", { count: reqsA.filter(r => r.aplicavel === false).length })} 
                          col={C.yellow} 
                        />
                      </span>
                    )}
                  </div>
                  <button style={S.btnS} onClick={() => addRequisito(a.id)}>
                    {t("requirements.addReqButton")}
                  </button>
                </div>

                {reqsA.length > 0 && (
                  <div style={{ padding: "0 14px 10px" }}>
                    <table style={{ ...S.tbl, marginTop: 6 }}>
                      <thead><tr>
                        <TH ch={t("requirements.cols.category")} w={140} />
                        <TH ch={t("requirements.cols.desc")} />
                        <TH ch={t("requirements.cols.applicable")} right w={160} accent />
                        <TH ch="" w={30} />
                      </tr></thead>
                      <tbody>
                        {reqsA.map((req, i) => {
                          const isAplic = req.aplicavel !== false;
                          const aplCol = isAplic ? C.greenL : C.yellow;
                          const displayDesc = currentLang === "es" ? (REQ_TRANSLATIONS[req.desc] || req.desc) : req.desc;
                          return (
                            <tr key={req._id} style={S.trOff(i)}>
                              <td style={{ padding: "5px 8px" }}>
                                <select
                                  value={req.categoria}
                                  onChange={e => updRequisito(req._id, "categoria", e.target.value)}
                                  style={selStyle(REQ_CAT_COLORS[req.categoria])}
                                >
                                  {REQ_CATEGORIAS.map(cat => (
                                    <option key={cat} value={cat}>
                                      {currentLang === "es" ? (CAT_TRANSLATIONS[cat] || cat) : cat}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: "4px 8px" }}>
                                <LocalTextInp
                                  v={displayDesc}
                                  onSave={v => updRequisito(req._id, "desc", v)}
                                  placeholder={t("requirements.placeholderDesc")}
                                />
                              </td>
                              <td style={{ padding: "4px 8px" }}>
                                <select
                                  value={isAplic ? "true" : "false"}
                                  onChange={e => updRequisito(req._id, "aplicavel", e.target.value === "true")}
                                  style={selStyle(aplCol)}
                                >
                                  <option value="true">{t("requirements.applicableShort")}</option>
                                  <option value="false">{t("requirements.notApplicableShort")}</option>
                                </select>
                              </td>
                              <td style={{ padding: "3px 6px", textAlign: "center" }}>
                                <BtnDel onClick={() => delRequisito(req._id)} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {reqsA.length === 0 && (
                  <div style={{ padding: "8px 14px", fontSize: 10, color: C.txt3, fontStyle: "italic" }}>
                    {t("requirements.emptyActivity")}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      ))}
    </div>
  );
}
