import { ReactNode, useState, useRef, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { C } from "../../constants/colors";
import { fmt } from "../../utils/formatters";

interface HelpTipProps {
  text: ReactNode;
}

// Ícone "ⓘ" que exibe um popover ao passar o mouse, explicando uma regra.
// O popover é medido após abrir e deslocado horizontalmente para não ultrapassar a tela.
export const HelpTip = ({ text }: HelpTipProps) => {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const popRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!open || !popRef.current) return;
    const margin = 8;
    const rect = popRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth - margin) {
      setShift(window.innerWidth - margin - rect.right);
    } else if (rect.left < margin) {
      setShift(margin - rect.left);
    }
  }, [open]);

  return (
    <span
      style={{ position: "relative", display: "inline-flex", marginLeft: 4, verticalAlign: "middle" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setOpen(false); setShift(0); }}
    >
      <span style={{
        cursor: "help", fontSize: 10, fontWeight: 700, color: C.goldL,
        border: `1px solid ${C.goldL}66`, borderRadius: "50%", width: 13, height: 13,
        display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
      }}>ⓘ</span>
      {open && (
        <span ref={popRef} style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: `translateX(calc(-50% + ${shift}px))`,
          zIndex: 50, width: 240, maxWidth: "calc(100vw - 16px)", padding: "8px 10px", borderRadius: 6,
          background: C.surf3, border: `1px solid ${C.border2}`, boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
          fontSize: 10, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0, color: C.txt2,
          textAlign: "left", whiteSpace: "normal",
        }}>{text}</span>
      )}
    </span>
  );
};

interface THProps {
  ch: ReactNode;
  right?: boolean;
  center?: boolean;
  accent?: boolean;
  w?: string | number;
  tip?: ReactNode;
}

export const TH = ({ ch, right, center, accent, w, tip }: THProps) => (
  <th style={{
    padding: "5px 9px", fontSize: 10, fontWeight: 700, letterSpacing: 1, whiteSpace: "nowrap",
    color: accent ? C.goldL : C.txt2, textAlign: center ? "center" : right ? "right" : "left", width: w,
    background: C.surf3, borderBottom: `1px solid ${C.border2}`, overflow: "visible"
  }}>{ch}{tip != null && <HelpTip text={tip} />}</th>
);

interface TDProps {
  ch: ReactNode;
  right?: boolean;
  bold?: boolean;
  accent?: boolean;
  muted?: boolean;
  cs?: number;
  col?: string;
}

export const TD = ({ ch, right, bold, accent, muted, cs, col }: TDProps) => (
  <td colSpan={cs} style={{
    padding: "4px 9px", fontSize: 11, textAlign: right ? "right" : "left",
    whiteSpace: "nowrap", fontWeight: bold ? 700 : 400,
    color: col || (accent ? C.goldL : muted ? C.txt3 : C.txt)
  }}>{ch}</td>
);

interface TotRowProps {
  label: ReactNode;
  value: number;
  cols?: number;
}

export const TotRow = ({ label, value, cols = 2 }: TotRowProps) => {
  const { i18n } = useTranslation();
  return (
    <tr style={{ borderTop: `2px solid ${C.border2}`, background: C.surf3 }}>
      <td colSpan={cols} style={{ padding: "5px 9px", fontSize: 11, fontWeight: 700, color: C.goldL }}>{label}</td>
      <td style={{ padding: "5px 9px", textAlign: "right", fontSize: 12, fontWeight: 700, color: C.goldL }}>
        {fmt(value, i18n.language)}
      </td>
    </tr>
  );
};
