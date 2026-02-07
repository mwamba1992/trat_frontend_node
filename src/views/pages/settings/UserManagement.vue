<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { UserService } from '@/service/UserManagement';
import { RoleService } from '@/service/RoleService';

const toast = useToast();
const dt = ref();

const users = ref([]);
const user = ref({});
const rolesList = ref([]);
const submitted = ref(false);
const userDialog = ref(false);
const deleteDialog = ref(false);
const resetDialog = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const totalUsers = computed(() => users.value.length);
const totalRoles = computed(() => rolesList.value.length);

onMounted(() => {
    UserService.getUsers().then((data) => (users.value = data || []));
    RoleService.getRoles().then((data) => (rolesList.value = data || []));
});

function openNew() {
    user.value = { name: '', username: '', checkNumber: '', email: '', mobileNumber: '', rolesList: [] };
    submitted.value = false;
    userDialog.value = true;
}

function editUser(usr) {
    user.value = { ...usr };
    const roles = [];
    if (user.value.rolesList) {
        user.value.rolesList.forEach((role) => {
            roles.push(role.id);
        });
    }
    user.value.rolesList = roles;
    submitted.value = false;
    userDialog.value = true;
}

function confirmDelete(usr) {
    user.value = { ...usr };
    deleteDialog.value = true;
}

function confirmResetPassword(usr) {
    user.value = { ...usr };
    resetDialog.value = true;
}

function saveUser() {
    submitted.value = true;
    if (!user.value.username?.trim() || !user.value.email?.trim() || !user.value.rolesList?.length) return;

    const action = user.value.id ? 'updateUser' : 'createUser';

    UserService[action](user.value)
        .then((data) => {
            if (data.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: user.value.id ? 'User updated successfully' : 'User created successfully', life: 3000 });
                userDialog.value = false;
                UserService.getUsers().then((data) => (users.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
        });
}

function deleteUser() {
    UserService.deleteUser(user.value.id)
        .then((data) => {
            if (data?.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'User deleted successfully', life: 3000 });
                deleteDialog.value = false;
                UserService.getUsers().then((data) => (users.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete user', life: 3000 });
        });
}

function resetPassword() {
    UserService.resetPassword(user.value.id)
        .then((data) => {
            if (data.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: 'Password has been reset successfully', life: 3000 });
            }
            resetDialog.value = false;
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to reset password', life: 3000 });
            resetDialog.value = false;
        });
}

function exportCSV() {
    dt.value.exportCSV();
}

