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
    console.log(noticeType);
    return noticeType === '1' ? 'info' : 'success';
}

function getBill(bill) {
    console.log(bill);
    if (!bill) {
        return 'Exempted';
    } else {
        return bill.billControlNumber;
    }
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
                        // Handle error (show error message to user, etc.)
                        toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                    } else {
                        // Handle success (show success message, clear form, etc.)
                        noticeDialog.value = false;
                        notices.value = [...notices.value]; // Update notices list
                        notice.value = {}; // Clear the form
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'Notice Updated', life: 3000 });
                        NoticeService.getNotices().then((data) => (notices.value = data));
                    }
                })
                .catch((error) => {
                    console.error('Unexpected error:', error);
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'An unexpected error occurred. Please try again later.',
                        life: 3000
                    });
                });
        } else {
            NoticeService.postNoticeData(notice.value)
                .then((data) => {
                    if (data.error) {
                        // Handle error (show error message to user, etc.)
                        toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                    } else {
                        // Handle success (show success message, clear form, etc.)
                        noticeDialog.value = false;
                        notices.value = [...notices.value]; // Update notices list
                        notice.value = {}; // Clear the form
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'Notice Created', life: 3000 });
                        NoticeService.getNotices().then((data) => (notices.value = data));
                    }
                })
                .catch((error) => {
                    console.error('Unexpected error:', error);
                    toast.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'An unexpected error occurred. Please try again later.',
                        life: 3000
                    });
                });
        }
    }
}

function isValidPhone(phone) {
    console.log(phone);
    const phoneRegex = /^0\d{3} \d{6}$/;
    return phoneRegex.test(phone);
}
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="New" icon="pi pi-plus"  class="mr-2" @click="openNew" />
        </template>

        <template #end>
            <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
        </template>
    </Toolbar>
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
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Notices</h4>
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search..." />
                </IconField>
            </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="noticeNo" header="Notice No" sortable style="min-width: 12rem"></Column>
        <Column field="appellantFullName" header="Filled By" sortable style="min-width: 16rem"  ></Column>
        <Column field="respondentFullName" header="Againts" sortable style="min-width: 16rem"></Column>
        <Column field="createdAt" header="Filled On" sortable style="min-width: 16rem"></Column>
        <Column field="bill" header="Bill Status" sortable style="min-width: 12rem">
            <template #body="slotProps">
                <Tag :value="getBill(slotProps.data.bill)" :severity="getStatusLabel(slotProps.data.noticeType)" />
            </template>
        </Column>

        <Column :exportable="false" style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editNotice(slotProps.data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteNotice(slotProps.data)" />
            </template>
        </Column>
    </DataTable>
    <Dialog v-model:visible="noticeDialog" :style="{ width: '700px' }" header="Notice Details" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="appellantFullName" class="block font-bold mb-3">Appellant Name</label>
                <InputText id="appellantFullName" v-model.trim="notice.appellantFullName" required="true" autofocus :invalid="submitted && !notice.appellantFullName" fluid />
                <small v-if="submitted && !notice.appellantFullName" class="text-red-500">Appellant name is required.</small>
            </div>

            <div>
                <label for="respondentFullName" class="block font-bold mb-3">Respondent Name</label>
                <InputText id="respondentFullName" v-model.trim="notice.respondentFullName" required="true" :invalid="submitted && !notice.respondentFullName" fluid />
                <small v-if="submitted && !notice.respondentFullName" class="text-red-500">Respondent name is required.</small>
            </div>

            <div>
                <label for="appellantPhone" class="block font-bold mb-3">Appellant Phone</label>
                <InputText id="appellantPhone" v-mask="['(###) ###-####']" v-model.trim="notice.appellantPhone" required="true" :invalid="submitted && !notice.appellantPhone" fluid  aria-label="0XXX XXXXXX"/>
                <small v-if="submitted && !isValidPhone(notice.appellantPhone)" class="text-red-500">Phone number is required.</small>
            </div>

            <div>
                <label for="respondentPhone" class="block font-bold mb-3">Respondent Phone</label>
                <InputText id="respondentPhone"  v-model.trim="notice.respondentPhone" required="true" :invalid="submitted && !notice.respondentPhone" fluid aria-label="0XXX XXXXXX"/>
                <small v-if="submitted && !isValidPhone(notice.respondentPhone)" class="text-red-500">Phone number is required.</small>
            </div>

            <div>
                <label for="appealAgaints" class="block font-bold mb-3">Notice Type</label>
                <Select id="appealAgaints" v-model="notice.appealAgaints" :options="againts" placeholder="Select Againts" optionValue="value" optionLabel="label" required="true" fluid />
                <small v-if="submitted && !notice.appealAgaints" class="text-red-500">Appeal against is required.</small>
            </div>

            <div>
                <label for="noticeType" class="block font-bold mb-3">Notice Type</label>
                <Select id="noticeType" v-model="notice.noticeType" :options="noticeTypes" placeholder="Select a Notice Type" optionValue="value" optionLabel="label" required="true" fluid />
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label for="listAppeal" class="block font-bold mb-3">List Of Appeals</label>
                    <InputText id="listAppeal" v-model="notice.listAppeal" mode="listAppeal" placeholder="" fluid />
                </div>
                <div class="col-span-6">
                    <label for="listApplication" class="block font-bold mb-3">List Of Applications</label>
                    <InputText id="listApplication" v-model="notice.listApplication" fluid />
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
            <Button label="Save" icon="pi pi-check" @click="saveNotice" />
        </template>
    </Dialog>
</template>

<style>
.uppercase-header {
    text-transform: uppercase;
}
</style>
