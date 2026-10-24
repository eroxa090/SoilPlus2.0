"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MotionConfig,
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";

/**
 * Small motion kit for the whole site. Every piece honours the OS
 * "reduce motion" setting, through <MotionProvider> or useReducedMotion.
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

/** A red thread along the header seam that sews itself as the page scrolls. */
export function ScrollThread({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 36, restDelta: 0.001 });
  return <motion.div aria-hidden className={className} style={{ scaleX, originX: 0 }} />;
}

/**
 * A seed packet you can pick up: it tilts toward the mouse pointer and a
 * sheen slides across the paper. Touch and reduced motion get a still card.
 */
export function Tilt({
  children,
  className,
  max = 8,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sheen = useMotionValue(0);
  const spring = { stiffness: 260, damping: 20 };
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring);
  const opacity = useSpring(sheen, { stiffness: 200, damping: 30 });
  const gx = useTransform(px, [0, 1], ["0%", "100%"]);
  const gy = useTransform(py, [0, 1], ["0%", "100%"]);
  const background = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,250,235,0.55), transparent 55%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
    sheen.set(1);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    sheen.set(0);
  };

  return (
    <motion.div
      className={`relative h-full ${className ?? ""}`}
      style={{ rotateX, rotateY, transformPerspective: 700 }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ background, opacity }}
      />
    </motion.div>
  );
}

/** Pulls its child a little toward the pointer, like a button on a magnet. */
export function Magnetic({
  children,
  className,
  strength = 0.22,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const spring = { stiffness: 320, damping: 18, mass: 0.5 };
  const x = useSpring(0, spring);
  const y = useSpring(0, spring);
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };
  return (
    <motion.div className={`inline-flex ${className ?? ""}`} style={{ x, y }} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </motion.div>
  );
}

/**
 * A number that rolls to its new value instead of jumping, with the
 * locale's grouping ("231 840") and a fixed number of decimals.
 */
export function AnimatedNumber(props: {
  value: number;
  locale: string;
  decimals?: number;
  grouping?: boolean;
  className?: string;
}) {
  // Remount on a format change so the old format never animates into the new.
  return <RollingNumber key={`${props.locale}-${props.decimals}-${props.grouping}`} {...props} />;
}

function RollingNumber({
  value,
  locale,
  decimals = 0,
  grouping = true,
  className,
}: {
  value: number;
  locale: string;
  decimals?: number;
  grouping?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mv = useSpring(value, { stiffness: 90, damping: 20, mass: 0.8 });
  const nf = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouping,
      }),
    [locale, decimals, grouping],
  );
  const text = useTransform(() => nf.format(mv.get()));

  useEffect(() => {
    if (reduce) mv.jump(value);
    else mv.set(value);
  }, [mv, value, reduce]);

  return (
    <motion.span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text}
    </motion.span>
  );
}

/** A tick that draws itself, for a step that has just been completed. */
export function DrawnCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.1 }}
      />
    </svg>
  );
}

/** Three hopping seeds: the site-wide "working on it" indicator. */
export function Seeds({ className }: { className?: string }) {
  return (
    <span aria-hidden className={`seeds ${className ?? ""}`}>
      <i />
      <i />
      <i />
    </span>
  );
}

/** A word whose letters are stamped onto the label one after another. */
export function StampLetters({ text, className, delay = 0.2 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          initial={{ opacity: 0, scale: 1.7, rotate: i % 2 ? 9 : -7, y: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 24, delay: delay + i * 0.06 }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}
