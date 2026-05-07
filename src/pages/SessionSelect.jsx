import { C } from "../constants/colors";
import { S } from "../styles";
import { useApp } from "../context/AppContext";

export default function SessionSelect() {
  const { sessions, setActiveSessionId, setScreen, setRole } = useApp();

  const selecionarSessao = (id) => {
    setActiveSessionId(id);
    setScreen("grupo-login");
  };

  const voltar = () => {
    setRole(null);
    setScreen("intro");
  };

  return (
    <div style={S.app}>
      <div style={{ ...S.pg, maxWidth: 560, paddingTop: 60 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>SELECIONAR SESSÃO</h2>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: C.txt3, letterSpacing: 1 }}>
            ESCOLHA A JORNADA EM QUE SEU GRUPO ESTÁ PARTICIPANDO
          </p>
        </div>

        {sessions.length === 0 ? (
          <div style={{
            background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "32px", textAlign: "center", color: C.txt3, fontSize: 13
          }}>
            Nenhuma sessão disponível. Aguarde o facilitador criar a sessão.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.map((s, i) => (
              <button
                key={s.id}
                onClick={() => selecionarSessao(s.id)}
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer",
                  background: C.surface, border: `2px solid ${C.border}`,
                  borderRadius: 8, padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "border-color 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", background: C.gold + "22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: C.goldDim, flexShrink: 0
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.txt }}>{s.nome}</div>
                  <div style={{ fontSize: 11, color: C.txt3, marginTop: 3 }}>
                    {s.grupos.length} grupo{s.grupos.length !== 1 ? "s" : ""}
                    {s.lt.nome ? ` · ${s.lt.nome}` : ""}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 16, color: C.txt3 }}>→</div>
              </button>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button style={{ ...S.btnS, fontSize: 11 }} onClick={voltar}>← VOLTAR</button>
        </div>
      </div>
    </div>
  );
}
