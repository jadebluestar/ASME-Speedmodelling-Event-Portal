/**
 * speedportal/src/participant.js
 * Participant dashboard logic - view competition, upload CAD, track time
 */

// Check authorization
if (localStorage.getItem("role") !== "participant") {
    window.location.href = "index.html";
}

// Get participant info from localStorage
const participantName = localStorage.getItem("participant_name");
const participantEmail = localStorage.getItem("participant_email");
const participantCollege = localStorage.getItem("participant_college");

// Get DOM elements
const uploadBtn = document.getElementById("upload-cad-btn");
const downloadDrawingBtn = document.getElementById("download-drawing-btn");
const logoutBtn = document.getElementById("logout-btn");
const statusBtn = document.getElementById("competition-status-btn");
const materialInput = document.getElementById("material-value");
const weightInput = document.getElementById("weight-value");
const timerDisplay = document.getElementById("comp-timer");

// State
let competitionActive = false;
let hasSubmitted = false;
let timerInterval = null;
let drawingUrl = null;
const COMPETITION_ID = 1;

/**
 * Initialize participant dashboard
 */
async function initDashboard() {
    await checkCompetitionStatus();
    await fetchAdminDrawing();
    await loadParticipantData();
    setupRealtimeSubscriptions();
}

/**
 * Check if competition is active and load details
 */
async function checkCompetitionStatus() {
    try {
        const { data, error } = await supabase
            .from("competitions")
            .select("*")
            .eq("id", COMPETITION_ID)
            .single();

        if (error) throw error;

        if (data) {
            competitionActive = data.is_active;
            
            // Display material (reference weight is hidden from participants)
            materialInput.value = data.material || "Waiting...";
            
            // Clear the weight input - participant enters their own
            weightInput.value = "";
            weightInput.placeholder = competitionActive 
                ? "Enter your calculated weight" 
                : "Competition not started";
            weightInput.disabled = !competitionActive;

            // Start timer if competition is active
            if (data.is_active && data.start_time) {
                startTimerFromStartTime(data.start_time);
            } else {
                timerDisplay.textContent = "00:00:00";
            }
             drawingUrl = data.drawing_url; // Get URL from competition
            downloadDrawingBtn.disabled = !drawingUrl; // Enable/disable button
    // 
            // Update button states
            updateButtonStates();
        }
    } catch (err) {
        console.error("Error checking competition status:", err);
    }
}

/**
 * Load participant's submission data
 */
async function loadParticipantData() {
    try {
        const { data, error } = await supabase
            .from("participants")
            .select("*")
            .eq("email", participantEmail)
            .single();

        if (error) throw error;

        if (data && data.file_url) {
            hasSubmitted = true;
            uploadBtn.disabled = true;
            uploadBtn.textContent = "Already Submitted";
            uploadBtn.classList.remove("green-btn");
            uploadBtn.classList.add("gray-btn");
        }
    } catch (err) {
        console.error("Error loading participant data:", err);
    }
}

/**
 * Start timer based on competition start time
 */
function startTimerFromStartTime(startTimeISO) {
    const startTime = new Date(startTimeISO);
    
    // Clear any existing timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Update timer every second
    timerInterval = setInterval(() => {
        if (!competitionActive || hasSubmitted) {
            clearInterval(timerInterval);
            return;
        }

        const now = new Date();
        const elapsed = Math.floor((now - startTime) / 1000);
        timerDisplay.textContent = formatTime(elapsed);
    }, 1000);

    // Initial update
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);
    timerDisplay.textContent = formatTime(elapsed);
}

/**
 * Update button states based on competition status
 */
function updateButtonStates() {
    if (hasSubmitted) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Already Submitted ✓";
        uploadBtn.classList.remove("green-btn");
        uploadBtn.classList.add("gray-btn");
        statusBtn.textContent = "Submission Complete";
        statusBtn.classList.remove("green-btn");
        statusBtn.classList.add("gray-btn");
    } else if (!competitionActive) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Competition Not Started";
        statusBtn.textContent = "Waiting to Start";
        statusBtn.classList.remove("green-btn");
        statusBtn.classList.add("orange-btn");
    } else {
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload CAD Model";
        uploadBtn.classList.add("green-btn");
        statusBtn.textContent = "Competition Active";
        statusBtn.classList.add("green-btn");
    }
}

