<script setup>
import { SummonsService } from '@/service/SummonsService';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { onMounted, ref, computed } from 'vue';
import { JudgeService } from '@/service/JudgeService';
import { AppealService } from '@/service/AppealService';
import { ApplicationService } from '@/service/ApplicationService';

const toast = useToast();
const dt = ref();

const summons = ref([]);
const judges = ref([]);
const appeals = ref([]);
const applications = ref([]);
const selectedAppeals = ref(null);
const selectedApplications = ref(null);

const summonsDialog = ref(false);
const deleteDialog = ref(false);
const concludeDialog = ref(false);

const showAppeal = ref(false);
const showApplication = ref(false);

const summonsDetails = ref({});
const conclude = ref({});
const submitted = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const summonForType = ref([
    { label: 'Appeals', value: 'Appeals' },
    { label: 'Applications', value: 'Applications' }
]);

const totalSummons = computed(() => summons.value.length);
const pendingSummons = computed(() => summons.value.filter((s) => s.status === 'PENDING').length);
const servedSummons = computed(() => summons.value.filter((s) => s.status === 'SERVED').length);
const respondedSummons = computed(() => summons.value.filter((s) => s.status === 'RESPONDED').length);

onMounted(() => {
    SummonsService.getSummons().then((data) => (summons.value = data || []));
    JudgeService.getJudges().then((data) => (judges.value = data || []));
    AppealService.getAppeals().then((data) => (appeals.value = data || []));
    ApplicationService.getApplications().then((data) => (applications.value = data || []));
});

function openNewSummons() {
    summonsDetails.value = { appeals: [], applications: [] };
    showAppeal.value = false;
    showApplication.value = false;
    submitted.value = false;
    summonsDialog.value = true;
}

function editSummons(summonsData) {
    summonsDetails.value = { ...summonsData };
    summonsDetails.value.judge = summonsData.judge?.id;
    summonsDetails.value.appeals = summonsData.appealList || [];
    summonsDetails.value.applications = summonsData.applicationList || [];
    summonsDetails.value.member1 = summonsData.member1;
    summonsDetails.value.member2 = summonsData.member2;

    if (summonsDetails.value.appeals?.length) {
        showAppeal.value = true;
        showApplication.value = false;
        summonsDetails.value.summonType = { label: 'Appeals', value: 'Appeals' };
    } else if (summonsDetails.value.applications?.length) {
        showAppeal.value = false;
        showApplication.value = true;
        summonsDetails.value.summonType = { label: 'Applications', value: 'Applications' };
    }

    submitted.value = false;
    summonsDialog.value = true;
}

function confirmDelete(summonsData) {
    summonsDetails.value = { ...summonsData };
    deleteDialog.value = true;
}

