<script setup>
import { SummonsService } from '@/service/SummonsService'; // Service to manage summons
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { onMounted, ref } from 'vue';
import Judge from '@/views/pages/settings/Judge.vue';
import { JudgeService } from '@/service/JudgeService';
import { AppealService } from '@/service/AppealService';

const selectedSummons = ref([]);
const toast = useToast();
const dt = ref();
const summons = ref([]);
const judges = ref([]);
const appeals = ref([]);
const selectedAppeals = ref([]);
const summonsDialog = ref(false);

const concludeDialog = ref(false);
const conclude = ref();

const summonsDetails = ref({});
const submitted = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(() => {
    SummonsService.getSummons().then((data) => (summons.value = data));
    JudgeService.getJudges().then((data) => (judges.value = data));
    AppealService.getAppeals().then((data) => (appeals.value = data));
});

// Summons status options
const summonsStatus = ref([
    { label: 'Pending', value: 'PENDING' },
    { label: 'Served', value: 'SERVED' },
    { label: 'Dismissed', value: 'DISMISSED' },
    { label: 'Responded', value: 'RESPONDED' }
]);

function exportCSV() {
    dt.value.exportCSV();
}

// Open dialog to create a new summons
function openNewSummons() {
    summonsDetails.value = {};
    summonsDetails.value.appeals = [];
    submitted.value = false;
    summonsDialog.value = true;
}

// Edit existing summons
function editSummons(summonsData) {
    summonsDetails.value = { ...summonsData };
    summonsDetails.value.judge = summonsData.judge.id;
    summonsDetails.value.appeals = summonsData.appealList;
    summonsDetails.value.member1 = summonsData.member1;
    summonsDetails.value.member2 = summonsData.member2;
    summonsDialog.value = true;
}

