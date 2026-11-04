"use client";

import { MotionConfig, motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const; // fast start, soft landing

// Respects the visitor's "reduce motion" setting for every Motion animation below it
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

// Hero name: letters rise in one after another
export function HeroName({ first, rest }: { first: string; rest: string }) {
  const name = `${first} ${rest}`.trim();
  let i = 0; // running letter index, for the stagger
  return (
    <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl" aria-label={name}>
      {/* letters animate one by one; real spaces sit between whole words so they keep their width and can wrap */}
      {name.split(/\s+/).map((word, w) => (
        <span key={w} aria-hidden="true">
          {w > 0 && " "}
          <span className="inline-block whitespace-nowrap">
            {[...word].map((ch) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: "0.4em" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i++ * 0.035 }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        </span>
      ))}
    </h1>
  );
}
