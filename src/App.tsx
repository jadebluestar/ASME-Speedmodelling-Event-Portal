import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { RoleChooser } from "./components/RoleChooser";
import { LoginScreen } from "./components/LoginScreen";
import { ParticipantDashboard } from "./components/ParticipantDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { useCompetition } from "./hooks/useCompetition";
import { useParticipants } from "./hooks/useParticipants";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { formatTime, calculateScore } from "./lib/utils";
import { exportToCSV } from "./lib/csv";
import type { Participant } from "./lib/types";

type Screen = "welcome" | "role-chooser" | "login" | "dashboard";
type Role = "participant" | "admin" | null;

interface ParticipantData {
  name: string;
  email: string;
  college: string;
  hasSubmitted?: boolean;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [role, setRole] = useState<Role>(null);
  const [participantData, setParticipantData] = useState<ParticipantData | null>(null);

  // Hooks for competition, participants, and leaderboard
  const competition = useCompetition();
  const participants = useParticipants();
  const leaderboard = useLeaderboard();

  const handleLoginClick = () => {
    setCurrentScreen("role-chooser");
  };

  const handleRoleSelect = (selectedRole: "participant" | "admin") => {
    setRole(selectedRole);
    setCurrentScreen("login");
  };

  const handleLogin = async (data: any) => {
    try {
      if (role === "participant") {
        // Register participant with Supabase
        const participant = await participants.registerParticipant(
          data.name,
          data.email,
          data.college
        );

        // Check if participant has already submitted
        const existing = await participants.getParticipant(data.email);
        const hasSubmitted = !!(existing?.file_url || existing?.time_submitted);

        // Store participant data
        setParticipantData({
          name: participant.name,
          email: participant.email,
          college: participant.college,
          hasSubmitted,
        });
      } else {
        // Admin login - credentials are validated in LoginScreen
        // Just proceed to dashboard
      }

      setCurrentScreen("dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.message || "Login failed. Please try again.");
    }
  };

  const handleBackToRoleChooser = () => {
    setCurrentScreen("role-chooser");
    setRole(null);
  };

  const handleLogout = () => {
    setCurrentScreen("welcome");
    setRole(null);
    setParticipantData(null);
  };

  const handleStartCompetition = async (material: string, refWeight: number) => {
    try {
      await competition.start(material, refWeight);
      alert("Competition started! Participants can now submit.");
    } catch (error: any) {
      console.error("Error starting competition:", error);
      alert(error.message || "Failed to start competition. Please try again.");
    }
  };

  const handleUpdateMaterial = async (material: string, refWeight?: number) => {
    try {
      await competition.updateMaterial(material, refWeight);
    } catch (error: any) {
      console.error("Error updating material:", error);
      // Don't show alert for material updates to avoid spam
    }
  };

  const handlePauseCompetition = async () => {
    try {
      await competition.pause();
      alert("Timer paused.");
    } catch (error: any) {
      console.error("Error pausing competition:", error);
      alert(error.message || "Failed to pause competition.");
    }
  };

  const handleResumeCompetition = async () => {
    try {
      await competition.resume();
      alert("Competition resumed.");
    } catch (error: any) {
      console.error("Error resuming competition:", error);
      alert(error.message || "Failed to resume competition.");
    }
  };

  const handleStopCompetition = async () => {
    if (!confirm("Are you sure you want to stop the competition? This will disable all submissions.")) {
      return;
    }

    try {
      await competition.stop();
      alert("Competition stopped successfully.");
    } catch (error: any) {
      console.error("Error stopping competition:", error);
      alert(error.message || "Failed to stop competition.");
    }
  };

  const handleResetCompetition = async () => {
    const confirmed = confirm(
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

    try {
      // 1) Reset competition state
      await competition.reset();

      // 2) Clear all participant submissions (keep registrations)
      if (participants.resetSubmissions) {
        await participants.resetSubmissions('clear');
      }

      // 3) Refresh lists
      await Promise.all([participants.refresh(), leaderboard.refresh()]);

      alert("✅ Competition has been completely reset!\n\nAll data cleared.");
    } catch (error: any) {
      console.error("Error resetting competition:", error);
      alert(error.message || "Failed to reset competition.");
    }
  };

  const handleRefreshLeaderboard = async () => {
    await leaderboard.refresh();
  };

  const handleExportResults = () => {
    try {
      exportToCSV(leaderboard.entries, "competition_results.csv");
      alert("Results exported successfully!");
    } catch (error: any) {
      console.error("Export error:", error);
      alert("Failed to export results.");
    }
  };

  const handleUploadDrawing = async (file: File) => {
    try {
      await competition.uploadDrawing(file);
      alert(`✅ CAD drawing "${file.name}" uploaded successfully! Participants can now download it.`);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to upload drawing.");
    }
  };

  const handleParticipantUpload = async (file: File, weight: number) => {
    if (!participantData) {
      alert("❌ Participant data not found. Please log in again.");
      return;
    }

    if (!competition.referenceWeight || competition.referenceWeight <= 0) {
      alert("❌ Reference weight not set. Please wait for admin to configure the competition.");
      return;
    }

    try {
      // Calculate score before submission for display
      const tolerance = competition.competition?.tolerance || 5;
      const calculatedScore = calculateScore(weight, competition.referenceWeight, tolerance);

      console.log('Starting CAD file upload to Supabase submissions bucket...');
      console.log('File:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      // Upload CAD file to Supabase submissions bucket
      await participants.submitCAD(
        participantData.email,
        file,
        weight,
        competition.referenceWeight,
        tolerance
      );

      console.log('CAD file uploaded successfully to submissions bucket');

      // Refresh participants and leaderboard to get updated data
      await Promise.all([
        participants.refresh(),
        leaderboard.refresh()
      ]);

      // Update local state
      setParticipantData({
        ...participantData,
        hasSubmitted: true,
      });

      alert(
        `✅ Submission Successful!\n\n` +
        `📁 File: ${file.name}\n` +
        `📦 Stored in: Supabase submissions bucket\n\n` +
        `Your Weight: ${weight.toFixed(3)} kg\n` +
        `Reference Weight: ${competition.referenceWeight.toFixed(3)} kg\n` +
        `Your Score: ${calculatedScore.toFixed(2)}/100\n\n` +
        `Your timer has stopped. Check the leaderboard!`
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Provide specific error messages based on error type
      let errorMessage = "❌ Upload failed. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        errorMessage = "❌ Upload was cancelled or aborted. Please try again.";
      } else if (error.message?.includes('timeout') || error.message?.includes('network')) {
        errorMessage = "❌ Network error or timeout. Please check your connection and try again.";
      } else if (error.message?.includes('bucket') || error.message?.includes('storage')) {
        errorMessage = "❌ Storage bucket error. Please contact admin to check Supabase configuration.";
      } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
        errorMessage = "❌ Permission denied. Please contact admin to check storage permissions.";
      }
      
      alert(errorMessage);
      throw error; // Re-throw so component can handle it
    }
  };

  const handleDownloadDrawing = () => {
    if (!competition.drawingUrl) {
      alert("⚠️ CAD drawing not available yet. Wait for Admin to Upload");
    } else {
      window.open(competition.drawingUrl, '_blank');
    }
  };

  const handleCheckStatus = () => {
    if (competition.status === "active") {
      alert("🟢 Competition is ACTIVE!\n\nYou can upload your CAD model now.");
    } else if (competition.status === "paused") {
      alert("🟡 Competition is PAUSED.\n\nPlease wait for the admin to resume.");
    } else if (competition.status === "expired") {
      alert("🔴 Competition has ENDED.\n\nNo more submissions are allowed.");
    } else {
      alert("🔴 Competition has not started yet.\n\nPlease wait for the admin to start the competition.");
    }
  };

  const pageTransition = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as const,
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-background text-foreground">
      <AnimatePresence mode="wait">
        {currentScreen === "welcome" && (
          <motion.div key="welcome" {...pageTransition}>
            <WelcomeScreen onLogin={handleLoginClick} />
          </motion.div>
        )}

        {currentScreen === "role-chooser" && (
          <motion.div key="role-chooser" {...pageTransition}>
            <RoleChooser onSelectRole={handleRoleSelect} />
          </motion.div>
        )}

        {currentScreen === "login" && role && (
          <motion.div key="login" {...pageTransition}>
            <LoginScreen
              role={role}
              onLogin={handleLogin}
              onBack={handleBackToRoleChooser}
            />
          </motion.div>
        )}

        {currentScreen === "dashboard" && role === "participant" && participantData && (
          <motion.div key="participant-dashboard" {...pageTransition}>
            <ParticipantDashboard
              participantData={participantData}
              timer={formatTime(competition.elapsed)}
              status={competition.status}
              materialType={competition.material || "Waiting for admin..."}
              drawingUrl={competition.drawingUrl}
              hasSubmitted={participantData.hasSubmitted || false}
              onLogout={handleLogout}
              onUpload={handleParticipantUpload}
              onDownloadDrawing={handleDownloadDrawing}
              onCheckStatus={handleCheckStatus}
            />
          </motion.div>
        )}

        {currentScreen === "dashboard" && role === "admin" && (
          <motion.div key="admin-dashboard" {...pageTransition}>
            <AdminDashboard
              timer={formatTime(competition.elapsed)}
              status={competition.status}
              participantCount={participants.participantCount}
              submissionCount={participants.submissionCount}
              leaderboard={leaderboard.entries}
              material={competition.material}
              referenceWeight={competition.referenceWeight}
              drawingUrl={competition.drawingUrl}
              onLogout={handleLogout}
              onStartCompetition={handleStartCompetition}
              onUpdateMaterial={handleUpdateMaterial}
              onPauseCompetition={handlePauseCompetition}
              onResumeCompetition={handleResumeCompetition}
              onStopCompetition={handleStopCompetition}
              onResetCompetition={handleResetCompetition}
              onRefreshLeaderboard={handleRefreshLeaderboard}
              onExportResults={handleExportResults}
              onUploadDrawing={handleUploadDrawing}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}