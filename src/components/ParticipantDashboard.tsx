import { motion } from "motion/react";
import { WireframeBackground } from "./WireframeBackground";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Download, Upload, LogOut, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface ParticipantDashboardProps {
  participantData: {
    name: string;
    email: string;
    college: string;
  };
  timer: string;
  status: "waiting" | "active" | "paused" | "expired";
  materialType: string;
  drawingUrl: string | null;
  hasSubmitted: boolean;
  onLogout: () => void;
  onUpload: (file: File, weight: number) => void;
  onDownloadDrawing: () => void;
  onCheckStatus: () => void;
}

export function ParticipantDashboard({ 
  participantData, 
  timer, 
  status,
  materialType,
  drawingUrl,
  hasSubmitted,
  onLogout,
  onUpload,
  onDownloadDrawing,
  onCheckStatus
}: ParticipantDashboardProps) {
  const [weightCalculation, setWeightCalculation] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async () => {
    if (!uploadedFile) {
      alert("Please select a CAD file to upload.");
      return;
    }
    
    const weight = parseFloat(weightCalculation);
    if (!weight || isNaN(weight) || weight <= 0) {
      alert("⚠️ Please enter your calculated weight before uploading!");
      return;
    }

    // Validate file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (uploadedFile.size > maxSize) {
      alert("❌ File is too large. Maximum size is 50MB.");
      return;
    }

    // Validate file type
    const allowedExtensions = ['.step', '.stp', '.stl', '.iges', '.igs', '.zip', '.rar'];
    const fileExtension = '.' + uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      alert(`❌ File type not allowed. Accepted formats: ${allowedExtensions.join(', ')}`);
      return;
    }
    
    try {
      await onUpload(uploadedFile, weight);
      // Clear file selection after successful upload
      setUploadedFile(null);
      setWeightCalculation("");
    } catch (error: any) {
      // Error handling is done in App.tsx, but show user feedback here too
      console.error('Upload error in component:', error);
    }
  };

  const statusColors = {
    waiting: "bg-orange-500/20 border-orange-500 text-orange-500",
    active: "bg-green-500/20 border-green-500 text-green-500",
    paused: "bg-yellow-500/20 border-yellow-500 text-yellow-500",
    expired: "bg-red-500/20 border-red-500 text-red-500",
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
          <div>
            <h2 className="text-white">Participant Dashboard</h2>
            <p className="text-white/80 text-sm">{participantData.name}</p>
          </div>
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
      
      {/* Main Content */}
      <div className="relative z-10 pt-24 px-4 max-w-7xl mx-auto">
        
        {/* Top Action Row */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => {
                if (uploadedFile) {
                  handleSubmit();
                } else {
                  document.getElementById('cad-upload')?.click();
                }
              }}
              disabled={status !== "active" || hasSubmitted || !materialType || materialType === "Waiting for admin..."}
              className="w-full h-20 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-6 h-6 mr-2" />
              {hasSubmitted ? "Already Submitted " : uploadedFile ? "Submit Model" : "Upload CAD Model"}
            </Button>
            <input
              type="file"
              id="cad-upload"
              className="hidden"
              accept=".step,.stp,.stl,.iges,.igs,.zip,.rar"
              onChange={handleFileSelect}
              disabled={hasSubmitted}
            />
          </motion.div>
          
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={onDownloadDrawing}
              disabled={!drawingUrl}
              className="w-full h-20 bg-secondary hover:bg-secondary/80 text-secondary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-6 h-6 mr-2" />
              {drawingUrl ? "Download 2D Drawing" : "Drawing Not Available"}
            </Button>
          </motion.div>
          
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`glass-card p-6 rounded-lg flex flex-col items-center justify-center border-2 ${statusColors[status]}`}
          >
            <p className="text-sm mb-2 opacity-80">Competition Timer</p>
            <p className="timer-display text-4xl">{timer}</p>
          </motion.div>
        </div>
        
        {/* Material & Weight Inputs */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6 rounded-lg"
          >
            <Label htmlFor="material">Material Type</Label>
            <Input
              id="material"
              type="text"
              value={materialType || "Waiting for admin..."}
              readOnly
              className="mt-2 bg-muted cursor-not-allowed"
            />
          </motion.div>
          
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 rounded-lg"
          >
            <Label htmlFor="weight">Your Weight Calculation (g)</Label>
            <Input
              id="weight"
              type="number"
              step="0.001"
              value={weightCalculation}
              onChange={(e) => setWeightCalculation(e.target.value)}
              placeholder={materialType && materialType !== "Waiting for admin..." ? "Enter your calculated weight" : "Wait for admin to set material"}
              disabled={!materialType || materialType === "Waiting for admin..." || status === "expired" || hasSubmitted}
              className="mt-2 bg-input-background border-border focus:border-secondary focus:glow-accent transition-all duration-300"
            />
          </motion.div>
        </div>
        
        {uploadedFile && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-4 rounded-lg mb-6 border-2 border-secondary"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-sm">File Selected</p>
                  <p className="text-xs text-muted-foreground">{uploadedFile.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadedFile(null)}
                disabled={hasSubmitted}
              >
                Remove
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Instructions Card */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-8 rounded-lg mb-6"
        >
          <h3 className="mb-4 pb-3 border-b-2 border-primary"> Competition Instructions</h3>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">▶</span>
              <span>Wait for the admin to start the competition</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">▶</span>
              <span>Once started, the timer will begin automatically</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">▶</span>
              <span>Download the 2D drawing reference from admin</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">▶</span>
              <span>Create an accurate 3D CAD model based on the drawing</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1 font-bold">▶</span>
              <span><strong>Enter YOUR calculated weight</strong> in the weight field above and Upload your completed CAD file when ready</span>
            </li>
           <li className="flex items-start gap-3">
              <span className="text-primary mt-1">▶</span>
              <span>Don't Forget to Log Out After Submitting</span>
            </li>
          </ul>
        </motion.div>
        
        {/* Bottom Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={onCheckStatus}
            className="h-14 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Check Status
          </Button>
        </div>
      </div>
    
    </div>
  );
}
