import { useTranslation } from "react-i18next";
import { C } from "../constants/colors";
import { S } from "../styles";
import { fmtI } from "../utils/formatters";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2, Pill } from "../components/ui/Typography";
import { LocalNumInp, LocalTextInp } from "../components/ui/Inputs";

interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  label: string;
  labelOn: string;
  labelOff: string;
}

function Toggle({ on, onToggle, label, labelOn, labelOff }: ToggleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.txt2, letterSpacing: 1, minWidth: 140 }}>{label}</span>
      <div
        onClick={onToggle}
        style={{
          width: 38, height: 20, borderRadius: 10, cursor: "pointer",
          background: on ? C.gold : C.border2,
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: on ? 20 : 2,
          width: 16, height: 16, borderRadius: "50%", background: "#FFF",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: on ? C.goldL : C.txt2 }}>
        {on ? labelOn : labelOff}
      </span>
    </div>
  );
}

export default function Engenharia() {
  const { t, i18n } = useTranslation();
  const { lt, uLt, fator, totalCabos, extCondutor, extParaRaios, duracaoSomada, setDuracaoSomada, travaEquipes, setTravaEquipes } = useApp();

  return (
    <div style={S.pg}>
      <Card>
        <Hdr2 ch={`⚡ ${t("engineering.title")}`} />
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>{t("engineering.fields.name")}</div>
              <LocalTextInp v={lt.nome} onSave={v => uLt("nome", v)} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>{t("engineering.fields.tensao")}</div>
              <LocalTextInp v={lt.tensao} onSave={v => uLt("tensao", v)} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>{t("engineering.fields.ext")}</div>
              <LocalNumInp v={lt.ext} onSave={v => uLt("ext", +v)} w="100%" />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>{t("engineering.fields.circ")}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  ["simples", t("engineering.fields.circSimples")],
                  ["duplo", t("engineering.fields.circDuplo")]
                ].map(([c, label]) => (
                  <Pill key={c} on={lt.circ === c} onClick={() => uLt("circ", c as any)} ch={label.toUpperCase()} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              [t("engineering.fields.cabFase"), "cabFase" as const],
              [t("engineering.fields.pararaios"), "pararaios" as const],
              [t("engineering.fields.opgw"), "opgw" as const]
            ].map(([label, k]) => (
              <div key={k}>
                <div style={{ fontSize: 9, color: C.txt3, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
                <LocalNumInp v={lt[k] as number} onSave={v => uLt(k, +v)} w="100%" />
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            [t("engineering.stats.conductors"), `${lt.cabFase * 3 * fator}`, t("engineering.stats.cablesUnit")],
            [t("engineering.stats.totalCables"), `${totalCabos}`, t("engineering.stats.cablesUnit")],
            [t("engineering.stats.kmConductor"), fmtI(extCondutor, i18n.language), t("engineering.stats.kmUnit")],
            [t("engineering.stats.kmPararaios"), fmtI(extParaRaios, i18n.language), t("engineering.stats.kmUnit")]
          ].map(([label, v, u]) => (
            <div key={label} style={S.stat}>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.goldL }}>{v}</div>
              <div style={{ fontSize: 9, color: C.txt3 }}>{u}</div>
              <div style={{ fontSize: 8, letterSpacing: 2, color: C.txt2, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Hdr2 ch={t("engineering.rules.title")} />
        <div style={{ padding: "6px 16px 16px", display: "flex", flexDirection: "column", gap: 18 }}>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            <Toggle
              on={duracaoSomada}
              onToggle={() => setDuracaoSomada(!duracaoSomada)}
              label={t("engineering.rules.durationMode")}
              labelOn={t("engineering.rules.sumActivities")}
              labelOff={t("engineering.rules.period")}
            />
            <span style={{ fontSize: 10, color: C.txt3, maxWidth: 320, lineHeight: 1.6 }}>
              {duracaoSomada
                ? t("engineering.rules.sumDesc")
                : t("engineering.rules.periodDesc")}
            </span>
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
            <Toggle
              on={travaEquipes}
              onToggle={() => setTravaEquipes(v => !v)}
              label={t("engineering.rules.lockTeams")}
              labelOn={t("engineering.rules.locked")}
              labelOff={t("engineering.rules.free")}
            />
            <span style={{ fontSize: 10, color: C.txt3, maxWidth: 320, lineHeight: 1.6 }}>
              {travaEquipes
                ? t("engineering.rules.lockDesc")
                : t("engineering.rules.freeDesc")}
            </span>
          </div>

        </div>
      </Card>
    </div>
  );
}
