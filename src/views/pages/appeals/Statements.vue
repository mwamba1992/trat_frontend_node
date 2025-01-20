<script setup>
import { ApplicationService } from '@/service/ApplicationService'; // Ensure a service exists to handle API requests
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { SetupService } from '@/service/SetupService';
import { PartyService } from '@/service/PartyService';
import { AppealService } from '@/service/AppealService';
import { NoticeService } from '@/service/NoticeService';

// References for data and state
const appeals = ref([]);
const appealDialog = ref(false);
const appealDecisionDialog = ref(false);
const appealViewDialog = ref(false);
const isAppealsDiv = ref(false);
const isApplicationDiv = ref(false);
const deleteApplicationDialog = ref(false);
const appeal = ref({});
const appealAmount = ref({});
const submitted = ref(false);
const dt = ref();
const toast = useToast();
const regions = ref([]);
const taxes = ref([]);
const currencies = ref([]);
const notices = ref([]);
const availableAppellants = ref([]);
const availableRespondents = ref([]);
const availableApplications = ref([]);
const loading = ref(false);
const searchCriteria = ref({
    year: '',
    taxType: '',
    region: ''
});


const choices = ref([
    {  name: 'Appeals', id: '2' },
    {  name: 'Application', id: '1' },
]);
const appealFor = ref([
    { label: 'Applications', value: '1' },
    { label: 'Appeals', value: '2' }
]);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Fetch applications on component mount

