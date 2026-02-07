<script setup>
import { ref } from 'vue';
import { SetupService as LoginService } from '@/service/LoginService';
import { useToast } from 'primevue/usetoast';
import router from '@/router';

const toast = useToast();
const username = ref('');
const password = ref('');
const checked = ref(false);
const loading = ref(false);
const submitted = ref(false);

async function handleSignIn() {
    submitted.value = true;
    if (!username.value.trim() || !password.value.trim()) return;

    loading.value = true;
    try {
        const response = await LoginService.login(username.value, password.value);

        if (response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('refresh_token', response.refresh_token);

            let userDetails = base64UrlDecode(response.access_token.split('.')[1]);
            localStorage.setItem('userId', userDetails.sub);
            localStorage.setItem('userName', userDetails.username);

            let permissions = userDetails.permissions.map((permission) => permission.name);
            localStorage.setItem('permissions', permissions);

            await router.push('/dashboard');
        } else {
            toast.add({ severity: 'error', summary: 'Authentication Failed', detail: 'Invalid credentials. Please check your username and password.', life: 5000 });
        }
    } catch (error) {
        console.error('Login failed:', error);
        const message = error?.response?.data?.message || error?.message || 'Unable to connect to the server. Please try again later.';
        toast.add({ severity: 'error', summary: 'Login Failed', detail: message, life: 5000 });
    } finally {
        loading.value = false;
    }
}

function base64UrlDecode(base64Url) {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded);
}
</script>

