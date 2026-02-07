<script setup>
import { PaymentService } from '@/service/PaymentService.js';
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';

const userName = ref();
const allPayments = ref([]);
const loading = ref(false);
const dt = ref();
const showPaymentPreview = ref(false);
const payment = ref({});
const activeFilter = ref('all');

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Custom date range
const dateFrom = ref(null);
const dateTo = ref(null);

onMounted(() => {
    userName.value = localStorage.getItem('userName');
    loading.value = true;
    PaymentService.getPayments()
        .then((data) => {
            allPayments.value = data;
        })
        .finally(() => (loading.value = false));
});

// Filtered payments based on active filter
const filteredPayments = computed(() => {
    const data = allPayments.value;
    if (!data || !data.length) return [];

    const now = new Date();
    let from = null;
    let to = null;

    switch (activeFilter.value) {
        case 'today':
            from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case 'week': {
            const dayOfWeek = now.getDay();
            from = new Date(now);
            from.setDate(now.getDate() - dayOfWeek);
            from.setHours(0, 0, 0, 0);
            to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        }
        case 'month':
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case 'quarter': {
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            from = new Date(now.getFullYear(), quarterMonth, 1);
            to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        }
        case 'year':
            from = new Date(now.getFullYear(), 0, 1);
            to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case 'custom':
            if (dateFrom.value && dateTo.value) {
                from = new Date(dateFrom.value);
                from.setHours(0, 0, 0, 0);
                to = new Date(dateTo.value);
                to.setHours(23, 59, 59);
            }
            break;
        case 'all':
        default:
            return data;
    }

    if (from && to) {
        return data.filter((p) => {
            const d = new Date(p.paymentDate);
            return d >= from && d <= to;
        });
    }
    return data;
});

// Stats computed from filtered data
const totalPayments = computed(() => filteredPayments.value.length);
const totalAmount = computed(() => filteredPayments.value.reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0));
const todaysPayments = computed(() => {
    const today = new Date().toDateString();
    return filteredPayments.value
        .filter((p) => new Date(p.paymentDate).toDateString() === today)
        .reduce((sum, p) => sum + (parseFloat(p.paidAmount) || 0), 0);
});
const averagePayment = computed(() => filteredPayments.value.length > 0 ? totalAmount.value / filteredPayments.value.length : 0);

const formattedTotalAmount = computed(() => formatAmount(totalAmount.value));
const formattedTodaysPayments = computed(() => formatAmount(todaysPayments.value));
const formattedAveragePayment = computed(() => formatAmount(averagePayment.value));

function formatAmount(amount) {
    return new Intl.NumberFormat('en-US').format(amount || 0);
}

function applyQuickFilter(filterType) {
    activeFilter.value = filterType;
}

function applyCustomRange() {
    if (dateFrom.value && dateTo.value) {
        activeFilter.value = 'custom';
    }
}

function clearFilters() {
    activeFilter.value = 'all';
    dateFrom.value = null;
    dateTo.value = null;
}

function showPayment(py) {
    payment.value = py;
    showPaymentPreview.value = true;
}

function formatPaymentDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true };
    return date.toLocaleDateString('en-US', options);
}

function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function getTodayDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
}

function countTotal(items) {
    if (!items) return 0;
    return items.reduce((total, item) => total + item.billItemAmount, 0);
}

function convertToWords(n) {
    if (n < 0) return false;
    let single_digit = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    let double_digit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    let below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (n === 0) return 'Zero';

    function translate(n) {
        let word = '';
        if (n < 10) {
            word = single_digit[n] + ' ';
        } else if (n < 20) {
            word = double_digit[n - 10] + ' ';
        } else if (n < 100) {
            let rem = translate(n % 10);
            word = below_hundred[(n - (n % 10)) / 10 - 2] + ' ' + rem;
        } else if (n < 1000) {
            word = single_digit[Math.trunc(n / 100)] + ' Hundred ' + translate(n % 100);
        } else if (n < 1000000) {
            word = translate(parseInt(n / 1000)).trim() + ' Thousand ' + translate(n % 1000);
        } else if (n < 1000000000) {
            word = translate(parseInt(n / 1000000)).trim() + ' Million ' + translate(n % 1000000);
        } else {
            word = translate(parseInt(n / 1000000000)).trim() + ' Billion ' + translate(n % 1000000000);
        }
        return word;
    }

    let result = translate(n);
    return result.trim() + '.';
}