// Save summons (either create or update)
function saveSummons() {
    submitted.value = true;

    // Ensure necessary fields are filled

    if (summonsDetails.value.id) {
        SummonsService.updateSummons(summonsDetails.value)
            .then((data) => {
                if (data.error) {
                    toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                } else {
                    summonsDialog.value = false;
                    summons.value = [...summons.value]; // Update summons list
                    summonsDetails.value = {}; // Clear the form
                    toast.add({ severity: 'success', summary: 'Successful', detail: 'Summons Updated', life: 3000 });
                    SummonsService.getSummons().then((data) => (summons.value = data));
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
        SummonsService.createSummons(summonsDetails.value)
            .then((data) => {
                if (data.error) {
                    toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                } else {
                    summonsDialog.value = false;
                    summons.value = [...summons.value]; // Update summons list
                    summonsDetails.value = {}; // Clear the form
                    toast.add({ severity: 'success', summary: 'Successful', detail: 'Summons Created', life: 3000 });
                    SummonsService.getSummons().then((data) => (summons.value = data));
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

// Delete summons
function confirmDeleteSummons(summonsData) {
    // Implement delete functionality if necessary
    console.log(`Deleting summons: ${summonsData.id}`);
}
function concludeAppeals(summon) {
    summonsDetails.value = { ...summon };
    conclude.value = {};
    concludeDialog.value = true;
}

function addAppeals() {
    if (selectedAppeals.value) {
        if (!summonsDetails.value.appeals.some((existingAppellant) => existingAppellant.id === selectedAppeals.value.id)) {
            summonsDetails.value.appeals.push(selectedAppeals.value);
            selectedAppeals.value = null;
        } else {
            console.log('Appellant is already in the list.');
        }
    } else {
        console.log('No appellant selected.');
    }
}

function removeAppeals(index) {
    summonsDetails.value.appeals.splice(index, 1);
}
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="New Summons" icon="pi pi-plus" class="mr-2" @click="openNewSummons" />
        </template>

        <template #end>
            <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
        </template>
    </Toolbar>

    <DataTable
        ref="dt"
        v-model:selection="selectedSummons"
        :value="summons"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} summons"
        scrollable="false"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Summons</h4>
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search..." />
                </IconField>
            </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="judge.name" header="Chairman" sortable></Column>
        <Column field="startDate" header="Start Date" sortable></Column>
        <Column field="endDate" header="End Date" sortable></Column>
        <Column field="status" header="Status" sortable></Column>
        <Column header="Appeals/Applications" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.appealList && slotProps.data.appealList.length">
                    {{ slotProps.data.appealList.map((appeal) => appeal.appealNo).join(', ') }}
                </span>
            </template>
        </Column>
        <Column style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editSummons(slotProps.data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteSummons(slotProps.data)" />
                <Button icon="pi pi-trash" outlined rounded severity="info" @click="concludeAppeals(slotProps.data)" />
            </template>
        </Column>
    </DataTable>
    <Dialog v-model:visible="summonsDialog" :style="{ width: '700px' }" header="Summons Details" :modal="true">
        <!-- Appellant List -->
        <div class="col-12">
            <label for="appellantList" class="block font-bold mb-2">Appeals List</label>
            <Dropdown v-model="selectedAppeals" :options="appeals" optionLabel="appealNo" multiple placeholder="Select  Appeals" class="w-full" />
            <Button label="Add  Appeals" icon="pi pi-plus" @click="addAppeals" class="mt-2" />
            <div class="mt-2">
                <ul>
                    <li v-for="(appeal, index) in summonsDetails.appeals" :key="index">
                        {{ appeal.appealNo }}
                        <Button icon="pi pi-times" class="p-button-rounded p-button-danger ml-2" @click="removeAppeals(index)" />
                    </li>
                </ul>
            </div>
        </div>

        <div class="flex flex-col gap-6">
            <div>
                <label for="startDate" class="block font-bold mb-3">Start Date</label>
                <DatePicker id="startDate" v-model.trim="summonsDetails.startDate" required="true" :invalid="submitted && !summonsDetails.startDate" fluid />
                <small v-if="submitted && !summonsDetails.startDate" class="text-red-500">Start date is required.</small>
            </div>

            <div>
                <label for="endDate" class="block font-bold mb-3">End Date</label>
                <DatePicker id="endDate" v-model.trim="summonsDetails.endDate" required="true" :invalid="submitted && !summonsDetails.endDate" fluid />
                <small v-if="submitted && !summonsDetails.endDate" class="text-red-500">End date is required.</small>
            </div>

            <div>
                <label for="venue" class="block font-bold mb-3">Venue</label>
                <InputText id="venue" v-model="summonsDetails.venue" fluid />
            </div>

            <div>
                <label for="judge" class="block font-bold mb-3">ChairMan</label>
                <Select id="type" v-model="summonsDetails.judge" :options="judges" optionValue="id" optionLabel="name" placeholder="Select  Chairman" required class="w-full" />
            </div>

            <div>
                <label for="judge" class="block font-bold mb-3">Member 1</label>
                <Select id="type" v-model="summonsDetails.member1" :options="judges" optionValue="id" optionLabel="name" placeholder="Select Member1" required class="w-full" />
            </div>

            <div>
                <label for="judge" class="block font-bold mb-3">Member 2</label>
                <Select id="type" v-model="summonsDetails.member2" :options="judges" optionValue="id" optionLabel="name" placeholder="Select Member2" required class="w-full" />
            </div>

            <div>
                <label for="time" class="block font-bold mb-3">Time</label>
                <DatePicker id="time" v-model="summonsDetails.time" fluid timeOnly />
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="summonsDialog.value = false" />
            <Button label="Save" icon="pi pi-check" @click="saveSummons" />
        </template>
    </Dialog>

    <Dialog v-model:visible="concludeDialog" :style="{ width: '500px' }" header="Conclude Details" :modal="true">
        <div>
            <label for="startDate" class="block font-bold mb-3"> {{ summonsDetails.appealList.map((appeal) => appeal.appealNo).join(', ') }}</label>
        </div>
        <div>
            <label for="startDate" class="block font-bold mb-3">Concluding Date</label>
            <DatePicker id="startDate" v-model.trim="conclude.concludeDate" required="true" fluid />
        </div>
    </Dialog>
</template>
