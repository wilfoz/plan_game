import { useState } from "react";
import { useTranslation } from "react-i18next";
import { C } from "../../constants/colors";
import { S } from "../../styles";
import { useApp } from "../../context/AppContext";

export default function Header() {
  const { t, i18n } = useTranslation();
  const {
    screen,
    setScreen,
    role,
    setRole,
    setActiveSessionId,
    grupos,
    gIdx,
    sess,
    lang,
    logout,
    adminSenha,
    setActiveEventId,
    setActiveEventNome
  } = useApp();

  const [menuAberto, setMenuAberto] = useState(false);

  // Facilitador volta para lista de sessões (permanece autenticado)
  const voltarSessoes = () => {
    setActiveSessionId(null);
    setScreen("session-manager");
    setMenuAberto(false);
  };

  const irParaPainelAdmin = () => {
    setActiveSessionId(null);
    setActiveEventId(null);
    setActiveEventNome(null);
    setRole("ADMIN");
    setScreen("admin_dashboard");
    setMenuAberto(false);
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

  const handleNavClick = (tela: string) => {
    setScreen(tela);
    setMenuAberto(false);
  };

  const navItems = role === "F" ? navF : navG;

  return (
    <header style={{ ...S.hdr, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, background: `linear-gradient(135deg,${C.gold},${C.goldDim})`,
          borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#FFF"
        }}>⚡</div>
        <div style={{ textAlign: "left" }}>
          <div className="header-title-desktop" style={{ fontWeight: 700 }}>
            {t("header.tagline")}
          </div>
          <div style={{ fontSize: 8, letterSpacing: 1 }}>
            {sess && <span style={{ color: C.goldL }}>{sess.nome}</span>}
            {role === "G" && grupos[gIdx] && (
              <span style={{ color: C.txt3 }}> · {grupos[gIdx].nome}</span>
            )}
          </div>
        </div>
      </div>

      {/* Navegação Desktop (escondida no mobile via CSS) */}
      <nav className="header-nav">
        {navItems.map(([s, label]) => (
          <button
            key={s}
            style={S.nb(screen === s)}
            onClick={() => handleNavClick(s)}
          >
            {label}
          </button>
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

        {adminSenha && (
          <button
            style={{ ...S.nb(false), marginLeft: 8, borderColor: C.gold, color: C.gold }}
            onClick={irParaPainelAdmin}
          >
            ⬅ PAINEL ADMIN
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
          onClick={() => { setMenuAberto(false); logout(); }}
          title={t("common.logout")}
        >
          {t("common.logout")}
        </button>
      </nav>

      {/* Botão do Menu Hambúrguer (exibido apenas no mobile via CSS) */}
      <button
        onClick={() => setMenuAberto(!menuAberto)}
        style={{
          background: "transparent",
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          padding: "6px 10px",
          color: C.txt,
          fontSize: 16,
          cursor: "pointer",
        }}
        className="mobile-only"
      >
        {menuAberto ? "✕" : "☰"}
      </button>

      {/* Dropdown Menu Móvel */}
      {menuAberto && (
        <div className="header-menu-dropdown mobile-only">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {navItems.map(([s, label]) => (
              <button
                key={s}
                style={{
                  ...S.nb(screen === s),
                  width: "100%",
                  padding: "10px",
                  textAlign: "center"
                }}
                onClick={() => handleNavClick(s)}
              >
                {label}
              </button>
            ))}

            {role === "F" && (
              <button
                style={{ ...S.nb(false), width: "100%", padding: "10px" }}
                onClick={voltarSessoes}
              >
                {t("common.sessions")}
              </button>
            )}

            {adminSenha && (
              <button
                style={{
                  ...S.nb(false),
                  width: "100%",
                  padding: "10px",
                  borderColor: C.gold,
                  color: C.gold
                }}
                onClick={irParaPainelAdmin}
              >
                ⬅ PAINEL ADMIN
              </button>
            )}
          </div>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`
          }}>
            {/* Widget Seletor de Idioma PT | ES (Mobile) */}
            <div style={{
              display: "flex",
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
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                onClick={() => { i18n.changeLanguage("pt-BR"); setMenuAberto(false); }}
              >
                PT
              </button>
              <button
                style={{
                  background: lang === "es" ? C.gold : "transparent",
                  color: lang === "es" ? "#fff" : C.txt2,
                  border: "none",
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
                onClick={() => { i18n.changeLanguage("es"); setMenuAberto(false); }}
              >
                ES
              </button>
            </div>

            <button
              style={{
                ...S.nb(false),
                color: C.redL,
                borderColor: C.redL + "44",
                padding: "6px 16px"
              }}
              onClick={() => { setMenuAberto(false); logout(); }}
            >
              {t("common.logout")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