function printBill() {
    const modal = document.getElementById('modalInvoice');
    if (!modal) {
        console.error('Modal content not found!');
        return;
    }

    const cloned = modal.cloneNode(true);

    let section = document.getElementById('print');
    if (!section) {
        section = document.createElement('div');
        section.id = 'print';
        document.body.appendChild(section);
    }

    section.innerHTML = '';
    section.appendChild(cloned);

    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
        @media print {
            body * { visibility: hidden; }
            #print, #print * { visibility: visible; }
            #print {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                max-width: 850px;
                margin: auto;
            }
            #modalInvoice { page-break-inside: avoid; }
            .no-print { display: none !important; }
        }
    `;
    document.head.appendChild(style);
    window.print();
    section.remove();
    style.remove();
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Payments Management</h1>
            <p class="text-muted-color mt-1">Track and manage all payment transactions</p>
        </div>
    </div>

    <!-- Date Filter Card -->
    <div class="card mb-6">
        <div class="flex items-center justify-between mb-3">
            <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Date Filter</div>
            <Button label="Clear Filters" text size="small" @click="clearFilters" />
        </div>
        <div class="flex flex-col gap-4">
            <div>
                <div class="text-sm font-medium text-muted-color mb-2">Quick Filters</div>
                <div class="flex items-center gap-2 flex-wrap">
                    <Button label="All Time" :outlined="activeFilter !== 'all'" size="small" @click="applyQuickFilter('all')" />
                    <Button label="Today" :outlined="activeFilter !== 'today'" size="small" @click="applyQuickFilter('today')" />
                    <Button label="This Week" :outlined="activeFilter !== 'week'" size="small" @click="applyQuickFilter('week')" />
                    <Button label="This Month" :outlined="activeFilter !== 'month'" size="small" @click="applyQuickFilter('month')" />
                    <Button label="This Quarter" :outlined="activeFilter !== 'quarter'" size="small" @click="applyQuickFilter('quarter')" />
                    <Button label="This Year" :outlined="activeFilter !== 'year'" size="small" @click="applyQuickFilter('year')" />
                    <div class="flex items-center gap-2 ml-2">
                        <DatePicker v-model="dateFrom" placeholder="From" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" class="w-40" />
                        <DatePicker v-model="dateTo" placeholder="To" dateFormat="yy-mm-dd" showIcon :showOnFocus="false" class="w-40" />
                        <Button label="Apply" size="small" @click="applyCustomRange" :disabled="!dateFrom || !dateTo" />
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-12 gap-4 mb-6">
        <div class="col-span-3">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Total Payments</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ totalPayments }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                        <i class="pi pi-history text-white"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-3">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Total Amount</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">TSh {{ formattedTotalAmount }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #34d399, #10b981)">
                        <i class="pi pi-clipboard text-white"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-3">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Today's Payments</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">TSh {{ formattedTodaysPayments }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #fb923c, #f97316)">
                        <i class="pi pi-calendar text-white"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-3">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Average Payment</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">TSh {{ formattedAveragePayment }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #60a5fa, #3b82f6)">
                        <i class="pi pi-chart-line text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Payment Records Table -->
    <div class="card">
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
                <span class="font-semibold text-lg text-surface-900 dark:text-surface-0">Payment Records</span>
                <span class="text-muted-color text-sm">({{ totalPayments }} records)</span>
            </div>
            <div class="flex items-center gap-3">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search payments..." />
                </IconField>
                <Button label="Export" icon="pi pi-download" severity="secondary" outlined @click="exportCSV($event)" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="filteredPayments"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} payments"
            :loading="loading"
            stripedRows
        >
            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                </template>
            </Column>
            <Column field="controlNumber" header="Control Number" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-qrcode text-muted-color"></i>
                        <span>{{ slotProps.data.controlNumber }}</span>
                    </div>
                </template>
            </Column>
            <Column field="paymentDate" header="Payment Date" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar text-muted-color"></i>
                        <span>{{ formatPaymentDate(slotProps.data.paymentDate) }}</span>
                    </div>
                </template>
            </Column>
            <Column field="payerName" header="Payer Name" sortable style="min-width: 18rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #34d399, #10b981)">
                            {{ getInitial(slotProps.data.payerName) }}
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.payerName }}</span>
                    </div>
                </template>
            </Column>
            <Column field="paidAmount" header="Amount Paid" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <span class="font-semibold text-emerald-600">TSh {{ formatAmount(parseFloat(slotProps.data.paidAmount) || 0) }}</span>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 6rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-1">
                        <Button icon="pi pi-eye" text rounded @click="showPayment(slotProps.data)" />
                        <Button icon="pi pi-print" text rounded @click="showPayment(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Payment Receipt Preview Dialog -->
    <Dialog v-model:visible="showPaymentPreview" :modal="true" :style="{ width: '850px' }" header="Payment Receipt" :maximizable="true">
        <div id="modalInvoice">
            <!-- Header Section -->
            <div class="text-center pb-4 mb-4" style="border-bottom: 2px solid #e2e8f0">
                <div class="flex items-center justify-between">
                    <img src="/coat_arms.png" alt="Coat of Arms" style="width: 70px; height: auto" />
                    <div class="text-center flex-1 px-4">
                        <div class="text-base font-bold text-surface-900 dark:text-surface-0 uppercase tracking-wide">The United Republic of Tanzania</div>
                        <div class="text-lg font-bold text-surface-900 dark:text-surface-0 mt-1">Tax Revenue Appeals Tribunal (TRAT)</div>
                        <div class="mt-2">
                            <Tag value="EXCHEQUER RECEIPT" severity="success" class="text-sm px-3" />
                        </div>
                    </div>
                    <img src="/TRAT.png" alt="TRAT Logo" style="width: 80px; height: auto" />
                </div>
            </div>

            <!-- Receipt Information -->
            <div class="mb-4">
                <div class="text-sm font-semibold text-muted-color uppercase tracking-wide mb-3">Receipt Information</div>
                <div class="flex flex-col gap-2">
                    <div class="flex">
                        <span class="text-muted-color text-sm" style="min-width: 160px">Receipt Number</span>
                        <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ payment.gepgReference }}</span>
                    </div>
                    <div class="flex">
                        <span class="text-muted-color text-sm" style="min-width: 160px">Received From</span>
                        <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ payment.payerName }}</span>
                    </div>
                    <div class="flex">
                        <span class="text-muted-color text-sm" style="min-width: 160px">Amount</span>
                        <span class="font-semibold text-sm text-emerald-600">TZS {{ formatAmount(parseFloat(payment.paidAmount) || 0) }}</span>
                    </div>
                    <div class="flex">
                        <span class="text-muted-color text-sm" style="min-width: 160px">Amount In Words</span>
                        <span class="font-semibold text-sm text-surface-900 dark:text-surface-0 italic">{{ convertToWords(payment.paidAmount) }}</span>
                    </div>
                    <div class="flex">
                        <span class="text-muted-color text-sm" style="min-width: 160px">Outstanding Amount</span>
                        <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">TZS 0.00</span>
                    </div>
                </div>
            </div>

            <!-- Bill Items Table -->
            <div class="mb-4" v-if="payment.bill?.billItems">
                <div class="text-sm font-semibold text-muted-color uppercase tracking-wide mb-3">In Respect Of</div>
                <div class="border rounded-border overflow-hidden">
                    <table class="w-full text-sm">
                        <thead>
                            <tr style="background: linear-gradient(135deg, #f1f5f9, #e2e8f0)">
                                <th class="text-left p-3 font-semibold text-surface-700 dark:text-surface-200" style="width: 4rem">#</th>
                                <th class="text-left p-3 font-semibold text-surface-700 dark:text-surface-200">Description</th>
                                <th class="text-right p-3 font-semibold text-surface-700 dark:text-surface-200" style="width: 10rem">Amount (TZS)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in payment.bill.billItems" :key="index" class="border-t">
                                <td class="p-3 text-muted-color">{{ index + 1 }}</td>
                                <td class="p-3 text-surface-900 dark:text-surface-0">{{ item.billItemDescription }}</td>
                                <td class="p-3 text-right font-medium">{{ formatAmount(item.billItemAmount) }}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="border-t-2" style="background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                                <td colspan="2" class="p-3 font-bold text-surface-900 dark:text-surface-0">Total Billed Amount</td>
                                <td class="p-3 text-right font-bold text-emerald-700 text-base">TZS {{ formatAmount(countTotal(payment.bill.billItems)) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Additional Details -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-7">
                    <div class="text-sm font-semibold text-muted-color uppercase tracking-wide mb-3">Additional Details</div>
                    <div class="flex flex-col gap-2 text-sm">
                        <div class="flex" v-if="payment.bill">
                            <span class="text-muted-color" style="min-width: 140px">Bill Reference</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ payment.bill.billReference }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color" style="min-width: 140px">Control Number</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ payment.controlNumber }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color" style="min-width: 140px">Payment Date</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(payment.paymentDate) }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color" style="min-width: 140px">Printed By</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ userName }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color" style="min-width: 140px">Printed On</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ getTodayDate() }}</span>
                        </div>
                    </div>
                </div>
                <div class="col-span-5 flex flex-col justify-end items-center">
                    <div class="text-center">
                        <div style="width: 180px; border-bottom: 1px dashed #94a3b8; margin-bottom: 0.5rem"></div>
                        <span class="text-sm text-muted-color">Authorized Signature</span>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Close" text @click="showPaymentPreview = false" />
            <Button label="Print Receipt" icon="pi pi-print" @click="printBill" />
        </template>
    </Dialog>
</template>

<style scoped>
@media print {
    #print {
        max-height: 100vh;
        max-width: 850px;
        overflow: hidden;
    }

    .modal-content {
        page-break-inside: avoid;
    }
}
</style>
