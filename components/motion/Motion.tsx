"use client";

import { useEffect, useRef, useState } from "react";
import {
  MotionConfig,
  animate,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";

/**
 * Small motion kit for the landing page. Every piece honours the OS
 * "reduce motion" setting through <MotionProvider>.
 */

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** Fades and slides its children in the first time they scroll into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  x = 0,
  rotate = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  x?: number;
  rotate?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x, rotate }}
      whileInView={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/** A list whose items cascade in one after another. */
export function StaggerList({
  children,
  className,
  ordered = false,
}: {
  children: React.ReactNode;
  className?: string;
  ordered?: boolean;
}) {
  const List = ordered ? motion.ol : motion.ul;
  return (
    <List
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </List>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.li className={className} variants={itemVariants}>
      {children}
    </motion.li>
  );
}

/** A dashed seam that sews itself left-to-right when it scrolls into view. */
export function SewLine({ className }: { className?: string }) {
  return (
    <motion.div
      aria-hidden
      className={className}
      style={{ originX: 0 }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
    />
  );
}

/** The inspection stamp lands on the label with a thud. */
export function StampIn({
  children,
  className,
  rotate = 14,
  delay = 0.6,
}: {
  children: React.ReactNode;
  className?: string;
  rotate?: number;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={className}
      initial={{ opacity: 0, scale: 2.2, rotate: rotate - 22 }}
      animate={{ opacity: 0.88, scale: 1, rotate }}
      transition={{ type: "spring", stiffness: 520, damping: 22, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Background layer that drifts slower than the page (parallax). */
export function Parallax({
  children,
  className,
  distance = 140,
}: {
  children: React.ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, distance]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1.18]);
  return (
    <div ref={ref} className={`absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}>
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Counts the number inside a stat like "−35%" or "+5,4%" up from zero
 * when it scrolls into view, keeping its sign, suffix and decimal mark.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const m = value.match(/^(\D*)(\d+(?:[.,]\d+)?)(.*)$/);
  const [shown, setShown] = useState(value);

  // Reset to zero as soon as we hydrate so the count starts from nothing.
  useEffect(() => {
    if (!m || reduce || inView) return;
    setShown(m[1] + m[2].replace(/\d/g, "0") + m[3]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!m || !inView || reduce) return;
    const [, pre, num, post] = m;
    const sep = num.includes(",") ? "," : ".";
    const decimals = num.split(/[.,]/)[1]?.length ?? 0;
    const target = parseFloat(num.replace(",", "."));
    const controls = animate(0, target, {
      duration: 1.4,
      ease: EASE,
      onUpdate: (v) => setShown(pre + v.toFixed(decimals).replace(".", sep) + post),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value]);

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}
