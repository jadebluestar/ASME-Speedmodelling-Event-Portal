import React, { useState } from "react";
import { motion } from "motion/react";
import { WireframeBackground } from "./WireframeBackground";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft } from "lucide-react";

interface LoginScreenProps {
  role: "participant" | "admin";
  onLogin: (data: any) => void;
  onBack: () => void;
}

export function LoginScreen({ role, onLogin, onBack }: LoginScreenProps) {
  // Participant fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  
  // Admin fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (role === "participant") {
      if (!name.trim() || !email.trim() || !college.trim()) {
        alert("All fields are required.");
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }
      
      onLogin({ name: name.trim(), email: email.trim(), college: college.trim() });
    } else {
      // Admin login with hardcoded credentials
      if (!username.trim() || !password.trim()) {
        alert("Please enter both username and password.");
        return;
      }
      
      if (username === "admin" && password === "bigdawgs69") {
        onLogin({ username: username.trim() });
      } else {
        alert("Invalid admin credentials.");
      }
    }
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <WireframeBackground />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotateY: -90 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        exit={{ scale: 0.8, opacity: 0, rotateY: 90 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass-card p-10 rounded-2xl max-w-md w-full mx-4 relative z-10"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex justify-center mb-6"
          >
            <img
              src="/logo.jpg"
              alt="Logo"
              className="h-20 w-auto object-contain"
              onError={(e) => {
                // Fallback if logo doesn't exist
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </motion.div>
          
          <h2 className="text-center mb-2">
            {role === "participant" ? "Participant Login" : "Admin Login"}
          </h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            {role === "participant" 
              ? "Enter your details to join the competition" 
              : "Enter your admin credentials"}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {role === "participant" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <motion.div whileFocus={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-input-background border-border focus:border-secondary focus:glow-accent transition-all duration-300"
                      required
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">College Email</Label>
                  <motion.div whileFocus={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@college.edu"
                      className="bg-input-background border-border focus:border-secondary focus:glow-accent transition-all duration-300"
                      required
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="college">College Name</Label>
                  <motion.div whileFocus={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                    <Input
                      id="college"
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="Your college name"
                      className="bg-input-background border-border focus:border-secondary focus:glow-accent transition-all duration-300"
                      required
                    />
                  </motion.div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Admin Username</Label>
                  <motion.div whileFocus={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter admin username"
                      className="bg-input-background border-border focus:border-secondary focus:glow-accent transition-all duration-300"
                      required
                    />
                  </motion.div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <motion.div whileFocus={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="bg-input-background border-border focus:border-secondary focus:glow-accent transition-all duration-300"
                      required
                    />
                  </motion.div>
                </div>
              </>
            )}
            
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-orange-600 hover:from-orange-600 hover:to-primary transition-all duration-300"
                size="lg"
              >
                Enter Competition
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
