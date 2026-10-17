const MINUS = "−";

export function tonnes(t: number, digits = 1): string {
  return `${t.toFixed(digits)} t`;
}

export function signedTonnes(t: number, digits = 1): string {
  const rounded = Number(t.toFixed(digits));
  if (rounded === 0) return `±0 t`;
  return `${rounded > 0 ? "+" : MINUS}${Math.abs(rounded).toFixed(digits)} t`;
}

export function signedPercent(ratio: number): string {
  const pct = Math.round(ratio * 100);
  if (pct === 0) return "±0%";
  return `${pct > 0 ? "+" : MINUS}${Math.abs(pct)}%`;
}

/** Rounds to 2 significant figures so equivalents never look more precise than they are. */
export function roughCount(n: number): string {
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs < 1) return abs.toFixed(1);
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(abs)) - 1);
  return (Math.round(abs / magnitude) * magnitude).toLocaleString("en-US");
}
