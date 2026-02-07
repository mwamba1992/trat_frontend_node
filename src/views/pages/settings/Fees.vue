<script setup>
import { FeeService } from '@/service/FeesService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { SetupService } from '@/service/SetupService';

const toast = useToast();
const dt = ref();

const fees = ref([]);
const fee = ref({});
const availableGfs = ref([]);
const submitted = ref(false);
const feeDialog = ref(false);
const deleteDialog = ref(false);

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

const totalFees = computed(() => fees.value.length);
const approvedFees = computed(() => fees.value.filter((f) => f.active).length);
const pendingFees = computed(() => fees.value.filter((f) => !f.active).length);

onMounted(async () => {
    try {
        const setups = await SetupService.getSetups('gfs');
        availableGfs.value = (setups || []).map((setup) => ({
            id: setup.id,
            name: setup.description
        }));
    } catch (error) {
        console.error('Error fetching GFS:', error);
    }
    FeeService.getFees().then((data) => (fees.value = data || []));
});

function openNew() {
    fee.value = { revenueName: '', amount: null, type: null, gfsId: null };
    submitted.value = false;
    feeDialog.value = true;
}

function editFee(feeData) {
    fee.value = { ...feeData };
    fee.value.gfsId = feeData.gfs?.id || null;
    submitted.value = false;
    feeDialog.value = true;
}

function confirmDelete(feeData) {
    fee.value = { ...feeData };
    deleteDialog.value = true;
}

