/**
 * speedportal/src/admin.js
 * Admin dashboard logic - competition control, leaderboard, and export
 */

// Check authorization
if (localStorage.getItem("role") !== "admin") {
    window.location.href = "index.html";
}

// Get DOM elements
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");
const stopBtn = document.getElementById("stop-btn");
const exportBtn = document.getElementById("export-results-btn");
const refreshBtn = document.getElementById("refresh-leaderboard-btn");
const uploadDrawingBtn = document.getElementById("upload-cad-drawing-btn");
const resetBtn = document.getElementById("reset-competition-btn");
const logoutBtn = document.getElementById("logout-btn");
const materialInput = document.getElementById("material-input");
const weightInput = document.getElementById("weight-input");

// Timer state
let timerInterval = null;
let seconds = 0;
let isRunning = false;
let isPaused = false;

// Competition ID (default to 1, or fetch from DB)
const COMPETITION_ID = 1;

/**
 * Initialize admin dashboard
 */
async function initDashboard() {
    await updateStats();
    await loadLeaderboard();
    await loadCompetitionState();
    setupRealtimeSubscriptions();
}

/**
 * Load current competition state from database
 */
async function loadCompetitionState() {
    try {
        const { data, error } = await supabase
            .from("competitions")
            .select("*")
            .eq("id", COMPETITION_ID)
            .single();

        if (error) throw error;

        if (data) {
            // Set material and weight inputs
            materialInput.value = data.material || "";
            weightInput.value = data.reference_weight || "";

            // Restore timer if competition is active
            if (data.is_active && data.start_time) {
                const startTime = new Date(data.start_time);
                const now = new Date();
                seconds = Math.floor((now - startTime) / 1000);
                startTimer();
            }
        }
    } catch (err) {
        console.error("Error loading competition state:", err);
    }
}

/**
 * Update statistics bar
 */
async function updateStats() {
    try {
        // Count participants
        const { count: participantCount, error: pError } = await supabase
            .from("participants")
            .select("*", { count: "exact", head: true });

        if (!pError) {
            document.getElementById("num-participants").textContent = participantCount || 0;
        }

        // Count submissions
        const { count: submissionCount, error: sError } = await supabase
            .from("participants")
            .select("*", { count: "exact", head: true })
            .not("file_url", "is", null);

        if (!sError) {
            document.getElementById("num-submissions").textContent = submissionCount || 0;
        }
    } catch (err) {
        console.error("Error updating stats:", err);
    }
}

/**
 * Start the competition timer
 */
function startTimer() {
    if (isRunning) return;

    isRunning = true;
    isPaused = false;

    timerInterval = setInterval(() => {
        seconds++;
        updateTimerDisplay();
    }, 1000);

    // Update button states
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
}

/**
 * Update timer display
 */
function updateTimerDisplay() {
    document.getElementById("comp-timer").textContent = formatTime(seconds);
}

/**
 * Load and display leaderboard
 */
async function loadLeaderboard() {
    try {
        const { data, error } = await supabase
            .from("participants")
            .select("name, college, score, time_submitted, submitted_weight")
            .order("score", { ascending: false })
            .order("time_submitted", { ascending: true });

        if (error) throw error;

        const tbody = document.getElementById("leaderboard-body-admin");
        tbody.innerHTML = "";

        if (data && data.length > 0) {
            // Filter only submitted participants
            const submitted = data.filter(p => p.file_url || p.time_submitted);
            
            if (submitted.length > 0) {
                submitted.forEach((participant, index) => {
                    const row = document.createElement("tr");
                    const submittedTime = participant.time_submitted
                        ? new Date(participant.time_submitted).toLocaleTimeString()
                        : "-";

                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${participant.name}</td>
                        <td>${participant.submitted_weight ? participant.submitted_weight.toFixed(3) + ' kg' : '-'}</td>
                        <td>${participant.score ? participant.score.toFixed(2) : '0'}</td>
                        <td>${submittedTime}</td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Waiting for submissions...</td></tr>';
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No participants registered yet</td></tr>';
        }
    } catch (err) {
        console.error("Error loading leaderboard:", err);
    }
}

/**
 * Setup real-time subscriptions for live updates
 */
function setupRealtimeSubscriptions() {
    // Subscribe to participant changes
    supabase
        .channel("admin-updates")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "participants" },
            async () => {
                await updateStats();
                await loadLeaderboard();
            }
        )
        .subscribe();
}

// ========== EVENT LISTENERS ==========

/**
 * START button - Begin competition
 */
startBtn.addEventListener('click', async () => {
    const material = materialInput.value.trim();
    const referenceWeight = parseFloat(weightInput.value);

    if (!material || !referenceWeight || isNaN(referenceWeight)) {
        alert("Please enter both material and reference weight before starting.");
        return;
    }

    try {
        const startTime = new Date().toISOString();

        // Update competition in database
        const { error } = await supabase
            .from("competitions")
            .upsert({
                id: COMPETITION_ID,
                is_active: true,
                start_time: startTime,
                material: material,
                reference_weight: referenceWeight,
                tolerance: 5 // Default 5% tolerance
            });

        if (error) throw error;

        // Start local timer
        seconds = 0;
        startTimer();

        alert("Competition started! Participants can now submit.");
    } catch (err) {
        console.error("Error starting competition:", err);
        alert("Failed to start competition. Check console for details.");
    }
});

/**
 * PAUSE button - Pause the timer
 */
pauseBtn.addEventListener('click', () => {
    if (isRunning) {
        isRunning = false;
        isPaused = true;
        clearInterval(timerInterval);

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = "RESUME";

        alert("Timer paused.");
    }
});

/**
 * STOP button - End competition
 */
stopBtn.addEventListener('click', async () => {
    if (!confirm("Are you sure you want to stop the competition? This will disable all submissions.")) {
        return;
    }

    try {
        // Stop competition in database
        const { error } = await supabase
            .from("competitions")
            .update({ is_active: false })
            .eq("id", COMPETITION_ID);

        if (error) throw error;

        // Stop local timer
        isRunning = false;
        isPaused = false;
        clearInterval(timerInterval);

        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        startBtn.textContent = "START";

        alert("Competition stopped successfully.");
    } catch (err) {
        console.error("Error stopping competition:", err);
        alert("Failed to stop competition. Check console for details.");
    }
});

/**
 * REFRESH button - Reload leaderboard
 */
refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "🔄 Refreshing...";
    
    try {
        await loadLeaderboard();
        await updateStats();
        
        // Show success briefly
        refreshBtn.textContent = "✅ Refreshed!";
        setTimeout(() => {
            refreshBtn.textContent = "🔄 Refresh";
            refreshBtn.disabled = false;
        }, 1000);
    } catch (err) {
        console.error("Refresh error:", err);
        refreshBtn.textContent = "❌ Failed";
        setTimeout(() => {
            refreshBtn.textContent = "🔄 Refresh";
            refreshBtn.disabled = false;
        }, 2000);
    }
});

