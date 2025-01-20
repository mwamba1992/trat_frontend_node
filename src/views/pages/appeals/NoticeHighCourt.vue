<script setup>
import { ref, onMounted } from 'vue';
import { NoticeService } from '@/service/NoticeService';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { NoticeHighService } from '@/service/NoticeHighService';
import { AppealService } from '@/service/AppealService';

const noticeTypes = ref([
    { label: 'GOVERNMENT', value: '1' },
    { label: 'OTHER PARTIES', value: '2' }
]);

// Refs
const toast = useToast();
const noticeDialog = ref(false);
const notice = ref({});
const submitted = ref(false);
const loading = ref(false);
const selectedNotices = ref([]);
const bills = ref([]); // Array to hold Bill data
const notices = ref([]); // Array to hold Appeal data
const appeals = ref([]); // Array to hold Appeal data
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Fetch bills and appeals data
onMounted(() => {
    loading.value = true;
    NoticeHighService.getNoticesHigh().then((data) => {
        notices.value = data;
        loading.value = false;
    });
    AppealService.getAppeals().then((data) => {
        appeals.value = data;
    });
});

// Save or update the notice
const saveNotice = () => {
    submitted.value = true;
    if (notice.value.appellantName?.trim()) {
        // Create new notice
        NoticeHighService.saveNoticeHigh(notice.value)
            .then((data) => {
                if (data.error) {
                    toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                } else {
                    toast.add({ severity: 'success', summary: 'Success', detail: 'Notice Created', life: 3000 });
                    resetForm();
                }
            })
            .catch((error) => {
                console.error('Unexpected error:', error);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Unexpected error occurred', life: 3000 });
            });
    }
};

// Reset the form after saving or closing
const resetForm = () => {
    notice.value = {};
    noticeDialog.value = false;
    submitted.value = false;
};

// Validate phone number
const isValidPhone = (phone) => {
    const phoneRegex = /^0\d{3} \d{6}$/; // Example phone pattern
    return phoneRegex.test(phone);
};

// Open the dialog for creating or editing a notice
const openNew = () => {
    notice.value = {};
    submitted.value = false;
    noticeDialog.value = true;
};

// Edit the selected notice
const editNotice = (not) => {
    notice.value = { ...not };
    noticeDialog.value = true;
};
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNew" />
        </template>
        <template #end>
            <Button label="Export" icon="pi pi-upload" severity="secondary" />
        </template>
    </Toolbar>

    <!-- DataTable for Displaying Notices -->
    <DataTable
        v-model:selection="selectedNotices"
        :value="notices"
        :paginator="true"
        :rows="10"
        :loading="loading"
        :filters="filters"
        dataKey="id"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} notices"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Notices High Court</h4>
                <InputText v-model="filters['global'].value" placeholder="Search..." />
            </div>
        </template>

        <Column field="appellantName" header="Appellant Name" sortable style="min-width: 16rem"></Column>
        <Column field="respondentName" header="Respondent Name" sortable style="min-width: 16rem"></Column>
        <Column field="appellantPhone" header="Phone" sortable style="min-width: 12rem"></Column>
        <Column field="bill" header="Bill Status" sortable style="min-width: 12rem">
            <template #body="slotProps">
                <span>{{ slotProps.data.bill ? slotProps.data.bill.billControlNumber : 'No Bill' }}</span>
            </template>
        </Column>
        <Column :exportable="false" style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editNotice(slotProps.data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" />
            </template>
        </Column>
    </DataTable>

    <!-- Dialog for creating/editing notices -->
    <Dialog v-model:visible="noticeDialog" :style="{ width: '700px' }" header="Notice Details" :modal="true">
        <div class="flex flex-col gap-6">
            <!-- Appellant Type -->

            <div>
                <label for="noticeType" class="block font-bold mb-3">Notice Type</label>
                <Select id="noticeType" v-model="notice.appellantType" :options="noticeTypes" placeholder="Select a Type Of Application" optionValue="value" optionLabel="label" required="true" fluid />
            </div>

            <!-- Appellant Name -->
            <div>
                <label for="appellantName" class="block font-bold mb-3">Appellant Name</label>
                <InputText id="appellantName" v-model.trim="notice.appellantName" required="true" autofocus :invalid="submitted && !notice.appellantName" fluid />
                <small v-if="submitted && !notice.appellantName" class="text-red-500">Appellant name is required.</small>
            </div>

            <!-- Appellant Phone -->
            <div>
                <label for="appellantPhone" class="block font-bold mb-3">Appellant Phone</label>
                <InputText id="appellantPhone" v-mask="['(###) ###-####']" v-model.trim="notice.appellantPhone" required="true" :invalid="submitted && !notice.appellantPhone" fluid />
<!--                <small v-if="submitted && !isValidPhone(notice.appellantPhone)" class="text-red-500">Invalid phone number format.</small>-->
            </div>

            <!-- Respondent Name -->
            <div>
                <label for="respondentName" class="block font-bold mb-3">Respondent Name</label>
                <InputText id="respondentName" v-model.trim="notice.respondentName" required="true" :invalid="submitted && !notice.respondentName" fluid />
                <small v-if="submitted && !notice.respondentName" class="text-red-500">Respondent name is required.</small>
            </div>

            <!-- Appeals (Multi-select Dropdown) -->
            <div>
                <label for="listOfAppeals" class="block font-bold mb-3">List of Appeals</label>
                <MultiSelect id="listOfAppeals" v-model="notice.listOfAppeals" :options="appeals" optionValue="id" optionLabel="appealNo" placeholder="Select Appeals" />
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="resetForm" />
            <Button label="Save" icon="pi pi-check" @click="saveNotice" />
        </template>
    </Dialog>
</template>
