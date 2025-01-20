<script setup>
import { ApplicationService } from '@/service/ApplicationService'; // Ensure a service exists to handle API requests
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { SetupService } from '@/service/SetupService';
import { PartyService } from '@/service/PartyService';

// References for data and state
const applications = ref([]);
const applicationDialog = ref(false);
const isAppealsDiv = ref(false);
const isApplicationDiv = ref(false);
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

// Fetch applications on component mount

onMounted(async () => {
    await fetchApplications();

    try {
        const setups = await SetupService.getSetups('region');
        regions.value = setups.map((setup) => ({
            id: setup.id,
            name: setup.description // Assuming each `CommonSetup` has `id` and `name`
        }));

        const taxTypes = await SetupService.getSetups('taxType');
        taxes.value = taxTypes.map((setup) => ({
            id: setup.id,
            name: setup.name // Assuming each `CommonSetup` has `id` and `name`
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

        const applications = await ApplicationService.getApplications();
        availableApplications.value = applications.map((application) => ({
            id: application.id,
            name: application.applicationNo + ' - ' + application.appellantList[0]?.name
        }));
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch setup options', life: 3000 });
    }
});

async function fetchApplications() {
    applications.value = await ApplicationService.getApplications();
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
    application.value = { ...app };
    applicationDialog.value = true;
}

function hideDialog() {
    applicationDialog.value = false;
    submitted.value = false;
}

function saveApplication() {
    submitted.value = true;

    console.log(application.value);

    if (application.value.id) {
        // Update existing application
        ApplicationService.updateApplication(application.value.id, application.value)
            .then(() => {
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Application updated successfully',
                    life: 3000
                });
                fetchApplications();
                applicationDialog.value = false;

            })
            .catch((error) => {
                console.error(error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update application',
                    life: 3000
                });
            });
    } else {
        // Create new application
        ApplicationService.createApplication(application.value)
            .then(() => {
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Application created successfully',
                    life: 3000
                });
                fetchApplications();
                applicationDialog.value = false;
            })
            .catch((error) => {
                console.error(error);
                toast.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create application',
                    life: 3000
                });
            });
    }
}

function deleteApplication() {
    ApplicationService.deleteApplication(application.value.id)
        .then(() => {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Application deleted successfully',
                life: 3000
            });
            fetchApplications();
            deleteApplicationDialog.value = false;
        })
        .catch((error) => {
            console.error(error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete application',
                life: 3000
            });
        });
}

// Temporary selected items
const selectedAppellants = ref([]);
const selectedRespondents = ref([]);
const selectedApplication = ref([]);

function addAppellant() {
    if (selectedAppellants.value) {
        if (!application.value.appellantList.some((existingAppellant) => existingAppellant.id === selectedAppellants.value.id)) {
            application.value.appellantList.push(selectedAppellants.value);
        } else {
            console.log('Appellant is already in the list.');
        }
    } else {
        console.log('No appellant selected.');
    }
}
function addApplications() {
    if (selectedApplication.value) {
        if (!application.value.applicationss.some((existingAppellant) => existingAppellant.id === selectedAppellants.value.id)) {
            application.value.applicationss.push(selectedApplication.value);
        } else {
            console.log('Appellant is already in the list.');
        }
    } else {
        console.log('No appellant selected.');
    }
}

// Remove appellant from the list
function removeAppellant(index) {
    application.value.appellantList.splice(index, 1);
}

function removeApplications(index) {
    application.value.applicationss.splice(index, 1);
}

function addRespondent() {
    if (selectedRespondents.value) {
        const exists = application.value.respondentList.some((existingRespondent) => existingRespondent.id === selectedRespondents.value.id);

        if (!exists) {
            // Add the selected respondent to the list
            application.value.respondentList.push(selectedRespondents.value);
        } else {
            console.log('Respondent is already in the list.');
        }

        selectedRespondents.value = null;
    } else {
        console.log('No respondent selected.');
    }
}

// Remove respondent from the list
function removeRespondent(index) {
    application.value.respondentList.splice(index, 1);
}

