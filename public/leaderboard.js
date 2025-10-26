/**
 * speedportal/src/leaderboard.js
 * Public leaderboard with real-time updates
 */

/**
 * Load and display leaderboard
 */
async function loadLeaderboard() {
    try {
        const { data, error } = await supabase
            .from("participants")
            .select("name, college, score, time_submitted")
            .order("score", { ascending: false })
            .order("time_submitted", { ascending: true });

        if (error) {
            console.error("Error loading leaderboard:", error);
            return;
        }

        const tbody = document.getElementById("leaderboard-body");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (data && data.length > 0) {
            data.forEach((participant, index) => {
                const row = document.createElement("tr");
                
                // Format submission time
                const submittedTime = participant.time_submitted
                    ? new Date(participant.time_submitted).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })
                    : "-";

                // Create row content
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${participant.name}</td>
                    <td>${participant.college}</td>
                    <td>${participant.score || "-"}</td>
                    <td>${submittedTime}</td>
                `;

                // Add special styling for top 3
                if (index === 0) {
                    row.style.fontWeight = "bold";
                    row.style.fontSize = "18px";
                } else if (index === 1 || index === 2) {
                    row.style.fontWeight = "600";
                }

                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No submissions yet. Waiting for participants...</td></tr>';
        }
    } catch (err) {
        console.error("Exception loading leaderboard:", err);
    }
}

/**
 * Setup real-time subscriptions
 */
function setupRealtimeUpdates() {
    supabase
        .channel("public-leaderboard")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "participants" },
            (payload) => {
                console.log("Leaderboard update received:", payload);
                loadLeaderboard();
            }
        )
        .subscribe((status) => {
            console.log("Leaderboard subscription status:", status);
        });
}

/**
 * Auto-refresh leaderboard every 10 seconds as backup
 */
function startAutoRefresh() {
    setInterval(() => {
        loadLeaderboard();
    }, 10000); // Refresh every 10 seconds
}

// Initialize leaderboard on page load
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    setupRealtimeUpdates();
    startAutoRefresh();
});