import { createApp, watch } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';
// Import useCounter and useIdle from @vueuse/core
import { useCounter, useIdle } from '@vueuse/core';

const app = createApp(App);


// Set idle timeout (in milliseconds, e.g., 5 minutes)
const idleTimeout = 15 * 60 * 1000  // 5 minutes
const warningTime = 10 * 1000      // Show warning 10 seconds before timeout (optional)

// Global state for tracking idle status
let idleWarningTimeout;
let logoutTimeout;
let showWarning = false;

// Set up useCounter and useIdle
const { inc, count } = useCounter();
const { idle, lastActive, reset } = useIdle(idleTimeout); // 5 minutes idle timeout

// Handle idle state change
watch(idle, (idleValue) => {
    if (idleValue) {
        // Increment idle trigger count
        inc();

        // Show idle warning before logging out
        setWarningTimeout();
    } else {
        // Reset the idle timers when activity is detected
        resetIdleTimers();
    }
});

// Set the warning timeout
function setWarningTimeout() {
    clearTimeout(idleWarningTimeout);
    showWarning = true;

    // Show warning before logging out
    idleWarningTimeout = setTimeout(() => {
        setLogoutTimeout();
    }, warningTime);
}

// Set the logout timeout after idle
function setLogoutTimeout() {
    clearTimeout(logoutTimeout);

    logoutTimeout = setTimeout(() => {
        logout(); // Log out the user after the idle timeout
    }, warningTime);
}

// Reset idle timers (activity detected)
function resetIdleTimers() {
    showWarning = false;
    clearTimeout(idleWarningTimeout);
    clearTimeout(logoutTimeout);
    reset(); // Reset the idle timer
}

// Log out the user (clear localStorage and redirect to login page)
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
}

// Allow the user to stay logged in (reset idle timers)
function stayLoggedIn() {
    resetIdleTimers();  // Reset idle timers when user clicks "Stay Logged In"
}

// Monitor idle status on page load
app.mixin({
    created() {
        // Show warning based on the global state in main.js
        this.showWarning = showWarning;
    },
    methods: {
        stayLoggedIn,  // Make the method available globally
    },
});


app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.mount('#app');
