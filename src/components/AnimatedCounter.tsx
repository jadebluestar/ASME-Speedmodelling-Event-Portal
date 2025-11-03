import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 1 }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration,
      ease: "easeOut",
    });
    
    return controls.stop;
  }, [value, count, duration]);

  return (
    <motion.span className="tabular-nums">
      {rounded}
    </motion.span>
  );
}
