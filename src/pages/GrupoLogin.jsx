import { useState } from "react";
import { C } from "../constants/colors";
import { S } from "../styles";
import { useApp } from "../context/AppContext";

export default function GrupoLogin() {
  const { grupos, setGIdx, setRole, setScreen } = useApp();
  const [selecionado, setSelecionado] = useState(null);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  const selecionar = (i) => {
    setSelecionado(i);
    setSenha("");
    setErro(false);
  };

  const entrar = () => {
    if (selecionado === null) return;
    const g = grupos[selecionado];
    if (g.senha && g.senha !== senha) {
      setErro(true);
      return;
    }
    setErro(false);
    setGIdx(selecionado);
    setRole("G");
    setScreen("composicao");
  };

  const voltar = () => {
    setScreen("intro");
    setRole(null);
  };

  return (
    <div style={S.app}>
      <div style={{ ...S.pg, maxWidth: 560, paddingTop: 60 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: 4 }}>ACESSO DO GRUPO</h2>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: C.txt3, letterSpacing: 1 }}>
            SELECIONE SEU GRUPO E INFORME A SENHA
          </p>
        </div>

        {grupos.length === 0 ? (
          <div style={{
            background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: "24px", textAlign: "center", color: C.txt3, fontSize: 13
          }}>
            Aguardando cadastro de grupos pelo facilitador.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {grupos.map((g, i) => {
              const ativo = selecionado === i;
              return (
                <div key={g.id}>
                  <button
                    onClick={() => selecionar(i)}
                    style={{
                      width: "100%", textAlign: "left", cursor: "pointer",
                      background: ativo ? C.gold + "18" : C.surface,
                      border: `2px solid ${ativo ? C.gold : C.border}`,
                      borderRadius: 8, padding: "14px 18px",
                      display: "flex", alignItems: "center", gap: 12,
                      transition: "border-color 0.15s"
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: ativo ? C.gold : C.surf3,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: ativo ? "#FFF" : C.txt3,
                      flexShrink: 0
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ativo ? C.goldDim : C.txt }}>{g.nome}</div>
                      {g.resp && (
                        <div style={{ fontSize: 11, color: C.txt3, marginTop: 2 }}>{g.resp}</div>
                      )}
                    </div>
                  </button>

                  {ativo && (
                    <div style={{
                      background: C.surf2, border: `2px solid ${C.gold}`, borderTop: "none",
                      borderRadius: "0 0 8px 8px", padding: "14px 18px",
                      display: "flex", flexDirection: "column", gap: 10
                    }}>
                      <label style={{ fontSize: 10, color: C.txt3, letterSpacing: 2, fontWeight: 700 }}>
                        SENHA DO GRUPO
                      </label>
                      <input
                        type="password"
                        value={senha}
                        onChange={e => { setSenha(e.target.value); setErro(false); }}
                        onKeyDown={e => e.key === "Enter" && entrar()}
                        placeholder={g.senha ? "Digite a senha..." : "Sem senha — pressione Entrar"}
                        autoFocus
                        style={{
                          background: C.surface, border: `1px solid ${erro ? C.redL : C.border2}`,
                          borderRadius: 4, padding: "8px 12px", fontSize: 13, color: C.txt,
                          outline: "none", width: "100%", boxSizing: "border-box"
                        }}
                      />
                      {erro && (
                        <div style={{ fontSize: 11, color: C.redL, fontWeight: 600 }}>
                          Senha incorreta. Tente novamente.
                        </div>
                      )}
                      <button style={{ ...S.btnP, alignSelf: "flex-end" }} onClick={entrar}>
                        ENTRAR →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button style={{ ...S.btnS, fontSize: 11 }} onClick={voltar}>← VOLTAR</button>
        </div>
      </div>
    </div>
  );
}
