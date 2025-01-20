<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppConfigurator from './AppConfigurator.vue';
import { onMounted, ref } from 'vue';

const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();


let userName = ref();

onMounted(() => {
    userName.value = localStorage.getItem('userName');
});

function logout() {
    localStorage.clear();
    window.location.href = '/login';

    console.log("##### logout #######")
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


                <span>{{ userName }}</span>
            </router-link>
        </div>

        <div class="layout-topbar-actions">

            <div class="layout-topbar-menu-content"> <div v-if="showWarning" class="idle-warning">
                    <p>You have been idle for too long. You will be logged out soon.</p>
                <button @click="stayLoggedIn">Stay Logged In</button>
                </div>
                <button type="button" class="layout-topbar-action">
                    <i class="pi pi-user"></i>
                    <span>Profile</span>
                </button>

                <!-- Logout Button -->
                <button type="button" class="layout-topbar-action" @click="logout">
                    <i class="pi pi-power-off"></i> <!-- Icon for logout -->
                    <span>Logout</span>
                </button>
            </div>
        </div>

    </div>
</template>
