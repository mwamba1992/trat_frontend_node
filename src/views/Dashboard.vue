<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onMounted, ref, watch, computed } from 'vue';
import { AppealService } from '@/service/AppealService';
import { SummonsService } from '@/service/SummonsService';
import { SetupService } from '@/service/SetupService';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const topAppellants = ref([]);
const cardDetails = ref(null);
const hearings = ref([]);

const filledAppealsCount = ref(0);
const filledAppealsChange = ref(0);
const filledApplicationCount = ref(0);
const filledApplicationChange = ref(0);
const resolvedAppealsCount = ref(0);
const resolvedAppealsChange = ref(0);
const pendingAppealsCount = ref(0);
const pendingAppealsChange = ref(0);

const yearlyCasesData = ref(null);
const yearlyCasesOptions = ref(null);
const caseDistributionData = ref(null);
const caseDistributionOptions = ref(null);
const caseStatusData = ref(null);
const caseStatusOptions = ref(null);
const monthlyTrendData = ref(null);
const monthlyTrendOptions = ref(null);

const totalHearings = computed(() => hearings.value.length);

const hasMonthlyTrendData = computed(() => {
    if (!monthlyTrendData.value?.datasets?.[0]?.data) return false;
    return monthlyTrendData.value.datasets[0].data.some((v) => v > 0);
});

const hasYearlyCasesData = computed(() => {
    if (!yearlyCasesData.value?.datasets) return false;
    return yearlyCasesData.value.datasets.some((ds) => ds.data.some((v) => v > 0));
});

onMounted(async () => {
    try {
        const [appellants, cards, summary, summons, appeals, taxTypes] = await Promise.all([
            AppealService.getTopAppellants(),
            AppealService.getCardStatistics(),
            AppealService.getAppealsSummary(),
            SummonsService.getSummons(),
            AppealService.getAppeals(),
            SetupService.getSetups('taxType')
        ]);

        topAppellants.value = appellants || [];
        cardDetails.value = cards;
        hearings.value = summons || [];

        if (cardDetails.value) {
            filledAppealsCount.value = cardDetails.value[0] || 0;
            pendingAppealsCount.value = cardDetails.value[1] || 0;
            resolvedAppealsCount.value = cardDetails.value[2] || 0;
            filledApplicationCount.value = cardDetails.value[3] || 0;

            filledAppealsChange.value = cardDetails.value[4] || 12;
            filledApplicationChange.value = cardDetails.value[5] || 8;
            resolvedAppealsChange.value = cardDetails.value[6] || 5;
            pendingAppealsChange.value = cardDetails.value[7] || -3;
        }

        yearlyCasesData.value = buildYearlyCasesData(summary);
        yearlyCasesOptions.value = buildYearlyCasesOptions();

        // Monthly trend line chart
        monthlyTrendData.value = buildMonthlyTrendData(summary);
        monthlyTrendOptions.value = buildMonthlyTrendOptions();

        // Build case distribution using only valid tax types from common setup
        const validTaxNames = (taxTypes || []).map((t) => t.name);
        if (appeals && appeals.length && validTaxNames.length) {
            const taxCounts = {};
            validTaxNames.forEach((name) => { taxCounts[name] = 0; });
            appeals.forEach((appeal) => {
                const taxName = appeal.taxes?.name;
                if (taxName && validTaxNames.includes(taxName)) {
                    taxCounts[taxName] = (taxCounts[taxName] || 0) + 1;
                }
            });
            const labels = Object.keys(taxCounts).filter((k) => taxCounts[k] > 0);
            const values = labels.map((k) => taxCounts[k]);
            caseDistributionData.value = buildCaseDistributionData({ labels, values });
        } else {
            caseDistributionData.value = buildCaseDistributionData(null);
        }
        caseDistributionOptions.value = buildPieOptions();

        // Build case status from actual appeals statusTrend data
        if (appeals && appeals.length) {
            const statusCounts = {};
            appeals.forEach((appeal) => {
                const statusName = appeal.statusTrend?.name;
                if (statusName) {
                    statusCounts[statusName] = (statusCounts[statusName] || 0) + 1;
                }
            });
            const labels = Object.keys(statusCounts);
            const values = Object.values(statusCounts);
            caseStatusData.value = buildCaseStatusData({ labels, values });
        } else {
            caseStatusData.value = buildCaseStatusData(null);
        }
        caseStatusOptions.value = buildDoughnutOptions();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
});

function buildYearlyCasesData(summary) {
    const pendingData = summary?.find((item) => item.PENDING)?.PENDING || Array(12).fill(0);
    const newData = summary?.find((item) => item.NEW)?.NEW || Array(12).fill(0);
    const decidedData = summary?.find((item) => item.DECIDED)?.DECIDED || Array(12).fill(0);

    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                type: 'bar',
                label: 'Pending',
                backgroundColor: '#f87171',
                data: pendingData,
                barThickness: 24,
                borderRadius: 4
            },
            {
                type: 'bar',
                label: 'New',
                backgroundColor: '#60a5fa',
                data: newData,
                barThickness: 24,
                borderRadius: 4
            },
            {
                type: 'bar',
                label: 'Decided',
                backgroundColor: '#34d399',
                data: decidedData,
                borderRadius: { topLeft: 6, topRight: 6 },
                borderSkipped: true,
                barThickness: 24
            }
        ]
    };
}

