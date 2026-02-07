import { createApp, watch } from 'vue';
import App from './App.vue';
import router from './router';

import Aura from '@primevue/themes/aura';
import { definePreset } from '@primevue/themes';
import PrimeVue from 'primevue/config';

const TratPreset = definePreset(Aura, {
    primitive: {
        green: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#059669',
            500: '#047857',
            600: '#065f46',
            700: '#064e3b',
            800: '#022c22',
            900: '#022c22',
            950: '#022c22'
        }
    },
    semantic: {
        primary: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
            950: '#022c22'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '#047857',
                    contrastColor: '#ffffff',
                    hoverColor: '#065f46',
                    activeColor: '#064e3b'
                },
                highlight: {
                    background: '#ecfdf5',
                    focusBackground: '#d1fae5',
                    color: '#047857',
                    focusColor: '#065f46'
                }
            },
            dark: {
                primary: {
                    color: '#34d399',
                    contrastColor: '#064e3b',
                    hoverColor: '#6ee7b7',
                    activeColor: '#a7f3d0'
                },
                highlight: {
                    background: 'color-mix(in srgb, #34d399, transparent 84%)',
                    focusBackground: 'color-mix(in srgb, #34d399, transparent 76%)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                }
            }
        }
    }
});
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
        preset: TratPreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);
app.mount('#app');
