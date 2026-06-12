import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { C } from "../../constants/colors";
import { S } from "../../styles";
import { useApp } from "../../context/AppContext";
import ManualParticipante from "./ManualParticipante";

// Importações dos prints reais mockados na pasta assets
import imgConfigLt from "../../assets/tela_facilitador_ou_admin_configuracao_lt.png";
import imgCriacaoGrupos from "../../assets/tela_facilitador_ou_admin_criacao_grupos.png";
import imgEdicaoAtividades from "../../assets/tela_facilitador_ou_admin_edicao_atividades.png";
import imgEquipeBase from "../../assets/tela_facilitador_ou_admin_configuracao_equipe_base.png";
import imgRequisitos from "../../assets/tela_facilitador_ou_admin_configuracao_requisitos.png";
import imgRanking from "../../assets/tela_facilitador_ou_admin_ranking.png";
import imgGrupoComposicao from "../../assets/tela_grupo_composicao.png";
import imgGrupoCronograma from "../../assets/tela_grupo_cronograma.png";
import imgListagemSessoes from "../../assets/tela_listagem_criacao_sessoes.png";
import imgPainelAdmin from "../../assets/tela_painel_administrativo.png";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "F" | "G";
}

export default function TutorialModal({ isOpen, onClose, defaultRole }: TutorialModalProps) {
  const { t } = useTranslation();
  const { role: contextRole, lang } = useApp();
  
  // Decide o papel inicial a exibir (prioriza prop, depois contexto, depois 'F')
  const papelInicial = defaultRole || (contextRole === "ADMIN" ? "F" : contextRole) || "F";
  const [roleMode, setRoleMode] = useState<"F" | "G">(papelInicial);
  const [activeTab, setActiveTab] = useState<"steps" | "rules" | "screens" | "manual">("steps");
  
  // Controle de qual tela com print real exibir
  const [selectedScreenId, setSelectedScreenId] = useState<string>("");

  const screensF = [
    { id: "sessoes", label: "Listagem de Sessões", img: imgListagemSessoes, desc: "Tela onde o facilitador cria, edita, exclui e entra nas sessões (turmas) da dinâmica." },
    { id: "lt", label: "Configuração da LT", img: imgConfigLt, desc: "Definição dos parâmetros técnicos da Linha de Transmissão, como extensão, circuito, tensão e cabos por fase." },
    { id: "grupos", label: "Cadastro de Grupos", img: imgCriacaoGrupos, desc: "Cadastro dos grupos participantes e definição de senhas de acesso para cada equipe." },
    { id: "atividades", label: "Parâmetros das Atividades", img: imgEdicaoAtividades, desc: "Configuração de produtividade (KPI) de referência, volumes previstos e meses de início das 7 atividades." },
    { id: "equipe_base", label: "Equipe Base de Referência", img: imgEquipeBase, desc: "Definição do dimensionamento ideal (MO e equipamentos) para servir de benchmark de coeficientes de eficiência." },
    { id: "requisitos", label: "Requisitos de Segurança", img: imgRequisitos, desc: "Gabarito de requisitos aplicáveis e não aplicáveis. Itens aplicáveis faltantes desclassificam; não aplicáveis adicionados penalizam custo." },
    { id: "ranking", label: "Ranking & Análise IA", img: imgRanking, desc: "Visualização das notas dos grupos e acionamento dos relatórios de debriefing qualitativo via Claude AI." },
    { id: "admin", label: "Painel do Administrador", img: imgPainelAdmin, desc: "Controle de eventos gerais, cadastro de facilitadores e gerenciamento global de acessos." },
  ];

  const screensG = [
    { id: "composicao", label: "Composição de Recursos", img: imgGrupoComposicao, desc: "Área de trabalho principal do grupo para adicionar profissionais (MO), equipamentos, definir KPI da equipe, equipes simultâneas e requisitos de segurança." },
    { id: "cronograma", label: "Cronograma & Gantt", img: imgGrupoCronograma, desc: "Visualização do cronograma de produção estimado, caminho crítico e gráfico Gantt mensal de volumes." },
  ];

  const activeScreens = roleMode === "F" ? screensF : screensG;

  // Atualiza a tela selecionada ao alternar entre os papéis
  useEffect(() => {
    if (activeScreens.length > 0) {
      setSelectedScreenId(activeScreens[0].id);
    }
  }, [roleMode]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Estilos locais
  const modalOverlay: React.CSSProperties = {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 16
  };

  const modalContainer: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    width: "100%",
    maxWidth: 960,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px rgba(0, 0, 0, 0.05)",
    overflow: "hidden"
  };

  const headerStyle: React.CSSProperties = {
    padding: "16px 24px",
    borderBottom: `1px solid ${C.border}`,
    background: `linear-gradient(135deg, ${C.surface}, ${C.surf2})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0
  };

  const footerStyle: React.CSSProperties = {
    padding: "12px 24px",
    borderTop: `1px solid ${C.border}`,
    background: C.surf2,
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    flexShrink: 0
  };

  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    background: isActive ? C.gold + "15" : "transparent",
    border: "none",
    borderBottom: `2px solid ${isActive ? C.gold : "transparent"}`,
    color: isActive ? C.gold : C.txt2,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s"
  });

  const roleSelectorStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    background: isActive ? C.gold : C.surf2,
    border: `1px solid ${isActive ? C.gold : C.border2}`,
    color: isActive ? "#FFF" : C.txt2,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s"
  });

  const currentScreen = activeScreens.find(s => s.id === selectedScreenId) || activeScreens[0];

  return (
    <div style={modalOverlay} onClick={handleBackdropClick}>
      <div style={modalContainer}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>📖</span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.txt }}>{t("tutorial.title")}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", fontSize: 18, color: C.txt3, cursor: "pointer", padding: "4px 8px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Subheader: Seleção de Papel */}
        <div style={{
          padding: "10px 24px",
          background: C.surf3,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          flexShrink: 0
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={roleSelectorStyle(roleMode === "F")}
              onClick={() => setRoleMode("F")}
            >
              ⚙️ {t("tutorial.facilitatorTitle")}
            </button>
            <button
              style={roleSelectorStyle(roleMode === "G")}
              onClick={() => setRoleMode("G")}
            >
              👥 {t("tutorial.groupTitle")}
            </button>
          </div>

          {/* Abas Secundárias */}
          <div style={{ display: "flex" }}>
            <button
              style={tabButtonStyle(activeTab === "steps")}
              onClick={() => setActiveTab("steps")}
            >
              🚶 {t("tutorial.tabs.steps")}
            </button>
            <button
              style={tabButtonStyle(activeTab === "rules")}
              onClick={() => setActiveTab("rules")}
            >
              ⚖️ {t("tutorial.tabs.rules")}
            </button>
            <button
              style={tabButtonStyle(activeTab === "screens")}
              onClick={() => setActiveTab("screens")}
            >
              🖥️ {t("tutorial.tabs.screens")}
            </button>
            <button
              style={tabButtonStyle(activeTab === "manual")}
              onClick={() => setActiveTab("manual")}
            >
              📖 {t("tutorial.tabs.manual")}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1, color: C.txt }}>
          
          {/* TAB 1: PASSO A PASSO */}
          {activeTab === "steps" && (
            <div>
              {roleMode === "F" ? (
                <div>
                  <h3 style={{ margin: "0 0 16px", color: C.gold, fontSize: 14, fontWeight: 700 }}>
                    {t("tutorial.facSteps.title")}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13, lineHeight: 1.6 }}>
                    <p style={{ margin: 0 }}>{t("tutorial.facSteps.step1")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.facSteps.step2")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.facSteps.step3")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.facSteps.step4")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.facSteps.step5")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.facSteps.step6")}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: "0 0 16px", color: C.gold, fontSize: 14, fontWeight: 700 }}>
                    {t("tutorial.grpSteps.title")}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 13, lineHeight: 1.6 }}>
                    <p style={{ margin: 0 }}>{t("tutorial.grpSteps.step1")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.grpSteps.step2")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.grpSteps.step3")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.grpSteps.step4")}</p>
                    <p style={{ margin: 0 }}>{t("tutorial.grpSteps.step5")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REGRAS E PENALIDADES */}
          {activeTab === "rules" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <h3 style={{ margin: 0, color: C.gold, fontSize: 14, fontWeight: 700 }}>
                {t("tutorial.rulesTitle")}
              </h3>
              <p style={{ margin: 0, fontSize: 13 }}>{t("tutorial.rulesText")}</p>

              {/* Regra de Segurança */}
              <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, color: C.txt, fontWeight: 700 }}>
                  {t("tutorial.safetyTitle")}
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.5, color: C.txt2 }}>
                  {t("tutorial.safetyDesc")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                  <div style={{ color: C.redL, fontWeight: 600 }}>• {t("tutorial.safetyDisq")}</div>
                  <div style={{ color: C.yellow, fontWeight: 600 }}>• {t("tutorial.safetyPenalty")}</div>
                </div>
              </div>

              {/* Regra de Prazo */}
              <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 13, color: C.txt, fontWeight: 700 }}>
                  {t("tutorial.deadlineTitle")}
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: 12, lineHeight: 1.5, color: C.txt2 }}>
                  {t("tutorial.deadlineDesc")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: C.goldDim, fontWeight: 600 }}>
                  <div>• {t("tutorial.deadlineRisco")}</div>
                  <div>• {t("tutorial.deadlinePior")}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRINTS REAIS DAS TELAS */}
          {activeTab === "screens" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Menu de seleção do print real */}
              <div style={{
                display: "flex", gap: 6, borderBottom: `1px solid ${C.border}`, paddingBottom: 10,
                overflowX: "auto", whiteSpace: "nowrap", scrollbarWidth: "thin"
              }}>
                {activeScreens.map(s => (
                  <button
                    key={s.id}
                    style={{
                      background: "transparent", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      padding: "4px 8px", marginRight: 4,
                      color: selectedScreenId === s.id ? C.gold : C.txt3,
                      borderBottom: `2px solid ${selectedScreenId === s.id ? C.gold : "transparent"}`
                    }}
                    onClick={() => setSelectedScreenId(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Renderização do print real */}
              {currentScreen && (
                <div style={{ background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, textAlign: "center" }}>
                  <img
                    src={currentScreen.img}
                    alt={currentScreen.label}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "55vh",
                      height: "auto",
                      borderRadius: 6,
                      border: `1px solid ${C.border2}`,
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      marginBottom: 12
                    }}
                  />
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 4, textAlign: "left"
                  }}>
                    {currentScreen.label}
                  </div>
                  <div style={{
                    fontSize: 12, color: C.txt2, lineHeight: 1.5, textAlign: "left"
                  }}>
                    {currentScreen.desc}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MANUAL COMPLETO */}
          {activeTab === "manual" && (
            <ManualParticipante lang={lang === "es" ? "es" : "pt"} />
          )}

        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={{
              ...S.btnP,
              background: "transparent",
              border: `1px solid ${C.border2}`,
              color: C.txt2,
              letterSpacing: 1,
              padding: "8px 16px"
            }}
          >
            {t("tutorial.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