/**
 * Setup real-time subscriptions
 */
function setupRealtimeSubscriptions() {
    // Subscribe to competition changes
    supabase
        .channel("participant-updates")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "competitions" },
            async (payload) => {
                await checkCompetitionStatus();
                await fetchAdminDrawing();
            }
        )
        .subscribe();
}

/**
 * Fetch the latest admin CAD drawing URL
 */
async function fetchAdminDrawing() {
    try {
        const { data, error } = await supabase
            .from("competitions")
            .select("drawing_url")
            .eq("id", COMPETITION_ID)
            .single();

        if (error) throw error;

        drawingUrl = data.drawing_url || null;
        downloadDrawingBtn.disabled = !drawingUrl;
    } catch (err) {
        console.error("Error fetching admin drawing:", err);
        downloadDrawingBtn.disabled = true;
    }
}

// ========== EVENT LISTENERS ==========

/**
 * UPLOAD CAD button
 */
uploadBtn.addEventListener('click', async () => {
    if (!competitionActive) {
        alert("Competition has not started yet!");
        return;
    }

    if (hasSubmitted) {
        alert("You have already submitted!");
        return;
    }

    // Get participant's entered weight
    const participantWeight = parseFloat(weightInput.value);
    
    if (!participantWeight || isNaN(participantWeight) || participantWeight <= 0) {
        alert(" Please enter your calculated weight before uploading!");
        weightInput.focus();
        return;
    }

    const file = await pickFile();
    if (!file) return;

    // Show loading state
    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    try {
        const filePath = `submissions/${participantEmail}-${Date.now()}-${file.name}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("submissions")
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("submissions")
            .getPublicUrl(filePath);

        // Record submission time
        const submissionTime = new Date().toISOString();

        // Get competition details for scoring
        const { data: compData, error: compError } = await supabase
            .from("competitions")
            .select("reference_weight, tolerance")
            .eq("id", 1)
            .single();

        if (compError) throw compError;

        // Calculate score
        const score = calculateScore(
            participantWeight, 
            compData.reference_weight, 
            compData.tolerance
        );

        // Update participant record with weight, file, time, and score
        const { error: updateError } = await supabase
            .from("participants")
            .update({
                file_url: urlData.publicUrl,
                time_submitted: submissionTime,
                submitted_weight: participantWeight,
                score: score
            })
            .eq("email", participantEmail);

        if (updateError) throw updateError;

        // Update local state
        hasSubmitted = true;
        
        // Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Update UI
        updateButtonStates();

        alert(`✅ Submission Successful!\n\n` +
              `Your Weight: ${participantWeight} kg\n` +
              `Reference Weight: ${compData.reference_weight} kg\n` +
              `Your Score: ${score.toFixed(2)}/100\n\n` +
              `Your timer has stopped. Check the leaderboard!`);
    } catch (err) {
        console.error("Upload error:", err);
        alert("❌ Upload failed. Please try again.");
        
        // Reset button state
        uploadBtn.disabled = false;
        uploadBtn.textContent = "Upload CAD Model";
    }
});
/**
 * DOWNLOAD ADMIN DRAWING button
 */
downloadDrawingBtn.addEventListener('click', () => {
    if (drawingUrl) {
        window.open(drawingUrl, '_blank'); // Opens drawing in new tab
    } else {
        alert(" CAD drawing not available yet. Wait for Admin to Upload");
    }
});

/**
 * COMPETITION STATUS button
 */
statusBtn.addEventListener('click', async () => {
    await checkCompetitionStatus();
    
    if (competitionActive) {
        alert("🟢 Competition is ACTIVE!\n\nYou can upload your CAD model now.");
    } else {
        alert("🔴 Competition has not started yet.\n\nPlease wait for the admin to start the competition.");
    }
});

/**
 * LOGOUT button
 */
logoutBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.clear();
        window.location.href = "index.html";
    }
});

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});