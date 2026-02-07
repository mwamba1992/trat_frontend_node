<script setup>
import { ApplicationService } from '@/service/ApplicationService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { SetupService } from '@/service/SetupService';
import { PartyService } from '@/service/PartyService';

// References for data and state
const applications = ref([]);
const applicationDialog = ref(false);
const applicationViewDialog = ref(false);
const deleteApplicationDialog = ref(false);
const application = ref({});
const submitted = ref(false);
const dt = ref();
const toast = useToast();
const regions = ref([]);
const taxes = ref([]);
const availableAppellants = ref([]);
const availableRespondents = ref([]);
const availableApplications = ref([]);
const loading = ref(false);

// Stat cards
const totalApplications = ref(0);
const governmentCount = ref(0);
const othersCount = ref(0);

const applicationTypes = ref([
    { label: 'Government', value: '1' },
    { label: 'Others', value: '2' }
]);

const applicationsFor = ref([
    { label: 'Applications', value: '1' },
    { label: 'Appeals', value: '2' }
]);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(async () => {
    await fetchApplications();

    try {
        const setups = await SetupService.getSetups('region');
        regions.value = setups.map((setup) => ({
            id: setup.id,
            name: setup.description
        }));

        const taxTypes = await SetupService.getSetups('taxType');
        taxes.value = taxTypes.map((setup) => ({
            id: setup.id,
            name: setup.name
        }));

        const appellants = await PartyService.getApplicants();
        availableAppellants.value = appellants.map((appellant) => ({
            id: appellant.id,
            name: appellant.name
        }));

        const respondents = await PartyService.getRespondents();
        availableRespondents.value = respondents.map((respondent) => ({
            id: respondent.id,
            name: respondent.name
        }));

        const apps = await ApplicationService.getApplications();
        availableApplications.value = apps.map((app) => ({
            id: app.id,
            name: app.applicationNo + ' - ' + (app.appellantList[0]?.name || '')
        }));
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch setup options', life: 3000 });
    }
});

async function fetchApplications() {
    loading.value = true;
    const data = await ApplicationService.getApplications();
    applications.value = data;

    totalApplications.value = data.length;
    governmentCount.value = data.filter((a) => a.applicationType === '1').length;
    othersCount.value = data.filter((a) => a.applicationType === '2').length;

    loading.value = false;
}

function openNew() {
    application.value = {
        applicationNo: '',
        dateOfFilling: '',
        dateOfDecision: '',
        natureOfRequest: '',
        personnelResponsibleFor: '',
        decideBy: '',
        remarks: '',
        appellantList: [],
        respondentList: [],
        applicationss: [],
        notice: null,
        taxes: null,
        statusTrend: null,
        billId: null,
        applicationType: null,
        listAppeal: [],
        selectedType: null
    };
    submitted.value = false;
    applicationDialog.value = true;
}

function editApplication(app) {
    application.value = {
        ...app,
        taxes: app.taxes?.id || app.taxes,
        region: app.region?.id || app.region
    };
    submitted.value = false;
    applicationDialog.value = true;
}

function viewApplication(app) {
    application.value = { ...app };
    applicationViewDialog.value = true;
}

function hideDialog() {
    applicationDialog.value = false;
    submitted.value = false;
}

function saveApplication() {
    submitted.value = true;

    if (application.value.id) {
        ApplicationService.updateApplication(application.value.id, application.value)
            .then(() => {
                toast.add({ severity: 'success', summary: 'Success', detail: 'Application updated successfully', life: 3000 });
                fetchApplications();
                applicationDialog.value = false;
            })
            .catch((error) => {
                console.error(error);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update application', life: 3000 });
            });
    } else {
        ApplicationService.createApplication(application.value)
            .then(() => {
                toast.add({ severity: 'success', summary: 'Success', detail: 'Application created successfully', life: 3000 });
                fetchApplications();
                applicationDialog.value = false;
            })
            .catch((error) => {
                console.error(error);
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to create application', life: 3000 });
            });
    }
}

