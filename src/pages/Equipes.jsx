import { useState, useEffect, useRef } from "react";
import { S } from "../styles";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Hdr2 } from "../components/ui/Typography";
import { TH, TD } from "../components/ui/Table";
import { BtnDel } from "../components/ui/Card";
import { C } from "../constants/colors";

const fieldStyle = {
  width: "100%", background: C.surf3, border: `1px solid ${C.border2}`,
  borderRadius: 3, color: C.txt, padding: "5px 9px", fontSize: 11,
  fontFamily: "inherit", boxSizing: "border-box",
};

// Estado local para evitar re-renders do servidor durante a digitação.
// Salva no servidor apenas no onBlur; sincroniza do servidor somente
// quando a alteração vem de outra fonte (não do próprio usuário).
function GrupoField({ value, onSave, placeholder = "" }) {
  const [v, setV] = useState(value ?? "");
  const serverRef = useRef(value ?? "");

  useEffect(() => {
    if (value !== serverRef.current) {
      setV(value ?? "");
      serverRef.current = value ?? "";
    }
  }, [value]);

  const handleBlur = () => {
    if (v !== serverRef.current) {
      onSave(v);
      serverRef.current = v;
    }
  };

  return (
    <input
      value={v}
      placeholder={placeholder}
      onChange={e => setV(e.target.value)}
      onBlur={handleBlur}
      style={fieldStyle}
    />
  );
}

function SenhaInput({ grupoId, onSave }) {
  const [v, setV] = useState("");
  return (
    <input
      type="password"
      value={v}
      placeholder="Definir nova senha..."
      onChange={e => setV(e.target.value)}
      onBlur={() => { if (v.trim()) { onSave(grupoId, v.trim()); setV(""); } }}
      onKeyDown={e => { if (e.key === "Enter" && v.trim()) { onSave(grupoId, v.trim()); setV(""); } }}
      style={fieldStyle}
    />
  );
}

export default function Equipes() {
  const { grupos, addGrupo, uGrupo, delGrupo } = useApp();
  const saveSenha = (id, plaintext) => uGrupo(id, "senha", plaintext);
  return (
    <div style={S.pg}>
      <Card>
        <Hdr2 ch="👥 GRUPOS PARTICIPANTES" right={
          <button style={S.btnS} onClick={addGrupo}>+ ADICIONAR</button>
        } />
        <table style={S.tbl}>
          <thead><tr>
            <TH ch="#" w={30} /><TH ch="NOME DO GRUPO" /><TH ch="RESPONSÁVEL" /><TH ch="SENHA DE ACESSO" w={160} /><TH ch="" w={40} />
          </tr></thead>
          <tbody>
            {grupos.map((g, i) => (
              <tr key={g.id} style={S.trOff(i)}>
                <TD ch={i + 1} bold accent />
                <td style={{ padding: "4px 8px" }}>
                  <GrupoField value={g.nome} onSave={v => uGrupo(g.id, "nome", v)} />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <GrupoField value={g.resp} placeholder="Nome do responsável..." onSave={v => uGrupo(g.id, "resp", v)} />
                </td>
                <td style={{ padding: "4px 8px" }}>
                  <SenhaInput grupoId={g.id} onSave={saveSenha} />
                </td>
                <td style={{ padding: "4px 8px", textAlign: "center" }}>
                  {grupos.length > 1 && <BtnDel onClick={() => delGrupo(i)} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "8px 13px", fontSize: 11, color: C.txt2 }}>
          ℹ️ Cada grupo monta composições para <strong style={{ color: C.goldL }}>todas as 16 atividades</strong> — Montagem E Lançamento.
        </div>
      </Card>
    </div>
  );
}