function buildMonthlyTrendData(summary) {
    const pendingData = summary?.find((item) => item.PENDING)?.PENDING || Array(12).fill(0);
    const newData = summary?.find((item) => item.NEW)?.NEW || Array(12).fill(0);
    const decidedData = summary?.find((item) => item.DECIDED)?.DECIDED || Array(12).fill(0);
    const totalData = pendingData.map((v, i) => v + (newData[i] || 0) + (decidedData[i] || 0));

    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Total Cases',
                data: totalData,
                fill: true,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };
}

function buildMonthlyTrendOptions() {
    const textMutedColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color-secondary');
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-border');

    return {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                ticks: { color: textMutedColor, font: { size: 11 } },
                grid: { display: false }
            },
            y: {
                ticks: { color: textMutedColor, font: { size: 11 } },
                grid: { color: borderColor, drawBorder: false }
            }
        }
    };
}

function buildYearlyCasesOptions() {
    const textMutedColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color-secondary');
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--surface-border');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: textMutedColor, font: { size: 11 } },
                grid: { color: 'transparent', borderColor: 'transparent' }
            },
            y: {
                stacked: true,
                ticks: { color: textMutedColor, font: { size: 11 } },
                grid: { color: borderColor, borderColor: 'transparent', drawTicks: false }
            }
        }
    };
}

const chartColors = ['#60a5fa', '#34d399', '#fb923c', '#a78bfa', '#f87171', '#facc15', '#2dd4bf', '#f472b6', '#94a3b8', '#c084fc'];

function buildCaseDistributionData(data) {
    if (data && data.labels && data.values) {
        return {
            labels: data.labels,
            datasets: [{ data: data.values, backgroundColor: data.labels.map((_, i) => chartColors[i % chartColors.length]) }]
        };
    }
    return { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }] };
}

function buildCaseStatusData(data) {
    if (data && data.labels && data.values) {
        return {
            labels: data.labels,
            datasets: [{ data: data.values, backgroundColor: data.labels.map((_, i) => chartColors[i % chartColors.length]) }]
        };
    }
    return { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }] };
}

function buildPieOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 8,
                    font: { size: 10 },
                    boxWidth: 6
                }
            },
            tooltip: {
                callbacks: {
                    label(ctx) {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                        return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                    }
                }
            }
        }
    };
}

function buildDoughnutOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 8,
                    font: { size: 10 },
                    boxWidth: 6,
                    generateLabels(chart) {
                        const data = chart.data;
                        if (!data.labels || !data.datasets.length) return [];
                        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                        return data.labels.map((label, i) => ({
                            text: `${label} (${total > 0 ? Math.round((data.datasets[0].data[i] / total) * 100) : 0}%)`,
                            fillStyle: data.datasets[0].backgroundColor[i],
                            strokeStyle: data.datasets[0].backgroundColor[i],
                            pointStyle: 'circle',
                            hidden: false,
                            index: i
                        }));
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label(ctx) {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                        return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                    }
                }
            }
        }
    };
}

function getAppealNos(summon) {
    if (summon.appealList && summon.appealList.length) {
        return summon.appealList.map((a) => a.appealNo).join(', ');
    }
    if (summon.applicationList && summon.applicationList.length) {
        return summon.applicationList.map((a) => a.applicationNo).join(', ');
    }
    return '—';
}

function formatDate(date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
}

