import { C } from "../../constants/colors";

export const NumInp = ({ v, onChange, w = 50 }) => (
  <input type="number" value={v} onChange={onChange}
    style={{
      width: w, background: C.surf3, border: `1px solid ${C.border2}`, borderRadius: 3,
      color: C.goldL, padding: "3px 6px", fontSize: 11, fontFamily: "inherit",
      textAlign: "right", boxSizing: "border-box"
    }} />
);

export const TextInp = ({ v, onChange, placeholder = "", w = "100%" }) => (
  <input value={v} onChange={onChange} placeholder={placeholder}
    style={{
      width: w, background: C.surf3, border: `1px solid ${C.border2}`,
      borderRadius: 3, color: C.txt, padding: "5px 9px", fontSize: 11,
      fontFamily: "inherit", boxSizing: "border-box"
    }} />
);

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