function saveFee() {
    submitted.value = true;
    if (!fee.value.revenueName?.trim() || !fee.value.amount || !fee.value.type || !fee.value.gfsId) return;

    const action = fee.value.id ? 'updateFee' : 'createFee';

    FeeService[action](fee.value)
        .then((data) => {
            if (data.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: fee.value.id ? 'Fee updated successfully' : 'Fee created successfully', life: 3000 });
                feeDialog.value = false;
                FeeService.getFees().then((data) => (fees.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
        });
}

function deleteFee() {
    FeeService.deleteFee(fee.value.id)
        .then((data) => {
            if (data?.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'Fee deleted successfully', life: 3000 });
                deleteDialog.value = false;
                FeeService.getFees().then((data) => (fees.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete fee', life: 3000 });
        });
}

async function approveFee(id) {
    try {
        const response = await FeeService.approveFee(id);
        toast.add({ severity: 'success', summary: 'Success', detail: response.message || 'Fee approved successfully', life: 3000 });
        FeeService.getFees().then((data) => (fees.value = data || []));
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve the fee. Please try again.', life: 3000 });
    }
}

function exportCSV() {
    dt.value.exportCSV();
}

function formatAmount(amount) {
    if (!amount && amount !== 0) return '—';
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Fee Management</h1>
            <p class="text-muted-color mt-1">Configure and manage fee structures and revenue items</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Total Fees</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalFees }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                        <i class="pi pi-dollar text-purple-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Configured fee items</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Approved</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ approvedFees }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                        <i class="pi pi-check-circle text-emerald-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Active fee items</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Pending Approval</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ pendingFees }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #fefce8, #fde68a)">
                        <i class="pi pi-clock text-yellow-600"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Awaiting approval</span>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="card">
        <!-- Action Bar -->
        <div class="flex justify-between items-center mb-4">
            <Button label="New Fee" icon="pi pi-plus" class="p-button-success" @click="openNew" />
            <div class="flex gap-2">
                <IconField>
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search fees..." />
                </IconField>
                <Button label="Export" icon="pi pi-upload" severity="secondary" text @click="exportCSV" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="fees"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} fees"
            stripedRows
        >
            <template #empty>
                <div class="flex flex-col items-center justify-center py-8">
                    <i class="pi pi-dollar text-4xl text-muted-color mb-3"></i>
                    <span class="text-muted-color">No fees found</span>
                </div>
            </template>

            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    <span class="text-muted-color font-medium">{{ slotProps.index + 1 }}</span>
                </template>
            </Column>

            <Column field="revenueName" header="Revenue Name" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-border" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                            <i class="pi pi-wallet text-emerald-600 text-xs"></i>
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.revenueName }}</span>
                    </div>
                </template>
            </Column>

            <Column field="amount" header="Amount (TSh)" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <span class="font-semibold text-emerald-600">TSh {{ formatAmount(slotProps.data.amount) }}</span>
                </template>
            </Column>

            <Column field="type" header="Type" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <Tag v-if="slotProps.data.type" :value="slotProps.data.type" severity="info" rounded />
                    <span v-else class="text-muted-color">—</span>
                </template>
            </Column>

            <Column field="gfs.name" header="GFS Code" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <span class="text-muted-color">{{ slotProps.data.gfs?.name || slotProps.data.gfs?.description || '—' }}</span>
                </template>
            </Column>

            <Column field="active" header="Status" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.active ? 'Approved' : 'Pending'" :severity="slotProps.data.active ? 'success' : 'warn'" rounded>
                        <template #default>
                            <span class="flex items-center gap-1">
                                <span :style="{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: slotProps.data.active ? '#10b981' : '#eab308' }"></span>
                                {{ slotProps.data.active ? 'Approved' : 'Pending' }}
                            </span>
                        </template>
                    </Tag>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button icon="pi pi-pencil" label="Edit" text rounded class="p-button-success" size="small" @click="editFee(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="confirmDelete(slotProps.data)" />
                        <Button v-if="!slotProps.data.active" icon="pi pi-check" label="Approve" text rounded severity="info" size="small" @click="approveFee(slotProps.data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Create/Edit Fee Dialog -->
    <Dialog v-model:visible="feeDialog" :style="{ width: '600px' }" :header="fee.id ? 'Edit Fee' : 'New Fee'" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="flex items-center gap-3 pb-3" style="border-left: 4px solid #10b981; padding-left: 12px">
                <div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ fee.id ? 'Update Fee Details' : 'Create New Fee' }}</div>
                    <div class="text-muted-color text-sm">{{ fee.id ? 'Modify fee information' : 'Configure a new fee item for the system' }}</div>
                </div>
            </div>

            <!-- Revenue Name -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-wallet mr-2 text-muted-color"></i>Revenue Name <span class="text-red-500">*</span></label>
                <InputText v-model.trim="fee.revenueName" placeholder="Enter revenue name" fluid autofocus :invalid="submitted && !fee.revenueName" />
                <small v-if="submitted && !fee.revenueName" class="text-red-500">Revenue name is required.</small>
            </div>

            <!-- Amount + Type -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-dollar mr-2 text-muted-color"></i>Amount (TSh) <span class="text-red-500">*</span></label>
                    <InputNumber v-model="fee.amount" mode="currency" currency="TZS" :min="0" placeholder="Enter amount" fluid :invalid="submitted && !fee.amount" />
                    <small v-if="submitted && !fee.amount" class="text-red-500">Amount is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-tag mr-2 text-muted-color"></i>Type <span class="text-red-500">*</span></label>
                    <Select v-model="fee.type" :options="types" optionValue="value" optionLabel="label" placeholder="Select type" fluid :invalid="submitted && !fee.type" />
                    <small v-if="submitted && !fee.type" class="text-red-500">Type is required.</small>
                </div>
            </div>

            <!-- GFS Code -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-hashtag mr-2 text-muted-color"></i>GFS Code <span class="text-red-500">*</span></label>
                <Select v-model="fee.gfsId" :options="availableGfs" optionValue="id" optionLabel="name" placeholder="Select GFS code" fluid :invalid="submitted && !fee.gfsId" />
                <small v-if="submitted && !fee.gfsId" class="text-red-500">GFS code is required.</small>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="feeDialog = false" />
            <Button :label="fee.id ? 'Update' : 'Save'" icon="pi pi-check" class="p-button-success" @click="saveFee" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '420px' }" header="Confirm Deletion" :modal="true">
        <div class="flex flex-col items-center gap-4 py-4">
            <div class="flex items-center justify-center rounded-full" style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #fef2f2, #fecaca)">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <div class="text-center">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-1">Delete fee "{{ fee.revenueName }}"?</div>
                <div class="text-muted-color text-sm">This action cannot be undone.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteFee" />
        </template>
    </Dialog>
</template>
