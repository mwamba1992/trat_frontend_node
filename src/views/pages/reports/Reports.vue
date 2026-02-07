<script setup>
import { ref, onUnmounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ReportService } from '@/service/ReportService';

const toast = useToast();
const activeCategory = ref('appeals');
const configDialog = ref(false);
const selectedReport = ref(null);
const generating = ref(false);
const submitted = ref(false);

// PDF Preview
const pdfPreviewDialog = ref(false);
const pdfUrl = ref(null);
const pdfFilename = ref('');
const pdfBlob = ref(null);

// Report config form
const reportConfig = ref({
    startDate: null,
    endDate: null,
    format: null,
    dateOfFillingFrom: null,
    dateOfFillingTo: null,
    dateOfDecisionFrom: null,
    dateOfDecisionTo: null,
    progressStatus: null
});

const exportFormats = ref([
    { label: 'PDF', value: 'PDF' },
    { label: 'Excel', value: 'EXCEL' }
]);

const progressStatuses = ref([
    { label: 'Pending', value: 'PENDING' },
    { label: 'Hearing', value: 'HEARING' },
    { label: 'Concluded', value: 'CONCLUDED' },
    { label: 'Decided', value: 'DECIDED' }
]);

const categories = ref([
    {
        key: 'appeals',
        label: 'Appeals',
        reports: [
            { key: 'appeals', name: 'Appeals Report', description: 'Generate appeals report filtered by date and criteria', endpoint: 'appeals', type: 'appeals' },
            { key: 'case-status', name: 'Case Status Summary', description: 'Distribution of cases across progress statuses', endpoint: 'analytics/case-status', type: 'simple' },
            { key: 'judge-workload', name: 'Judge Workload Report', description: 'Case distribution and workload per judge', endpoint: 'analytics/judge-workload', type: 'simple' },
            { key: 'tax-type', name: 'Tax Type Analysis', description: 'Case distribution across different tax types', endpoint: 'analytics/tax-type', type: 'simple' },
            { key: 'top-appellants', name: 'Top Appellants Report', description: 'Most frequent appellants ranked by cases', endpoint: 'analytics/top-appellants', type: 'simple' },
            { key: 'overdue-cases', name: 'Overdue Cases Report', description: 'Cases open for 90+ days without decision', endpoint: 'operational/overdue-cases', type: 'simple' },
            { key: 'fy-comparison', name: 'Financial Year Comparison', description: 'Compare case volumes across financial years', endpoint: 'operational/financial-year-comparison', type: 'simple' }
        ]
    },
    {
        key: 'applications',
        label: 'Applications',
        reports: [
            { key: 'applications', name: 'Applications Report', description: 'Generate applications report by date range', endpoint: 'applications', type: 'simple' }
        ]
    },
    {
        key: 'notices',
        label: 'Notices',
        reports: [
            { key: 'notices', name: 'Notices Report', description: 'Generate notices report by date range', endpoint: 'notices', type: 'simple' },
            { key: 'high-court', name: 'High Court Notices Report', description: 'High court notices within date range', endpoint: 'operational/high-court-notices', type: 'simple' },
            { key: 'summons', name: 'Summons Report', description: 'All summons issued within date range', endpoint: 'operational/summons', type: 'simple' }
        ]
    },
    {
        key: 'finance',
        label: 'Finance Reports',
        reports: [
            { key: 'payments', name: 'All Payments Received by Date', description: 'Click to configure and generate report', endpoint: 'payments', type: 'simple' },
            { key: 'outstanding-bills', name: 'Outstanding Bills Report', description: 'Unpaid bills with aging analysis', endpoint: 'finance/outstanding-bills', type: 'simple' },
            { key: 'revenue-summary', name: 'Revenue Summary Report', description: 'Revenue collection grouped by type', endpoint: 'finance/revenue-summary', type: 'simple' },
            { key: 'bill-reconciliation', name: 'Bill Reconciliation Report', description: 'Bill-by-bill reconciliation with variance', endpoint: 'finance/bill-reconciliation', type: 'simple' }
        ]
    }
]);

const activeReports = ref([]);

function selectCategory(categoryKey) {
    activeCategory.value = categoryKey;
    const cat = categories.value.find((c) => c.key === categoryKey);
    activeReports.value = cat ? cat.reports : [];
}

selectCategory('appeals');

