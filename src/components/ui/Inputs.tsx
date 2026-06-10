import { useState, useEffect, useRef, ChangeEvent } from "react";
import { C } from "../../constants/colors";

const toStr = (v: any) => (v != null ? String(v) : "");

const numStyle = (w: string | number) => ({
  width: w, background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 3,
  color: C.goldL, padding: "3px 6px", fontSize: 11, fontFamily: "inherit",
  textAlign: "right" as const, boxSizing: "border-box" as const
});

const txtStyle = (w: string | number) => ({
  width: w, background: C.surf3, border: `1px solid ${C.border2}`,
  borderRadius: 3, color: C.txt, padding: "5px 9px", fontSize: 11,
  fontFamily: "inherit", boxSizing: "border-box" as const
});

interface NumInpProps {
  v: number | string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  w?: string | number;
}

export const NumInp = ({ v, onChange, w = 50 }: NumInpProps) => (
  <input type="number" value={v} onChange={onChange} style={numStyle(w)} />
);

interface TextInpProps {
  v: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  w?: string | number;
}

export const TextInp = ({ v, onChange, placeholder = "", w = "100%" }: TextInpProps) => (
  <input value={v} onChange={onChange} placeholder={placeholder} style={txtStyle(w)} />
);

interface LocalNumInpProps {
  v: number | string;
  onSave: (val: string) => void;
  w?: string | number;
}

export const LocalNumInp = ({ v, onSave, w = 50 }: LocalNumInpProps) => {
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

interface LocalTextInpProps {
  v: string;
  onSave: (val: string) => void;
  placeholder?: string;
  w?: string | number;
}

export const LocalTextInp = ({ v, onSave, placeholder = "", w = "100%" }: LocalTextInpProps) => {
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

interface Opt {
  id: string;
  label: string;
}

interface SelProps {
  v?: string | null;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  opts: Opt[];
  placeholder?: string;
  w?: string | number;
}

export const Sel = ({ v, onChange, opts, placeholder = "— selecione —", w = "100%" }: SelProps) => (
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
