<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { NoticeHighService } from '@/service/NoticeHighService';
import { AppealService } from '@/service/AppealService';

const noticeTypes = ref([
    { label: 'GOVERNMENT', value: '1' },
    { label: 'OTHER PARTIES', value: '2' }
]);

const againts = ref([
    { label: 'PART', value: 'PART' },
    { label: 'WHOLE', value: 'WHOLE' }
]);

const toast = useToast();
const dt = ref();
const noticeDialog = ref(false);
const notice = ref({});
const submitted = ref(false);
const loading = ref(false);
const notices = ref([]);
const appeals = ref([]);

// Stat cards
const totalNotices = ref(0);
const governmentCount = ref(0);
const otherPartiesCount = ref(0);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    loading.value = true;
    NoticeHighService.getNoticesHigh()
        .then((data) => {
            notices.value = data;
            totalNotices.value = data.length;
            governmentCount.value = data.filter((n) => n.appellantType === '1').length;
            otherPartiesCount.value = data.filter((n) => n.appellantType === '2').length;
        })
        .finally(() => (loading.value = false));

    AppealService.getAppeals().then((data) => {
        appeals.value = data;
    });
});

function openNew() {
    notice.value = {};
    submitted.value = false;
    noticeDialog.value = true;
}

function editNotice(not) {
    notice.value = { ...not };
    noticeDialog.value = true;
}

function saveNotice() {
    submitted.value = true;
    if (notice.value.appellantName?.trim()) {
        NoticeHighService.saveNoticeHigh(notice.value)
            .then((data) => {
                if (data.error) {
                    toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                } else {
                    toast.add({ severity: 'success', summary: 'Success', detail: 'Notice Created', life: 3000 });
                    noticeDialog.value = false;
                    notice.value = {};
                    submitted.value = false;
                    NoticeHighService.getNoticesHigh().then((data) => {
                        notices.value = data;
                        totalNotices.value = data.length;
                        governmentCount.value = data.filter((n) => n.appellantType === '1').length;
                        otherPartiesCount.value = data.filter((n) => n.appellantType === '2').length;
                    });
                }
            })
            .catch((error) => {
                console.error('Unexpected error:', error);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Unexpected error occurred', life: 3000 });
            });
    }
}

function getNoticeTypeLabel(type) {
    return type === '1' ? 'Government' : 'Other Party';
}

function getNoticeTypeSeverity(type) {
    return type === '1' ? 'info' : 'success';
}

function getBill(bill) {
    return bill ? bill.billControlNumber : 'No Bill';
}

function getBillSeverity(bill) {
    return bill ? 'info' : 'secondary';
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">High Court Notices</h1>
            <p class="text-muted-color mt-1">Manage and track high court notices efficiently</p>
        </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-12 gap-4 mb-6">
        <div class="col-span-4">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Total Notices</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ totalNotices }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                        <i class="pi pi-bell text-white"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-4">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Government</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ governmentCount }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                        <i class="pi pi-building text-white"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-4">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Other Parties</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ otherPartiesCount }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                        <i class="pi pi-users text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <!-- Action Bar -->
        <div class="flex items-center justify-between mb-4">
            <Button label="New Notice" icon="pi pi-plus" class="p-button-success" @click="openNew" />
            <div class="flex items-center gap-3">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search notices..." />
                </IconField>
                <Button label="Export" icon="pi pi-download" severity="secondary" outlined @click="exportCSV($event)" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="notices"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} notices"
            :loading="loading"
            stripedRows
        >
            <Column header="S/No" style="width: 4rem">
                <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                </template>
            </Column>
            <Column field="appellantName" header="Appellant Name" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #34d399, #10b981)">
                            {{ getInitial(slotProps.data.appellantName) }}
                        </div>
                        <div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.appellantName }}</div>
                            <Tag :value="getNoticeTypeLabel(slotProps.data.appellantType)" :severity="getNoticeTypeSeverity(slotProps.data.appellantType)" rounded class="text-xs" />
                        </div>
                    </div>
                </template>
            </Column>
            <Column field="respondentName" header="Respondent Name" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                            {{ getInitial(slotProps.data.respondentName) }}
                        </div>
                        <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.respondentName }}</div>
                    </div>
                </template>
            </Column>
            <Column field="createdAt" header="Filed On" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar text-muted-color"></i>
                        <span>{{ slotProps.data.createdAt }}</span>
                    </div>
                </template>
            </Column>
            <Column field="appellantPhone" header="Phone" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <span>{{ slotProps.data.appellantPhone }}</span>
                </template>
            </Column>
            <Column field="bill" header="Bill Status" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-1">
                        <span class="inline-block w-1.5 h-1.5 rounded-full" :class="slotProps.data.bill ? 'bg-emerald-500' : 'bg-gray-400'"></span>
                        <span>{{ getBill(slotProps.data.bill) }}</span>
                    </div>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 6rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-1">
                        <Button icon="pi pi-pencil" text rounded @click="editNotice(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Notice Dialog -->
    <Dialog v-model:visible="noticeDialog" :style="{ width: '900px' }" header="Notice Details" :modal="true">
        <div class="flex flex-col gap-5">
            <div class="bg-surface-100 dark:bg-surface-700 rounded-border p-4" style="border-left: 4px solid var(--primary-color)">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ notice.id ? 'Edit Notice' : 'Create New Notice' }}</div>
                <span class="text-muted-color text-sm">Fill in the details for the high court notice</span>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-tag text-muted-color"></i> Notice Type <span class="text-red-500">*</span></label>
                    <Select v-model="notice.appellantType" :options="noticeTypes" placeholder="Select a Type" optionValue="value" optionLabel="label" required fluid />
                </div>
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-phone text-muted-color"></i> Appellant Phone <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="notice.appellantPhone" required :invalid="submitted && !notice.appellantPhone" fluid placeholder="0XXX XXXXXX" />
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-user text-muted-color"></i> Appellant Name <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="notice.appellantName" required autofocus :invalid="submitted && !notice.appellantName" fluid placeholder="Enter appellant name" />
                    <small v-if="submitted && !notice.appellantName" class="text-red-500">Appellant name is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-user text-muted-color"></i> Respondent Name <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="notice.respondentName" required :invalid="submitted && !notice.respondentName" fluid placeholder="Enter respondent name" />
                    <small v-if="submitted && !notice.respondentName" class="text-red-500">Respondent name is required.</small>
                </div>
            </div>

            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-list text-muted-color"></i> List of Appeals</label>
                <MultiSelect v-model="notice.listOfAppeals" :options="appeals" optionValue="id" optionLabel="appealNo" placeholder="Select Appeals" fluid filter />
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" text @click="noticeDialog = false; notice = {}; submitted = false" />
            <Button label="Save Notice" class="p-button-success" @click="saveNotice" />
        </template>
    </Dialog>
</template>
