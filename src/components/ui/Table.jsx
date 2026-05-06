import { C } from "../../constants/colors";
import { fmt } from "../../utils/formatters";

export const TH = ({ ch, right, accent, w }) => (
  <th style={{
    padding: "5px 9px", fontSize: 10, fontWeight: 700, letterSpacing: 1, whiteSpace: "nowrap",
    color: accent ? C.goldL : C.txt2, textAlign: right ? "right" : "left", width: w,
    background: C.surf3, borderBottom: `1px solid ${C.border2}`
  }}>{ch}</th>
);

export const TD = ({ ch, right, bold, accent, muted, cs, col }) => (
  <td colSpan={cs} style={{
    padding: "4px 9px", fontSize: 11, textAlign: right ? "right" : "left",
    whiteSpace: "nowrap", fontWeight: bold ? 700 : 400,
    color: col || (accent ? C.goldL : muted ? C.txt3 : C.txt)
  }}>{ch}</td>
);

export const TotRow = ({ label, value, cols = 2 }) => (
  <tr style={{ borderTop: `2px solid ${C.border2}`, background: C.surf3 }}>
    <td colSpan={cols} style={{ padding: "5px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>{label}</td>
    <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>{fmt(value)}</td>
  </tr>
);
