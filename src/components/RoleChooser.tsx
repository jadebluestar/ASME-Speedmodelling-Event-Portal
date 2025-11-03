import { motion } from "motion/react";
import { WireframeBackground } from "./WireframeBackground";
import { User, Shield } from "lucide-react";

interface RoleChooserProps {
  onSelectRole: (role: "participant" | "admin") => void;
}

export function RoleChooser({ onSelectRole }: RoleChooserProps) {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <WireframeBackground />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-4xl mx-4"
      >
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-12"
        >
          Select Your Role
        </motion.h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Participant Card */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ 
              scale: 1.05, 
              y: -10,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole("participant")}
            className="glass-card p-8 rounded-2xl cursor-pointer group relative overflow-hidden"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/20"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            <div className="relative z-10">
              <motion.div
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-secondary/20 flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <User className="w-12 h-12 text-secondary" />
              </motion.div>
              
              <h3 className="text-center mb-3">Participant</h3>
              <p className="text-center text-sm text-muted-foreground">
                Join the competition and submit your CAD models
              </p>
              
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-secondary"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
          
          {/* Admin Card */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ 
              scale: 1.05, 
              y: -10,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole("admin")}
            className="glass-card p-8 rounded-2xl cursor-pointer group relative overflow-hidden"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/20"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            
            <div className="relative z-10">
              <motion.div
                className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Shield className="w-12 h-12 text-primary" />
              </motion.div>
              
              <h3 className="text-center mb-3">Admin</h3>
              <p className="text-center text-sm text-muted-foreground">
                Manage the competition and view live results
              </p>
              
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
