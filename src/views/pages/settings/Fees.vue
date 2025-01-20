<script setup>
import { FeeService } from '@/service/FeesService'; // Ensure you have a service for handling Fee API requests
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { SetupService } from '@/service/SetupService';

// Reactive Variables
const toast = useToast();
const dt = ref();
const fees = ref([]);
const selectedFees = ref();
const feeDialog = ref(false);
const deleteFeesDialog = ref(false);
const fee = ref({});
const submitted = ref(false);

const availableGfs = ref([]);

const types = ref([
    { label: 'Notice', value: 'NOTICE' },
    { label: 'Application', value: 'APPLICATION' },
    { label: 'Statements', value: 'STATEMENTS' },
    { label: 'Appeals', value: 'APPEALS' },
    { label: 'Others', value: 'OTHERS' }
]);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Fetch Fees on Mounted
onMounted(async () => {
    const setups = await SetupService.getSetups('gfs');
    availableGfs.value = setups.map((setup) => ({
        id: setup.id,
        name: setup.description // Assuming each `CommonSetup` has `id` and `name`
    }));

    FeeService.getFees().then((data) => (fees.value = data));
});

// Open Dialog for New Fee
function openNew() {
    fee.value = {}; // Clear form data
    submitted.value = false; // Reset form validation
    feeDialog.value = true; // Show dialog
}

// Open Dialog to Edit Fee
function editFee(feeData) {
    fee.value = { ...feeData }; // Populate form with existing data
    fee.value.gfsId = feeData.gfs.id; // Set GFS ID
    feeDialog.value = true; // Show dialog
}

// Save Fee (Create or Update)
function saveFee() {
    submitted.value = true;

    if (fee.value.id) {
        // Update Fee
        FeeService.updateFee(fee.value)
            .then((data) => {
                if (data.error) {
                    toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                } else {
                    feeDialog.value = false;
                    fees.value = [...fees.value]; // Refresh the list
                    fee.value = {}; // Reset form
                    toast.add({ severity: 'success', summary: 'Successful', detail: 'Fee Updated', life: 3000 });
                    FeeService.getFees().then((data) => (fees.value = data)); // Reload fees
                }
            })
            .catch((error) => {
                console.error(error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'An unexpected error occurred. Please try again later.',
                    life: 3000
                });
            });
    } else {
        // Create Fee
        FeeService.createFee(fee.value)
            .then((data) => {
                if (data.error) {
                    toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                } else {
                    feeDialog.value = false;
                    fees.value = [...fees.value]; // Refresh the list
                    fee.value = {}; // Reset form
                    toast.add({ severity: 'success', summary: 'Successful', detail: 'Fee Created', life: 3000 });
                    FeeService.getFees().then((data) => (fees.value = data)); // Reload fees
                }
            })
            .catch((error) => {
                console.error(error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'An unexpected error occurred. Please try again later.',
                    life: 3000
                });
            });
    }
}

// Confirm Fee Deletion
function confirmDeleteFee(feeData) {
    fee.value = feeData;
    deleteFeesDialog.value = true; // Open confirmation dialog
}

// Delete Selected Fee
function deleteSelectedFee() {
    FeeService.deleteFee(fee.value.id)
        .then((data) => {
            if (data.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Fee Deleted', life: 3000 });
                FeeService.getFees().then((data) => (fees.value = data)); // Reload fees
                deleteFeesDialog.value = false; // Close confirmation dialog
            }
        })
        .catch((error) => {
            console.error(error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'An unexpected error occurred. Please try again later.',
                life: 3000
            });
        });
}

// Export to CSV
function exportCSV() {
    dt.value.exportCSV();
}

async function approveFee(id) {
    try {
        const response = await FeeService.approveFee(id);
        toast.add({ severity: 'success', summary: 'Success', detail: response.message, life: 3000 });
        FeeService.getFees().then((data) => (fees.value = data));
    } catch (error) {
        console.error(error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to approve the fee. Please try again.',
            life: 3000
        });
    }
}