function openReportConfig(report) {
    selectedReport.value = report;
    submitted.value = false;
    reportConfig.value = {
        startDate: null,
        endDate: null,
        format: null,
        dateOfFillingFrom: null,
        dateOfFillingTo: null,
        dateOfDecisionFrom: null,
        dateOfDecisionTo: null,
        progressStatus: null
    };
    configDialog.value = true;
}

function formatDateISO(date) {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function hasValidationErrors() {
    const report = selectedReport.value;
    if (!report) return true;

    if (report.type === 'appeals') {
        return !reportConfig.value.dateOfFillingFrom || !reportConfig.value.dateOfFillingTo || !reportConfig.value.format;
    }
    return !reportConfig.value.startDate || !reportConfig.value.endDate || !reportConfig.value.format;
}

async function generateReport() {
    submitted.value = true;
    if (!selectedReport.value || hasValidationErrors()) return;

    const report = selectedReport.value;
    let filters = {};

    if (report.type === 'appeals') {
        filters = {
            dateOfFillingFrom: formatDateISO(reportConfig.value.dateOfFillingFrom),
            dateOfFillingTo: formatDateISO(reportConfig.value.dateOfFillingTo),
            format: reportConfig.value.format
        };
        if (reportConfig.value.dateOfDecisionFrom) filters.dateOfDecisionFrom = formatDateISO(reportConfig.value.dateOfDecisionFrom);
        if (reportConfig.value.dateOfDecisionTo) filters.dateOfDecisionTo = formatDateISO(reportConfig.value.dateOfDecisionTo);
        if (reportConfig.value.progressStatus) filters.progressStatus = reportConfig.value.progressStatus;
    } else {
        filters = {
            startDate: formatDateISO(reportConfig.value.startDate),
            endDate: formatDateISO(reportConfig.value.endDate),
            format: reportConfig.value.format
        };
    }

    generating.value = true;
    try {
        const result = await ReportService.generateReport(report.endpoint, filters);
        configDialog.value = false;
        submitted.value = false;

        if (result.format === 'PDF') {
            // Preview PDF in dialog
            cleanupPdfUrl();
            pdfBlob.value = result.blob;
            pdfFilename.value = result.filename;
            pdfUrl.value = window.URL.createObjectURL(result.blob);
            pdfPreviewDialog.value = true;
        } else {
            // Download Excel directly
            ReportService.downloadBlob(result.blob, result.filename);
            toast.add({ severity: 'success', summary: 'Success', detail: `Report downloaded: ${result.filename}`, life: 3000 });
        }
    } catch (error) {
        console.error('Error generating report:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate report. Please try again.', life: 3000 });
    } finally {
        generating.value = false;
    }
}

function downloadPdf() {
    if (pdfBlob.value && pdfFilename.value) {
        ReportService.downloadBlob(pdfBlob.value, pdfFilename.value);
        toast.add({ severity: 'success', summary: 'Success', detail: `Downloaded: ${pdfFilename.value}`, life: 3000 });
    }
}

function cleanupPdfUrl() {
    if (pdfUrl.value) {
        window.URL.revokeObjectURL(pdfUrl.value);
        pdfUrl.value = null;
    }
}

function closePdfPreview() {
    pdfPreviewDialog.value = false;
    cleanupPdfUrl();
    pdfBlob.value = null;
    pdfFilename.value = '';
}

onUnmounted(() => {
    cleanupPdfUrl();
});

