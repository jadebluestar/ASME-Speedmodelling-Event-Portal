/**
 * speedportal/src/index.js
 * Handles login navigation and authentication
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get all screen containers
    const welcomeScreen = document.getElementById('welcome-screen');
    const loginChooser = document.getElementById('login-chooser');
    const participantLogin = document.getElementById('participant-login-container');
    const adminLogin = document.getElementById('admin-login-container');

    // Get all buttons
    const mainLoginBtn = document.getElementById('main-login-btn');
    const showAdminLoginBtn = document.getElementById('show-admin-login');
    const showParticipantLoginBtn = document.getElementById('show-participant-login');
    const participantSubmitBtn = document.getElementById('participant-login-btn');
    const adminSubmitBtn = document.getElementById('admin-login-btn');
    const backToChooser1 = document.getElementById('back-to-chooser-1');
    const backToChooser2 = document.getElementById('back-to-chooser-2');

    /**
     * Helper function to show only one screen at a time
     */
    function showScreen(screenToShow) {
        // Hide all screens
        welcomeScreen.style.display = 'none';
        loginChooser.style.display = 'none';
        participantLogin.style.display = 'none';
        adminLogin.style.display = 'none';

        // Show the requested screen
        if (screenToShow) {
            screenToShow.style.display = 'flex';
        }
    }

    /**
     * Show error message to user
     */
    function showError(message) {
        alert(message);
    }

    /**
     * Validate email format
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ========== SCREEN NAVIGATION ==========

    // Welcome Screen -> Login Chooser
    mainLoginBtn.addEventListener('click', () => {
        showScreen(loginChooser);
    });

    // Chooser -> Admin Login
    showAdminLoginBtn.addEventListener('click', () => {
        showScreen(adminLogin);
    });

    // Chooser -> Participant Login
    showParticipantLoginBtn.addEventListener('click', () => {
        showScreen(participantLogin);
    });

    // Back to Chooser from Participant Login
    backToChooser1.addEventListener('click', () => {
        showScreen(loginChooser);
    });

    // Back to Chooser from Admin Login
    backToChooser2.addEventListener('click', () => {
        showScreen(loginChooser);
    });

    // ========== ADMIN LOGIN ==========
adminSubmitBtn.addEventListener('click', () => {
    const username = document.getElementById("admin-id").value.trim();
    const password = document.getElementById("admin-password").value.trim();

    // Hardcoded credentials
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "bigdawgs69"; // change anytime

    if (!username || !password) {
        showError("Please enter both username and password.");
        return;
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Successful login
        localStorage.setItem("role", "admin");
        localStorage.setItem("username", username);
        window.location.href = "admin.html";
    } else {
        showError("Invalid admin credentials.");
    }
});

    // ========== PARTICIPANT LOGIN ==========
    participantSubmitBtn.addEventListener('click', async () => {
        const name = document.getElementById("participant-name").value.trim();
        const email = document.getElementById("participant-email").value.trim();
        const college = document.getElementById("participant-college").value.trim();

        // Validate input
        if (!name || !email || !college) {
            showError("All fields are required.");
            return;
        }

        if (!isValidEmail(email)) {
            showError("Please enter a valid email address.");
            return;
        }

        try {
            // Check if participant already exists
            const { data: existingParticipant, error: checkError } = await supabase
                .from("participants")
                .select("*")
                .eq("email", email)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                // PGRST116 is "no rows returned" which is fine
                console.error("Participant check error:", checkError);
                showError("An error occurred. Please try again.");
                return;
            }

            // Insert or update participant
            const { data, error } = await supabase
                .from("participants")
                .upsert(
                    { 
                        name, 
                        email, 
                        college,
                        score: 0,
                        submitted_weight: null,
                        file_url: null,
                        time_submitted: null
                    },
                    { 
                        onConflict: "email",
                        returning: "minimal"
                    }
                );

            if (error) {
                console.error("Participant registration error:", error);
                showError("Registration failed. Please try again.");
                return;
            }

            // Store participant session
            localStorage.setItem("role", "participant");
            localStorage.setItem("participant_name", name);
            localStorage.setItem("participant_email", email);
            localStorage.setItem("participant_college", college);

            // Redirect to participant dashboard
            window.location.href = "participant.html";

        } catch (err) {
            console.error("Participant login exception:", err);
            showError("An error occurred during registration. Please try again.");
        }
    });

    // Allow Enter key to submit forms
    document.getElementById('admin-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            adminSubmitBtn.click();
        }
    });

    document.getElementById('participant-college').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            participantSubmitBtn.click();
        }
    });
});