function deleteApplication() {
    ApplicationService.deleteApplication(application.value.id)
        .then(() => {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Application deleted successfully', life: 3000 });
            fetchApplications();
            deleteApplicationDialog.value = false;
        })
        .catch((error) => {
            console.error(error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete application', life: 3000 });
        });
}

// Temporary selected items
const selectedAppellants = ref(null);
const selectedRespondents = ref(null);
const selectedApplication = ref(null);

function addAppellant() {
    if (selectedAppellants.value) {
        if (!application.value.appellantList.some((a) => a.id === selectedAppellants.value.id)) {
            application.value.appellantList.push(selectedAppellants.value);
            selectedAppellants.value = null;
        }
    }
}

function addApplications() {
    if (selectedApplication.value) {
        if (!application.value.applicationss.some((a) => a.id === selectedApplication.value.id)) {
            application.value.applicationss.push(selectedApplication.value);
            selectedApplication.value = null;
        }
    }
}

function removeAppellant(index) {
    application.value.appellantList.splice(index, 1);
}

function removeApplications(index) {
    application.value.applicationss.splice(index, 1);
}

function addRespondent() {
    if (selectedRespondents.value) {
        if (!application.value.respondentList.some((r) => r.id === selectedRespondents.value.id)) {
            application.value.respondentList.push(selectedRespondents.value);
            selectedRespondents.value = null;
        }
    }
}

function removeRespondent(index) {
    application.value.respondentList.splice(index, 1);
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

function exportCSV() {
    dt.value.exportCSV();
}

function onSelectChange(data) {
    if (data === '1') {
        application.value.isApplicationDiv = true;
    } else {
        application.value.isApplicationDiv = false;
    }
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Applications Management</h1>
            <p class="text-muted-color mt-1">Manage and track all legal applications efficiently</p>
        </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-12 gap-4 mb-6">
        <div class="col-span-4">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Total Applications</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ totalApplications }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                        <i class="pi pi-file text-white"></i>
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
                        <div class="text-muted-color text-sm font-medium mb-1">Others</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ othersCount }}</div>
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
            <Button label="New Application" icon="pi pi-plus" class="p-button-success" @click="openNew" />
            <div class="flex items-center gap-3">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search applications..." />
                </IconField>
                <Button label="Export" icon="pi pi-download" severity="secondary" outlined @click="exportCSV($event)" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="applications"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} applications"
            :loading="loading"
            stripedRows
        >
            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                </template>
            </Column>
            <Column field="applicationNo" header="Application No" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <span class="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        <span class="font-medium">{{ slotProps.data.applicationNo }}</span>
                    </div>
                </template>
            </Column>
            <Column field="dateOfFilling" header="Date of Filing" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar text-muted-color"></i>
                        <span>{{ slotProps.data.dateOfFilling }}</span>
                    </div>
                </template>
            </Column>
            <Column header="Applicants" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div v-if="slotProps.data.appellantList && slotProps.data.appellantList.length" class="flex items-center gap-2">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #34d399, #10b981)">
                            {{ getInitial(slotProps.data.appellantList[0].name) }}
                        </div>
                        <div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.appellantList[0].name }}</div>
                            <div class="text-muted-color text-xs">{{ slotProps.data.appellantList.length }} applicant(s)</div>
                        </div>
                    </div>
                    <span v-else class="text-muted-color text-sm">No Applicants</span>
                </template>
            </Column>
            <Column header="Respondents" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div v-if="slotProps.data.respondentList && slotProps.data.respondentList.length" class="flex items-center gap-2">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                            {{ getInitial(slotProps.data.respondentList[0].name) }}
                        </div>
                        <div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.respondentList[0].name }}</div>
                            <div class="text-muted-color text-xs">{{ slotProps.data.respondentList.length }} respondent(s)</div>
                        </div>
                    </div>
                    <span v-else class="text-muted-color text-sm">No Respondents</span>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-1">
                        <Button icon="pi pi-pencil" text rounded @click="editApplication(slotProps.data)" />
                        <Button icon="pi pi-eye" text rounded severity="info" @click="viewApplication(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="application = { ...slotProps.data }; deleteApplicationDialog = true" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Application Dialog -->
    <Dialog v-model:visible="applicationDialog" header="Application Details" :modal="true" :style="{ width: '900px' }">
        <div class="flex flex-col gap-5">
            <div class="bg-surface-100 dark:bg-surface-700 rounded-border p-4" style="border-left: 4px solid var(--primary-color)">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ application.id ? 'Edit Application' : 'Create New Application' }}</div>
                <span class="text-muted-color text-sm">Fill in the details for the legal application</span>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-tag text-muted-color"></i> Application Type <span class="text-red-500">*</span></label>
                    <Select v-model="application.applicationType" :options="applicationTypes" optionValue="value" optionLabel="label" placeholder="Select Application Type" required fluid />
                </div>
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-calendar text-muted-color"></i> Date of Filing <span class="text-red-500">*</span></label>
                    <DatePicker v-model="application.dateOfFilling" dateFormat="yy-mm-dd" fluid showIcon />
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-map-marker text-muted-color"></i> Region <span class="text-red-500">*</span></label>
                    <Select v-model="application.region" :options="regions" optionValue="id" optionLabel="name" placeholder="Select Region" required fluid />
                </div>
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2">Tax Type <span class="text-red-500">*</span></label>
                    <Select v-model="application.taxes" :options="taxes" optionValue="id" optionLabel="name" placeholder="Select Tax Type" required fluid />
                </div>
            </div>

            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-file-edit text-muted-color"></i> Nature of Request <span class="text-red-500">*</span></label>
                <Textarea v-model="application.natureOfRequest" required rows="4" fluid placeholder="Describe the nature of your request..." style="resize: none; width: 100%" />
            </div>

            <!-- Appellant List -->
            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-users text-muted-color"></i> Appellant List</label>
                <div class="grid grid-cols-12 gap-3 mb-2">
                    <div class="col-span-10">
                        <Select v-model="selectedAppellants" :options="availableAppellants" optionLabel="name" placeholder="Select Applicants" filter filterBy="name" fluid />
                    </div>
                    <div class="col-span-2">
                        <Button label="Add" icon="pi pi-plus" class="w-full" @click="addAppellant" />
                    </div>
                </div>
                <div v-if="application.appellantList && application.appellantList.length" class="flex flex-wrap gap-2">
                    <Tag v-for="(appellant, index) in application.appellantList" :key="index" severity="info" rounded>
                        <span class="flex items-center gap-1">
                            {{ appellant.name }}
                            <i class="pi pi-times text-xs cursor-pointer" @click="removeAppellant(index)"></i>
                        </span>
                    </Tag>
                </div>
            </div>

            <!-- Respondent List -->
            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-id-card text-muted-color"></i> Respondent List</label>
                <div class="grid grid-cols-12 gap-3 mb-2">
                    <div class="col-span-10">
                        <Select v-model="selectedRespondents" :options="availableRespondents" optionLabel="name" placeholder="Select Respondents" filter filterBy="name" fluid />
                    </div>
                    <div class="col-span-2">
                        <Button label="Add" icon="pi pi-plus" class="w-full" @click="addRespondent" />
                    </div>
                </div>
                <div v-if="application.respondentList && application.respondentList.length" class="flex flex-wrap gap-2">
                    <Tag v-for="(respondent, index) in application.respondentList" :key="index" severity="success" rounded>
                        <span class="flex items-center gap-1">
                            {{ respondent.name }}
                            <i class="pi pi-times text-xs cursor-pointer" @click="removeRespondent(index)"></i>
                        </span>
                    </Tag>
                </div>
            </div>

            <!-- Separator -->
            <div class="border-t border-surface-200 dark:border-surface-600"></div>

            <!-- Link Applications/Appeals -->
            <div>
                <label class="flex items-center gap-2 font-semibold mb-3 text-lg"><i class="pi pi-link text-muted-color"></i> Link Applications/Appeals</label>
                <div>
                    <label class="block text-muted-color text-sm mb-1">Select Type To Link</label>
                    <Select v-model="application.selectedType" :options="applicationsFor" optionValue="value" optionLabel="label" placeholder="Select Type To Link" fluid @change="onSelectChange(application.selectedType)" />
                </div>

                <div v-if="application.selectedType" class="mt-4">
                    <div class="grid grid-cols-12 gap-3 mb-2">
                        <div class="col-span-10">
                            <Select v-model="selectedApplication" :options="availableApplications" optionLabel="name" placeholder="Select from list" filter filterBy="name" fluid />
                        </div>
                        <div class="col-span-2">
                            <Button label="Add" icon="pi pi-plus" class="w-full p-button-success" @click="addApplications" />
                        </div>
                    </div>
                    <div v-if="application.applicationss && application.applicationss.length" class="flex flex-wrap gap-2">
                        <Tag v-for="(app, index) in application.applicationss" :key="index" severity="secondary" rounded>
                            <span class="flex items-center gap-1">
                                {{ app.name || app }}
                                <i class="pi pi-times text-xs cursor-pointer" @click="removeApplications(index)"></i>
                            </span>
                        </Tag>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" text @click="hideDialog" />
            <Button label="Save Application" class="p-button-success" @click="saveApplication" />
        </template>
    </Dialog>

    <!-- View Application Dialog -->
    <Dialog v-model:visible="applicationViewDialog" header="Application Details" :modal="true" :style="{ width: '800px' }">
        <div class="bg-surface-100 dark:bg-surface-700 rounded-border p-4 mb-4" style="border-left: 4px solid var(--primary-color)">
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-bold text-xl text-surface-900 dark:text-surface-0">Application #{{ application.applicationNo }}</div>
                    <span class="text-muted-color text-sm">Filed on {{ application.dateOfFilling || 'N/A' }}</span>
                </div>
                <Tag v-if="application.applicationType" :value="application.applicationType === '1' ? 'Government' : 'Others'" :severity="application.applicationType === '1' ? 'info' : 'success'" rounded />
            </div>
        </div>

        <div class="flex flex-col gap-4">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <div class="text-muted-color text-sm">Application Number:</div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ application.applicationNo || '-' }}</div>
                </div>
                <div class="col-span-6">
                    <div class="text-muted-color text-sm">Tax Type:</div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ application.taxes?.name || '-' }}</div>
                </div>
            </div>
            <div>
                <div class="text-muted-color text-sm">Nature of Request:</div>
                <div class="font-medium text-surface-900 dark:text-surface-0">{{ application.natureOfRequest || '-' }}</div>
            </div>
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <div class="text-muted-color text-sm mb-2">Applicants</div>
                    <div v-if="application.appellantList && application.appellantList.length" class="flex flex-col gap-2">
                        <div v-for="(appellant, index) in application.appellantList" :key="index" class="flex items-center gap-2">
                            <div class="flex items-center justify-center rounded-full text-white font-bold text-xs" style="width: 1.5rem; height: 1.5rem; background: linear-gradient(135deg, #34d399, #10b981)">
                                {{ getInitial(appellant.name) }}
                            </div>
                            <span class="text-sm">{{ appellant.name }}</span>
                        </div>
                    </div>
                    <span v-else class="text-muted-color text-sm">None</span>
                </div>
                <div class="col-span-6">
                    <div class="text-muted-color text-sm mb-2">Respondents</div>
                    <div v-if="application.respondentList && application.respondentList.length" class="flex flex-col gap-2">
                        <div v-for="(respondent, index) in application.respondentList" :key="index" class="flex items-center gap-2">
                            <div class="flex items-center justify-center rounded-full text-white font-bold text-xs" style="width: 1.5rem; height: 1.5rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                                {{ getInitial(respondent.name) }}
                            </div>
                            <span class="text-sm">{{ respondent.name }}</span>
                        </div>
                    </div>
                    <span v-else class="text-muted-color text-sm">None</span>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Close" text @click="applicationViewDialog = false" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteApplicationDialog" header="Confirm Delete" :modal="true" :style="{ width: '400px' }">
        <div class="flex items-center gap-3">
            <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
            <span>Are you sure you want to delete this application?</span>
        </div>
        <template #footer>
            <Button label="Cancel" text @click="deleteApplicationDialog = false" />
            <Button label="Delete" severity="danger" @click="deleteApplication" />
        </template>
    </Dialog>
</template>
