"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type Props = HTMLMotionProps<"div"> & {
  /** Pick a visual variant. */
  variant?: "default" | "feature";
  /** Optional eyebrow label shown top-left in uppercase. */
  eyebrow?: string;
  /** Optional small right-aligned meta chip in the header. */
  meta?: React.ReactNode;
  /** Override the card's internal padding (defaults to p-6 sm:p-7). */
  padding?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Bento surface — the atomic container of the Gilded Earth dashboard.
 *
 * The variants share a glass backdrop + 1px low-opacity gold hairline and
 * differ only in how they treat the top-left gradient halo.
 */
const BentoCard = forwardRef<HTMLDivElement, Props>(function BentoCard(
  {
    variant = "default",
    eyebrow,
    meta,
    padding = "p-6 sm:p-7",
    className = "",
    children,
    ...rest
  },
  ref,
) {
  const variantClass = variant === "feature" ? "bento bento-feature" : "bento";

  return (
    <motion.div
      ref={ref}
      {...rest}
      className={`${variantClass} ${padding} ${className}`}
    >
      {/* Subtle koshkar-muiiz texture behind content */}
      <span className="koshkar-pattern pointer-events-none absolute inset-0" aria-hidden />

      {(eyebrow || meta) && (
        <div className="relative mb-5 flex items-center justify-between">
          {eyebrow && (
            <p className="font-sans text-[10px] font-medium uppercase tracking-ultra text-gold/70">
              {eyebrow}
            </p>
          )}
          {meta ? <div className="text-gold/50">{meta}</div> : null}
        </div>
      )}

      <div className="relative">{children}</div>
    </motion.div>
  );
});

export default BentoCard;

/* ---- shared framer-motion stagger presets ---- */
export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.2, 0.8, 0.2, 1] as const },
  },
};
