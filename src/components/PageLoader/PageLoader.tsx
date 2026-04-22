"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

const COLS = 12;
const ROWS = 12;
const TOTAL = COLS * ROWS;

export default function PageLoader({ children }: { children: React.ReactNode }) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const pixelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const pixels = pixelsRef.current;
    const shuffled = [...pixels].sort(() => Math.random() - 0.5);

    gsap.timeline()
      .to(shuffled, {
        opacity: 1,
        duration: 0.04,
        stagger: { each: 0.012, from: "random" },
        ease: "none",
        delay: 0.3,
      })
      .to(loader, { backgroundColor: "#000000", duration: 0.1 }, "-=0.1")
      .to(shuffled, {
        opacity: 0,
        duration: 0.04,
        stagger: { each: 0.008, from: "random" },
        ease: "none",
      })
      .to(loader, {
        yPercent: -100,
        duration: 0.6,
        ease: "power3.inOut",
      })
      .then(() => setDone(true));
  }, []);

  return (
    <>
      {!done && (
        <div
          ref={loaderRef}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "#0B0B0C",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: TOTAL }).map((_, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            return (
              <div
                key={i}
                ref={(el) => { pixelsRef.current[i] = el; }}
                style={{
                  position: "absolute",
                  width: `${100 / COLS}%`,
                  height: `${100 / ROWS}%`,
                  left: `${(col / COLS) * 100}%`,
                  top: `${(row / ROWS) * 100}%`,
                  backgroundColor: "#3FAB88",
                  opacity: 0,
                }}
              />
            );
          })}
        </div>
      )}
      {children}
    </>
  );
}