<template>
    <div class="min-h-screen flex" style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)">
        <!-- Left Panel - Branding -->
        <div class="hidden lg:flex lg:w-5/12 flex-col justify-between p-0 relative overflow-hidden" style="background: linear-gradient(160deg, #064e3b 0%, #065f46 40%, #047857 100%)">
            <!-- Decorative circles -->
            <div class="absolute" style="width: 300px; height: 300px; border-radius: 50%; background: rgba(255,255,255,0.03); top: -80px; right: -80px"></div>
            <div class="absolute" style="width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.03); bottom: 100px; left: -60px"></div>
            <div class="absolute" style="width: 150px; height: 150px; border-radius: 50%; background: rgba(255,255,255,0.02); top: 40%; right: 20%"></div>

            <!-- Content -->
            <div class="flex flex-col items-center justify-center flex-1 px-12 relative z-10">
                <!-- Coat of Arms -->
                <div class="mb-8">
                    <div class="flex items-center justify-center rounded-full p-4" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px)">
                        <img src="/coat_arms.png" alt="Coat of Arms" style="width: 120px; height: 120px; object-fit: contain" />
                    </div>
                </div>

                <!-- Title -->
                <div class="text-center">
                    <h1 class="text-white text-3xl font-bold mb-2" style="letter-spacing: 0.5px">THE UNITED REPUBLIC OF TANZANIA</h1>
                    <div class="mx-auto mb-6" style="width: 80px; height: 3px; background: linear-gradient(90deg, transparent, #34d399, transparent); border-radius: 2px"></div>
                    <h2 class="text-emerald-200 text-xl font-semibold mb-3">Tax Revenue Appeals Tribunal</h2>
                    <p class="text-emerald-300/70 text-sm max-w-xs mx-auto leading-relaxed">
                        Tribunal Revenue Appeals Information System
                    </p>
                </div>

                <!-- Features list -->
                <div class="mt-12 flex flex-col gap-4 w-full max-w-xs">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full" style="width: 2rem; height: 2rem; background: rgba(52, 211, 153, 0.2)">
                            <i class="pi pi-shield text-emerald-300 text-xs"></i>
                        </div>
                        <span class="text-emerald-200/80 text-sm">Secure & Encrypted Access</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full" style="width: 2rem; height: 2rem; background: rgba(52, 211, 153, 0.2)">
                            <i class="pi pi-file text-emerald-300 text-xs"></i>
                        </div>
                        <span class="text-emerald-200/80 text-sm">Appeal & Case Management</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full" style="width: 2rem; height: 2rem; background: rgba(52, 211, 153, 0.2)">
                            <i class="pi pi-chart-bar text-emerald-300 text-xs"></i>
                        </div>
                        <span class="text-emerald-200/80 text-sm">Reports & Analytics</span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="text-center pb-8 px-8 relative z-10">
                <div class="mx-auto mb-4" style="width: 60%; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)"></div>
                <p class="text-emerald-300/50 text-xs">&copy; {{ new Date().getFullYear() }} Tax Revenue Appeals Tribunal. All rights reserved.</p>
            </div>
        </div>

        <!-- Right Panel - Login Form -->
        <div class="flex-1 flex items-center justify-center p-6 lg:p-12">
            <div class="w-full max-w-md">
                <!-- Mobile Logo (shown only on small screens) -->
                <div class="flex flex-col items-center mb-8 lg:hidden">
                    <img src="/coat_arms.png" alt="Coat of Arms" style="width: 80px; height: 80px; object-fit: contain" class="mb-4" />
                    <h2 class="text-surface-900 text-xl font-bold text-center">Tax Revenue Appeals Tribunal</h2>
                </div>

                <!-- Login Card -->
                <div class="bg-white dark:bg-surface-900 rounded-2xl p-8 lg:p-10" style="box-shadow: 0 4px 40px rgba(0, 0, 0, 0.06)">
                    <!-- Header -->
                    <div class="text-center mb-8">
                        <div class="lg:flex hidden items-center justify-center mb-6">
                            <img src="/TRAT%20New%20Logo%20August%202023.png" alt="TRAT Logo" style="width: 80px; height: 80px; object-fit: contain" />
                        </div>
                        <h2 class="text-surface-900 dark:text-surface-0 text-2xl font-bold mb-2">Welcome to TRAIS</h2>
                        <p class="text-muted-color text-sm">Sign in with your credentials to access the system</p>
                    </div>

                    <!-- Form -->
                    <div class="flex flex-col gap-5">
                        <!-- Username -->
                        <div>
                            <label class="block font-medium mb-2 text-surface-900 dark:text-surface-0">
                                <i class="pi pi-user mr-2 text-muted-color"></i>Username
                            </label>
                            <InputText
                                v-model="username"
                                placeholder="Enter your username"
                                fluid
                                :invalid="submitted && !username"
                                @keyup.enter="handleSignIn"
                            />
                            <small v-if="submitted && !username" class="text-red-500">Username is required.</small>
                        </div>

                        <!-- Password -->
                        <div>
                            <label class="block font-medium mb-2 text-surface-900 dark:text-surface-0">
                                <i class="pi pi-lock mr-2 text-muted-color"></i>Password
                            </label>
                            <Password
                                v-model="password"
                                placeholder="Enter your password"
                                :toggleMask="true"
                                :feedback="false"
                                fluid
                                :invalid="submitted && !password"
                                @keyup.enter="handleSignIn"
                                inputClass="w-full"
                            />
                            <small v-if="submitted && !password" class="text-red-500">Password is required.</small>
                        </div>

                        <!-- Remember me & Forgot -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <Checkbox v-model="checked" :binary="true" />
                                <label class="text-sm text-muted-color cursor-pointer">Remember me</label>
                            </div>
                            <span class="text-sm font-medium cursor-pointer" style="color: #047857">Forgot password?</span>
                        </div>

                        <!-- Sign In Button -->
                        <Button
                            label="Sign In"
                            icon="pi pi-sign-in"
                            class="w-full p-button-success mt-2"
                            style="background: linear-gradient(135deg, #047857, #065f46); border: none; padding: 0.85rem"
                            :loading="loading"
                            @click="handleSignIn"
                        />
                    </div>

                    <!-- Security Notice -->
                    <div class="flex items-center gap-2 mt-6 pt-5" style="border-top: 1px solid #f3f4f6">
                        <i class="pi pi-shield text-muted-color text-xs"></i>
                        <span class="text-muted-color text-xs">This is a secure government system. Unauthorized access is prohibited.</span>
                    </div>
                </div>

                <!-- Version -->
                <div class="text-center mt-6">
                    <span class="text-muted-color text-xs">TRAIS v2.0 | Powered by TRAT ICT Department</span>
                </div>
            </div>
        </div>
    </div>
</template>