function saveSummons() {
    submitted.value = true;
    if (!summonsDetails.value.startDate || !summonsDetails.value.endDate || !summonsDetails.value.judge) return;

    const action = summonsDetails.value.id ? 'updateSummons' : 'createSummons';

    SummonsService[action](summonsDetails.value)
        .then((data) => {
            const result = data?.data || data;
            if (result?.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: summonsDetails.value.id ? 'Summons updated successfully' : 'Summons created successfully', life: 3000 });
                summonsDialog.value = false;
                SummonsService.getSummons().then((data) => (summons.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
        });
}

function deleteSummons() {
    SummonsService.deleteSummons(summonsDetails.value.id)
        .then(() => {
            toast.add({ severity: 'success', summary: 'Deleted', detail: 'Summons deleted successfully', life: 3000 });
            deleteDialog.value = false;
            SummonsService.getSummons().then((data) => (summons.value = data || []));
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete summons', life: 3000 });
        });
}

function concludeAppeals(summon) {
    summonsDetails.value = { ...summon };
    conclude.value = {};
    concludeDialog.value = true;
}

function submitConcludeDetails() {
    SummonsService.concludeSummon(summonsDetails.value.id, conclude.value)
        .then(() => {
            concludeDialog.value = false;
            toast.add({ severity: 'success', summary: 'Success', detail: 'Summons concluded successfully', life: 3000 });
            SummonsService.getSummons().then((data) => (summons.value = data || []));
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to conclude summons', life: 3000 });
        });
}

function onSelectSummon() {
    const type = summonsDetails.value.summonType?.value;
    showAppeal.value = type === 'Appeals';
    showApplication.value = type === 'Applications';
}

function addAppeals() {
    if (!selectedAppeals.value) return;
    if (!summonsDetails.value.appeals) summonsDetails.value.appeals = [];
    if (!summonsDetails.value.appeals.some((a) => a.id === selectedAppeals.value.id)) {
        summonsDetails.value.appeals.push(selectedAppeals.value);
    }
    selectedAppeals.value = null;
}

function addApplications() {
    if (!selectedApplications.value) return;
    if (!summonsDetails.value.applications) summonsDetails.value.applications = [];
    if (!summonsDetails.value.applications.some((a) => a.id === selectedApplications.value.id)) {
        summonsDetails.value.applications.push(selectedApplications.value);
    }
    selectedApplications.value = null;
}

function removeAppeals(index) {
    summonsDetails.value.appeals.splice(index, 1);
}

function removeApplications(index) {
    summonsDetails.value.applications.splice(index, 1);
}

function exportCSV() {
    dt.value.exportCSV();
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusSeverity(status) {
    switch (status) {
        case 'SERVED': return 'success';
        case 'RESPONDED': return 'info';
        case 'DISMISSED': return 'danger';
        default: return 'warn';
    }
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Summons Management</h1>
            <p class="text-muted-color mt-1">Create and manage court hearing summons</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Total Summons</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalSummons }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                        <i class="pi pi-calendar-times text-purple-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">All hearings</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Pending</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ pendingSummons }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #fefce8, #fde68a)">
                        <i class="pi pi-clock text-yellow-600"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Awaiting service</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Served</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ servedSummons }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                        <i class="pi pi-send text-emerald-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Successfully served</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Responded</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ respondedSummons }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eff6ff, #dbeafe)">
                        <i class="pi pi-check-circle text-blue-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Responses received</span>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="card">
        <!-- Action Bar -->
        <div class="flex justify-between items-center mb-4">
            <Button label="New Summons" icon="pi pi-plus" class="p-button-success" @click="openNewSummons" />
            <div class="flex gap-2">
                <IconField>
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search summons..." />
                </IconField>
                <Button label="Export" icon="pi pi-upload" severity="secondary" text @click="exportCSV" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="summons"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} summons"
            stripedRows
        >
            <template #empty>
                <div class="flex flex-col items-center justify-center py-8">
                    <i class="pi pi-calendar-times text-4xl text-muted-color mb-3"></i>
                    <span class="text-muted-color">No summons found</span>
                </div>
            </template>

            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    <span class="text-muted-color font-medium">{{ slotProps.index + 1 }}</span>
                </template>
            </Column>

            <Column field="judge.name" header="Chairman" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full font-bold text-xs text-white" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #10b981, #059669)">
                            {{ getInitials(slotProps.data.judge?.name) }}
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.judge?.name || '—' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="startDate" header="Start Date" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar text-muted-color text-xs"></i>
                        <span>{{ formatDate(slotProps.data.startDate) }}</span>
                    </div>
                </template>
            </Column>

            <Column field="endDate" header="End Date" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar text-muted-color text-xs"></i>
                        <span>{{ formatDate(slotProps.data.endDate) }}</span>
                    </div>
                </template>
            </Column>

            <Column field="status" header="Status" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <Tag :value="slotProps.data.status || 'PENDING'" :severity="getStatusSeverity(slotProps.data.status)" rounded />
                </template>
            </Column>

            <Column header="Appeals/Applications" style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex flex-wrap gap-1">
                        <Tag v-for="appeal in (slotProps.data.appealList || [])" :key="'a-' + appeal.id" severity="info" rounded>
                            <span class="flex items-center gap-1">
                                <i class="pi pi-file text-xs"></i>
                                {{ appeal.appealNo }}
                            </span>
                        </Tag>
                        <Tag v-for="app in (slotProps.data.applicationList || [])" :key="'app-' + app.id" severity="success" rounded>
                            <span class="flex items-center gap-1">
                                <i class="pi pi-briefcase text-xs"></i>
                                {{ app.applicationNo }}
                            </span>
                        </Tag>
                        <span v-if="!(slotProps.data.appealList?.length || slotProps.data.applicationList?.length)" class="text-muted-color">—</span>
                    </div>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex gap-1">
                        <Button icon="pi pi-pencil" label="Edit" text rounded class="p-button-success" size="small" @click="editSummons(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" size="small" @click="confirmDelete(slotProps.data)" />
                        <Button icon="pi pi-check-square" label="Conclude" text rounded severity="info" size="small" @click="concludeAppeals(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Create/Edit Summons Dialog -->
    <Dialog v-model:visible="summonsDialog" :style="{ width: '750px' }" header="Summons Details" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="flex items-center gap-3 pb-3" style="border-left: 4px solid #10b981; padding-left: 12px">
                <div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ summonsDetails.id ? 'Update Summons' : 'Create New Summons' }}</div>
                    <div class="text-muted-color text-sm">Fill in the details to create or update a court summons</div>
                </div>
            </div>

            <!-- Type Of Summons -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-list mr-2 text-muted-color"></i>Type Of Summons For <span class="text-red-500">*</span></label>
                <Select v-model="summonsDetails.summonType" :options="summonForType" optionLabel="label" placeholder="Select Summons Type" fluid @change="onSelectSummon" :invalid="submitted && !summonsDetails.summonType" />
                <small v-if="submitted && !summonsDetails.summonType" class="text-red-500">Summons type is required.</small>
            </div>

            <!-- Appeals List -->
            <div v-if="showAppeal">
                <label class="block font-medium mb-2"><i class="pi pi-file mr-2 text-muted-color"></i>Appeals List</label>
                <div class="flex gap-2">
                    <Select v-model="selectedAppeals" :options="appeals" optionLabel="appealNo" placeholder="Select Appeal" filter class="flex-1" />
                    <Button icon="pi pi-plus" class="p-button-success" @click="addAppeals" />
                </div>
                <div v-if="summonsDetails.appeals?.length" class="flex flex-wrap gap-2 mt-3">
                    <Tag v-for="(appeal, index) in summonsDetails.appeals" :key="index" severity="info" rounded>
                        <span class="flex items-center gap-2">
                            <i class="pi pi-file text-xs"></i>
                            {{ appeal.appealNo }}
                            <i class="pi pi-times text-xs cursor-pointer" @click="removeAppeals(index)"></i>
                        </span>
                    </Tag>
                </div>
            </div>

            <!-- Applications List -->
            <div v-if="showApplication">
                <label class="block font-medium mb-2"><i class="pi pi-briefcase mr-2 text-muted-color"></i>Applications List</label>
                <div class="flex gap-2">
                    <Select v-model="selectedApplications" :options="applications" optionLabel="applicationNo" placeholder="Select Application" filter class="flex-1" />
                    <Button icon="pi pi-plus" class="p-button-success" @click="addApplications" />
                </div>
                <div v-if="summonsDetails.applications?.length" class="flex flex-wrap gap-2 mt-3">
                    <Tag v-for="(app, index) in summonsDetails.applications" :key="index" severity="success" rounded>
                        <span class="flex items-center gap-2">
                            <i class="pi pi-briefcase text-xs"></i>
                            {{ app.applicationNo }}
                            <i class="pi pi-times text-xs cursor-pointer" @click="removeApplications(index)"></i>
                        </span>
                    </Tag>
                </div>
            </div>

            <!-- Start Date + End Date -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-calendar mr-2 text-muted-color"></i>Start Date <span class="text-red-500">*</span></label>
                    <DatePicker v-model="summonsDetails.startDate" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid :invalid="submitted && !summonsDetails.startDate" />
                    <small v-if="submitted && !summonsDetails.startDate" class="text-red-500">Start date is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-calendar mr-2 text-muted-color"></i>End Date <span class="text-red-500">*</span></label>
                    <DatePicker v-model="summonsDetails.endDate" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid :invalid="submitted && !summonsDetails.endDate" />
                    <small v-if="submitted && !summonsDetails.endDate" class="text-red-500">End date is required.</small>
                </div>
            </div>

            <!-- Venue + Time -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-map-marker mr-2 text-muted-color"></i>Venue</label>
                    <InputText v-model="summonsDetails.venue" placeholder="Enter venue location" fluid />
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-clock mr-2 text-muted-color"></i>Time</label>
                    <DatePicker v-model="summonsDetails.time" placeholder="Select time" timeOnly fluid />
                </div>
            </div>

            <!-- Panel Members Section -->
            <div class="border rounded-border p-4" style="background: linear-gradient(135deg, #f0fdf4, #fefefe)">
                <div class="flex items-center gap-2 mb-4">
                    <i class="pi pi-users text-emerald-600"></i>
                    <span class="font-semibold text-emerald-700">Panel Members</span>
                </div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-4">
                        <label class="block font-medium mb-2">Chairman <span class="text-red-500">*</span></label>
                        <Select v-model="summonsDetails.judge" :options="judges" optionValue="id" optionLabel="name" placeholder="Select Chairman" fluid :invalid="submitted && !summonsDetails.judge" />
                        <small v-if="submitted && !summonsDetails.judge" class="text-red-500">Chairman is required.</small>
                    </div>
                    <div class="col-span-4">
                        <label class="block font-medium mb-2">Member 1</label>
                        <Select v-model="summonsDetails.member1" :options="judges" optionValue="id" optionLabel="name" placeholder="Select Member 1" fluid />
                    </div>
                    <div class="col-span-4">
                        <label class="block font-medium mb-2">Member 2</label>
                        <Select v-model="summonsDetails.member2" :options="judges" optionValue="id" optionLabel="name" placeholder="Select Member 2" fluid />
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="summonsDialog = false" />
            <Button label="Save Summons" icon="pi pi-check" class="p-button-success" @click="saveSummons" />
        </template>
    </Dialog>

    <!-- Conclude Dialog -->
    <Dialog v-model:visible="concludeDialog" :style="{ width: '500px' }" header="Conclude Summons" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="flex items-center gap-3 pb-3" style="border-left: 4px solid #3b82f6; padding-left: 12px">
                <div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">Conclude Hearing</div>
                    <div class="text-muted-color text-sm">
                        <span v-if="summonsDetails.appealList?.length">{{ summonsDetails.appealList.map((a) => a.appealNo).join(', ') }}</span>
                        <span v-else-if="summonsDetails.applicationList?.length">{{ summonsDetails.applicationList.map((a) => a.applicationNo).join(', ') }}</span>
                    </div>
                </div>
            </div>

            <div>
                <label class="block font-medium mb-2"><i class="pi pi-calendar mr-2 text-muted-color"></i>Concluding Date</label>
                <DatePicker v-model="conclude.concludeDate" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid />
            </div>

            <div>
                <label class="block font-medium mb-2"><i class="pi pi-align-left mr-2 text-muted-color"></i>Description</label>
                <Textarea v-model="conclude.description" rows="4" placeholder="Enter concluding remarks" fluid />
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="concludeDialog = false" />
            <Button label="Submit" icon="pi pi-check" severity="info" @click="submitConcludeDetails" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '420px' }" header="Confirm Deletion" :modal="true">
        <div class="flex flex-col items-center gap-4 py-4">
            <div class="flex items-center justify-center rounded-full" style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #fef2f2, #fecaca)">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <div class="text-center">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-1">Delete this summons?</div>
                <div class="text-muted-color text-sm">This action cannot be undone.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSummons" />
        </template>
    </Dialog>
</template>
