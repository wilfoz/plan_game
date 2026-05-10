import { useState, useEffect, useRef } from "react";
import { C } from "../../constants/colors";

const toStr = v => (v != null ? String(v) : "");

const numStyle = (w) => ({
  width: w, background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 3,
  color: C.goldL, padding: "3px 6px", fontSize: 11, fontFamily: "inherit",
  textAlign: "right", boxSizing: "border-box"
});

const txtStyle = (w) => ({
  width: w, background: C.surf3, border: `1px solid ${C.border2}`,
  borderRadius: 3, color: C.txt, padding: "5px 9px", fontSize: 11,
  fontFamily: "inherit", boxSizing: "border-box"
});

// Versões controladas pelo servidor (legado — usar Local* para campos editáveis)
export const NumInp = ({ v, onChange, w = 50 }) => (
  <input type="number" value={v} onChange={onChange} style={numStyle(w)} />
);

export const TextInp = ({ v, onChange, placeholder = "", w = "100%" }) => (
  <input value={v} onChange={onChange} placeholder={placeholder} style={txtStyle(w)} />
);

// LocalNumInp — estado local, salva só no onBlur; sincroniza do servidor
// apenas quando a mudança vem de fora (não do próprio usuário).
export const LocalNumInp = ({ v, onSave, w = 50 }) => {
  const [local, setLocal] = useState(toStr(v));
  const savedRef = useRef(toStr(v));

  useEffect(() => {
    const s = toStr(v);
    if (s !== savedRef.current) {
      setLocal(s);
      savedRef.current = s;
    }
  }, [v]);

  const handleBlur = () => {
    if (local !== savedRef.current) {
      onSave(local);
      savedRef.current = local;
    }
  };

  return (
    <input
      type="number"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={handleBlur}
      style={numStyle(w)}
    />
  );
};

// LocalTextInp — mesmo padrão do LocalNumInp para campos de texto.
export const LocalTextInp = ({ v, onSave, placeholder = "", w = "100%" }) => {
  const [local, setLocal] = useState(v ?? "");
  const savedRef = useRef(v ?? "");

  useEffect(() => {
    const s = v ?? "";
    if (s !== savedRef.current) {
      setLocal(s);
      savedRef.current = s;
    }
  }, [v]);

  const handleBlur = () => {
    if (local !== savedRef.current) {
      onSave(local);
      savedRef.current = local;
    }
  };

  return (
    <input
      value={local}
      placeholder={placeholder}
      onChange={e => setLocal(e.target.value)}
      onBlur={handleBlur}
      style={txtStyle(w)}
    />
  );
};

export const Sel = ({ v, onChange, opts, placeholder = "— selecione —", w = "100%" }) => (
  <select value={v || ""} onChange={onChange}
    style={{
      width: w, background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 3,
      color: v ? C.txt : C.txt3, padding: "4px 8px", fontSize: 11, fontFamily: "inherit",
      boxSizing: "border-box", cursor: "pointer"
    }}>
    <option value="">{placeholder}</option>
    {opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
  </select>
);