function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">User Management</h1>
            <p class="text-muted-color mt-1">Manage system users and their role assignments</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Total Users</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalUsers }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                        <i class="pi pi-users text-purple-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Registered accounts</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Available Roles</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalRoles }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                        <i class="pi pi-shield text-emerald-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Role definitions</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">System Status</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">Active</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eff6ff, #dbeafe)">
                        <i class="pi pi-check-circle text-blue-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">All services running</span>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="card">
        <!-- Action Bar -->
        <div class="flex justify-between items-center mb-4">
            <Button label="New User" icon="pi pi-plus" class="p-button-success" @click="openNew" />
            <div class="flex gap-2">
                <IconField>
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search users..." />
                </IconField>
                <Button label="Export" icon="pi pi-upload" severity="secondary" text @click="exportCSV" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="users"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
            stripedRows
        >
            <template #empty>
                <div class="flex flex-col items-center justify-center py-8">
                    <i class="pi pi-users text-4xl text-muted-color mb-3"></i>
                    <span class="text-muted-color">No users found</span>
                </div>
            </template>

            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    <span class="text-muted-color font-medium">{{ slotProps.index + 1 }}</span>
                </template>
            </Column>

            <Column field="name" header="Full Name" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full font-bold text-xs text-white" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #10b981, #059669)">
                            {{ getInitials(slotProps.data.name) }}
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.name || '—' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="username" header="Username" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-user text-muted-color text-xs"></i>
                        <span>{{ slotProps.data.username }}</span>
                    </div>
                </template>
            </Column>

            <Column field="checkNumber" header="Check No." sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <span class="text-muted-color">{{ slotProps.data.checkNumber || '—' }}</span>
                </template>
            </Column>

            <Column field="email" header="Email" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-envelope text-muted-color text-xs"></i>
                        <span>{{ slotProps.data.email || '—' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="mobileNumber" header="Phone" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-phone text-muted-color text-xs"></i>
                        <span>{{ slotProps.data.mobileNumber || '—' }}</span>
                    </div>
                </template>
            </Column>

            <Column header="Roles" style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex flex-wrap gap-1">
                        <Tag v-for="(role, index) in slotProps.data.rolesList" :key="index" :value="role.name" severity="success" rounded />
                    </div>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button icon="pi pi-pencil" label="Edit" text rounded class="p-button-success" size="small" @click="editUser(slotProps.data)" />
                        <Button icon="pi pi-refresh" label="Reset" text rounded severity="warn" size="small" @click="confirmResetPassword(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="confirmDelete(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Create/Edit User Dialog -->
    <Dialog v-model:visible="userDialog" :style="{ width: '650px' }" :header="user.id ? 'Edit User' : 'New User'" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="flex items-center gap-3 pb-3" style="border-left: 4px solid #10b981; padding-left: 12px">
                <div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ user.id ? 'Update User Details' : 'Create New User' }}</div>
                    <div class="text-muted-color text-sm">{{ user.id ? 'Modify existing user information' : 'Fill in the details to create a new system user' }}</div>
                </div>
            </div>

            <!-- Full Name + Username -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-user mr-2 text-muted-color"></i>Full Name <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="user.name" placeholder="Enter full name" fluid autofocus :invalid="submitted && !user.name" />
                    <small v-if="submitted && !user.name" class="text-red-500">Full name is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-at mr-2 text-muted-color"></i>Username <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="user.username" placeholder="Enter username" fluid :invalid="submitted && !user.username" />
                    <small v-if="submitted && !user.username" class="text-red-500">Username is required.</small>
                </div>
            </div>

            <!-- Email + Phone -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-envelope mr-2 text-muted-color"></i>Email <span class="text-red-500">*</span></label>
                    <InputText type="email" v-model.trim="user.email" placeholder="Enter email" fluid :invalid="submitted && !user.email" />
                    <small v-if="submitted && !user.email" class="text-red-500">Email is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-phone mr-2 text-muted-color"></i>Mobile Number</label>
                    <InputText v-model.trim="user.mobileNumber" placeholder="Enter mobile number" fluid />
                </div>
            </div>

            <!-- Check Number -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-id-card mr-2 text-muted-color"></i>Check Number</label>
                <InputText v-model.trim="user.checkNumber" placeholder="Enter check number" fluid />
            </div>

            <!-- Roles -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-shield mr-2 text-muted-color"></i>Roles <span class="text-red-500">*</span></label>
                <MultiSelect v-model="user.rolesList" :options="rolesList" optionLabel="name" optionValue="id" placeholder="Select roles" display="chip" fluid :invalid="submitted && (!user.rolesList || user.rolesList.length === 0)" />
                <small v-if="submitted && (!user.rolesList || user.rolesList.length === 0)" class="text-red-500">At least one role is required.</small>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="userDialog = false" />
            <Button :label="user.id ? 'Update' : 'Save'" icon="pi pi-check" class="p-button-success" @click="saveUser" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '420px' }" header="Confirm Deletion" :modal="true">
        <div class="flex flex-col items-center gap-4 py-4">
            <div class="flex items-center justify-center rounded-full" style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #fef2f2, #fecaca)">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <div class="text-center">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-1">Delete user "{{ user.name || user.username }}"?</div>
                <div class="text-muted-color text-sm">This will permanently remove the user and revoke all access.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteUser" />
        </template>
    </Dialog>

    <!-- Reset Password Confirmation Dialog -->
    <Dialog v-model:visible="resetDialog" :style="{ width: '420px' }" header="Reset Password" :modal="true">
        <div class="flex flex-col items-center gap-4 py-4">
            <div class="flex items-center justify-center rounded-full" style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #fefce8, #fde68a)">
                <i class="pi pi-refresh text-yellow-600 text-2xl"></i>
            </div>
            <div class="text-center">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-1">Reset password for "{{ user.name || user.username }}"?</div>
                <div class="text-muted-color text-sm">The user will need to use the new password to log in.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="resetDialog = false" />
            <Button label="Reset Password" icon="pi pi-refresh" severity="warn" @click="resetPassword" />
        </template>
    </Dialog>
</template>
