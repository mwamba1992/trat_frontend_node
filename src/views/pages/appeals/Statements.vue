<script setup>
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { SetupService } from '@/service/SetupService';
import { PartyService } from '@/service/PartyService';
import { AppealService } from '@/service/AppealService';
import { NoticeService } from '@/service/NoticeService';
import { JudgeService } from '@/service/JudgeService';

// References for data and state
const appeals = ref([]);
const appealDialog = ref(false);
const appealDecisionDialog = ref(false);
const appealViewDialog = ref(false);
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

// Stat cards
const totalAppeals = ref(0);
const pendingCount = ref(0);
const decidedCount = ref(0);

// Filter refs
const filterTaxType = ref(null);
const filterStatusTrend = ref(null);
const filterDateFrom = ref(null);
const filterDateTo = ref(null);
const statusTrends = ref([]);

const judges = ref([]);
const decisionStatuses = ref([]);

const choices = ref([
    { name: 'Appeals', id: '2' },
    { name: 'Application', id: '1' }
]);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Computed: filtered appeals based on filter dropdowns
const filteredAppeals = computed(() => {
    let result = appeals.value || [];
    if (filterTaxType.value) {
        result = result.filter((a) => a.taxes && a.taxes.name === filterTaxType.value);
    }
    if (filterStatusTrend.value) {
        result = result.filter((a) => a.statusTrend && a.statusTrend.name === filterStatusTrend.value);
    }
    if (filterDateFrom.value) {
        result = result.filter((a) => a.dateOfFilling && new Date(a.dateOfFilling) >= new Date(filterDateFrom.value));
    }
    if (filterDateTo.value) {
        result = result.filter((a) => a.dateOfFilling && new Date(a.dateOfFilling) <= new Date(filterDateTo.value));
    }
    return result;
});

