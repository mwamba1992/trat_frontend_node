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

const items = ref([
    { label: 'Add New', icon: 'pi pi-fw pi-plus' },
    { label: 'Remove', icon: 'pi pi-fw pi-trash' }
]);

const totalHearings = computed(() => hearings.value.length);

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
            // Remove tax types with 0 count
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
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'New',
                backgroundColor: '#60a5fa',
                data: newData,
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Decided',
                backgroundColor: '#4ade80',
                data: decidedData,
                borderRadius: { topLeft: 8, topRight: 8 },
                borderSkipped: true,
                barThickness: 32
            }
        ]
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
                ticks: { color: textMutedColor },
                grid: { color: 'transparent', borderColor: 'transparent' }
            },
            y: {
                stacked: true,
                ticks: { color: textMutedColor },
                grid: { color: borderColor, borderColor: 'transparent', drawTicks: false }
            }
        }
    };
}

const chartColors = ['#60a5fa', '#4ade80', '#fb923c', '#a78bfa', '#f87171', '#facc15', '#2dd4bf', '#f472b6', '#94a3b8', '#c084fc'];

function buildCaseDistributionData(data) {
    if (data && data.labels && data.values) {
        return {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.labels.map((_, i) => chartColors[i % chartColors.length])
            }]
        };
    }
    return {
        labels: ['No Data'],
        datasets: [{
            data: [1],
            backgroundColor: ['#e2e8f0']
        }]
    };
}

function buildCaseStatusData(data) {
    if (data && data.labels && data.values) {
        return {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: data.labels.map((_, i) => chartColors[i % chartColors.length])
            }]
        };
    }
    return {
        labels: ['No Data'],
        datasets: [{
            data: [1],
            backgroundColor: ['#e2e8f0']
        }]
    };
}

function buildPieOptions() {
    return {
        responsive: true,
        aspectRatio: 1.6,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 12,
                    font: { size: 11 },
                    boxWidth: 8
                }
            }
        }
    };
}

function buildDoughnutOptions() {
    return {
        responsive: true,
        aspectRatio: 1.6,
        cutout: '55%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 12,
                    font: { size: 11 },
                    boxWidth: 8
                }
            }
        }
    };
}

function getAppealNos(summon) {
    if (summon.appealList && summon.appealList.length) {
        return summon.appealList.map((a) => `Appeal ${a.appealNo}`).join(', ');
    }
    return '-';
}

watch([getPrimary, getSurface, isDarkTheme], async () => {
    try {
        const summary = await AppealService.getAppealsSummary();
        yearlyCasesData.value = buildYearlyCasesData(summary);
        yearlyCasesOptions.value = buildYearlyCasesOptions();
    } catch (error) {
        console.error('Error refreshing chart:', error);
    }
});
</script>

