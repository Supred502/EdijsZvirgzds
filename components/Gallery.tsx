"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Image grid; clicking a picture grows it into a full-screen view. Esc, ←/→ and clicking outside work.
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  function close() {
    setOpen(null);
    lastTrigger.current?.focus(); // give keyboard focus back to the picture that opened it
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((src, i) => (
          <motion.button
            key={src}
            layoutId={`img-${src}`}
            onClick={(e) => {
              lastTrigger.current = e.currentTarget;
              setOpen(i);
            }}
            aria-label={`Open picture ${i + 1} of ${images.length}`}
            className="relative aspect-[16/10] cursor-zoom-in overflow-hidden rounded-card bg-surface"
          >
            <Image src={src} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${title}: picture ${open + 1} of ${images.length}`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/90 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div layoutId={`img-${images[open]}`} className="relative h-full max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-card">
              <Image src={images[open]} alt="" fill sizes="100vw" className="object-contain" />
            </motion.div>
            <button ref={closeRef} onClick={close} className="btn absolute right-4 top-4" aria-label="Close">✕</button>
            {images.length > 1 && <p className="absolute bottom-4 text-sm text-text-dim">{open + 1} / {images.length} · use ← → keys</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
