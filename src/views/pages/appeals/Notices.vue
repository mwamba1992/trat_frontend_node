<script setup>
import { NoticeService } from '@/service/NoticeService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';

onMounted(() => {
    loading.value = true;
    NoticeService.getNotices()
        .then((data) => (notices.value = data))
        .finally(() => (loading.value = false));
});

const selectedNotices = ref();
const toast = useToast();
const dt = ref();
const notices = ref();
const noticeDialog = ref(false);
const notice = ref({});
const submitted = ref(false);
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const noticeTypes = ref([
    { label: 'GOVERNMENT', value: '1' },
    { label: 'OTHER PARTIES', value: '2' }
]);

const againts = ref([
    { label: 'PART', value: 'PART' },
    { label: 'WHOLE', value: 'WHOLE' }
]);

function exportCSV() {
    dt.value.exportCSV();
}

function getStatusLabel(noticeType) {
    return noticeType === '1' ? 'info' : 'success';
}

function getBill(bill) {
    if (!bill) {
        return 'Exempted';
    } else {
        return bill.billControlNumber;
    }
}

function getBillSeverity(bill) {
    if (!bill) {
        return 'success';
    }
    return 'info';
}

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

    if (notice?.value.appellantFullName?.trim()) {
        if (notice.value.id) {
            NoticeService.editNoticeData(notice.value)
                .then((data) => {
                    if (data.error) {
                        toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                    } else {
                        noticeDialog.value = false;
                        notices.value = [...notices.value];
                        notice.value = {};
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'Notice Updated', life: 3000 });
                        NoticeService.getNotices().then((data) => (notices.value = data));
                    }
                })
                .catch((error) => {
                    console.error('Unexpected error:', error);
                    toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
                });
        } else {
            NoticeService.postNoticeData(notice.value)
                .then((data) => {
                    if (data.error) {
                        toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                    } else {
                        noticeDialog.value = false;
                        notices.value = [...notices.value];
                        notice.value = {};
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'Notice Created', life: 3000 });
                        NoticeService.getNotices().then((data) => (notices.value = data));
                    }
                })
                .catch((error) => {
                    console.error('Unexpected error:', error);
                    toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
                });
        }
    }
}

function isValidPhone(phone) {
    const phoneRegex = /^0\d{3} \d{6}$/;
    return phoneRegex.test(phone);
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Legal Notices</h1>
            <p class="text-muted-color mt-1">Manage and track all legal notices and appeals</p>
        </div>
        <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-sm text-muted-color">{{ notices?.length || 0 }} notices</span>
        </div>
    </div>

    <div class="card">
        <div class="flex items-center justify-between mb-6">
            <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNew" />
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
            v-model:selection="selectedNotices"
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
            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                </template>
            </Column>
            <Column field="noticeNo" header="Notice No" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <span class="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>{{ slotProps.data.noticeNo }}</span>
                    </div>
                </template>
            </Column>
            <Column field="appellantFullName" header="Filed By" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                            {{ getInitial(slotProps.data.appellantFullName) }}
                        </div>
                        <div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.appellantFullName }}</div>
                            <div class="text-muted-color text-sm">{{ slotProps.data.appellantPhone }}</div>
                        </div>
                    </div>
                </template>
            </Column>
            <Column field="respondentFullName" header="Against" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #34d399, #10b981)">
                            {{ getInitial(slotProps.data.respondentFullName) }}
                        </div>
                        <div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.respondentFullName }}</div>
                            <div class="text-muted-color text-sm">{{ slotProps.data.respondentPhone }}</div>
                        </div>
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
            <Column field="bill" header="Bill Status" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <Tag :value="getBill(slotProps.data.bill)" :severity="getBillSeverity(slotProps.data.bill)" rounded>
                        <template #default>
                            <span class="flex items-center gap-1">
                                <span class="inline-block w-1.5 h-1.5 rounded-full" :class="slotProps.data.bill ? 'bg-teal-400' : 'bg-emerald-400'"></span>
                                {{ getBill(slotProps.data.bill) }}
                            </span>
                        </template>
                    </Tag>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <Button icon="pi pi-pencil" text rounded @click="editNotice(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteNotice(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <Dialog v-model:visible="noticeDialog" :style="{ width: '900px' }" header="Notice Details" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="bg-surface-100 dark:bg-surface-700 rounded-border p-4">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Create New Notice</div>
                <span class="text-muted-color text-sm">Fill in the details for the legal notice</span>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label for="appellantFullName" class="block font-medium mb-2">Appellant Name <span class="text-red-500">*</span></label>
                    <InputText id="appellantFullName" v-model.trim="notice.appellantFullName" required="true" autofocus :invalid="submitted && !notice.appellantFullName" fluid placeholder="Enter appellant's full name" />
                    <small v-if="submitted && !notice.appellantFullName" class="text-red-500">Appellant name is required.</small>
                </div>
                <div class="col-span-6">
                    <label for="respondentFullName" class="block font-medium mb-2">Respondent Name <span class="text-red-500">*</span></label>
                    <InputText id="respondentFullName" v-model.trim="notice.respondentFullName" required="true" :invalid="submitted && !notice.respondentFullName" fluid placeholder="Enter respondent's full name" />
                    <small v-if="submitted && !notice.respondentFullName" class="text-red-500">Respondent name is required.</small>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label for="appellantPhone" class="block font-medium mb-2">Appellant Phone <span class="text-red-500">*</span></label>
                    <InputText id="appellantPhone" v-model.trim="notice.appellantPhone" required="true" :invalid="submitted && !notice.appellantPhone" fluid placeholder="0XXX XXXXXX" />
                    <small v-if="submitted && !isValidPhone(notice.appellantPhone)" class="text-red-500">Phone number is required.</small>
                </div>
                <div class="col-span-6">
                    <label for="respondentPhone" class="block font-medium mb-2">Respondent Phone <span class="text-red-500">*</span></label>
                    <InputText id="respondentPhone" v-model.trim="notice.respondentPhone" required="true" :invalid="submitted && !notice.respondentPhone" fluid placeholder="0XXX XXXXXX" />
                    <small v-if="submitted && !isValidPhone(notice.respondentPhone)" class="text-red-500">Phone number is required.</small>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label for="appealAgaints" class="block font-medium mb-2">Appeal Against <span class="text-red-500">*</span></label>
                    <Select id="appealAgaints" v-model="notice.appealAgaints" :options="againts" placeholder="Select appeal against" optionValue="value" optionLabel="label" required="true" fluid />
                    <small v-if="submitted && !notice.appealAgaints" class="text-red-500">Appeal against is required.</small>
                </div>
                <div class="col-span-6">
                    <label for="noticeType" class="block font-medium mb-2">Notice Type <span class="text-red-500">*</span></label>
                    <Select id="noticeType" v-model="notice.noticeType" :options="noticeTypes" placeholder="Select a notice type" optionValue="value" optionLabel="label" required="true" fluid />
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label for="listAppeal" class="block font-medium mb-2">List of Appeals</label>
                    <Textarea id="listAppeal" v-model="notice.listAppeal" rows="3" fluid placeholder="Enter list of appeals" style="resize: none; width: 100%;" />
                </div>
                <div class="col-span-6">
                    <label for="listApplication" class="block font-medium mb-2">List of Applications</label>
                    <Textarea id="listApplication" v-model="notice.listApplication" rows="3" fluid placeholder="Enter list of applications" style="resize: none; width: 100%;" />
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" text @click="noticeDialog = false" />
            <Button label="Save Notice" class="p-button-success" @click="saveNotice" />
        </template>
    </Dialog>
</template>
