<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, computed } from 'vue';

const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();

let userName = ref('');
let userRole = ref('');

const userInitial = computed(() => {
    return userName.value ? userName.value.charAt(0).toUpperCase() : 'U';
});

onMounted(() => {
    userName.value = localStorage.getItem('userName') || '';
    userRole.value = localStorage.getItem('role') || 'Administrator';
});

const showUserMenu = ref(false);

function toggleUserMenu() {
    showUserMenu.value = !showUserMenu.value;
}

function logout() {
    localStorage.clear();
    window.location.href = '/login';
}
</script>

<template>
    <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <img src="/TRAT%20New%20Logo%20August%202023.png" alt="Logo" width="54" height="40" />
                <div class="flex flex-col">
                    <span class="font-bold text-lg leading-tight">TRAT</span>
                    <span class="text-xs text-muted-color leading-tight">Tax Revenue Appeals Tribunal</span>
                </div>
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-topbar-menu-content">
                <div v-if="showWarning" class="idle-warning">
                    <p>You have been idle for too long. You will be logged out soon.</p>
                    <button @click="stayLoggedIn">Stay Logged In</button>
                </div>

                <!-- Notification Bell -->
                <button type="button" class="layout-topbar-action">
                    <i class="pi pi-bell"></i>
                </button>

                <!-- User Profile Section -->
                <div class="flex items-center gap-3 cursor-pointer relative" @click="toggleUserMenu">
                    <div class="flex items-center justify-center rounded-full bg-blue-500 text-white font-bold" style="width: 2.2rem; height: 2.2rem">
                        {{ userInitial }}
                    </div>
                    <div class="flex flex-col">
                        <span class="font-medium text-sm text-surface-900 dark:text-surface-0 leading-tight">{{ userName }}</span>
                        <span class="text-xs text-muted-color leading-tight">{{ userRole }}</span>
                    </div>
                    <i class="pi pi-chevron-down text-xs text-muted-color"></i>

                    <!-- Dropdown Menu -->
                    <div v-if="showUserMenu" class="absolute top-full right-0 mt-2 bg-surface-0 dark:bg-surface-800 shadow-md rounded-border p-2 min-w-48 z-50">
                        <button class="w-full text-left px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-border flex items-center gap-2" @click="$router.push('/profile')">
                            <i class="pi pi-user"></i>
                            <span>Profile</span>
                        </button>
                        <button class="w-full text-left px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-border flex items-center gap-2 text-red-500" @click="logout">
                            <i class="pi pi-power-off"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
