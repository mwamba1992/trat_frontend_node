<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { UserService } from '@/service/UserManagement';
import { RoleService } from '@/service/RoleService';

const user = ref({});
const toast = useToast();
const dt = ref();
const users = ref([]);
const submitted = ref(false);
const userDialog = ref(false);
const selectedUsers = ref();
const rolesList = ref([]);

onMounted(() => {
    UserService.getUsers().then((data) => (users.value = data));
    RoleService.getRoles().then((data) => (rolesList.value = data));
});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

function openNew() {
    user.value = {};
    submitted.value = false;
    userDialog.value = true;
}

function exportCSV() {
    dt.value.exportCSV();
}

function editUser(usr) {
    console.log(usr);
    userDialog.value = true;
    user.value = { ...usr };
    console.log(user.value);

    const roles = [];
    user.value.rolesList.forEach((role) => {
        roles.push(role.id);
    });

    user.value.rolesList = roles;
    userDialog.value = true;
}

function deleteUser(usr) {}

function resetPassword(user) {
    console.log(user);
    UserService.resetPassword(user.id)
        .then((data) => {
            if (data.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Password Reset', life: 3000 });
            }
        })
        .catch((error) => {
            console.log(error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'An unexpected error occurred. Please try again later.',
                life: 3000
            });
        });
}
function saveUser() {
    submitted.value = true;
    if (user?.value.username?.trim() && user?.value.email?.trim() && user?.value.rolesList.length > 0) {
        if (user.value.id) {
            UserService.updateUser(user.value)
                .then((data) => {
                    if (data.error) {
                        toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                    } else {
                        userDialog.value = false;
                        users.value = [...users.value]; // Update users list
                        user.value = {}; // Clear the form
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'User Updated', life: 3000 });
                        UserService.getUsers().then((data) => (users.value = data));
                    }
                })
                .catch((error) => {
                    console.log(error);
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'An unexpected error occurred. Please try again later.',
                        life: 3000
                    });
                });
        } else {
            UserService.createUser(user.value)
                .then((data) => {
                    if (data.error) {
                        toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                    } else {
                        userDialog.value = false;
                        users.value = [...users.value, data]; // Add the new user to the users list
                        user.value = {}; // Clear the form
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'User Created', life: 3000 });
                        UserService.getUsers().then((data) => (users.value = data));
                    }
                })
                .catch((error) => {
                    console.log(error);
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'An unexpected error occurred. Please try again later.',
                        life: 3000
                    });
                });
        }
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all required fields', life: 3000 });
    }
}
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
        </template>

        <template #end>
            <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
        </template>
    </Toolbar>

    <DataTable
        ref="dt"
        v-model:selection="selectedUsers"
        :value="users"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} judges"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Judges</h4>
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search..." />
                </IconField>
            </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="username" header="User Name" sortable style="min-width: 12rem"></Column>
        <Column field="checkNumber" header="Check Number" sortable style="min-width: 16rem"></Column>
        <Column field="mobileNumber" header="Phone" sortable style="min-width: 16rem"></Column>
        <Column field="name" header="Name" sortable style="min-width: 16rem"></Column>
        <Column header="Roles">
            <template #body="slotProps">
                <!-- Loop through the roleList of each user and display the roles -->
                <div>
                    <Tag v-for="(role, index) in slotProps.data.rolesList" :key="index" :value="role.name" class="mr-2" />
                </div>
            </template>
        </Column>

        <Column :exportable="false" style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editUser(slotProps.data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="deleteUser(slotProps.data)" />
                <Button icon="pi pi-undo" outlined rounded @click="resetPassword(slotProps.data)" />
            </template>
        </Column>
    </DataTable>

    <Dialog v-model:visible="userDialog" :style="{ width: '700px' }" header="User Details" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name" class="block font-bold mb-3">Full name</label>
                <InputText id="name" v-model.trim="user.name" required="true" autofocus :invalid="submitted && !user.name" fluid />
                <small v-if="submitted && !user.name" class="text-red-500">Name is required.</small>
            </div>
            <!-- Username Field -->
            <div>
                <label for="username" class="block font-bold mb-3">Username</label>
                <InputText id="username" v-model.trim="user.username" required="true" autofocus :invalid="submitted && !user.username" fluid />
                <small v-if="submitted && !user.username" class="text-red-500">Username is required.</small>
            </div>

            <!-- Check Number Field -->
            <div>
                <label for="checkNumber" class="block font-bold mb-3">Check Number</label>
                <InputText id="checkNumber" v-model.trim="user.checkNumber" :invalid="submitted && !user.checkNumber" fluid />
            </div>
            <!-- Email Field -->
            <div>
                <label for="email" class="block font-bold mb-3">Email</label>
                <InputText type="email" id="email" v-model.trim="user.email" required="true" :invalid="submitted && !user.email" fluid />
                <small v-if="submitted && !user.email" class="text-red-500">Email is required.</small>
            </div>

            <!-- Mobile Number Field -->
            <div>
                <label for="mobileNumber" class="block font-bold mb-3">Mobile Number</label>
                <InputText id="mobileNumber" v-model.trim="user.mobileNumber" :invalid="submitted && !user.mobileNumber" fluid />
            </div>

            <!-- Roles List -->
            <div>
                <label for="roles" class="block font-bold mb-3">Roles</label>
                <MultiSelect v-model="user.rolesList" :options="rolesList" optionLabel="name" optionValue="id" placeholder="Select Roles" display="chip" required />
                <small v-if="submitted && user.rolesList.length === 0" class="text-red-500">At least one role is required.</small>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
            <Button label="Save" icon="pi pi-check" @click="saveUser" />
        </template>
    </Dialog>
</template>