<template>
    <div class="grid grid-cols-12 gap-6">
        <!-- Header -->
        <div class="col-span-12 flex justify-between items-start">
            <div>
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Legal Dashboard</h1>
                <p class="text-muted-color mt-1">Monitor your legal cases and appeals activity</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                <span class="text-sm text-muted-color">Live Updates</span>
            </div>
        </div>

        <!-- Stat Cards -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 py-4 px-5">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-muted-color font-medium text-sm">Filled Appeals</span>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2rem; height: 2rem">
                        <i class="pi pi-file text-blue-500 !text-sm"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ filledAppealsCount }}</span>
                    <span :class="filledAppealsChange >= 0 ? 'text-green-500' : 'text-red-500'" class="font-medium text-sm">
                        <i :class="filledAppealsChange >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="!text-xs"></i>
                        {{ filledAppealsChange >= 0 ? '+' : '' }}{{ filledAppealsChange }}%
                    </span>
                </div>
                <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full h-1">
                    <div class="bg-blue-500 h-1 rounded-full" style="width: 70%"></div>
                </div>
                <span class="block text-muted-color text-xs mt-2">vs last month</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 py-4 px-5">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-muted-color font-medium text-sm">Filled Applications</span>
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2rem; height: 2rem">
                        <i class="pi pi-folder-open text-green-500 !text-sm"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ filledApplicationCount }}</span>
                    <span :class="filledApplicationChange >= 0 ? 'text-green-500' : 'text-red-500'" class="font-medium text-sm">
                        <i :class="filledApplicationChange >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="!text-xs"></i>
                        {{ filledApplicationChange >= 0 ? '+' : '' }}{{ filledApplicationChange }}%
                    </span>
                </div>
                <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full h-1">
                    <div class="bg-green-500 h-1 rounded-full" style="width: 55%"></div>
                </div>
                <span class="block text-muted-color text-xs mt-2">vs last month</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 py-4 px-5">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-muted-color font-medium text-sm">Determined Appeals</span>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2rem; height: 2rem">
                        <i class="pi pi-check-circle text-cyan-500 !text-sm"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ resolvedAppealsCount }}</span>
                    <span :class="resolvedAppealsChange >= 0 ? 'text-green-500' : 'text-red-500'" class="font-medium text-sm">
                        <i :class="resolvedAppealsChange >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="!text-xs"></i>
                        {{ resolvedAppealsChange >= 0 ? '+' : '' }}{{ resolvedAppealsChange }}%
                    </span>
                </div>
                <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full h-1">
                    <div class="bg-purple-500 h-1 rounded-full" style="width: 65%"></div>
                </div>
                <span class="block text-muted-color text-xs mt-2">vs last month</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 py-4 px-5">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-muted-color font-medium text-sm">Pending Judgement</span>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2rem; height: 2rem">
                        <i class="pi pi-clock text-orange-500 !text-sm"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ pendingAppealsCount }}</span>
                    <span :class="pendingAppealsChange >= 0 ? 'text-green-500' : 'text-red-500'" class="font-medium text-sm">
                        <i :class="pendingAppealsChange >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="!text-xs"></i>
                        {{ pendingAppealsChange >= 0 ? '+' : '' }}{{ pendingAppealsChange }}%
                    </span>
                </div>
                <div class="w-full bg-surface-200 dark:bg-surface-600 rounded-full h-1">
                    <div class="bg-orange-500 h-1 rounded-full" style="width: 40%"></div>
                </div>
                <span class="block text-muted-color text-xs mt-2">vs last month</span>
            </div>
        </div>

        <!-- Upcoming Hearings -->
        <div class="col-span-12 xl:col-span-7">
            <div class="card">
                <div class="flex items-center gap-3 mb-6">
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-calendar text-blue-500 !text-xl"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Upcoming Hearings</div>
                        <span class="text-muted-color text-sm">Next {{ totalHearings }} scheduled hearings</span>
                    </div>
                </div>
                <DataTable :value="hearings" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column header="CASE" style="width: 30%">
                        <template #body="slotProps">
                            <Tag severity="info" :value="getAppealNos(slotProps.data)" />
                        </template>
                    </Column>
                    <Column field="startDate" header="HEARING DATE" :sortable="true" style="width: 35%">
                        <template #body="slotProps">
                            <div>
                                <div>{{ slotProps.data.startDate }}</div>
                                <div class="text-muted-color text-sm">to {{ slotProps.data.endDate }}</div>
                            </div>
                        </template>
                    </Column>
                    <Column field="venue" header="VENUE" :sortable="true" style="width: 35%">
                        <template #body="slotProps">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-map-marker text-muted-color"></i>
                                <span>{{ slotProps.data.venue }}</span>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Top Appellants -->
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                            <i class="pi pi-users text-orange-500 !text-xl"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Top Appellants</div>
                            <span class="text-muted-color text-sm">Most active appellants with cases</span>
                        </div>
                    </div>
                    <div>
                        <Button icon="pi pi-ellipsis-v" class="p-button-text p-button-plain p-button-rounded" @click="$refs.menu2.toggle($event)"></Button>
                        <Menu ref="menu2" :popup="true" :model="items" class="!min-w-40"></Menu>
                    </div>
                </div>
                <ul class="list-none p-0 m-0">
                    <li v-for="(appellant, index) in topAppellants" :key="index" class="flex items-center justify-between py-4 border-b border-surface-200 dark:border-surface-700 last:border-0">
                        <div class="flex items-center gap-3">
                            <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2.8rem; height: 2.8rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                                {{ appellant.name ? appellant.name.charAt(0).toUpperCase() : '?' }}
                            </div>
                            <div>
                                <div class="font-semibold text-surface-900 dark:text-surface-0">{{ appellant.name }}</div>
                                <span class="text-muted-color text-sm">Active appellant</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 rounded-full text-sm font-medium" style="background-color: #fff3e0; color: #e65100;">
                                {{ appellant.appealCount }} cases
                            </span>
                            <i class="pi pi-chevron-right text-muted-color text-sm"></i>
                        </div>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Right Column: Charts -->
        <div class="col-span-12 xl:col-span-5">
            <!-- Yearly Cases Overview -->
            <div class="card">
                <div class="flex items-center gap-3 mb-4">
                    <div class="flex items-center justify-center bg-indigo-100 dark:bg-indigo-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-chart-bar text-indigo-500 !text-xl"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Yearly Cases Overview</div>
                        <span class="text-muted-color text-sm">Monthly breakdown of case activity</span>
                    </div>
                </div>
                <!-- Legend -->
                <div class="flex items-center gap-4 mb-4">
                    <div class="flex items-center gap-2">
                        <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-400"></span>
                        <span class="text-sm text-muted-color">Pending</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                        <span class="text-sm text-muted-color">New</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="inline-block w-2.5 h-2.5 rounded-full bg-green-400"></span>
                        <span class="text-sm text-muted-color">Decided</span>
                    </div>
                </div>
                <Chart type="bar" :data="yearlyCasesData" :options="yearlyCasesOptions" class="h-64" />
            </div>

            <!-- Case Distribution -->
            <div class="card">
                <div class="flex items-center gap-3 mb-4">
                    <div class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-chart-pie text-red-500 !text-xl"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Case Distribution</div>
                        <span class="text-muted-color text-sm">Cases by category and type</span>
                    </div>
                </div>
                <Chart type="pie" :data="caseDistributionData" :options="caseDistributionOptions" />
            </div>

            <!-- Case Status -->
            <div class="card">
                <div class="flex items-center gap-3 mb-4">
                    <div class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-chart-pie text-green-500 !text-xl"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-xl text-surface-900 dark:text-surface-0">Case Status</div>
                        <span class="text-muted-color text-sm">Current status breakdown</span>
                    </div>
                </div>
                <Chart type="doughnut" :data="caseStatusData" :options="caseStatusOptions" />
            </div>
        </div>
    </div>
</template>
