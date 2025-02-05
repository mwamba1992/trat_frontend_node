<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { AppealService } from '@/service/AppealService';
import { PartyService } from '@/service/PartyService';

const toast = useToast();

// State Variables
const filters = ref({
    dateOfFillingFrom: { value: '', matchMode: FilterMatchMode.DATE_IS },
    dateOfFillingTo: { value: '', matchMode: FilterMatchMode.DATE_IS },
    progressStatus: { value: '', matchMode: FilterMatchMode.EQUALS },
    appellantList: { value: '', matchMode: FilterMatchMode.CONTAINS },
    respondentList: { value: '', matchMode: FilterMatchMode.CONTAINS },
    financialYear: { value: '', matchMode: FilterMatchMode.CONTAINS }
});

const appeals = ref([]);
const loading = ref(false);
const selectedAppeals = ref([]);
const appealDialog = ref(false);
const appeal = ref({});
const submitted = ref(false);
const dt = ref();

const availableAppellants = ref([]);
const availableRespondents = ref([]);

// Fetch appeals on component mount
onMounted(async () => {
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
});

// Function to fetch filtered appeals

// Open new appeal dialog
function openNew() {
    appeal.value = {};
    submitted.value = false;
    appealDialog.value = true;
}

// Edit an appeal
function editAppeal(selectedAppeal) {
    appeal.value = { ...selectedAppeal };
    appealDialog.value = true;
}

