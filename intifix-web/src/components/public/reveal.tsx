import { motion, useReducedMotion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

interface RevealProps {
  children: ReactNode
  className?: string
  /** Delay in seconds before the animation starts. */
  delay?: number
  /** Direction the element travels in from. */
  from?: "up" | "down" | "left" | "right" | "none"
}

const OFFSET = 24

/**
 * Scroll-reveal wrapper. Fades + slides content into view once, with a soft
 * easing curve tuned to feel like Airbnb/Stripe section reveals. Respects the
 * user's reduced-motion preference by disabling movement entirely.
 */
export function Reveal({ children, className, delay = 0, from = "up" }: RevealProps) {
  const reduceMotion = useReducedMotion()

  const axis: Record<NonNullable<RevealProps["from"]>, { x?: number; y?: number }> = {
    up: { y: OFFSET },
    down: { y: -OFFSET },
    left: { x: OFFSET },
    right: { x: -OFFSET },
    none: {},
  }

  const variants: Variants = {
    hidden: { opacity: 0, ...(reduceMotion ? {} : axis[from]) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
    },
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Container that staggers the reveal of its direct <RevealItem> children.
 * Use for grids of cards/steps so they cascade rather than appear at once.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode
  className?: string
  stagger?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  )
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  const variants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : OFFSET },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}
