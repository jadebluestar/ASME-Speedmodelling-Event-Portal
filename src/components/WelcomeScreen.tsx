import { motion } from "motion/react";
import { WireframeBackground } from "./WireframeBackground";
import { Button } from "./ui/button";

interface WelcomeScreenProps {
  onLogin: () => void;
}

export function WelcomeScreen({ onLogin }: WelcomeScreenProps) {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <WireframeBackground />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-card p-12 rounded-2xl max-w-md w-full mx-4 relative z-10"
      >
        <motion.div
          initial={{ rotateY: -180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-primary mb-4">Welcome to EFx KLSGIT!</h1>
          
          <motion.div 
            className="mb-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <img 
              src="/logo.png" 
              alt="EFx KLSGIT Logo" 
              className="h-24 w-auto mx-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </motion.div>
          
          <div className="relative inline-block mb-6">
            <motion.div
              className="text-7xl mb-2"
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          
          <p className="text-muted-foreground mb-2">Speedmodelling Event</p>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Button
            onClick={onLogin}
            className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-primary pulse-shadow transition-all duration-300"
            size="lg"
          >
            Login
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          Built with ❤️ by ASME Student Section KLSGIT
        </motion.div>
      </motion.div>
    </div>
  );
}
