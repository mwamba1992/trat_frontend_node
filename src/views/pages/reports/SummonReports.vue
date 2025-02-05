<script setup>
import { ref } from 'vue';
import { SummonsService } from '@/service/SummonsService';
import { useToast } from 'primevue/usetoast';
const toast = useToast();
const summon = ref({});
const summons = ref([]);
const globalFilter = ref('');
const emptyMessage = ref('No records found');
const summonDialog = ref(false);
const isLoading = ref(false);

function openNew() {
    summonDialog.value = true;
}

function exportCSV() {}

function exportPdf() {
    let doc = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' size

    let columns = [
        { title: 'S/NO', dataKey: 'id' },
        { title: 'CASE', dataKey: 'case' },
        { title: 'HEARING DATE', dataKey: 'date' },
        { title: 'VENUE', dataKey: 'venue' }
    ];

    console.log(summons.value);

    // Helper function to break long text into multiple lines (custom line breaks)
    function breakText(text, maxLength = 50) {
        let result = [];
        let currentLine = '';

        text.split(' ').forEach(word => {
            if (currentLine.length + word.length + 1 > maxLength) {
                result.push(currentLine);
                currentLine = word;
            } else {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            }
        });

        // Add the last line
        if (currentLine.length > 0) {
            result.push(currentLine);
        }

        return result.join('\n'); // Return text with line breaks
    }

    let tableData = summons.value.map((summon, index) => {
        const caseText =
            summon.appealList
                .map(
                    (appeal) =>
                        `Appeal NO. ${appeal.appealNo.split('/')[0].split('.')[1] + ' OF ' + appeal.appealNo.split('/')[1]} ${appeal.appellantList.map((appellant) => appellant.name).join(', ')} VS ${appeal.respondentList
                            .map((respondent) => respondent.name)
                            .join(', ')}`
                )
                .join(', ') +
            ' ' +
            summon.applicationList
                .map(
                    (application) =>
                        `Application ${application.applicationNo.split('/')[0].split('.')[1] + ' OF ' + application.applicationNo.split('/')[1]} ${application.appellantList
                            .map((appellant) => appellant.name)
                            .join(', ')} VS ${application.respondentList
                            .map((respondent) => respondent.name)
                            .join(', ')}`
                )
                .join(', ');

        return {
            id: index + 1,
            case: breakText(caseText.toUpperCase()), // Break the case text into multiple lines
            date: formatDate(summon.startDate) + ' - ' + formatDate(summon.endDate),
            venue: summon.venue
        };
    });

    // Calculate starting Y position dynamically based on the last table position
    let startY = 10;

    // Configure autoTable with word wrap and a max width for the 'CASE' column
    doc.autoTable(columns, tableData, {
        startY,
        styles: {
            cellWidth: 'auto', // Adjust cell width automatically
            overflow: 'linebreak', // Allow text to break across lines
            lineHeight: 1.2 // Adjust line height for better spacing
        },
        columnStyles: {
            id: { cellWidth: 100 },
            case: { cellWidth: 100 }, // Optional: Adjust column width for 'CASE' if needed
        }
    });

    // Save or output the PDF
    doc.save('cause_list.pdf');
}

// Helper function to format the date to "12th Feb 2025"
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' }); // Get abbreviated month (e.g., "Feb")
    const year = date.getFullYear();

    // Determine the suffix for the day (st, nd, rd, th)
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';

    return `${day}${suffix} ${month} ${year}`;
}

async function filterSummons() {
    isLoading.value = true;
    await SummonsService.filterSummons(summon.value).then((response) => {
        summons.value = response.data;
    });
    isLoading.value = false;
    summonDialog.value = false;
    toast.add({ severity: 'success', summary: 'Success', detail: 'Summons  fetched successfully', life: 6000 });
}
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="Filte Cause List" icon="pi pi-plus" class="mr-2" @click="openNew" />
        </template>

        <template #end>
            <Button label="Export Pdf" icon="pi pi-file-pdf" severity="secondary" @click="exportPdf" />
            <Button label="Export Excel" icon="pi pi-file-excel" severity="secondary" @click="exportCSV" />
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
        <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
        <Column field="judge.name" header="Chairman" sortable></Column>
        <Column field="startDate" header="Start Date" sortable></Column>
        <Column field="endDate" header="End Date" sortable></Column>
        <Column field="status" header="Status" sortable></Column>
        <Column header="Appeals/Applications" sortable>
            <template #body="slotProps">
                <span v-if="slotProps.data.appealList && slotProps.data.appealList.length">
                    {{ slotProps.data.appealList.map((appeal) => `Appeal  ${appeal.appealNo}`).join(', ') }}
                </span>
                <span v-if="slotProps.data.applicationList && slotProps.data.applicationList.length">
                    {{ slotProps.data.applicationList.map((appeal) => `Application ${appeal.applicationNo}`).join(', ') }}
                </span>
            </template>
        </Column>
    </DataTable>
    <Dialog v-model:visible="summonDialog" :style="{ width: '700px' }" header="Filter Cause List" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="dateOfFillingFrom" class="block font-bold mb-3">Date of Hearing</label>
                <div class="flex gap-4">
                    <div class="flex-1">
                        <label for="Hearing Date From" class="block mb-2">From</label>
                        <DatePicker id="startDateFrom" v-model.trim="summon.startDateFrom" required="true" type="date" fluid dateFormat="yy-mm-dd" />
                    </div>
                    <div class="flex-1">
                        <label for="Hearing Date To" class="block mb-2">To</label>
                        <DatePicker id="startDateTo" v-model.trim="summon.startDateTo" required="true" type="date" fluid dateFormat="yy-mm-dd" />
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="summon.value = false" />
            <Button label="Save" icon="pi pi-check" @click="filterSummons" />
        </template>
    </Dialog>
</template>
