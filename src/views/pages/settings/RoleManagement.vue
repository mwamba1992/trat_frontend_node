<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { RoleService } from '@/service/RoleService';

const toast = useToast();
const dt = ref();

const roles = ref([]);
const role = ref({});
const permissionsList = ref([]);
const submitted = ref(false);
const roleDialog = ref(false);
const deleteDialog = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const totalRoles = computed(() => roles.value.length);
const totalPermissions = computed(() => permissionsList.value.length);

onMounted(() => {
    RoleService.getRoles().then((data) => (roles.value = data || []));
    RoleService.getPermissions().then((data) => (permissionsList.value = data || []));
});

function openNew() {
    role.value = { name: '', desc: '', permissions: [] };
    submitted.value = false;
    roleDialog.value = true;
}

function editRole(selectedRole) {
    role.value = { ...selectedRole };
    const permissions = [];
    if (role.value.permissions) {
        role.value.permissions.forEach((permission) => {
            permissions.push(permission.id);
        });
    }
    role.value.permissions = permissions;
    submitted.value = false;
    roleDialog.value = true;
}

function confirmDelete(rol) {
    role.value = { ...rol };
    deleteDialog.value = true;
}

function saveRole() {
    submitted.value = true;
    if (!role.value.name?.trim() || !role.value.desc?.trim() || !role.value.permissions?.length) return;

    const action = role.value.id ? 'updateRole' : 'createRole';

    RoleService[action](role.value)
        .then((data) => {
            if (data.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: role.value.id ? 'Role updated successfully' : 'Role created successfully', life: 3000 });
                roleDialog.value = false;
                RoleService.getRoles().then((data) => (roles.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
        });
}

function deleteRole() {
    RoleService.deleteRole(role.value.id)
        .then((data) => {
            if (data?.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'Role deleted successfully', life: 3000 });
                deleteDialog.value = false;
                RoleService.getRoles().then((data) => (roles.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete role', life: 3000 });
        });
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Role Management</h1>
            <p class="text-muted-color mt-1">Define roles and assign permissions to control access</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Total Roles</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalRoles }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                        <i class="pi pi-shield text-purple-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Defined role groups</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Total Permissions</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalPermissions }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                        <i class="pi pi-lock text-emerald-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Available permission types</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Access Control</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">Active</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eff6ff, #dbeafe)">
                        <i class="pi pi-check-circle text-blue-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">RBAC system enabled</span>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="card">
        <!-- Action Bar -->
        <div class="flex justify-between items-center mb-4">
            <Button label="New Role" icon="pi pi-plus" class="p-button-success" @click="openNew" />
            <div class="flex gap-2">
                <IconField>
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search roles..." />
                </IconField>
                <Button label="Export" icon="pi pi-upload" severity="secondary" text @click="exportCSV" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="roles"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} roles"
            stripedRows
        >
            <template #empty>
                <div class="flex flex-col items-center justify-center py-8">
                    <i class="pi pi-shield text-4xl text-muted-color mb-3"></i>
                    <span class="text-muted-color">No roles found</span>
                </div>
            </template>

            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    <span class="text-muted-color font-medium">{{ slotProps.index + 1 }}</span>
                </template>
            </Column>

            <Column field="name" header="Role Name" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-border" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                            <i class="pi pi-shield text-emerald-600 text-xs"></i>
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.name }}</span>
                    </div>
                </template>
            </Column>

            <Column field="desc" header="Description" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <span class="text-muted-color">{{ slotProps.data.desc || '—' }}</span>
                </template>
            </Column>

            <Column header="Permissions" style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex flex-wrap gap-1">
                        <Tag v-for="(permission, index) in slotProps.data.permissions" :key="index" :value="permission.name" severity="info" rounded />
                    </div>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" label="Edit" text rounded class="p-button-success" @click="editRole(slotProps.data)" />
                        <Button icon="pi pi-trash" label="Delete" text rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Create/Edit Role Dialog -->
    <Dialog v-model:visible="roleDialog" :style="{ width: '600px' }" :header="role.id ? 'Edit Role' : 'New Role'" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="flex items-center gap-3 pb-3" style="border-left: 4px solid #10b981; padding-left: 12px">
                <div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ role.id ? 'Update Role Details' : 'Create New Role' }}</div>
                    <div class="text-muted-color text-sm">{{ role.id ? 'Modify role name, description, and permissions' : 'Define a new role with specific permissions' }}</div>
                </div>
            </div>

            <!-- Name -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-shield mr-2 text-muted-color"></i>Role Name <span class="text-red-500">*</span></label>
                <InputText v-model.trim="role.name" placeholder="Enter role name" fluid autofocus :invalid="submitted && !role.name" />
                <small v-if="submitted && !role.name" class="text-red-500">Role name is required.</small>
            </div>

            <!-- Description -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-align-left mr-2 text-muted-color"></i>Description <span class="text-red-500">*</span></label>
                <InputText v-model.trim="role.desc" placeholder="Enter role description" fluid :invalid="submitted && !role.desc" />
                <small v-if="submitted && !role.desc" class="text-red-500">Description is required.</small>
            </div>

            <!-- Permissions -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-lock mr-2 text-muted-color"></i>Permissions <span class="text-red-500">*</span></label>
                <MultiSelect v-model="role.permissions" :options="permissionsList" optionLabel="name" optionValue="id" placeholder="Select permissions" display="chip" fluid :invalid="submitted && (!role.permissions || role.permissions.length === 0)" />
                <small v-if="submitted && (!role.permissions || role.permissions.length === 0)" class="text-red-500">At least one permission is required.</small>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="roleDialog = false" />
            <Button :label="role.id ? 'Update' : 'Save'" icon="pi pi-check" class="p-button-success" @click="saveRole" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '420px' }" header="Confirm Deletion" :modal="true">
        <div class="flex flex-col items-center gap-4 py-4">
            <div class="flex items-center justify-center rounded-full" style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #fef2f2, #fecaca)">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <div class="text-center">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-1">Delete role "{{ role.name }}"?</div>
                <div class="text-muted-color text-sm">This will remove the role and unassign it from all users.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteRole" />
        </template>
    </Dialog>
</template>
