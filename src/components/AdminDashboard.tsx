import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { WireframeBackground } from "./WireframeBackground";
import { AnimatedCounter } from "./AnimatedCounter";
import { Leaderboard } from "./Leaderboard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LogOut, Play, Pause, Square, Upload, RefreshCw, Download, RotateCcw } from "lucide-react";
import { debounce } from "../lib/utils";

interface AdminDashboardProps {
  timer: string;
  status: "waiting" | "active" | "paused" | "expired";
  participantCount: number;
  submissionCount: number;
  leaderboard: any[];
  material?: string;
  referenceWeight?: number;
  drawingUrl?: string | null;
  onLogout: () => void;
  onStartCompetition: (material: string, refWeight: number) => void;
  onUpdateMaterial?: (material: string, refWeight?: number) => void;
  onPauseCompetition: () => void;
  onResumeCompetition: () => void;
  onStopCompetition: () => void;
  onResetCompetition: () => void;
  onRefreshLeaderboard: () => void;
  onExportResults: () => void;
  onUploadDrawing: (file: File) => void;
}

export function AdminDashboard({
  timer,
  status,
  participantCount,
  submissionCount,
  leaderboard,
  material = "",
  referenceWeight = 0,
  drawingUrl = null,
  onLogout,
  onStartCompetition,
  onUpdateMaterial,
  onPauseCompetition,
  onResumeCompetition,
  onStopCompetition,
  onResetCompetition,
  onRefreshLeaderboard,
  onExportResults,
  onUploadDrawing,
}: AdminDashboardProps) {
  const [materialType, setMaterialType] = useState(material);
  const [referenceWeightInput, setReferenceWeightInput] = useState(referenceWeight ? referenceWeight.toString() : "");
  const [drawingUploaded, setDrawingUploaded] = useState(!!drawingUrl);

  // Update local state when props change
  useEffect(() => {
    setMaterialType(material);
    setReferenceWeightInput(referenceWeight ? referenceWeight.toString() : "");
    setDrawingUploaded(!!drawingUrl);
  }, [material, referenceWeight, drawingUrl]);

  // Debounced material update to avoid too many database calls
  const debouncedMaterialUpdate = useCallback(
    debounce((mat: string, weight?: number) => {
      if (onUpdateMaterial && mat.trim()) {
        onUpdateMaterial(mat.trim(), weight);
      }
    }, 1000), // Wait 1 second after user stops typing
    [onUpdateMaterial]
  );

  const handleStart = () => {
    if (status === "paused") {
      onResumeCompetition();
      return;
    }
    
    const weight = parseFloat(referenceWeightInput);
    if (!materialType.trim() || !weight || isNaN(weight)) {
      alert("Please enter both material and reference weight before starting.");
      return;
    }
    onStartCompetition(materialType.trim(), weight);
  };


  const handleReset = () => {
    const confirmed = window.confirm(
      "⚠️ WARNING ⚠️\n\n" +
      "This will DELETE ALL:\n" +
      "• Participant submissions\n" +
      "• Scores and rankings\n" +
      "• Timer data\n" +
      "• Uploaded files\n\n" +
      "This action CANNOT be undone!\n\n" +
      "Are you sure you want to reset the competition?"
    );

    if (!confirmed) return;

    const doubleCheck = prompt('Type "RESET" (all caps) to confirm deletion:');
    if (doubleCheck !== "RESET") {
      alert("Reset cancelled.");
      return;
    }

    onResetCompetition();
    setMaterialType("");
    setReferenceWeightInput("");
    setDrawingUploaded(false);
  };

  const handleDrawingUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.step,.stl";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          await onUploadDrawing(file);
          setDrawingUploaded(true);
        } catch (error) {
          // Error handling is done in App.tsx
        }
      }
    };
    
    input.click();
  };

  return (
    <div className="relative w-full min-h-screen overflow-auto pb-20">
      <WireframeBackground />
      
      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary to-orange-600 px-6 py-4 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h2 className="text-white">Admin Dashboard</h2>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </motion.div>
      
      {/* Stats Bar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="relative z-10 pt-24 pb-4 px-4"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-lg bg-green-500/20 border-2 border-green-500">
            <p className="text-xs text-green-500 mb-1 uppercase tracking-wider">Participants</p>
            <p className="text-3xl timer-display text-green-500">
              <AnimatedCounter value={participantCount} />
            </p>
          </div>
          
          <div className="glass-card p-4 rounded-lg bg-green-500/20 border-2 border-green-500">
            <p className="text-xs text-green-500 mb-1 uppercase tracking-wider">Submissions</p>
            <p className="text-3xl timer-display text-green-500">
              <AnimatedCounter value={submissionCount} />
            </p>
          </div>
          
          <div className="glass-card p-4 rounded-lg bg-green-500/20 border-2 border-green-500">
            <p className="text-xs text-green-500 mb-1 uppercase tracking-wider">Competition Timer</p>
            <p className="text-2xl timer-display text-green-500">{timer}</p>
          </div>
          
          <Button
            onClick={handleDrawingUpload}
            className="h-full bg-green-500 hover:bg-green-600 text-white min-h-[80px]"
          >
            <Upload className="w-5 h-5 mr-2" />
            {drawingUploaded ? "✓ Drawing Uploaded" : "Upload CAD Drawing"}
          </Button>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="relative z-10 px-4 pb-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-6">
          
          {/* Control Panel */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="space-y-4"
          >
            <div className="glass-card p-6 rounded-lg">
              <h3 className="mb-4 text-center text-primary">Competition Controls</h3>
              
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-material">Material Type</Label>
                  <Input
                    id="admin-material"
                    type="text"
                    value={materialType}
                    onChange={(e) => {
                      setMaterialType(e.target.value);
                      // Save material to database in real-time (debounced) for participant sync
                      debouncedMaterialUpdate(e.target.value);
                    }}
                    placeholder="e.g., Steel, Aluminum"
                    className="bg-input-background border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin-weight">Reference Weight (kg)</Label>
                  <Input
                    id="admin-weight"
                    type="number"
                    step="0.01"
                    value={referenceWeightInput}
                    onChange={(e) => {
                      setReferenceWeightInput(e.target.value);
                      // Save weight to database in real-time (debounced) for participant sync
                      const weight = parseFloat(e.target.value);
                      if (!isNaN(weight) && e.target.value.trim()) {
                        debouncedMaterialUpdate(materialType, weight);
                      }
                    }}
                    placeholder="e.g., 2.5"
                    className="bg-input-background border-border"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleStart}
                    disabled={status === "active"}
                    className="w-full bg-[#20c997] hover:bg-[#1ab386] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden text-white"
                  >
                    <motion.div
                      className="absolute inset-0 bg-[#1ab386]"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                    <Play className="w-4 h-4 mr-2 relative z-10" />
                    <span className="relative z-10">{status === "paused" ? "RESUME" : status === "active" ? "STARTED" : "START"}</span>
                  </Button>
                </motion.div>
                
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onPauseCompetition}
                    disabled={status !== "active"}
                    className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                     PAUSE
                  </Button>
                </motion.div>
                
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onStopCompetition}
                    disabled={status === "waiting" || status === "expired"}
                    className="w-full bg-destructive hover:bg-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                  >
                    <Square className="w-4 h-4 mr-2" />
                     STOP
                  </Button>
                </motion.div>
                
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleReset}
                    className="w-full bg-destructive hover:bg-destructive/80 text-white"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                     RESET ALL
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
          
          {/* Leaderboard */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="lg:col-span-3"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3>🏆 Live Leaderboard</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshLeaderboard}
                  className="border-secondary text-secondary hover:bg-secondary/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportResults}
                  className="border-green-500 text-green-500 hover:bg-green-500/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              </div>
            </div>
            
            <Leaderboard entries={leaderboard} />
          </motion.div>
        </div>
      </div>
      
    </div>
  );
}
