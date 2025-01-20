<script setup>
import { onMounted, ref, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { SetupService } from '@/service/SetupService';

const toast = useToast();
const dt = ref();

const setups = ref([]);
const selectedSetups = ref([]);
const setupDialog = ref(false);
const setup = reactive({});
const submitted = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Dropdown options for type selection
const setupTypes = ref([
    { label: 'Tax Type', value: 'taxType' },
    { label: 'Appeal Status', value: 'appealStatus' },
    { label: 'Application Status', value: 'applicationStatus' },
    { label: 'Currency', value: 'currency' },
    { label: 'Applicant Type', value: 'applicantType' },
    { label: 'Applicant Type', value: 'applicationType' },
    { label: 'Regions', value: 'region' },
    { label: 'Gfs', value: 'gfs' }

]);

const currentSetupType = ref(setupTypes.value[0].value); // Default to the first type

// Fetch data dynamically based on the current setup type
onMounted(() => {
    fetchSetups(currentSetupType);
});

async function fetchSetups(type) {
    console.log('Fetching setups for:', type.value);
    await SetupService.getSetups(type.value).then((data) => {
        setups.value = data;
    });
}

function openNew() {
    Object.keys(setup).forEach((key) => (setup[key] = ''));
    submitted.value = false;
    setupDialog.value = true;
}

function editSetup(rowData) {
    Object.assign(setup, rowData); // Clone the selected setup data into the form
    setupDialog.value = true;
}

function saveSetup() {
    submitted.value = true;

    if (!setup.name?.trim()) {
        toast.add({ severity: 'error', summary: 'Validation Error', detail: 'Name is required', life: 3000 });
        return;
    }

    const action = setup.id ? 'editSetupData' : 'postSetupData';

    SetupService[action](currentSetupType.value, setup)
        .then((response) => {
            if (response.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: response.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: 'Setup Saved', life: 3000 });
                setupDialog.value = false;
                fetchSetups(currentSetupType);
            }
        })
        .catch((error) => {
            console.error('Unexpected error:', error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'An unexpected error occurred. Please try again later.',
                life: 3000,
            });
        });
}

function deleteSetup(rowData) {
    SetupService.deleteSetup(currentSetupType.value, rowData.id).then(() => {
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Setup Deleted', life: 3000 });
        fetchSetups(currentSetupType);
    });
}
</script>


<template>
    <Toolbar class="mb-6">
        <template #start>
            <Dropdown
                v-model="currentSetupType"
                :options="setupTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Type"
                @change="fetchSetups"
            />
            <Button label="New" icon="pi pi-plus" severity="secondary" class="ml-2" @click="openNew" />
        </template>
    </Toolbar>

    <DataTable
        ref="dt"
        v-model:selection="selectedSetups"
        :value="setups"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} setups"
    >
        <template #header>
            <div class="flex justify-between">
                <h4>Manage {{ currentSetupType }}</h4>
                <InputText v-model="filters['global'].value" placeholder="Search..." />
            </div>
        </template>

        <Column field="name" header="Name" sortable style="min-width: 16rem"></Column>
        <Column field="description" header="Description" sortable style="min-width: 16rem"></Column>

        <Column :exportable="false" style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editSetup(slotProps.data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="deleteSetup(slotProps.data)" />
            </template>
        </Column>
    </DataTable>

    <Dialog v-model:visible="setupDialog" header="Setup Details" :style="{ width: '500px' }" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name" class="block font-bold mb-2">Name</label>
                <InputText id="name" v-model.trim="setup.name" required="true" class="w-full" autofocus />
            </div>

            <div>
                <label for="description" class="block font-bold mb-2">Description</label>
                <InputText id="description" v-model.trim="setup.description" class="w-full" />
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="setupDialog = false" />
            <Button label="Save" icon="pi pi-check" @click="saveSetup" />
        </template>
    </Dialog>


</template>