onMounted(async () => {
    await fetchAppeals();

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

        const currencyTypes = await SetupService.getSetups('currency');
        currencies.value = currencyTypes.map((setup) => ({
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

        // const applications = await ApplicationService.getAppealsFromTrab();
        // availableApplications.value = applications._embedded.appeals.map((application) => ({
        //     id: application.id,
        //     name: application.appealNo + ' - ' + application._embedded.tax.taxName
        // }));

        const notice = await NoticeService.getNotices();
        notices.value = notice.map((not) => ({
            id: not.id,
            name: not.noticeNo + ' - ' + not.appellantFullName
        }));
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch setup options', life: 3000 });
    }
});

async function fetchAppeals() {
    loading.value = true;
    appeals.value = await AppealService.getAppeals();
    loading.value = false;
}

function openNew() {
    appeal.value = {
        appealNo: '',
        dateOfFilling: '',
        dateOfDecision: '',
        natureOfRequest: '',
        personnelResponsibleFor: '',
        decideBy: '',
        remarks: '',
        appellantList: [],
        respondentList: [],
        applicationss: [],
        amountCurrencyList: [],
        notice: null,
        taxes: null,
        statusTrend: null,
        billId: null,
        applicationType: null,
        listAppeal: [],
        selectedType: null
    };

    appealAmount.value = {
        amount: null,
        currency: ''
    };

    submitted.value = false;
    appealDialog.value = true;
}

function editApplication(app) {
    appeal.value = { ...app };
    appealDialog.value = true;
}

function hideDialog() {
    appealDialog.value = false;
    submitted.value = false;
}

function saveAppeal() {
    submitted.value = true;

    if (appeal.value.id) {
        // Update existing application
        AppealService.updateAppeal(appeal.value.id, appeal.value)
            .then(() => {
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Application updated successfully',
                    life: 3000
                });
                fetchAppeals();
                appealDialog.value = false;
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
        AppealService.createAppeal(appeal.value)
            .then(() => {
                toast.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Application created successfully',
                    life: 3000
                });
                fetchAppeals();
                appealDialog.value = false;
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
    AppealService.deleteApplication(appeal.value.id)
        .then(() => {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Application deleted successfully',
                life: 3000
            });
            fetchAppeals();
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
        if (!appeal.value.appellantList.some((existingAppellant) => existingAppellant.id === selectedAppellants.value.id)) {
            appeal.value.appellantList.push(selectedAppellants.value);
            selectedAppellants.value = null;
        } else {
            console.log('Appellant is already in the list.');
        }
    } else {
        console.log('No appellant selected.');
    }
}
function addApplications() {
    console.log(selectedApplication.value);
    if (selectedApplication.value) {
        if (!appeal.value.applicationss.some((existingAppellant) => existingAppellant === selectedApplication.value.id)) {
            appeal.value.applicationss.push(selectedApplication.value);
            selectedApplication.value = null;
        } else {
            console.log('Appeals is already in the list.');
        }
    } else {
        console.log('No Appeals  selected.');
    }
}

function addAmountCurrency() {
    const amount = appealAmount.value.amount; // Fetch value from the amount input
    const currency = appealAmount.value.currency; // Fetch value from the currency input

    if (amount && currency) {
        appeal.value.amountCurrencyList.push({ amount, currency });

        appealAmount.value.amount = null;
        appealAmount.value.currency = '';
    } else {
        this.$toast.add({
            severity: 'warn',
            summary: 'Missing Information',
            detail: 'Please enter both amount and currency.',
            life: 3000
        });
    }
}

/**
 * Removes an amount and currency entry from the list.
 * @param {number} index Index of the entry to remove
 */
function removeAmountCurrency(index) {
    appeal.value.amountCurrencyList.splice(index, 1);
}

// Remove appellant from the list
function removeAppellant(index) {
    appeal.value.appellantList.splice(index, 1);
}

function removeApplications(index) {
    appeal.value.applicationss.splice(index, 1);
}

function addRespondent() {
    if (selectedRespondents.value) {
        const exists = appeal.value.respondentList.some((existingRespondent) => existingRespondent.id === selectedRespondents.value.id);

        if (!exists) {
            // Add the selected respondent to the list
            appeal.value.respondentList.push(selectedRespondents.value);
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
    appeal.value.respondentList.splice(index, 1);
}

// function onSelectChange(data) {
//     console.log(data);
//
//     if (data === '1') {
//         isAppealsDiv.value = true;
//         isApplicationDiv.value = false;
//     } else {
//         isApplicationDiv.value = true;
//         isAppealsDiv.value = false;
//     }
// }

const isLoading = ref(false);

function searchApplications() {
    isLoading.value = true;
    AppealService.searchAppeals(searchCriteria.value)
        .then((data) => {
            if(searchCriteria.value.type == "1"){
                availableApplications.value = data._embedded.applicationregister.map((application) => ({
                    id: application.id,
                    name: "Application " + application.applicationNo + ' - ' + application._embedded.taxes.taxName
                }));

            }else{
                availableApplications.value = data._embedded.appeals.map((application) => ({
                    id: application.id,
                    name: "Appeal" + application.appealNo + ' - ' + application._embedded.tax.taxName
                }));
            }
            isLoading.value = false;
        })
        .catch((error) => {
            console.error(error);
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to fetch applications',
                life: 3000
            });
        })
        .finally({});
}

function updateDecision(app) {
    appeal.value = { ...app };
    appealDecisionDialog.value = true;
}

function viewAppeal(app) {
    console.log(app)
    appeal.value = { ...app };
    appealViewDialog.value = true;
}

function formatAmount(value) {
    return new Intl.NumberFormat().format(value);
}


</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNew" />
        </template>
        <template #end>
            <Button label="Export" icon="pi pi-upload" @click="dt.value.exportCSV()" />
        </template>
    </Toolbar>

    <DataTable
        ref="dt"
        :value="appeals"
        v-model:selection="selectedApplication"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :filters="filters"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} applications"
        :loading="loading"
    >
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Manage Statements</h4>
                <InputText v-model="filters['global'].value" placeholder="Search..." />
            </div>
        </template>

        <Column selectionMode="multiple" style="width: 3rem"></Column>
        <Column field="appealNo" header="Appeal No" sortable></Column>
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
                <Button icon="pi pi-undo" outlined rounded class="mr-2" @click="updateDecision(slotProps.data)" />
                <Button icon="pi pi-eye" outlined rounded class="mr-2" @click="viewAppeal(slotProps.data)" />
            </template>
        </Column>
    </DataTable>

    <Dialog v-model:visible="appealDialog" header="Appeals Details" :modal="true" :style="{ width: '800px' }">
        <div class="grid">
            <!-- Taxes -->

            <!-- Taxes -->
            <div class="col-12">
                <label for="taxes" class="block font-bold mb-2">Notice</label>
                <Select id="type" v-model="appeal.notice" :options="notices" optionValue="id" optionLabel="name" placeholder="Select Notice" required filter filterBy="name" class="w-full" />
            </div>

            <div class="col-12">
                <label for="dateOfFilling" class="block font-bold mb-2">Date of Filing</label>
                <DatePicker id="dateOfFilling" v-model="appeal.dateOfFilling" dateFormat="yy-mm-dd" class="w-full" />
            </div>

            <div class="col-12">
                <label for="notice" class="block font-bold mb-2">Region</label>
                <Select id="type" v-model="appeal.region" :options="regions" optionValue="id" optionLabel="name" placeholder="Select Region" required class="w-full" />
            </div>

            <!-- Taxes -->
            <div class="col-12">
                <label for="taxes" class="block font-bold mb-2">Taxes</label>
                <Select id="type" v-model="appeal.taxes" :options="taxes" optionValue="id" optionLabel="name" placeholder="Select Tax  Type" required class="w-full" />
            </div>

            <!-- Nature of Request -->
            <div class="col-12">
                <label for="natureOfRequest" class="block font-bold mb-2">Nature of Request</label>
                <Textarea id="natureOfRequest" v-model="appeal.natureOfRequest" required class="w-full" rows="4" />
            </div>

            <!-- Appellant List -->
            <div class="col-12">
                <label for="appellantList" class="block font-bold mb-2">Appellant List</label>
                <Dropdown v-model="selectedAppellants" :options="availableAppellants" optionLabel="name" multiple placeholder="Select Appellants" class="w-full" filter filterBy="name" />
                <Button label="Add Appellant" icon="pi pi-plus" @click="addAppellant" class="mt-2" />
                <div class="mt-2">
                    <ul>
                        <li v-for="(appellant, index) in appeal.appellantList" :key="index">
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
                        <li v-for="(respondent, index) in appeal.respondentList" :key="index">
                            {{ respondent.name }}
                            <Button icon="pi pi-times" class="p-button-rounded p-button-danger ml-2" @click="removeRespondent(index)" />
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Amount and Currency Selection -->
            <div class="col-12">
                <label for="amountCurrency" class="block font-bold mb-2">Amount and Currency</label>

                <!-- Input Row -->
                <div class="flex align-items-center gap-3 mb-3">
                    <!-- Amount Input -->
                    <InputNumber
                        v-model="appealAmount.amount"
                        ref="amountInput"
                        placeholder="Enter Amount"
                        class="flex-grow-1"
                        mode="decimal"
                        min="0"
                        step="0.01"
                        :minFractionDigits="2"
                        :maxFractionDigits="5"
                    />

                    <!-- Currency Dropdown -->
                    <Dropdown v-model="appealAmount.currency" ref="currencyInput" :options="currencies" optionLabel="name" optionValue="name" placeholder="Select Currency" class="flex-grow-1" />

                    <!-- Add Button -->
                    <Button label="Add" icon="pi pi-plus" @click="addAmountCurrency" class="p-button-primary" />
                </div>

                <!-- Display Added Amounts and Currencies -->
                <div class="mt-2">
                    <ul>
                        <li v-for="(entry, index) in appeal.amountCurrencyList" :key="index">
                            {{ entry.amount }} {{ entry.currency }}
                            <Button icon="pi pi-times" class="p-button-rounded p-button-danger ml-2" @click="removeAmountCurrency(index)" />
                        </li>
                    </ul>
                </div>
            </div>

            <!--            <div class="col-12">-->
            <!--                <label for="taxes" class="block font-bold mb-2">Application Types</label>-->
            <!--                <Select id="type" v-model="appeal.selectedType" @change="onSelectChange(appeal.selectedType)" :options="appealFor" optionValue="value" optionLabel="label" placeholder="Select Type To Link" required class="w-full" />-->
            <!--            </div>-->

            <!-- Appellant List -->
            <div class="col-12">
                <label for="appellantList" class="block font-bold mb-2">Search Appeals/Applications From Trab</label>
                <div class="flex align-items-center gap-3 mb-3">
                    <Select id="type" v-model="searchCriteria.type" :options="choices" optionValue="id" optionLabel="name" placeholder="Select Type " required filter filterBy="name"  class="flex-grow-1" />
                    <InputText v-model="searchCriteria.year" type="number" placeholder="Year" class="flex-grow-1" />
                    <InputText v-model="searchCriteria.region" type="text" placeholder="Region" class="flex-grow-1" />
                    <Button label="Search" icon="pi pi-search" @click="searchApplications" class="mt-2" />
                </div>

                <div v-if="isLoading" class="loader-container">
                    <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
                    <span> Fetching Appeals/Applications From Trab...</span>
                </div>
                <label for="appellantList" class="block font-bold mb-2">Appeals From Trab List</label>
                <Dropdown v-model="selectedApplication" :options="availableApplications" optionLabel="name" optionValue="name" multiple placeholder="Select Appeals" filter filterBy="name" class="w-full" />
                <Button label="Add Appeals" icon="pi pi-plus" @click="addApplications" class="mt-2" />
                <div class="mt-2">
                    <ul>
                        <li v-for="(appellant, index) in appeal.applicationss" :key="index">
                            {{ appellant }}
                            <Button icon="pi pi-times" class="p-button-rounded p-button-danger ml-2" @click="removeApplications(index)" />
                        </li>
                    </ul>
                </div>
            </div>

            <!--            <div v-if="isAppealsDiv" class="additional-div">-->
            <!--                <p>The div is now visible because you selected: {{ appeal.selectedType }}</p>-->
            <!--            </div>-->
        </div>

        <!-- Footer Buttons -->
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
            <Button label="Save" icon="pi pi-check" @click="saveAppeal" />
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

    <Dialog v-model:visible="appealDecisionDialog" header="Update Appeal Decision" :modal="true" :style="{ width: '750px' }">
        <div>
            <label for="appealNo" class="block font-bold mb-3">Appeal No</label>
            <InputText id="appealNo" v-model.trim="appeal.appealNo" readonly="true" fluid />
        </div>

        <div class="col-12">
            <label for="dateOfDecision" class="block font-bold mb-2">Date of Decision</label>
            <DatePicker id="dateOfDecision" v-model="appeal.dateOfDecision" dateFormat="yy-mm-dd" class="w-full" />
        </div>

        <div class="col-12">
            <label for="dateOfDecision" class="block font-bold mb-2">Date of Decision</label>
            <DatePicker id="dateOfDecision" v-model="appeal.dateOfDecision" dateFormat="yy-mm-dd" class="w-full" />
        </div>
    </Dialog>

    <Dialog v-model:visible="appealViewDialog" header="Appeal Details" :modal="true" :style="{ width: '650px' }">
            <!-- Grid Structure: Appeal Details -->

                <div class="mt-8">
                    <div class="grid sm:grid-cols-2 gap-4">
                        <div class="grid grid-cols-2 gap-y-2">
                            <div><strong>Appeal Number:</strong></div>
                            <div>:{{ appeal.appealNo }}</div>

                            <div><strong>Date of Filing:</strong></div>
                            <div>:{{ appeal.dateOfFilling }}</div>

                            <div><strong>Date of Decision:</strong></div>
                            <div>:{{ appeal.dateOfDecision }}</div>

                            <div><strong>Date of Concluding:</strong></div>
                            <div>:{{ appeal.concludingDate }}</div>

                            <div><strong>Date of Last Order:</strong></div>
                            <div>:{{ appeal.dateOfLastOrder }}</div>

                            <div><strong>Nature of Request:</strong></div>
                            <div>:{{ appeal.natureOfRequest }}</div>

                            <div><strong>Notice:</strong></div>
                            <div>:{{ appeal.notice.noticeNo }}</div>

                            <div><strong>Tax Information:</strong></div>
                            <div>:{{ appeal.taxes.name }}</div>

                            <div><strong>Status Trend:</strong></div>
                            <div>:{{ appeal.statusTrend.name }}</div>
                        </div>
                    </div>
                </div>
                    <!-- Appeal Details Section (First Column) -->
            <div class="mt-8">
                <div class="grid sm:grid-cols-2 gap-4">
                    <div class="grid grid-cols-2 gap-y-2">

                        <div><strong>Amount List:</strong></div>
                        <div>
                            <ul class="p-0 list-none">
                                <li v-for="(amount, index) in appeal.appealAmount" :key="index">{{formatAmount(amount.amount)}}</li>
                            </ul>
                        </div>

                    <div><strong>Appellant List:</strong></div>
                    <div>
                        <ul class="p-0 list-none">
                            <li v-for="(appellant, index) in appeal.appellantList" :key="index">{{ appellant.name }}</li>
                        </ul>
                    </div>

                    <div><strong>Respondent List:</strong></div>
                    <div>
                        <ul class="p-0 list-none">
                            <li v-for="(respondent, index) in appeal.respondentList" :key="index">{{ respondent.name }}</li>
                        </ul>
                    </div>
                </div>
                </div>
            </div>
                <!-- Second Section (Further Details) -->
            <div class="mt-6">
                <div class="grid sm:grid-cols-2 gap-4">
                    <div class="grid grid-cols-2 gap-y-2">
                    <div><strong>Remarks:</strong></div>
                    <div>:{{ appeal.remarks || 'N/A' }}</div>

                    <div><strong>Taxed Off:</strong></div>
                    <div>:{{ appeal.taxedOff || 'N/A' }}</div>

                    <div><strong>Ass No.:</strong></div>
                    <div>:{{ appeal.assNo || 'N/A' }}</div>

                    <div><strong>Bill No.:</strong></div>
                    <div>:{{ appeal.billNo || 'N/A' }}</div>

                    <div><strong>Bank No.:</strong></div>
                    <div>:{{ appeal.bankNo || 'N/A' }}</div>

                    <div><strong>Summary of Decision:</strong></div>
                    <div>:{{ appeal.summaryOfDecisionFromBoard || 'N/A' }}</div>

                    <div><strong>Decision Status:</strong></div>
                    <div>:{{ appeal.decisionStatusFromBoard || 'N/A' }}</div>

                    <div><strong>Financial Year:</strong></div>
                    <div>:{{ appeal.financialYear || 'N/A' }}</div>

                    <div><strong>Progress Status:</strong></div>
                    <div>:{{ appeal.progressStatus }}</div>

                    <div><strong>Summons List:</strong></div>
                    <div>
                        <ul class="p-0 list-none">
                            <li v-for="(summon, index) in appeal.summonsList" :key="index">{{ summon }}</li>
                        </ul>
                    </div>

                    <div><strong>Trab Appeals:</strong></div>
                    <div>
                        <ul class="p-0 list-none">
                            <li v-for="(trabAppeal, index) in appeal.trabAppeals" :key="index">{{ trabAppeal }}</li>
                        </ul>
                    </div>
                </div>
                </div>
            </div>
    </Dialog>
</template>
