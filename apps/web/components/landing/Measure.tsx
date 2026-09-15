"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { animate } from "motion";
import { useReducedMotion } from "motion/react";

const RANGE_MM = 8;
const MEASURED = 1.8;
const REQUIRED = 2.5;

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function ticks() {
  const nodes = [];
  for (let i = 0; i <= RANGE_MM * 2; i += 1) {
    const mm = i / 2;
    const kind = mm % 1 === 0 ? "cm" : "half";
    nodes.push(<i key={mm} className={kind} />);
  }
  return nodes;
}

export function Measure() {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [caret, setCaret] = useState(MEASURED);
  const caretRef = useRef(MEASURED);
  const grabbing = useRef(false);
  const history = useRef<{ t: number; x: number }[]>([]);

  const setFromClientX = useCallback(
    (clientX: number, snap = false) => {
      const el = track.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const raw = ((clientX - rect.left) / rect.width) * RANGE_MM;
      let next = raw;
      if (raw < 0) next = rubberband(raw, RANGE_MM);
      if (raw > RANGE_MM) next = RANGE_MM + rubberband(raw - RANGE_MM, RANGE_MM);
      if (snap) next = Math.min(RANGE_MM, Math.max(0, raw));
      caretRef.current = next;
      setCaret(next);
    },
    [],
  );

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    grabbing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    history.current = [{ t: event.timeStamp, x: event.clientX }];
    setFromClientX(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!grabbing.current) return;
    const log = history.current;
    log.push({ t: event.timeStamp, x: event.clientX });
    if (log.length > 5) log.shift();
    setFromClientX(event.clientX);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!grabbing.current) return;
    grabbing.current = false;
    const log = history.current;
    const last = log[log.length - 1];
    const prev = log[0] ?? last;
    const dt = Math.max(1, (last?.t ?? 0) - (prev?.t ?? 0));
    const vx = (((last?.x ?? 0) - (prev?.x ?? 0)) / dt) * 1000;
    const el = track.current;
    const width = el?.getBoundingClientRect().width ?? 1;
    const vMm = (vx / width) * RANGE_MM;
    const projected = caretRef.current + (vMm / 1000) * (0.998 / (1 - 0.998));
    const target = Math.min(RANGE_MM, Math.max(0, projected));
    if (reduce) {
      caretRef.current = target;
      setCaret(target);
      return;
    }
    const from = caretRef.current;
    animate(from, target, {
      type: "spring",
      bounce: Math.abs(vMm) > 4 ? 0.18 : 0,
      duration: 0.4,
      velocity: vMm,
      onUpdate: (value) => {
        caretRef.current = value;
        setCaret(value);
      },
    });
  };

  const measuredPct = (MEASURED / RANGE_MM) * 100;
  const requiredPct = (REQUIRED / RANGE_MM) * 100;
  const caretPct = (Math.min(RANGE_MM, Math.max(0, caret)) / RANGE_MM) * 100;

  return (
    <div>
      <div className="readout">
        <span className="now">{MEASURED.toFixed(1)}</span>
        <span className="unit">mm</span>
      </div>

      <div
        className="scale"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="scale-track" ref={track}>
          <div className="scale-rest" />
          <div className="scale-fill" style={{ width: `${measuredPct}%` }} />
          <div className="scale-required" style={{ left: `${requiredPct}%` }}>
            <span>{REQUIRED.toFixed(1)}</span>
          </div>
          <div className="scale-caret" style={{ left: `${caretPct}%` }} />
        </div>
        <div className="ticks" aria-hidden>
          {ticks()}
        </div>
        <div className="scale-meta">
          <span>0</span>
          <span>{caret.toFixed(1)} mm</span>
          <span>{RANGE_MM}</span>
        </div>
      </div>
    </div>
  );
}
