"use client"

import type { ReactNode } from "react"
import { motion, type Variants } from "framer-motion"
import CountUp from "react-countup"
import { cn } from "@/lib/utils"

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
}

export function Reveal({
  children,
  className,
  delay = 0,
  amount = 0.2,
}: {
  children: ReactNode
  className?: string
  delay?: number
  amount?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: fadeUpVariants.hidden,
        show: {
          ...fadeUpVariants.show,
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerReveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

export function CountUpStat({
  end,
  suffix = "",
  prefix = "",
  className,
}: {
  end: number
  suffix?: string
  prefix?: string
  className?: string
}) {
  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      <CountUp end={end} duration={2.1} enableScrollSpy scrollSpyOnce useEasing />
      {suffix}
    </span>
  )
}
