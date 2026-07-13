"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DonutChart.module.css";

/* ── Types ──────────────────────────────────────── */
export interface DonutDataItem {
  name: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutDataItem[];
  centerLabel?: string;
  animationDuration?: number;
}

/* ── Count-up hook ──────────────────────────────── */
function useCountUp(target: number, active: boolean, duration = 1100) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    let startTs: number | null = null;
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, target, duration]);

  return value;
}

/* ── Main Component ─────────────────────────────── */
export default function DonutChart({ data, centerLabel = "total", animationDuration = 900 }: DonutChartProps) {
  const [hoverSlice, setHoverSlice] = useState<number | null>(null);
  
  // Use a simple intersection observer or just mount animation for 'active' state
  const [active, setActive] = useState(false);
  useEffect(() => {
    setActive(true);
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);
  
  // Progress goes 0 -> 1 for sweep animation
  const prog = useCountUp(1000, active, animationDuration) / 1000; 
  
  // SVG Geometry
  const R = 60;
  const C = 2 * Math.PI * R;
  let offset = 0;
  
  const sel = hoverSlice ?? -1;
  const center = sel >= 0 ? data[sel] : null;
  const centerPct = center ? Math.round((center.value / total) * 100) : Math.round(prog * 100);

  return (
    <div className={styles.container}>
      <div className={styles.donutWrap}>
        <svg viewBox="0 0 160 160" className={styles.donutSvg}>
          <g transform="rotate(-90 80 80)">
            {data.map((d, i) => {
              const frac = (d.value / total) * prog;
              const len = C * frac;
              const dash = `${len} ${C - len}`;
              const thisOffset = offset;
              offset += len;
              const isSel = sel === i;
              
              return (
                <circle
                  key={d.name}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={isSel ? 22 : 16}
                  strokeDasharray={dash}
                  strokeDashoffset={-thisOffset}
                  opacity={sel === -1 || isSel ? 1 : 0.32}
                  className={styles.donutSeg}
                  onMouseEnter={() => setHoverSlice(i)}
                  onMouseLeave={() => setHoverSlice(null)}
                />
              );
            })}
          </g>
          
          <text x="80" y="74" textAnchor="middle" className={styles.donutNum}>
            {centerPct}%
          </text>
          
          <text x="80" y="92" textAnchor="middle" className={styles.donutSub}>
            {center ? center.name.split(" ")[0] : centerLabel}
          </text>
        </svg>
      </div>

      <ul className={styles.legend}>
        {data.map((d, i) => (
          <li
            key={d.name}
            className={`${styles.legendItem} ${hoverSlice === i ? styles.legendActive : ""}`}
            onMouseEnter={() => setHoverSlice(i)}
            onMouseLeave={() => setHoverSlice(null)}
          >
            <span className={styles.legendDot} style={{ background: d.color }} />
            <span className={styles.legendName}>{d.name}</span>
            <span className={styles.legendVal}>
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