function getStatusLabel(noticeType) {
    return noticeType  ? 'success' : 'info';
}

function getStatus(bill) {
    if (!bill) {
        return 'Pending';
    } else {
        return 'Approved';
    }
}
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="New Fee" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
        </template>
        <template #end>
            <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
        </template>
    </Toolbar>

    <DataTable
        ref="dt"
        v-model:selection="selectedFees"
        :value="fees"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} fees"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Fees</h4>
                <InputText v-model="filters['global'].value" placeholder="Search..." />
            </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="revenueName" header="Revenue Name" sortable style="min-width: 12rem"></Column>
        <Column field="amount" header="Amount" sortable style="min-width: 12rem"></Column>
        <Column field="type" header="Type" sortable style="min-width: 12rem"></Column>
        <Column field="gfs.name" header="GFS ID" sortable style="min-width: 12rem"></Column>

        <Column field="active" header="Approval Status" sortable style="min-width: 12rem">
            <template #body="slotProps">
                <Tag :value="getStatus(slotProps.data.active)" :severity="getStatusLabel(slotProps.data.active)" />
            </template>
        </Column>

        <Column :exportable="false" style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editFee(slotProps.data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteFee(slotProps.data)" />
                <Button icon="pi pi-check" outlined rounded severity="success" :disabled="slotProps.data.active" @click="approveFee(slotProps.data.id)" />
            </template>
        </Column>
    </DataTable>

    <!-- Dialog for Creating/Editing Fees -->
    <Dialog v-model:visible="feeDialog" :style="{ width: '700px' }" header="Fee Details" :modal="true">
        <div class="grid gap-4">
            <div class="col-12">
                <label for="revenueName" class="block font-bold mb-2">Revenue Name</label>
                <InputText id="revenueName" v-model.trim="fee.revenueName" required placeholder="Enter Revenue Name" class="w-full" />
                <small v-if="submitted && !fee.revenueName" class="text-red-500">Revenue Name is required.</small>
            </div>
            <div class="col-12">
                <label for="amount" class="block font-bold mb-2">Amount</label>
                <InputNumber id="amount" v-model="fee.amount" required mode="currency" currency="TZS" :min="0" placeholder="Enter Amount" class="w-full" />
                <small v-if="submitted && !fee.amount" class="text-red-500">Amount is required.</small>
            </div>
            <div class="col-12">
                <label for="notice" class="block font-bold mb-2">Type</label>
                <Select id="type" v-model="fee.type" :options="types" optionValue="value" optionLabel="label" placeholder="Select Type" required class="w-full" />
                <small v-if="submitted && !fee.type" class="text-red-500">GFS ID is required.</small>
            </div>

            <div class="col-12">
                <label for="notice" class="block font-bold mb-2">Gfs</label>
                <Select id="type" v-model="fee.gfsId" :options="availableGfs" optionValue="id" optionLabel="name" placeholder="Select Gfs" required class="w-full" />
                <small v-if="submitted && !fee.gfsId" class="text-red-500">GFS ID is required.</small>
            </div>
        </div>
        <template #footer>
            <div class="flex justify-end gap-3">
                <Button label="Cancel" icon="pi pi-times" text @click="feeDialog = false" />
                <Button label="Save" icon="pi pi-check" @click="saveFee" />
            </div>
        </template> </Dialog
    >x
    <!-- Dialog for Confirming Fee Deletion -->
    <Dialog v-model:visible="deleteFeesDialog" header="Confirm Deletion" :style="{ width: '400px' }" :modal="true">
        <p>Are you sure you want to delete the selected fee "{{ fee.revenueName }}"?</p>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteFeesDialog = false" />
            <Button label="Delete" icon="pi pi-check" severity="danger" @click="deleteSelectedFee" />
        </template>
    </Dialog>
</template>