watch([getPrimary, getSurface, isDarkTheme], async () => {
    try {
        const summary = await AppealService.getAppealsSummary();
        yearlyCasesData.value = buildYearlyCasesData(summary);
        yearlyCasesOptions.value = buildYearlyCasesOptions();
        monthlyTrendData.value = buildMonthlyTrendData(summary);
        monthlyTrendOptions.value = buildMonthlyTrendOptions();
    } catch (error) {
        console.error('Error refreshing chart:', error);
    }
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Stat Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-muted-color font-medium text-sm">Filed Appeals</span>
                        <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eff6ff, #dbeafe)">
                            <i class="pi pi-file text-blue-500"></i>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ filledAppealsCount }}</span>
                        <Tag :value="(filledAppealsChange >= 0 ? '+' : '') + filledAppealsChange + '%'" :severity="filledAppealsChange >= 0 ? 'success' : 'danger'" rounded />
                    </div>
                    <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full" style="height: 4px">
                        <div class="bg-blue-500 rounded-full" style="width: 70%; height: 4px"></div>
                    </div>
                    <span class="block text-muted-color text-xs mt-2">vs previous period</span>
                </div>
            </div>
            <div>
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-muted-color font-medium text-sm">Filed Applications</span>
                        <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                            <i class="pi pi-folder-open text-emerald-500"></i>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ filledApplicationCount }}</span>
                        <Tag :value="(filledApplicationChange >= 0 ? '+' : '') + filledApplicationChange + '%'" :severity="filledApplicationChange >= 0 ? 'success' : 'danger'" rounded />
                    </div>
                    <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full" style="height: 4px">
                        <div class="bg-emerald-500 rounded-full" style="width: 55%; height: 4px"></div>
                    </div>
                    <span class="block text-muted-color text-xs mt-2">vs previous period</span>
                </div>
            </div>
            <div>
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-muted-color font-medium text-sm">Determined Appeals</span>
                        <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                            <i class="pi pi-check-circle text-purple-500"></i>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ resolvedAppealsCount }}</span>
                        <Tag :value="(resolvedAppealsChange >= 0 ? '+' : '') + resolvedAppealsChange + '%'" :severity="resolvedAppealsChange >= 0 ? 'success' : 'danger'" rounded />
                    </div>
                    <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full" style="height: 4px">
                        <div class="bg-purple-500 rounded-full" style="width: 65%; height: 4px"></div>
                    </div>
                    <span class="block text-muted-color text-xs mt-2">vs previous period</span>
                </div>
            </div>
            <div>
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-muted-color font-medium text-sm">Pending Judgement</span>
                        <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #fefce8, #fde68a)">
                            <i class="pi pi-clock text-yellow-600"></i>
                        </div>
                    </div>
                    <div class="flex items-center gap-3 mb-3">
                        <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ pendingAppealsCount }}</span>
                        <Tag :value="(pendingAppealsChange >= 0 ? '+' : '') + pendingAppealsChange + '%'" :severity="pendingAppealsChange >= 0 ? 'success' : 'danger'" rounded />
                    </div>
                    <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full" style="height: 4px">
                        <div class="bg-yellow-500 rounded-full" style="width: 40%; height: 4px"></div>
                    </div>
                    <span class="block text-muted-color text-xs mt-2">vs previous period</span>
                </div>
            </div>
        </div>

        <!-- Monthly Trend + Case Status Row -->
        <div class="grid grid-cols-12 gap-4 items-stretch">
            <div class="col-span-12 xl:col-span-8">
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-5">
                        <div class="flex items-center gap-3">
                            <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                                <i class="pi pi-chart-line text-emerald-600"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Case Filing Trend</div>
                                <span class="text-muted-color text-sm">Monthly total cases overview</span>
                            </div>
                        </div>
                    </div>
                    <div class="relative">
                        <Chart type="line" :data="monthlyTrendData" :options="monthlyTrendOptions" class="h-64" />
                        <div v-if="!hasMonthlyTrendData" class="absolute inset-0 flex flex-col items-center justify-center bg-surface-0/80 dark:bg-surface-900/80 rounded-border">
                            <i class="pi pi-chart-line text-3xl text-muted-color mb-2"></i>
                            <span class="text-muted-color text-sm">No case filing data yet</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 xl:col-span-4">
                <div class="card mb-0 h-full">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                            <i class="pi pi-chart-pie text-purple-600"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Case Status</div>
                            <span class="text-muted-color text-sm">Current breakdown</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center h-64">
                        <Chart type="doughnut" :data="caseStatusData" :options="caseStatusOptions" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Yearly Cases + Case Distribution -->
        <div class="grid grid-cols-12 gap-4 items-stretch">
            <div class="col-span-12 xl:col-span-8">
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-5">
                        <div class="flex items-center gap-3">
                            <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eff6ff, #dbeafe)">
                                <i class="pi pi-chart-bar text-blue-600"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Yearly Cases Overview</div>
                                <span class="text-muted-color text-sm">Monthly breakdown by status</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="flex items-center gap-2">
                                <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-400"></span>
                                <span class="text-xs text-muted-color">Pending</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                                <span class="text-xs text-muted-color">New</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                <span class="text-xs text-muted-color">Decided</span>
                            </div>
                        </div>
                    </div>
                    <div class="relative">
                        <Chart type="bar" :data="yearlyCasesData" :options="yearlyCasesOptions" class="h-72" />
                        <div v-if="!hasYearlyCasesData" class="absolute inset-0 flex flex-col items-center justify-center bg-surface-0/80 dark:bg-surface-900/80 rounded-border">
                            <i class="pi pi-chart-bar text-3xl text-muted-color mb-2"></i>
                            <span class="text-muted-color text-sm">No yearly data available</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-span-12 xl:col-span-4">
                <div class="card mb-0 h-full">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #fff7ed, #fed7aa)">
                            <i class="pi pi-chart-pie text-orange-600"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Tax Type Distribution</div>
                            <span class="text-muted-color text-sm">Cases by tax category</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center h-72">
                        <Chart type="pie" :data="caseDistributionData" :options="caseDistributionOptions" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Hearings + Top Appellants -->
        <div class="grid grid-cols-12 gap-4 items-stretch">
            <!-- Upcoming Hearings -->
            <div class="col-span-12 xl:col-span-7">
                <div class="card mb-0 h-full">
                    <div class="flex justify-between items-center mb-5">
                        <div class="flex items-center gap-3">
                            <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eff6ff, #dbeafe)">
                                <i class="pi pi-calendar text-blue-600"></i>
                            </div>
                            <div>
                                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Upcoming Hearings</div>
                                <span class="text-muted-color text-sm">{{ totalHearings }} scheduled hearings</span>
                            </div>
                        </div>
                    </div>
                    <DataTable :value="hearings" :rows="5" :paginator="true" stripedRows dataKey="id">
                        <template #empty>
                            <div class="flex flex-col items-center justify-center py-6">
                                <i class="pi pi-calendar text-3xl text-muted-color mb-2"></i>
                                <span class="text-muted-color text-sm">No upcoming hearings</span>
                            </div>
                        </template>

                        <Column header="Case" style="min-width: 12rem">
                            <template #body="slotProps">
                                <Tag severity="info" rounded>
                                    <span class="flex items-center gap-1">
                                        <i class="pi pi-file text-xs"></i>
                                        {{ getAppealNos(slotProps.data) }}
                                    </span>
                                </Tag>
                            </template>
                        </Column>

                        <Column header="Chairman" style="min-width: 10rem">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <div class="flex items-center justify-center rounded-full font-bold text-white" style="width: 1.8rem; height: 1.8rem; font-size: 0.65rem; background: linear-gradient(135deg, #10b981, #059669)">
                                        {{ getInitials(slotProps.data.judge?.name) }}
                                    </div>
                                    <span class="text-sm">{{ slotProps.data.judge?.name || '—' }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column header="Hearing Date" :sortable="true" style="min-width: 10rem">
                            <template #body="slotProps">
                                <div>
                                    <div class="flex items-center gap-1">
                                        <i class="pi pi-calendar text-muted-color text-xs"></i>
                                        <span class="text-sm">{{ formatDate(slotProps.data.startDate) }}</span>
                                    </div>
                                    <div class="text-muted-color text-xs mt-1">to {{ formatDate(slotProps.data.endDate) }}</div>
                                </div>
                            </template>
                        </Column>

                        <Column header="Venue" style="min-width: 8rem">
                            <template #body="slotProps">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-map-marker text-muted-color text-xs"></i>
                                    <span class="text-sm">{{ slotProps.data.venue || '—' }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column header="Status" style="min-width: 6rem">
                            <template #body="slotProps">
                                <Tag :value="slotProps.data.status || 'PENDING'" :severity="slotProps.data.status === 'SERVED' ? 'success' : slotProps.data.status === 'RESPONDED' ? 'info' : 'warn'" rounded />
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- Top Appellants -->
            <div class="col-span-12 xl:col-span-5">
                <div class="card mb-0 h-full">
                    <div class="flex items-center gap-3 mb-5">
                        <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #fff7ed, #fed7aa)">
                            <i class="pi pi-users text-orange-600"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Top Appellants</div>
                            <span class="text-muted-color text-sm">Most active appellants</span>
                        </div>
                    </div>

                    <div v-if="!topAppellants.length" class="flex flex-col items-center justify-center py-8">
                        <i class="pi pi-users text-3xl text-muted-color mb-2"></i>
                        <span class="text-muted-color text-sm">No appellant data available</span>
                    </div>

                    <ul v-else class="list-none p-0 m-0">
                        <li v-for="(appellant, index) in topAppellants" :key="index" class="flex items-center justify-between py-3" :class="index < topAppellants.length - 1 ? 'border-b border-surface-200 dark:border-surface-700' : ''">
                            <div class="flex items-center gap-3">
                                <div class="flex items-center justify-center rounded-full text-white font-bold text-xs" style="width: 2.4rem; height: 2.4rem; background: linear-gradient(135deg, #10b981, #059669)">
                                    {{ getInitials(appellant.name) }}
                                </div>
                                <div>
                                    <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">{{ appellant.name }}</div>
                                    <span class="text-muted-color text-xs">Active appellant</span>
                                </div>
                            </div>
                            <Tag :value="appellant.appealCount + ' cases'" severity="warn" rounded />
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="card mb-0">
            <div class="flex items-center gap-3 mb-5">
                <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                    <i class="pi pi-bolt text-emerald-600"></i>
                </div>
                <div>
                    <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Quick Actions</div>
                    <span class="text-muted-color text-sm">Common tasks and shortcuts</span>
                </div>
            </div>
            <div class="grid grid-cols-12 gap-3">
                <router-link to="/pages/notices" class="col-span-6 md:col-span-3 no-underline">
                    <div class="border rounded-border p-4 text-center cursor-pointer transition-all hover:border-emerald-400 hover:shadow-sm">
                        <div class="flex items-center justify-center mx-auto rounded-border mb-3" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eff6ff, #dbeafe)">
                            <i class="pi pi-book text-blue-600"></i>
                        </div>
                        <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">New Notice</div>
                        <div class="text-muted-color text-xs mt-1">File a notice of appeal</div>
                    </div>
                </router-link>
                <router-link to="/pages/applications" class="col-span-6 md:col-span-3 no-underline">
                    <div class="border rounded-border p-4 text-center cursor-pointer transition-all hover:border-emerald-400 hover:shadow-sm">
                        <div class="flex items-center justify-center mx-auto rounded-border mb-3" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                            <i class="pi pi-briefcase text-emerald-600"></i>
                        </div>
                        <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">New Application</div>
                        <div class="text-muted-color text-xs mt-1">Submit an application</div>
                    </div>
                </router-link>
                <router-link to="/pages/summons" class="col-span-6 md:col-span-3 no-underline">
                    <div class="border rounded-border p-4 text-center cursor-pointer transition-all hover:border-emerald-400 hover:shadow-sm">
                        <div class="flex items-center justify-center mx-auto rounded-border mb-3" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                            <i class="pi pi-calendar-times text-purple-600"></i>
                        </div>
                        <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">Schedule Hearing</div>
                        <div class="text-muted-color text-xs mt-1">Create new summons</div>
                    </div>
                </router-link>
                <router-link to="/reports" class="col-span-6 md:col-span-3 no-underline">
                    <div class="border rounded-border p-4 text-center cursor-pointer transition-all hover:border-emerald-400 hover:shadow-sm">
                        <div class="flex items-center justify-center mx-auto rounded-border mb-3" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #fff7ed, #fed7aa)">
                            <i class="pi pi-chart-bar text-orange-600"></i>
                        </div>
                        <div class="font-medium text-surface-900 dark:text-surface-0 text-sm">Generate Report</div>
                        <div class="text-muted-color text-xs mt-1">View reports dashboard</div>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>
