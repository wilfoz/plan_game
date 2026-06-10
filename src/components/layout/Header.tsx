import { useTranslation } from "react-i18next";
import { C } from "../../constants/colors";
import { S } from "../../styles";
import { useApp } from "../../context/AppContext";

export default function Header() {
  const { t, i18n } = useTranslation();
  const { screen, setScreen, role, setRole, setActiveSessionId, grupos, gIdx, sess, lang } = useApp();

  const logout = () => {
    setRole(null);
    setActiveSessionId(null);
    setScreen("login");
  };

  // Facilitador volta para lista de sessões (permanece autenticado)
  const voltarSessoes = () => {
    setActiveSessionId(null);
    setScreen("session-manager");
  };

  // Definição dos menus baseados em chaves de tradução
  const navF = [
    ["config", t("header.nav.engineering")],
    ["grupos", t("header.nav.groups")],
    ["atividades", t("header.nav.activities")],
    ["equipe-base", t("header.nav.baseTeam")],
    ["requisitos", t("header.nav.requirements")],
    ["composicao", t("header.nav.compositions")],
    ["cronograma", t("header.nav.gantt")],
    ["ranking", t("header.nav.ranking")]
  ];

  const navG = [
    ["composicao", t("header.nav.compositions")],
    ["cronograma", t("header.nav.gantt")]
  ];

  return (
    <header style={S.hdr}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
          borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#FFF"
        }}>⚡</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>{t("header.tagline")}</div>
          <div style={{ fontSize: 8, letterSpacing: 1 }}>
            {sess && <span style={{ color: C.goldL }}>{sess.nome}</span>}
            {role === "G" && grupos[gIdx] && (
              <span style={{ color: C.txt3 }}> · {grupos[gIdx].nome}</span>
            )}
          </div>
        </div>
      </div>
      <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {(role === "F" ? navF : navG).map(([s, label]) => (
          <button key={s} style={S.nb(screen === s)} onClick={() => setScreen(s)}>{label}</button>
        ))}
        {role === "F" && (
          <button
            style={{ ...S.nb(false), marginLeft: 8 }}
            onClick={voltarSessoes}
            title={t("common.sessions")}
          >
            {t("common.sessions")}
          </button>
        )}

        {/* Widget Seletor de Idioma PT | ES */}
        <div style={{
          display: "flex",
          marginLeft: 8,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          overflow: "hidden",
          background: C.surf3
        }}>
          <button
            style={{
              background: lang === "pt" ? C.gold : "transparent",
              color: lang === "pt" ? "#fff" : C.txt2,
              border: "none",
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onClick={() => i18n.changeLanguage("pt-BR")}
          >
            PT
          </button>
          <button
            style={{
              background: lang === "es" ? C.gold : "transparent",
              color: lang === "es" ? "#fff" : C.txt2,
              border: "none",
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onClick={() => i18n.changeLanguage("es")}
          >
            ES
          </button>
        </div>

        <button
          style={{ ...S.nb(false), marginLeft: 8, color: C.redL + "CC", borderColor: C.redL + "44" }}
          onClick={logout}
          title={t("common.logout")}
        >
          {t("common.logout")}
        </button>
      </nav>
    </header>
  );
}