function getCategoryLabel(key) {
    const cat = categories.value.find((c) => c.key === key);
    return cat ? cat.label : '';
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Reports Dashboard</h1>
            <p class="text-muted-color mt-1">Select a report category and choose a report to generate</p>
        </div>
    </div>

    <!-- Reports Layout -->
    <div class="card">
        <div class="flex gap-0" style="min-height: 500px">
            <!-- Left Sidebar - Categories -->
            <div class="border-r pr-6" style="min-width: 240px">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-4">Report Categories</div>
                <div class="flex flex-col gap-1">
                    <div
                        v-for="cat in categories"
                        :key="cat.key"
                        class="flex items-center gap-2 p-3 rounded-border cursor-pointer transition-all"
                        :class="activeCategory === cat.key ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold' : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-300'"
                        @click="selectCategory(cat.key)"
                    >
                        <span>{{ cat.label }}</span>
                    </div>
                </div>
            </div>

            <!-- Right Content - Reports -->
            <div class="flex-1 pl-6">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-4">{{ getCategoryLabel(activeCategory) }} Reports</div>
                <div class="grid grid-cols-12 gap-4">
                    <div v-for="report in activeReports" :key="report.key" class="col-span-6 lg:col-span-4">
                        <div
                            class="border rounded-border p-4 cursor-pointer transition-all hover:border-emerald-400 hover:shadow-sm"
                            @click="openReportConfig(report)"
                        >
                            <div class="flex items-start gap-3">
                                <div class="flex items-center justify-center rounded-border" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                                    <i class="pi pi-file text-emerald-600 text-sm"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ report.name }}</div>
                                    <div class="text-muted-color text-xs mt-1">{{ report.description }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Configure Report Dialog -->
    <Dialog v-model:visible="configDialog" :style="{ width: '550px' }" :header="`Configure ${selectedReport?.name || 'Report'}`" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Appeals-specific fields -->
            <template v-if="selectedReport?.type === 'appeals'">
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label class="block font-medium mb-2">Start Date <span class="text-red-500">*</span></label>
                        <DatePicker v-model="reportConfig.dateOfFillingFrom" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid :invalid="submitted && !reportConfig.dateOfFillingFrom" />
                        <small v-if="submitted && !reportConfig.dateOfFillingFrom" class="text-red-500">Start date is required.</small>
                    </div>
                    <div class="col-span-6">
                        <label class="block font-medium mb-2">End Date <span class="text-red-500">*</span></label>
                        <DatePicker v-model="reportConfig.dateOfFillingTo" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid :invalid="submitted && !reportConfig.dateOfFillingTo" />
                        <small v-if="submitted && !reportConfig.dateOfFillingTo" class="text-red-500">End date is required.</small>
                    </div>
                </div>

                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label class="block font-medium mb-2">Decision Date From</label>
                        <DatePicker v-model="reportConfig.dateOfDecisionFrom" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid />
                    </div>
                    <div class="col-span-6">
                        <label class="block font-medium mb-2">Decision Date To</label>
                        <DatePicker v-model="reportConfig.dateOfDecisionTo" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid />
                    </div>
                </div>

                <div>
                    <label class="block font-medium mb-2">Progress Status</label>
                    <Select v-model="reportConfig.progressStatus" :options="progressStatuses" optionLabel="label" optionValue="value" placeholder="Select Status (Optional)" fluid />
                </div>
            </template>

            <!-- Simple date range fields -->
            <template v-else>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <label class="block font-medium mb-2">Start Date <span class="text-red-500">*</span></label>
                        <DatePicker v-model="reportConfig.startDate" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid :invalid="submitted && !reportConfig.startDate" />
                        <small v-if="submitted && !reportConfig.startDate" class="text-red-500">Start date is required.</small>
                    </div>
                    <div class="col-span-6">
                        <label class="block font-medium mb-2">End Date <span class="text-red-500">*</span></label>
                        <DatePicker v-model="reportConfig.endDate" placeholder="Select date" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" fluid :invalid="submitted && !reportConfig.endDate" />
                        <small v-if="submitted && !reportConfig.endDate" class="text-red-500">End date is required.</small>
                    </div>
                </div>
            </template>

            <!-- Export Format -->
            <div>
                <label class="block font-medium mb-2">Export Format <span class="text-red-500">*</span></label>
                <Select v-model="reportConfig.format" :options="exportFormats" optionLabel="label" optionValue="value" placeholder="Select Format" fluid :invalid="submitted && !reportConfig.format" />
                <small v-if="submitted && !reportConfig.format" class="text-red-500">Export format is required.</small>
            </div>

            <!-- Info message -->
            <div class="flex items-center gap-2 text-muted-color text-sm">
                <i class="pi pi-info-circle"></i>
                <span>This report requires a date range. Please select start and end dates.</span>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="configDialog = false" />
            <Button label="Generate Report" icon="pi pi-file" class="p-button-success" @click="generateReport" :loading="generating" />
        </template>
    </Dialog>

    <!-- PDF Preview Dialog -->
    <Dialog v-model:visible="pdfPreviewDialog" :style="{ width: '90vw', height: '90vh' }" :header="pdfFilename || 'Report Preview'" :modal="true" :maximizable="true" @hide="closePdfPreview">
        <div style="height: calc(90vh - 130px)">
            <iframe v-if="pdfUrl" :src="pdfUrl" style="width: 100%; height: 100%; border: none; border-radius: 6px" />
        </div>
        <template #footer>
            <Button label="Close" icon="pi pi-times" text @click="closePdfPreview" />
            <Button label="Download PDF" icon="pi pi-download" class="p-button-success" @click="downloadPdf" />
        </template>
    </Dialog>
</template>
