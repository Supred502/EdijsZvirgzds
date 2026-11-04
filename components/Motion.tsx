"use client";

import { MotionConfig, motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const; // fast start, soft landing

// Respects the visitor's "reduce motion" setting for every Motion animation below it
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Hero name: letters rise in one after another
export function HeroName({ first, rest }: { first: string; rest: string }) {
  const letters = [...`${first} ${rest}`.trim()];
  return (
    <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl" aria-label={`${first} ${rest}`.trim()}>
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="inline-block"
          initial={{ opacity: 0, y: "0.4em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.035 }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </h1>
  );
}