// Save the appeal
function filterAppeals() {
    console.log('Filtering appeals:', appeal.value);
    submitted.value = true;

    AppealService.getAppealsWithFilter(appeal.value)
        .then((response) => {
            console.log('Fetched appeals:', response);
            appeals.value = response;

            if (appeals.value.length === 0) {
                toast.add({ severity: 'info', summary: 'No Records', detail: 'No records found', life: 3000 });
            } else {
                appealDialog.value = false;
                toast.add({ severity: 'success', summary: 'Success', detail: 'Appeals fetched successfully', life: 3000 });
                console.log('Filtered appeals:', appeals.value);
            }
        })
        .catch((error) => {
            console.error('Error fetching appeals:', error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Error fetching appeals', life: 3000 });
        });
}

import * as XLSX from 'xlsx';

// Export filtered appeals to CSV
function exportCSV() {
    const formattedData = appeals.value.map((appeal) => {
        return {
            'Appeal No': appeal.appealNo,
            'Tax Type': appeal.taxes.name,
            'Date of Filing': appeal.dateOfFilling,
            'Date of Decision': appeal.dateOfDecision,
            Status: appeal.progressStatus,
            Applicants: appeal.appellantList && appeal.appellantList.length ? appeal.appellantList.map((a) => a.name).join(', ') : 'No Applicants',
            Respondents: appeal.respondentList && appeal.respondentList.length ? appeal.respondentList.map((a) => a.name).join(', ') : 'No Respondents',
            Amounts: appeal.appealAmount && appeal.appealAmount.length ? appeal.appealAmount.map((amount) => amount.amount + ' ' + amount.currency.name).join(', ') : 'No Amount',
            Remarks: appeal.remarks,
            'Status Trend': appeal.statusTrend.name
        };
    });

    // Create a new workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appeals');

    // Generate the Excel file and trigger download
    XLSX.writeFile(wb, 'Appeals_Report.xlsx');
}

function exportPdf() {
    // Initialize jsPDF with landscape mode and A4 paper size
    let doc = new jsPDF('l', 'mm', 'a4'); // 'l' for landscape, 'mm' for millimeters, 'a4' size

    // Define the columns for the table
    let columns = [
        { title: 'S/No', dataKey: 'id' },
        { title: 'Appeal No', dataKey: 'appealNo' },
        { title: 'Appellant', dataKey: 'Appellant' },
        { title: 'Respondent', dataKey: 'Respondent' },
        //{ title: 'Amounts', dataKey: 'Amounts' },
        { title: 'Tax Type', dataKey: 'taxType' },
        { title: 'Date of Filing', dataKey: 'dateOfFiling' }
        // { title: 'Date of Decision', dataKey: 'dateOfDecision' },
        //{ title: 'Status', dataKey: 'progressStatus' },
        // { title: 'Remarks', dataKey: 'remarks' },
        // { title: 'Status Trend', dataKey: 'statusTrend' }
    ];

    // Prepare the rows data
    let rows = appeals.value.map((appeal, index) => {
        return {
            id: index + 1,
            appealNo: appeal.appealNo,
            Appellant: appeal.appellantList && appeal.appellantList.length ? appeal.appellantList.map((a) => a.name).join(', ') : 'No Appellant',
            Respondent: appeal.respondentList && appeal.respondentList.length ? appeal.respondentList.map((a) => a.name).join(', ') : 'No Respondent',
            //  Amounts: appeal.appealAmount && appeal.appealAmount.length ? appeal.appealAmount.map((amount) => amount.amount + ' ' + amount.currency.name).join(', ') : 'No Amount',
            taxType: appeal.taxes.name,
            dateOfFiling: appeal.dateOfFiling
            //dateOfDecision: appeal.dateOfDecision,
            //progressStatus: appeal.progressStatus,
            //remarks: appeal.remarks,
            //statusTrend: appeal.statusTrend.name
        };
    });

    // Increase column widths for landscape mode
    const columnStyles = {
        id: { cellWidth: 20 }, // Increased width for S/No
        appealNo: { cellWidth: 30 }, // Increased width for Appeal No
        Appellant: { cellWidth: 50 }, // Larger width for Appellant
        Respondent: { cellWidth: 50 }, // Larger width for Respondent
        Amounts: { cellWidth: 40 }, // Larger width for Amounts
        taxType: { cellWidth: 30 }, // Increased width for Tax Type
        dateOfFiling: { cellWidth: 40 }, // Larger width for Date of Filing
        dateOfDecision: { cellWidth: 40 }, // Larger width for Date of Decision
        progressStatus: { cellWidth: 30 }, // Larger width for Status
        remarks: { cellWidth: 50 }, // Larger width for Remarks
        statusTrend: { cellWidth: 30 } // Increased width for Status Trend
    };

    // Add the table to the PDF (with custom column styles and margins)
    doc.autoTable(columns, rows, {
        startY: 20, // Start the table below the header (with some padding)
        columnStyles: columnStyles, // Apply column styles
        margin: { top: 40, bottom: 30, left: 10, right: 10 }, // Custom margins for landscape
        theme: 'striped', // Optional theme for the table
        tableWidth: 'wrap' // Allow table to stretch and fit,
    });

    // Save the PDF with the desired name
    doc.save('appeals_landscape.pdf');
}
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="Filter Appeals Reports" icon="pi pi-plus" class="mr-2" @click="openNew" />
        </template>

        <template #end>
            <Button label="Export Pdf" icon="pi pi-file-pdf" severity="secondary" @click="exportPdf" />
            <Button label="Export Excel" icon="pi pi-file-excel" severity="secondary" @click="exportCSV" />
        </template>
    </Toolbar>

    <DataTable
        ref="dt"
        v-model:selection="selectedAppeals"
        :value="appeals"
        dataKey="id"
        :paginator="true"
        :rows="10"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} appeals"
    >
        <Column field="appealNo" header="Appeal No" sortable style="min-width: 12rem" />
        <Column field="dateOfFilling" header="Date of Filing" sortable style="min-width: 12rem" />
        <Column field="dateOfDecision" header="Date of Decision" sortable style="min-width: 12rem" />
        <Column field="progressStatus" header="Status" sortable style="min-width: 12rem" />
        <Column field="Applicants" header="Applicants" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.appellantList && slotProps.data.appellantList.length">
                    {{ slotProps.data.appellantList.map((appellant) => appellant.name).join(', ') }}
                </span>
                <span v-else>No Applicants</span>
            </template>
        </Column>

        <Column field="Respondents" header="Respondents" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.respondentList && slotProps.data.respondentList.length">
                    {{ slotProps.data.respondentList.map((appellant) => appellant.name).join(', ') }}
                </span>
                <span v-else>No Applicants</span>
            </template>
        </Column>

        <Column field="Amounts" header="Amounts" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.respondentList && slotProps.data.appealAmount.length">
                    {{ slotProps.data.appealAmount.map((amount) => amount.amount + amount.currency.name).join(', ') }}
                </span>
                <span v-else>No Amount</span>
            </template>
        </Column>
    </DataTable>

    <!-- Appeal Dialog -->
    <Dialog v-model:visible="appealDialog" :style="{ width: '700px' }" header="Filter Appeals" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="dateOfFillingFrom" class="block font-bold mb-3">Date of Filing</label>
                <div class="flex gap-4">
                    <div class="flex-1">
                        <label for="dateOfFillingFrom" class="block mb-2">From</label>
                        <DatePicker id="dateOfFillingFrom" v-model.trim="appeal.dateOfFillingFrom" required="true" type="date" fluid dateFormat="yy-mm-dd" />
                    </div>
                    <div class="flex-1">
                        <label for="dateOfFillingTo" class="block mb-2">To</label>
                        <DatePicker id="dateOfFillingTo" v-model.trim="appeal.dateOfFillingTo" required="true" type="date" fluid dateFormat="yy-mm-dd" />
                    </div>
                </div>
            </div>

            <div>
                <label for="dateOfDecisionFrom" class="block font-bold mb-3">Date of Decision</label>
                <div class="flex gap-4">
                    <div class="flex-1">
                        <label for="dateOfDecisionFrom" class="block mb-2">From</label>
                        <DatePicker id="dateOfDecisionFrom" v-model.trim="appeal.dateOfDecisionFrom" required="true" type="date" fluid dateFormat="yy-mm-dd" />
                    </div>
                    <div class="flex-1">
                        <label for="dateOfDecisionTo" class="block mb-2">To</label>
                        <DatePicker id="dateOfDecisionTo" v-model.trim="appeal.dateOfDecisionTo" required="true" type="date" fluid dateFormat="yy-mm-dd" />
                    </div>
                </div>
            </div>

            <div>
                <label for="progressStatus" class="block font-bold mb-3">Progress Status</label>
                <Select id="progressStatus" v-model="appeal.progressStatus" :options="['Pending', 'Hearing', 'Concluded', 'Decided']" placeholder="Select Status" required fluid />
            </div>

            <div class="grid grid-cols-12 gap-4">
                <!-- Appellant List Dropdown -->
                <div class="col-span-6">
                    <label for="appellantList" class="block font-bold mb-3">Appellant List</label>
                    <Select id="appellantList" option-value="id" v-model="appeal.appellantList" :options="availableAppellants" optionLabel="name" placeholder="Select Appellant" fluid />
                </div>

                <!-- Respondent List Dropdown -->
                <div class="col-span-6">
                    <label for="respondentList" class="block font-bold mb-3">Respondent List</label>
                    <Select id="respondentList" option-value="id" v-model="appeal.respondentList" :options="availableRespondents" optionLabel="name" placeholder="Select Respondent" fluid />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="appealDialog.value = false" />
            <Button label="Save" icon="pi pi-check" @click="filterAppeals" />
        </template>
    </Dialog>
</template>

<style scoped>
.appeals-report-page {
    padding: 20px;
    max-width: 1000px;
    margin: 0 auto;
}

.appeals-table .p-datatable {
    width: 100%;
}
</style>