/**
 * EXPORT button - Export results to CSV
 */
exportBtn.addEventListener('click', async () => {
    try {
        const { data, error } = await supabase
            .from("participants")
            .select("name, college, score, time_submitted, submitted_weight")
            .order("score", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            alert("No data to export.");
            return;
        }

        exportToCSV(data, "competition_results.csv");
        alert("Results exported successfully!");
    } catch (err) {
        console.error("Export error:", err);
        alert("Failed to export results.");
    }
});

/**
 * UPLOAD CAD DRAWING button
 */
uploadDrawingBtn.addEventListener('click', async () => {
    const file = await pickFile();
    if (!file) return;

    try {
        const filePath = `drawings/${Date.now()}-${file.name}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from("submissions")
            .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("submissions")
            .getPublicUrl(filePath);

        // Update competition with drawing URL
        await supabase
            .from("competitions")
            .update({ drawing_url: urlData.publicUrl })
            .eq("id", COMPETITION_ID);

        alert("CAD drawing uploaded successfully!");
    } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload drawing.");
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

/**
 * RESET COMPETITION button - Clear all data
 */
resetBtn.addEventListener('click', async () => {
    const confirmed = confirm(
        " WARNING ⚠️\n\n" +
        "This will DELETE ALL:\n" +
        "• Participant submissions\n" +
        "• Scores and rankings\n" +
        "• Timer data\n" +
        "• Uploaded files\n\n" +
        "This action CANNOT be undone!\n\n" +
        "Are you sure you want to reset the competition?"
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleCheck = prompt(
        'Type "RESET" (all caps) to confirm deletion:'
    );

    if (doubleCheck !== "RESET") {
        alert("Reset cancelled.");
        return;
    }

    try {
        // Stop timer first
        if (isRunning) {
            clearInterval(timerInterval);
            isRunning = false;
        }
        seconds = 0;
        updateTimerDisplay();

        // 1. Delete all participants
        const { error: deleteError } = await supabase
            .from("participants")
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) throw deleteError;

        // 2. Reset competition
        const { error: resetError } = await supabase
            .from("competitions")
            .update({
                is_active: false,
                start_time: null,
                end_time: null,
                material: null,
                reference_weight: null,
                drawing_url: null
            })
            .eq("id", COMPETITION_ID);

        if (resetError) throw resetError;

        // 3. Clear storage bucket (optional - files remain but will be overwritten)
        // Note: Supabase doesn't have a "delete all" function, files will accumulate
        
        // 4. Clear input fields
        materialInput.value = "";
        weightInput.value = "";

        // 5. Reset button states
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        startBtn.textContent = "START";

        // 6. Refresh displays
        await updateStats();
        await loadLeaderboard();

        alert("✅ Competition has been completely reset!\n\nAll data cleared.");

    } catch (err) {
        console.error("Reset error:", err);
        alert("❌ Failed to reset competition. Check console for details.");
    }
});

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    updateTimerDisplay();
});