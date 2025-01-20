<script setup>
import { JudgeService } from '@/service/JudgeService'; // Ensure you have a service for handling Judge API requests
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';

onMounted(() => {
    JudgeService.getJudges().then((data) => (judges.value = data));
});

const selectedJudges = ref();
const toast = useToast();
const dt = ref();
const judges = ref();
const judgeDialog = ref(false);
const judge = ref({});
const submitted = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

function exportCSV() {
    dt.value.exportCSV();
}

function openNew() {
    judge.value = {};
    submitted.value = false;
    judgeDialog.value = true;
}

function editJudge(jud) {
    judge.value = { ...jud };
    judgeDialog.value = true;
}

function saveJudge() {
    submitted.value = true;

    if (judge?.value.name?.trim() && judge?.value.email?.trim() && judge?.value.phone?.trim()) {
        if (judge.value.id) {
            JudgeService.editJudgeData(judge.value)
                .then((data) => {
                    if (data.error) {
                        toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                    } else {
                        judgeDialog.value = false;
                        judges.value = [...judges.value]; // Update judges list
                        judge.value = {}; // Clear the form
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'Judge Updated', life: 3000 });
                        JudgeService.getJudges().then((data) => (judges.value = data));
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
            JudgeService.postJudgeData(judge.value)
                .then((data) => {
                    if (data.error) {
                        toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
                    } else {
                        judgeDialog.value = false;
                        judges.value = [...judges.value]; // Update judges list
                        judge.value = {}; // Clear the form
                        toast.add({ severity: 'success', summary: 'Successful', detail: 'Judge Created', life: 3000 });
                        JudgeService.getJudges().then((data) => (judges.value = data));
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
    }
}

const deleteJudgesDialog = ref(false);

function confirmDeleteJudge(jud) {
    judge.value = jud;
    // Show the dialog asking for confirmation of deletion
    deleteJudgesDialog.value = true;
}


function deleteSelectedJudges() {

    console.log(judge.value);
    // Filter out the selected judges from the judge list
    JudgeService.deleteJudge(judge.value.id)
        .then((data) => {
            if (data.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Judges Deleted', life: 3000 });
                JudgeService.getJudges().then((data) => (judges.value = data));
                selectedJudges.value = null; // Clear the selected judges
                deleteJudgesDialog.value = false; // Close the dialog
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
        v-model:selection="selectedJudges"
        :value="judges"
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
        <Column field="name" header="Judge Name" sortable style="min-width: 12rem"></Column>
        <Column field="email" header="Email" sortable style="min-width: 16rem"></Column>
        <Column field="phone" header="Phone" sortable style="min-width: 16rem"></Column>

        <Column :exportable="false" style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editJudge(slotProps.data)" />
                <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteJudge(slotProps.data)" />
            </template>
        </Column>
    </DataTable>

    <Dialog v-model:visible="judgeDialog" :style="{ width: '700px' }" header="Judge Details" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name" class="block font-bold mb-3">Name</label>
                <InputText id="name" v-model.trim="judge.name" required="true" autofocus :invalid="submitted && !judge.name" fluid />
                <small v-if="submitted && !judge.name" class="text-red-500">Name is required.</small>
            </div>

            <div>
                <label for="email" class="block font-bold mb-3">Email</label>
                <InputText id="email" v-model.trim="judge.email" required="true" :invalid="submitted && !judge.email" fluid />
                <small v-if="submitted && !judge.email" class="text-red-500">Email is required.</small>
            </div>

            <div>
                <label for="phone" class="block font-bold mb-3">Phone</label>
                <InputText id="phone" v-model.trim="judge.phone" required="true" :invalid="submitted && !judge.phone" fluid />
                <small v-if="submitted && !judge.phone" class="text-red-500">Phone number is required.</small>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
            <Button label="Save" icon="pi pi-check" @click="saveJudge" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteJudgesDialog" header="Confirm Deletion" :modal="true" :style="{ width: '400px' }">
        <p>Are you sure you want to delete the selected judge {{ judge.name}}</p>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" @click="deleteJudgesDialog = false" />
            <Button label="Delete" icon="pi pi-check" severity="danger" @click="deleteSelectedJudges" />
        </template>
    </Dialog>

</template>
