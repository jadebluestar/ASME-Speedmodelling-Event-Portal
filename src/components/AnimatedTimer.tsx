import { motion, AnimatePresence } from "motion/react";

interface AnimatedTimerProps {
  time: string; // Format: "MM:SS"
  status: "waiting" | "active" | "paused" | "expired";
}

export function AnimatedTimer({ time, status }: AnimatedTimerProps) {
  const digits = time.split("");
  
  const statusColors = {
    waiting: "bg-primary/20 border-primary",
    active: "bg-green-500/20 border-green-500",
    paused: "bg-yellow-500/20 border-yellow-500",
    expired: "bg-destructive/20 border-destructive",
  };
  
  const statusLabels = {
    waiting: "Waiting to Start",
    active: "Competition Active",
    paused: "Paused",
    expired: "Time's Up",
  };

  return (
    <div className={`relative p-6 rounded-lg border-2 transition-all duration-300 ${statusColors[status]}`}>
      <div className="absolute top-2 right-2">
        <span className="text-xs uppercase tracking-wider opacity-80">{statusLabels[status]}</span>
      </div>
      
      <div className="flex items-center justify-center gap-1 timer-display">
        {digits.map((digit, index) => (
          <div key={index} className="relative overflow-hidden">
            {digit === ":" ? (
              <div className="text-5xl mx-1 opacity-80">:</div>
            ) : (
              <div className="relative h-20 w-12 flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={digit}
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      mass: 1,
                    }}
                    className="absolute text-6xl"
                  >
                    {digit}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