onMounted(async () => {
    await fetchAppeals();

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

        const currencyTypes = await SetupService.getSetups('currency');
        currencies.value = currencyTypes.map((setup) => ({
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

        const notice = await NoticeService.getNotices();
        notices.value = notice.map((not) => ({
            id: not.id,
            name: not.noticeNo + ' - ' + not.appellantFullName
        }));

        const judgeList = await JudgeService.getJudges();
        judges.value = judgeList.map((j) => ({
            id: j.id,
            name: j.name
        }));
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch setup options', life: 3000 });
    }
});

async function fetchAppeals() {
    loading.value = true;
    const data = await AppealService.getAppeals();
    appeals.value = data;

    // Populate stat cards from API (same as dashboard)
    try {
        const cards = await AppealService.getCardStatistics();
        totalAppeals.value = cards[0] || 0;
        pendingCount.value = cards[1] || 0;
        decidedCount.value = cards[2] || 0;
    } catch (e) {
        totalAppeals.value = data.length;
    }

    // Populate status trends for filter dropdown
    const trendSet = new Set();
    data.forEach((a) => {
        if (a.statusTrend && a.statusTrend.name) {
            trendSet.add(a.statusTrend.name);
        }
    });
    statusTrends.value = Array.from(trendSet).map((name) => ({ label: name, value: name }));
    decisionStatuses.value = Array.from(trendSet).map((name) => ({ label: name, value: name }));

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
    appeal.value = {
        ...app,
        notice: app.notice?.id || app.notice,
        taxes: app.taxes?.id || app.taxes,
        region: app.region?.id || app.region
    };
    submitted.value = false;
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
const selectedAppellants = ref(null);
const selectedRespondents = ref(null);
const selectedApplication = ref(null);

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
            if (searchCriteria.value.type == '1') {
                availableApplications.value = data._embedded.applicationregister.map((application) => ({
                    id: application.id,
                    name: 'Application ' + application.applicationNo + ' - ' + application._embedded.taxes.taxName
                }));
            } else {
                availableApplications.value = data._embedded.appeals.map((application) => ({
                    id: application.id,
                    name: 'Appeal' + application.appealNo + ' - ' + application._embedded.tax.taxName
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
    appeal.value = {
        ...app,
        decisionStatus: app.statusTrend?.name || null,
        assignedJudge: app.assignedJudge?.id || app.assignedJudge || null
    };
    appealDecisionDialog.value = true;
}

function saveDecision() {
    AppealService.updateAppeal(appeal.value.id, appeal.value)
        .then(() => {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Decision updated successfully', life: 3000 });
            fetchAppeals();
            appealDecisionDialog.value = false;
        })
        .catch((error) => {
            console.error(error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update decision', life: 3000 });
        });
}

function viewAppeal(app) {
    console.log(app);
    appeal.value = { ...app };
    appealViewDialog.value = true;
}

function formatAmount(value) {
    return new Intl.NumberFormat().format(value);
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

function getTaxSeverity(taxName) {
    const map = {
        VAT: 'info',
        'INCOME TAX': 'success',
        PAYE: 'warn',
        'CUSTOM AND EXERCISE': 'danger',
        'IMPORT DUTY': 'secondary',
        'WITHHOLDING TAX': 'info',
        'VAT AND INCOME': 'success',
        'STAMP DUTY': 'warn',
        WAIVER: 'contrast',
        OTHERS: 'secondary'
    };
    return map[taxName] || 'info';
}

function getStatusSeverity(statusName) {
    const map = {
        PENDING: 'warn',
        DECIDED: 'success',
        NEW: 'info',
        DISMISSED: 'danger',
        WITHDRAWN: 'secondary'
    };
    return map[statusName] || 'info';
}

function clearFilters() {
    filterTaxType.value = null;
    filterStatusTrend.value = null;
    filterDateFrom.value = null;
    filterDateTo.value = null;
    filters.value.global.value = null;
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Appeals Management</h1>
            <p class="text-muted-color mt-1">Manage legal appeals and statements efficiently</p>
        </div>
        <span class="text-sm text-muted-color">{{ filteredAppeals?.length || 0 }} appeals</span>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
            <div class="card mb-0 h-full">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-muted-color font-medium text-sm">Total Appeals</span>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eef2ff, #e0e7ff)">
                        <i class="pi pi-folder text-indigo-500"></i>
                    </div>
                </div>
                <div class="flex items-center gap-3 mb-3">
                    <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalAppeals }}</span>
                </div>
                <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full" style="height: 4px">
                    <div class="bg-indigo-500 rounded-full" style="width: 100%; height: 4px"></div>
                </div>
                <span class="block text-muted-color text-xs mt-2">All registered appeals</span>
            </div>
        </div>
        <div>
            <div class="card mb-0 h-full">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-muted-color font-medium text-sm">Pending</span>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #fff7ed, #ffedd5)">
                        <i class="pi pi-clock text-orange-500"></i>
                    </div>
                </div>
                <div class="flex items-center gap-3 mb-3">
                    <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ pendingCount }}</span>
                    <Tag v-if="totalAppeals > 0" :value="Math.round((pendingCount / totalAppeals) * 100) + '%'" severity="warn" rounded />
                </div>
                <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full" style="height: 4px">
                    <div class="bg-orange-500 rounded-full" :style="{ width: totalAppeals > 0 ? Math.round((pendingCount / totalAppeals) * 100) + '%' : '0%', height: '4px' }"></div>
                </div>
                <span class="block text-muted-color text-xs mt-2">Awaiting decision</span>
            </div>
        </div>
        <div>
            <div class="card mb-0 h-full">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-muted-color font-medium text-sm">Decided</span>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                        <i class="pi pi-check-circle text-emerald-500"></i>
                    </div>
                </div>
                <div class="flex items-center gap-3 mb-3">
                    <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ decidedCount }}</span>
                    <Tag v-if="totalAppeals > 0" :value="Math.round((decidedCount / totalAppeals) * 100) + '%'" severity="success" rounded />
                </div>
                <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full" style="height: 4px">
                    <div class="bg-emerald-500 rounded-full" :style="{ width: totalAppeals > 0 ? Math.round((decidedCount / totalAppeals) * 100) + '%' : '0%', height: '4px' }"></div>
                </div>
                <span class="block text-muted-color text-xs mt-2">Completed decisions</span>
            </div>
        </div>
    </div>

    <div class="card">
        <!-- Action Bar -->
        <div class="flex items-center justify-between mb-4">
            <Button label="New Appeal" icon="pi pi-plus" severity="success" class="mr-2" @click="openNew" />
            <div class="flex items-center gap-3">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search appeals..." />
                </IconField>
                <Button label="Clear Filters" icon="pi pi-filter-slash" severity="secondary" text @click="clearFilters" />
                <Button label="Export" icon="pi pi-download" severity="secondary" outlined @click="exportCSV($event)" />
            </div>
        </div>

        <!-- Filter Row -->
        <div class="grid grid-cols-12 gap-4 mb-4">
            <div class="col-span-3">
                <Select v-model="filterTaxType" :options="taxes" optionLabel="name" optionValue="name" placeholder="Tax Type" fluid showClear />
            </div>
            <div class="col-span-3">
                <Select v-model="filterStatusTrend" :options="statusTrends" optionLabel="label" optionValue="value" placeholder="Status Trend" fluid showClear />
            </div>
            <div class="col-span-3">
                <DatePicker v-model="filterDateFrom" placeholder="Filing Date From" fluid showIcon dateFormat="yy-mm-dd" />
            </div>
            <div class="col-span-3">
                <DatePicker v-model="filterDateTo" placeholder="Filing Date To" fluid showIcon dateFormat="yy-mm-dd" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="filteredAppeals"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} appeals"
            :loading="loading"
            stripedRows
        >
            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                </template>
            </Column>
            <Column field="appealNo" header="Appeal No" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <span class="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                        <span class="font-medium">{{ slotProps.data.appealNo }}</span>
                    </div>
                </template>
            </Column>
            <Column field="dateOfFilling" header="Filing Date" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar text-muted-color"></i>
                        <span>{{ slotProps.data.dateOfFilling }}</span>
                    </div>
                </template>
            </Column>
            <Column header="Appellants" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div v-if="slotProps.data.appellantList && slotProps.data.appellantList.length" class="flex items-center gap-2">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                            {{ getInitial(slotProps.data.appellantList[0].name) }}
                        </div>
                        <div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.appellantList[0].name }}</div>
                            <div class="text-muted-color text-xs">{{ slotProps.data.appellantList.length }} appellant(s)</div>
                        </div>
                    </div>
                    <span v-else class="text-muted-color text-sm">No Appellants</span>
                </template>
            </Column>
            <Column header="Respondents" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div v-if="slotProps.data.respondentList && slotProps.data.respondentList.length" class="flex items-center gap-2">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #34d399, #10b981)">
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
            <Column field="taxes.name" header="Tax Type" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <Tag v-if="slotProps.data.taxes" :value="slotProps.data.taxes.name" :severity="getTaxSeverity(slotProps.data.taxes.name)" rounded />
                    <span v-else class="text-muted-color text-sm">N/A</span>
                </template>
            </Column>
            <Column header="Status Trend" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <Tag v-if="slotProps.data.statusTrend" :value="slotProps.data.statusTrend.name" :severity="getStatusSeverity(slotProps.data.statusTrend.name)" rounded />
                    <span v-else class="text-muted-color text-sm">N/A</span>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-1">
                        <Button icon="pi pi-pencil" text rounded @click="editApplication(slotProps.data)" />
                        <Button icon="pi pi-check" text rounded severity="success" @click="updateDecision(slotProps.data)" />
                        <Button icon="pi pi-eye" text rounded severity="info" @click="viewAppeal(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="appeal = { ...slotProps.data }; deleteApplicationDialog = true" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <Dialog v-model:visible="appealDialog" header="Appeal Registration" :modal="true" :style="{ width: '900px' }">
        <div class="flex flex-col gap-5">
            <!-- Sub-header with left accent -->
            <div class="bg-surface-100 dark:bg-surface-700 rounded-border p-4" style="border-left: 4px solid var(--primary-color)">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ appeal.id ? 'Edit Appeal' : 'Create New Appeal' }}</div>
                <span class="text-muted-color text-sm">Fill in the details for the legal appeal</span>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label for="notice" class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-bell text-muted-color"></i> Notice <span class="text-red-500">*</span></label>
                    <Select id="notice" v-model="appeal.notice" :options="notices" optionValue="id" optionLabel="name" placeholder="Select Notice" required filter filterBy="name" fluid />
                </div>
                <div class="col-span-6">
                    <label for="dateOfFilling" class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-calendar text-muted-color"></i> Date of Filing <span class="text-red-500">*</span></label>
                    <DatePicker id="dateOfFilling" v-model="appeal.dateOfFilling" dateFormat="yy-mm-dd" fluid showIcon />
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label for="region" class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-map-marker text-muted-color"></i> Region <span class="text-red-500">*</span></label>
                    <Select id="region" v-model="appeal.region" :options="regions" optionValue="id" optionLabel="name" placeholder="Select Region" required fluid />
                </div>
                <div class="col-span-6">
                    <label for="taxes" class="flex items-center gap-2 font-medium mb-2">Tax Type <span class="text-red-500">*</span></label>
                    <Select id="taxes" v-model="appeal.taxes" :options="taxes" optionValue="id" optionLabel="name" placeholder="Select Tax Type" required fluid />
                </div>
            </div>

            <div>
                <label for="natureOfRequest" class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-file-edit text-muted-color"></i> Nature of Request <span class="text-red-500">*</span></label>
                <Textarea id="natureOfRequest" v-model="appeal.natureOfRequest" required rows="4" fluid placeholder="Describe the nature of your request..." :maxlength="2000" style="resize: none; width: 100%" />
                <div class="text-right text-muted-color text-xs mt-1">{{ (appeal.natureOfRequest || '').length }}/2000 characters</div>
            </div>

            <!-- Appellant List -->
            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-users text-muted-color"></i> Appellant List</label>
                <div class="grid grid-cols-12 gap-3 mb-2">
                    <div class="col-span-10">
                        <Select v-model="selectedAppellants" :options="availableAppellants" optionLabel="name" placeholder="Select Appellants" filter filterBy="name" fluid />
                    </div>
                    <div class="col-span-2">
                        <Button label="Add" icon="pi pi-plus" class="w-full" @click="addAppellant" />
                    </div>
                </div>
                <div v-if="appeal.appellantList && appeal.appellantList.length" class="flex flex-wrap gap-2">
                    <Tag v-for="(appellant, index) in appeal.appellantList" :key="index" severity="info" rounded>
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
                <div v-if="appeal.respondentList && appeal.respondentList.length" class="flex flex-wrap gap-2">
                    <Tag v-for="(respondent, index) in appeal.respondentList" :key="index" severity="success" rounded>
                        <span class="flex items-center gap-1">
                            {{ respondent.name }}
                            <i class="pi pi-times text-xs cursor-pointer" @click="removeRespondent(index)"></i>
                        </span>
                    </Tag>
                </div>
            </div>

            <!-- Amount and Currency -->
            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-wallet text-muted-color"></i> Amount and Currency</label>
                <div class="grid grid-cols-12 gap-3 mb-2">
                    <div class="col-span-5">
                        <InputNumber v-model="appealAmount.amount" placeholder="Enter Amount" mode="decimal" min="0" :minFractionDigits="2" :maxFractionDigits="5" fluid />
                    </div>
                    <div class="col-span-5">
                        <Select v-model="appealAmount.currency" :options="currencies" optionLabel="name" optionValue="id" placeholder="Currency" fluid />
                    </div>
                    <div class="col-span-2">
                        <Button label="Add" icon="pi pi-plus" class="w-full p-button-success" @click="addAmountCurrency" />
                    </div>
                </div>
                <div v-if="appeal.amountCurrencyList && appeal.amountCurrencyList.length" class="flex flex-wrap gap-2">
                    <Tag v-for="(entry, index) in appeal.amountCurrencyList" :key="index" severity="warn" rounded>
                        <span class="flex items-center gap-1">
                            {{ formatAmount(entry.amount) }} {{ entry.currency }}
                            <i class="pi pi-times text-xs cursor-pointer" @click="removeAmountCurrency(index)"></i>
                        </span>
                    </Tag>
                </div>
            </div>

            <!-- Separator -->
            <div class="border-t border-surface-200 dark:border-surface-600"></div>

            <!-- Search Appeals/Applications from TRAB -->
            <div>
                <label class="flex items-center gap-2 font-semibold mb-3 text-lg"><i class="pi pi-search text-muted-color"></i> Search Appeals/Applications From TRAB</label>
                <div class="grid grid-cols-12 gap-4 mb-3">
                    <div class="col-span-3">
                        <label class="block text-muted-color text-sm mb-1">Type</label>
                        <Select v-model="searchCriteria.type" :options="choices" optionValue="id" optionLabel="name" placeholder="Select Type" required filter filterBy="name" fluid />
                    </div>
                    <div class="col-span-3">
                        <label class="block text-muted-color text-sm mb-1">Year</label>
                        <InputText v-model="searchCriteria.year" type="number" placeholder="Enter Year" fluid />
                    </div>
                    <div class="col-span-3">
                        <label class="block text-muted-color text-sm mb-1">Region</label>
                        <InputText v-model="searchCriteria.region" type="text" placeholder="Enter Region" fluid />
                    </div>
                    <div class="col-span-3 flex items-end">
                        <Button label="Search TRAB" icon="pi pi-search" class="w-full" @click="searchApplications" style="background: linear-gradient(135deg, #34d399, #10b981); border: none" />
                    </div>
                </div>

                <div v-if="isLoading" class="flex items-center gap-2 py-2">
                    <i class="pi pi-spin pi-spinner"></i>
                    <span class="text-muted-color text-sm">Fetching from TRAB...</span>
                </div>

                <div v-if="availableApplications.length" class="flex items-center gap-3 mb-2">
                    <Select v-model="selectedApplication" :options="availableApplications" optionLabel="name" optionValue="name" placeholder="Select Appeals" filter filterBy="name" fluid />
                    <Button label="Add" icon="pi pi-plus" @click="addApplications" />
                </div>
                <div v-if="appeal.applicationss && appeal.applicationss.length" class="flex flex-wrap gap-2">
                    <Tag v-for="(app, index) in appeal.applicationss" :key="index" severity="secondary" rounded>
                        <span class="flex items-center gap-1">
                            {{ app }}
                            <i class="pi pi-times text-xs cursor-pointer" @click="removeApplications(index)"></i>
                        </span>
                    </Tag>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" text @click="hideDialog" />
            <Button label="Save Appeal" class="p-button-success" @click="saveAppeal" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteApplicationDialog" header="Confirm Delete" :modal="true" :style="{ width: '400px' }">
        <div class="flex items-center gap-3">
            <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
            <span>Are you sure you want to delete this appeal?</span>
        </div>
        <template #footer>
            <Button label="Cancel" text @click="deleteApplicationDialog = false" />
            <Button label="Delete" severity="danger" @click="deleteApplication" />
        </template>
    </Dialog>

    <!-- Update Decision Dialog -->
    <Dialog v-model:visible="appealDecisionDialog" header="Update Appeal Decision" :modal="true" :style="{ width: '700px' }">
        <div class="flex flex-col gap-5">
            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-file text-muted-color"></i> Appeal Number</label>
                <InputText v-model.trim="appeal.appealNo" readonly fluid />
            </div>

            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-calendar text-muted-color"></i> Decision Date</label>
                <DatePicker v-model="appeal.dateOfDecision" dateFormat="yy-mm-dd" fluid showIcon placeholder="Select decision date" />
            </div>

            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-calendar text-muted-color"></i> Decision Receive Date</label>
                <DatePicker v-model="appeal.decisionReceiveDate" dateFormat="yy-mm-dd" fluid showIcon placeholder="Select receive date" />
            </div>

            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-check-circle text-muted-color"></i> Decision Status</label>
                <Select v-model="appeal.decisionStatus" :options="decisionStatuses" optionLabel="label" optionValue="value" placeholder="Select Status" fluid />
            </div>

            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-users text-muted-color"></i> Assigned Judge</label>
                <Select v-model="appeal.assignedJudge" :options="judges" optionLabel="name" optionValue="id" placeholder="Select Judge" filter filterBy="name" fluid />
            </div>

            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-file-edit text-muted-color"></i> Decision Remarks</label>
                <Textarea v-model="appeal.decisionRemarks" rows="4" fluid placeholder="Enter detailed decision remarks..." :maxlength="1000" style="resize: none; width: 100%" />
                <div class="text-right text-muted-color text-xs mt-1">{{ (appeal.decisionRemarks || '').length }}/1000 characters</div>
            </div>

            <div>
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-upload text-muted-color"></i> Supporting Documents</label>
                <FileUpload mode="advanced" :multiple="true" accept=".pdf,.doc,.docx,.jpg,.png" :maxFileSize="10000000" chooseLabel="Choose Files" class="w-full">
                    <template #empty>
                        <div class="flex items-center justify-center flex-col py-4">
                            <i class="pi pi-cloud-upload text-muted-color text-2xl mb-2"></i>
                            <p class="text-muted-color text-sm m-0">Drag and drop files here or click to browse</p>
                            <p class="text-muted-color text-xs m-0">PDF, DOC, DOCX, JPG, PNG (Max 10MB each)</p>
                        </div>
                    </template>
                </FileUpload>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" text @click="appealDecisionDialog = false" />
            <Button label="Save Decision" class="p-button-success" @click="saveDecision" />
        </template>
    </Dialog>

    <!-- View Appeal Dialog -->
    <Dialog v-model:visible="appealViewDialog" header="Appeal Details" :modal="true" :style="{ width: '900px' }">
        <!-- Header with appeal info and status badge -->
        <div class="bg-surface-100 dark:bg-surface-700 rounded-border p-4 mb-4" style="border-left: 4px solid var(--primary-color)">
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-bold text-xl text-surface-900 dark:text-surface-0">Appeal #{{ appeal.appealNo }}</div>
                    <span class="text-muted-color text-sm">Filed on {{ appeal.dateOfFilling || 'N/A' }}</span>
                </div>
                <Tag v-if="appeal.statusTrend" :value="appeal.statusTrend.name === 'NEW' ? 'Pending' : appeal.statusTrend.name" :severity="getStatusSeverity(appeal.statusTrend?.name)" rounded />
            </div>
        </div>

        <!-- Tabs -->
        <Tabs value="0">
            <TabList>
                <Tab value="0">Basic Info</Tab>
                <Tab value="1">Parties</Tab>
                <Tab value="2">Financial</Tab>
                <Tab value="3">Additional</Tab>
            </TabList>
            <TabPanels>
                <!-- Basic Info Tab -->
                <TabPanel value="0">
                    <div class="grid grid-cols-12 gap-6 pt-4">
                        <div class="col-span-6">
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-4">Appeal Details</div>
                            <div class="flex flex-col gap-4">
                                <div>
                                    <div class="text-muted-color text-sm">Appeal Number:</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appeal.appealNo || '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-muted-color text-sm">Filing Date:</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appeal.dateOfFilling || '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-muted-color text-sm">Decision Date:</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appeal.dateOfDecision || '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-muted-color text-sm">Tax Type:</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appeal.taxes?.name || '-' }}</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-6">
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-4">Nature of Request</div>
                            <div class="text-surface-900 dark:text-surface-0">{{ appeal.natureOfRequest || '-' }}</div>
                        </div>
                    </div>
                </TabPanel>

                <!-- Parties Tab -->
                <TabPanel value="1">
                    <div class="grid grid-cols-12 gap-6 pt-4">
                        <div class="col-span-6">
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-4">Appellants</div>
                            <div v-if="appeal.appellantList && appeal.appellantList.length" class="flex flex-col gap-3">
                                <div v-for="(appellant, index) in appeal.appellantList" :key="index" class="flex items-center gap-3">
                                    <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                                        {{ getInitial(appellant.name) }}
                                    </div>
                                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ appellant.name }}</span>
                                </div>
                            </div>
                            <span v-else class="text-muted-color">No appellants</span>
                        </div>
                        <div class="col-span-6">
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-4">Respondents</div>
                            <div v-if="appeal.respondentList && appeal.respondentList.length" class="flex flex-col gap-3">
                                <div v-for="(respondent, index) in appeal.respondentList" :key="index" class="flex items-center gap-3">
                                    <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #34d399, #10b981)">
                                        {{ getInitial(respondent.name) }}
                                    </div>
                                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ respondent.name }}</span>
                                </div>
                            </div>
                            <span v-else class="text-muted-color">No respondents</span>
                        </div>
                    </div>
                </TabPanel>

                <!-- Financial Tab -->
                <TabPanel value="2">
                    <div class="grid grid-cols-12 gap-6 pt-4">
                        <div class="col-span-6">
                            <div class="font-semibold text-surface-900 dark:text-surface-0 mb-4">Amounts</div>
                            <div v-if="appeal.appealAmount && appeal.appealAmount.length" class="flex flex-col gap-3">
                                <div v-for="(amount, index) in appeal.appealAmount" :key="index" class="flex items-center gap-2">
                                    <i class="pi pi-money-bill text-muted-color"></i>
                                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ formatAmount(amount.amount) }} {{ amount.currency }}</span>
                                </div>
                            </div>
                            <span v-else class="text-muted-color">No amounts recorded</span>
                        </div>
                        <div class="col-span-6">
                            <div class="flex flex-col gap-4">
                                <div>
                                    <div class="text-muted-color text-sm">Financial Year:</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appeal.financialYear || '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-muted-color text-sm">Bill No.:</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appeal.billNo || '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-muted-color text-sm">Bank No.:</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appeal.bankNo || '-' }}</div>
                                </div>
                                <div>
                                    <div class="text-muted-color text-sm">Ass No.:</div>
                                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appeal.assNo || '-' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <!-- Additional Tab -->
                <TabPanel value="3">
                    <div class="flex flex-col gap-4 pt-4">
                        <div class="grid grid-cols-12 gap-6">
                            <div class="col-span-6">
                                <div class="text-muted-color text-sm">Remarks:</div>
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ appeal.remarks || '-' }}</div>
                            </div>
                            <div class="col-span-6">
                                <div class="text-muted-color text-sm">Taxed Off:</div>
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ appeal.taxedOff || '-' }}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-6">
                            <div class="col-span-6">
                                <div class="text-muted-color text-sm">Summary of Decision:</div>
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ appeal.summaryOfDecisionFromBoard || '-' }}</div>
                            </div>
                            <div class="col-span-6">
                                <div class="text-muted-color text-sm">Decision Status:</div>
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ appeal.decisionStatusFromBoard || '-' }}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-12 gap-6">
                            <div class="col-span-6">
                                <div class="text-muted-color text-sm">Date of Concluding:</div>
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ appeal.concludingDate || '-' }}</div>
                            </div>
                            <div class="col-span-6">
                                <div class="text-muted-color text-sm">Date of Last Order:</div>
                                <div class="font-medium text-surface-900 dark:text-surface-0">{{ appeal.dateOfLastOrder || '-' }}</div>
                            </div>
                        </div>
                        <div>
                            <div class="text-muted-color text-sm">Progress Status:</div>
                            <div class="font-medium text-surface-900 dark:text-surface-0">{{ appeal.progressStatus || '-' }}</div>
                        </div>
                    </div>
                </TabPanel>
            </TabPanels>
        </Tabs>

        <template #footer>
            <Button label="Close" text @click="appealViewDialog = false" />
        </template>
    </Dialog>
</template>
