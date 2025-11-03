import { motion } from "motion/react";

export function WireframeBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10">
      <svg className="wireframe-bg w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-secondary" />
          </pattern>
          <pattern id="smallGrid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="currentColor" strokeWidth="0.25" className="text-secondary" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#smallGrid)" />
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Geometric shapes */}
        <motion.circle
          cx="20%"
          cy="30%"
          r="100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-accent"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.polygon
          points="80,20 100,60 60,60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary"
          style={{ transform: "translate(70%, 70%)" }}
          animate={{
            rotate: [0, 120, 240, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.rect
          x="70%"
          y="20%"
          width="80"
          height="80"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-secondary"
          animate={{
            rotate: [0, 90, 180, 270, 360],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}