function onSelectChange(data) {
    console.log(data);

    if (data === '1') {
        isAppealsDiv.value = true;
        isApplicationDiv.value = false;
    } else {
        isApplicationDiv.value = true;
        isAppealsDiv.value = false;
    }
}
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="New" icon="pi pi-plus"  class="mr-2" @click="openNew" />
        </template>
        <template #end>
            <Button label="Export" icon="pi pi-upload" severity="secondary" @click="dt.value.exportCSV()" />
        </template>
    </Toolbar>

    <DataTable
        ref="dt"
        :value="applications"
        v-model:selection="selectedApplications"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} applications"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Applications</h4>
                <InputText v-model="filters['global'].value" placeholder="Search..." />
            </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem"></Column>
        <Column field="applicationNo" header="Application No" sortable></Column>
        <Column field="dateOfFilling" header="Date of Filing" sortable></Column>
        <Column header="Applicants" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.appellantList && slotProps.data.appellantList.length">
                    {{ slotProps.data.appellantList.map((appellant) => appellant.name).join(', ') }}
                </span>
                <span v-else>No Applicants</span>
            </template>
        </Column>

        <Column header="Respondents" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.respondentList && slotProps.data.respondentList.length">
                    {{ slotProps.data.respondentList.map((appellant) => appellant.name).join(', ') }}
                </span>
                <span v-else>No Applicants</span>
            </template>
        </Column>

        <Column field="natureOfRequest" header="Nature of Request" sortable></Column>
        <Column field="taxes.name" header="Tax" sortable></Column>
        <Column style="min-width: 12rem">
            <template #body="slotProps">
                <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editApplication(slotProps.data)" />
            </template>
        </Column>
    </DataTable>

    <Dialog v-model:visible="applicationDialog" header="Application Details" :modal="true" :style="{ width: '600px' }">
        <div class="grid">
            <!-- Taxes -->
            <div class="col-12">
                <label for="taxes" class="block font-bold mb-2">Application Types</label>
                <Select id="type" v-model="application.applicationType" :options="applicationTypes" optionValue="value" optionLabel="label" placeholder="Select Application Type" required class="w-full" />
            </div>

            <div class="col-12">
                <label for="dateOfFilling" class="block font-bold mb-2">Date of Filing</label>
                <DatePicker id="dateOfFilling" v-model="application.dateOfFilling" dateFormat="yy-mm-dd" class="w-full" />
            </div>

            <div class="col-12">
                <label for="notice" class="block font-bold mb-2">Region</label>
                <Select id="type" v-model="application.region" :options="regions" optionValue="id" optionLabel="name" placeholder="Select Region" required class="w-full" />
            </div>

            <!-- Taxes -->
            <div class="col-12">
                <label for="taxes" class="block font-bold mb-2">Taxes</label>
                <Select id="type" v-model="application.taxes" :options="taxes" optionValue="id" optionLabel="name" placeholder="Select Tax  Type" required class="w-full" />
            </div>

            <!-- Nature of Request -->
            <div class="col-12">
                <label for="natureOfRequest" class="block font-bold mb-2">Nature of Request</label>
                <Textarea id="natureOfRequest" v-model="application.natureOfRequest" required class="w-full" rows="4" />
            </div>

            <!-- Appellant List -->
            <div class="col-12">
                <label for="appellantList" class="block font-bold mb-2">Appellant List</label>
                <Dropdown v-model="selectedAppellants" :options="availableAppellants" optionLabel="name" multiple placeholder="Select Appellants" filter filterBy="name" class="w-full" />
                <Button label="Add Appellant" icon="pi pi-plus" @click="addAppellant" class="mt-2" />
                <div class="mt-2">
                    <ul>
                        <li v-for="(appellant, index) in application.appellantList" :key="index">
                            {{ appellant.name }}
                            <Button icon="pi pi-times" class="p-button-rounded p-button-danger ml-2" @click="removeAppellant(index)" />
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Respondent List -->
            <div class="col-12">
                <label for="respondentList" class="block font-bold mb-2">Respondent List</label>
                <Dropdown v-model="selectedRespondents" :options="availableRespondents" optionLabel="name" multiple placeholder="Select Respondents" filter filterBy="name" class="w-full" />
                <Button label="Add Respondent" icon="pi pi-plus" @click="addRespondent" class="mt-2" />
                <div class="mt-2">
                    <ul>
                        <li v-for="(respondent, index) in application.respondentList" :key="index">
                            {{ respondent.name }}
                            <Button icon="pi pi-times" class="p-button-rounded p-button-danger ml-2" @click="removeRespondent(index)" />
                        </li>
                    </ul>
                </div>
            </div>

            <div class="col-12">
                <label for="taxes" class="block font-bold mb-2">Application Types</label>
                <Select id="type" v-model="application.selectedType" @change="onSelectChange(application.selectedType)" :options="applicationsFor" optionValue="value" optionLabel="label" placeholder="Select Type To Link" required class="w-full" />
            </div>

            <!-- Appellant List -->
            <div class="col-12" v-if="isApplicationDiv">
                <label for="appellantList" class="block font-bold mb-2">Applications List</label>
                <Dropdown v-model="selectedApplication" :options="availableApplications" optionLabel="name" multiple placeholder="Select Appellants" class="w-full" />
                <Button label="Add Appellant" icon="pi pi-plus" @click="addApplications" class="mt-2" />
                <div class="mt-2">
                    <ul>
                        <li v-for="(appellant, index) in application.applicationss" :key="index">
                            {{ appellant.name }}
                            <Button icon="pi pi-times" class="p-button-rounded p-button-danger ml-2" @click="removeApplications(index)" />
                        </li>
                    </ul>
                </div>
            </div>

            <div v-if="isAppealsDiv" class="additional-div">
                <p>The div is now visible because you selected: {{ application.selectedType }}</p>
            </div>
        </div>

        <!-- Footer Buttons -->
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
            <Button label="Save" icon="pi pi-check" @click="saveApplication" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteApplicationDialog" header="Confirm Delete" :modal="true" :style="{ width: '350px' }">
        <p>Are you sure you want to delete this application?</p>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteApplicationDialog = false" />
            <Button label="Delete" icon="pi pi-check" severity="danger" @click="deleteApplication" />
        </template>
    </Dialog>
</template>
