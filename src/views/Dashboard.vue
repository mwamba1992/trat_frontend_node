<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ProductService } from '@/service/ProductService';
import { onMounted, ref, watch } from 'vue';
import { AppealService } from '@/service/AppealService';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const products = ref(null);
const chartData = ref(null);
const chartOptions = ref(null);
const topAppellants = ref(null);
const cardDetails = ref(null);

const filledAppealsCount = ref(0);
const pendingAppealsCount = ref(0);
const resolvedAppealsCount = ref(0);
const filledApplicationCount = ref(0);

const items = ref([
    { label: 'Add New', icon: 'pi pi-fw pi-plus' },
    { label: 'Remove', icon: 'pi pi-fw pi-trash' }
]);

onMounted(async () => {
    ProductService.getProductsSmall().then((data) => (products.value = data));
    chartData.value = await setChartData();
    chartOptions.value = setChartOptions();
    await AppealService.getTopAppellants().then((data) => (topAppellants.value = data));
    await AppealService.getCardStatistics().then((data) => (cardDetails.value = data));

    filledApplicationCount.value = cardDetails.value[3];
    filledAppealsCount.value = cardDetails.value[0];
    pendingAppealsCount.value = cardDetails.value[1];
    resolvedAppealsCount.value = cardDetails.value[2];
});

async function setChartData() {
    const summary = await AppealService.getAppealsSummary();
    const documentStyle = getComputedStyle(document.documentElement);

    // Accessing PENDING data
    const pendingData = summary.find((item) => item.PENDING)?.PENDING;
    const newData = summary.find((item) => item.NEW)?.NEW;
    const decidedData = summary.find((item) => item.DECIDED)?.DECIDED;

    return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                type: 'bar',
                label: 'Pending',
                backgroundColor: documentStyle.getPropertyValue('100'),
                data: pendingData,
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'New',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-300'),
                data: newData,
                barThickness: 32
            },
            {
                type: 'bar',
                label: 'Decided',
                backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                data: decidedData,
                borderRadius: {
                    topLeft: 8,
                    topRight: 8
                },
                borderSkipped: true,
                barThickness: 32
            }
        ]
    };
}

function setChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

    return {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: 'transparent',
                    borderColor: 'transparent'
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textMutedColor
                },
                grid: {
                    color: borderColor,
                    borderColor: 'transparent',
                    drawTicks: false
                }
            }
        }
    };
}

const formatCurrency = (value) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartData.value = setChartData();
    chartOptions.value = setChartOptions();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Filled Appeals</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ filledAppealsCount }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-box text-blue-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Filled Applications</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ filledApplicationCount }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-folder text-orange-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Determined Appeals</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ resolvedAppealsCount }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-check-circle text-cyan-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Pending Judgement</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ pendingAppealsCount }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-minus-circle text-purple-500 !text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Up Coming Hearings</div>
                <DataTable :value="products" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column style="width: 15%" header="CASE">
                    </Column>
                    <Column field="name" header="HEARING DATE" :sortable="true" style="width: 35%"></Column>
                    <Column field="price" header="VENUE" :sortable="true" style="width: 35%">
                    </Column>
                </DataTable>
            </div>
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Top Appellants With Cases</div>
                    <div>
                        <Button icon="pi pi-ellipsis-v" class="p-button-text p-button-plain p-button-rounded" @click="$refs.menu2.toggle($event)"></Button>
                        <Menu ref="menu2" :popup="true" :model="items" class="!min-w-40"></Menu>
                    </div>
                </div>
                <ul class="list-none p-0 m-0" v-for="(appellant, index) in topAppellants" :key="appellant.id">
                    <li class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                        <div>
                            <span class="text-surface-900 dark:text-surface-0 font-medium mr-2 mb-1 md:mb-0">{{ appellant.name }}</span>
                        </div>
                        <div class="mt-2 md:mt-0 flex items-center">
                            <span class="text-orange-500 ml-4 font-medium">{{ appellant.appealCount }}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">Yearly Cases</div>
                <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
            </div>
        </div>
    </div>
</template>
