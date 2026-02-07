<script setup>
import { BillService } from '@/service/BillService';
import { FeeService } from '@/service/FeesService';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref } from 'vue';

const userName = ref();
const cart = ref([]);
const toast = useToast();
const dt = ref();
const qrData = ref('');
const bills = ref([]);
const revenues = ref([]);
const billDialog = ref(false);
const deleteBillDialog = ref(false);
const bill = ref({});
const selectedBills = ref();
const showBillPreview = ref(false);
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);

// Stat cards
const totalBills = ref(0);
const paidBills = ref(0);
const unpaidBills = ref(0);
const totalAmount = ref(0);

onMounted(() => {
    loading.value = true;
    BillService.getBills()
        .then((data) => {
            bills.value = data;
            updateStats(data);
        })
        .finally(() => (loading.value = false));
    FeeService.getFees()
        .then((data) => (revenues.value = data));
    userName.value = localStorage.getItem('userName');
});

function updateStats(data) {
    totalBills.value = data.length;
    paidBills.value = data.filter((b) => b.billPayed).length;
    unpaidBills.value = data.filter((b) => !b.billPayed).length;
    totalAmount.value = data.reduce((sum, b) => sum + (parseFloat(b.billedAmount) || 0), 0);
}

const formattedTotalAmount = computed(() => {
    return new Intl.NumberFormat('en-US').format(totalAmount.value);
});

function formatAmount(amount) {
    return new Intl.NumberFormat('en-US').format(amount || 0);
}

function openNew() {
    bill.value = {};
    submitted.value = false;
    billDialog.value = true;
}

function hideDialog() {
    billDialog.value = false;
    submitted.value = false;
}

function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function saveBill() {
    submitted.value = true;
    billCreateDto.value.carts = cart.value;
    BillService.createBill(billCreateDto.value).then(() => {
        billCreateDialog.value = false;
        billCreateDto.value = {};
        cart.value = [];
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Bill Created', life: 3000 });
        BillService.getBills().then((data) => {
            bills.value = data;
            updateStats(data);
        });
    });
}

function confirmDeleteBill(bl) {
    bill.value = bl;
    deleteBillDialog.value = true;
}

function deleteBill() {
    BillService.deleteBill(bill.value.id).then(() => {
        bills.value = bills.value.filter((val) => val.id !== bill.value.id);
        updateStats(bills.value);
        deleteBillDialog.value = false;
        bill.value = {};
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Bill Deleted', life: 3000 });
    });
}

function exportCSV() {
    dt.value.exportCSV();
}

async function showBill(bl) {
    qrData.value = JSON.stringify({
        opType: '2',
        shortCode: '001001',
        billReference: bl.billReference,
        amount: bl.billedAmount,
        billCcy: 'TZS',
        billExprDt: bl.expiryDate,
        billPayOpt: bl.billPayType,
        billRsv01: 'Council Revenue Collection |' + 'John Doe'
    });
    bill.value = bl;
    showBillPreview.value = true;
}

function countTotal(items) {
    if (!items) return 0;
    return items.reduce((total, item) => total + item.billItemAmount, 0);
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
            body * {
                visibility: hidden;
            }
            #print, #print * {
                visibility: visible;
            }
            #print {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                max-width: 700px;
                margin: auto;
            }
            #modalInvoice {
                page-break-inside: avoid;
            }
            .cert-heading, .bill-info, .bill-items, .payment-instructions {
                page-break-inside: avoid;
            }
            .bill-items div {
                page-break-inside: avoid;
            }
            .print-only {
                display: block;
            }
            .no-print {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(style);
    window.print();
    section.remove();
    style.remove();
}

function getTodayDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
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

const billCreateDto = ref({});
const billCreateDialog = ref(false);
function openNewCreateBill() {
    billCreateDto.value = {};
    cart.value = [];
    billCreateDialog.value = true;
}

const paymentType = [
    { name: 'Full', value: 3 },
    { name: 'Exact', value: 1 },
    { name: 'Partial', value: 2 }
];

const currency = [
    { name: 'TZS', value: 'TZS' },
    { name: 'USD', value: 'USD' }
];

function updateBilledAmount() {
    const selectedRevenue = revenues.value.find((item) => item.revenueName === billCreateDto.value.sourceName);
    if (selectedRevenue) {
        billCreateDto.value.billedAmount = selectedRevenue.amount;
    } else {
        billCreateDto.value.billedAmount = null;
    }
}

function addToCart() {
    if (billCreateDto.value.sourceName && billCreateDto.value.billedAmount) {
        cart.value.push({
            sourceName: billCreateDto.value.sourceName,
            billedAmount: billCreateDto.value.billedAmount
        });
        billCreateDto.value.sourceName = null;
        billCreateDto.value.billedAmount = null;
        submitted.value = false;
    } else {
        submitted.value = true;
    }
}

function updateExpiryDate() {
    if (billCreateDto.value.numberOfDays && !isNaN(billCreateDto.value.numberOfDays)) {
        const numberOfDays = billCreateDto.value.numberOfDays;
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + numberOfDays);
        billCreateDto.value.expiryDate = currentDate.toISOString().split('T')[0];
    }
}

function removeFromCart(index) {
    cart.value.splice(index, 1);
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Bills Management</h1>
            <p class="text-muted-color mt-1">Create, manage and track government bills efficiently</p>
        </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-12 gap-4 mb-6">
        <div class="col-span-3">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Total Bills</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ totalBills }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #818cf8, #6366f1)">
                        <i class="pi pi-file text-white"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-3">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Paid Bills</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ paidBills }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #34d399, #10b981)">
                        <i class="pi pi-check text-white"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-span-3">
            <div class="card p-4">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-muted-color text-sm font-medium mb-1">Unpaid Bills</div>
                        <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ unpaidBills }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #f87171, #ef4444)">
                        <i class="pi pi-times text-white"></i>
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
                    <div class="flex items-center justify-center rounded-full" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #60a5fa, #3b82f6)">
                        <i class="pi pi-wallet text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <!-- Action Bar -->
        <div class="flex items-center justify-between mb-4">
            <Button label="New Bill" icon="pi pi-plus" class="p-button-success" @click="openNewCreateBill" />
            <div class="flex items-center gap-3">
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search bills..." />
                </IconField>
                <Button label="Export" icon="pi pi-download" severity="secondary" outlined @click="exportCSV($event)" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="bills"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} bills"
            :loading="loading"
            stripedRows
        >
            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    {{ slotProps.index + 1 }}
                </template>
            </Column>
            <Column field="generatedDate" header="Generated Date" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-calendar text-muted-color"></i>
                        <span>{{ slotProps.data.generatedDate }}</span>
                    </div>
                </template>
            </Column>
            <Column field="billDescription" header="Bill Description" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.billDescription }}</span>
                </template>
            </Column>
            <Column field="billedAmount" header="Amount" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <span class="font-semibold text-emerald-600">TSh {{ formatAmount(slotProps.data.billedAmount) }}</span>
                </template>
            </Column>
            <Column field="payerName" header="Payer" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full text-white font-bold text-sm" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #34d399, #10b981)">
                            {{ getInitial(slotProps.data.payerName) }}
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.payerName }}</span>
                    </div>
                </template>
            </Column>
            <Column field="expiryDate" header="Expiry Date" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-clock text-muted-color"></i>
                        <span>{{ slotProps.data.expiryDate }}</span>
                    </div>
                </template>
            </Column>
            <Column field="billControlNumber" header="Control Number" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-qrcode text-muted-color"></i>
                        <span>{{ slotProps.data.billControlNumber }}</span>
                    </div>
                </template>
            </Column>
            <Column field="billPayed" header="Payment Status" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <Tag :severity="slotProps.data.billPayed ? 'success' : 'danger'" rounded>
                        <span class="flex items-center gap-1.5">
                            <span class="inline-block w-1.5 h-1.5 rounded-full" :class="slotProps.data.billPayed ? 'bg-emerald-400' : 'bg-red-400'"></span>
                            {{ slotProps.data.billPayed ? 'PAID' : 'NOT PAID' }}
                        </span>
                    </Tag>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 6rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-1">
                        <Button icon="pi pi-eye" text rounded @click="showBill(slotProps.data)" />
                        <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDeleteBill(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Bill Preview Dialog -->
    <Dialog v-model:visible="showBillPreview" :modal="true" :style="{ width: '850px' }" header="Bill Preview" :maximizable="true">
        <div id="modalInvoice">
            <!-- Header Section -->
            <div class="bill-header text-center pb-4 mb-4" style="border-bottom: 2px solid #e2e8f0">
                <div class="flex items-center justify-between">
                    <img src="/coat_arms.png" alt="Coat of Arms" style="width: 70px; height: auto" />
                    <div class="text-center flex-1 px-4">
                        <div class="text-base font-bold text-surface-900 dark:text-surface-0 uppercase tracking-wide">The United Republic of Tanzania</div>
                        <div class="text-lg font-bold text-surface-900 dark:text-surface-0 mt-1">Tax Revenue Appeals Tribunal (TRAT)</div>
                        <div class="mt-2">
                            <Tag value="GOVERNMENT BILL" severity="info" class="text-sm px-3" />
                        </div>
                    </div>
                    <img src="/TRAT.png" alt="TRAT Logo" style="width: 80px; height: auto" />
                </div>
            </div>

            <!-- Bill Info + QR Code -->
            <div class="flex gap-6 mb-4">
                <div class="flex-1">
                    <div class="text-sm font-semibold text-muted-color uppercase tracking-wide mb-3">Bill Information</div>
                    <div class="flex flex-col gap-2">
                        <div class="flex">
                            <span class="text-muted-color text-sm" style="min-width: 160px">Control Number</span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ bill.billControlNumber }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color text-sm" style="min-width: 160px">Payment Reference</span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ bill.billReference }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color text-sm" style="min-width: 160px">Service Provider Code</span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">SP535</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color text-sm" style="min-width: 160px">Payer Name</span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ bill.payerName }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color text-sm" style="min-width: 160px">Payer Phone</span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ bill.payerPhone }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color text-sm" style="min-width: 160px">Bill Description</span>
                            <span class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ bill.billDescription }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col items-center justify-center p-3 rounded-border bg-surface-50 dark:bg-surface-800" style="min-width: 150px">
                    <img :src="`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=120x120`" alt="QR Code" style="width: 120px; height: 120px" />
                    <span class="text-xs text-muted-color mt-2">Scan to Pay</span>
                </div>
            </div>

            <!-- Bill Items Table -->
            <div class="mb-4">
                <div class="text-sm font-semibold text-muted-color uppercase tracking-wide mb-3">Bill Items</div>
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
                            <tr v-for="(item, index) in bill.billItems" :key="index" class="border-t">
                                <td class="p-3 text-muted-color">{{ index + 1 }}</td>
                                <td class="p-3 text-surface-900 dark:text-surface-0">{{ item.billItemDescription }}</td>
                                <td class="p-3 text-right font-medium">{{ formatAmount(item.billItemAmount) }}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="border-t-2" style="background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                                <td colspan="2" class="p-3 font-bold text-surface-900 dark:text-surface-0">Total Billed Amount</td>
                                <td class="p-3 text-right font-bold text-emerald-700 text-base">TZS {{ formatAmount(countTotal(bill.billItems)) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Footer Details -->
            <div class="grid grid-cols-12 gap-4 mb-4">
                <div class="col-span-7">
                    <div class="text-sm font-semibold text-muted-color uppercase tracking-wide mb-3">Additional Details</div>
                    <div class="flex flex-col gap-2 text-sm">
                        <div class="flex">
                            <span class="text-muted-color" style="min-width: 140px">Amount in Words</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0 italic">{{ convertToWords(bill.billedAmount) }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color" style="min-width: 140px">Expires On</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(bill.expiryDate) }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color" style="min-width: 140px">Date Issued</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">{{ formatDate(bill.generatedDate) }}</span>
                        </div>
                        <div class="flex">
                            <span class="text-muted-color" style="min-width: 140px">Collection Center</span>
                            <span class="font-medium text-surface-900 dark:text-surface-0">HEAD QUARTER</span>
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

            <!-- Payment Instructions -->
            <div style="border-top: 2px solid #e2e8f0" class="pt-4">
                <div class="text-sm font-semibold text-muted-color uppercase tracking-wide mb-3">Payment Instructions</div>
                <div class="grid grid-cols-12 gap-4">
                    <div class="col-span-6">
                        <div class="bg-surface-50 dark:bg-surface-800 rounded-border p-3">
                            <div class="font-semibold text-sm mb-2 text-surface-900 dark:text-surface-0">Jinsi ya Kulipa</div>
                            <ol class="text-xs leading-relaxed pl-4 m-0">
                                <li class="mb-1">
                                    Kupitia Benki: Fika tawi lolote au wakala wa benki NMB, BOT. Namba ya kumbukumbu: <b>{{ bill?.billControlNumber }}</b>
                                    <ul class="pl-3 mt-1">
                                        <li>Ingia kwenye menyu ya mtandao husika</li>
                                        <li>Chagua 4 (Lipa Bili)</li>
                                        <li>Chagua 5 (Malipo ya Serikali)</li>
                                        <li>Ingiza <b>{{ bill?.billControlNumber }}</b> kama namba ya kumbukumbu</li>
                                    </ul>
                                </li>
                                <li>Kupitia Mitandao ya Simu</li>
                            </ol>
                        </div>
                    </div>
                    <div class="col-span-6">
                        <div class="bg-surface-50 dark:bg-surface-800 rounded-border p-3">
                            <div class="font-semibold text-sm mb-2 text-surface-900 dark:text-surface-0">How to Pay</div>
                            <ol class="text-xs leading-relaxed pl-4 m-0">
                                <li class="mb-1">
                                    Via Bank: Visit any branch or bank agent of NMB, BOT. Reference Number: <b>{{ bill?.billControlNumber }}</b>
                                    <ul class="pl-3 mt-1">
                                        <li>Enter to the respective USSD Menu of MNO</li>
                                        <li>Select 4 (Bill Payment)</li>
                                        <li>Select 5 (Government Payments)</li>
                                        <li>Enter <b>{{ bill?.billControlNumber }}</b> as reference number</li>
                                    </ul>
                                </li>
                                <li>Via Mobile Network Operators (MNOs)</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Close" text @click="showBillPreview = false" />
            <Button label="Print Bill" icon="pi pi-print" @click="printBill" />
        </template>
    </Dialog>

    <!-- Create Bill Dialog -->
    <Dialog v-model:visible="billCreateDialog" :style="{ width: '900px' }" header="Bill Details" :modal="true">
        <div class="flex flex-col gap-5">
            <div class="bg-surface-100 dark:bg-surface-700 rounded-border p-4" style="border-left: 4px solid var(--primary-color)">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0">Create New Bill</div>
                <span class="text-muted-color text-sm">Fill in the details for the government bill</span>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-user text-muted-color"></i> Payer Name <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="billCreateDto.payerName" required :invalid="submitted && !billCreateDto.payerName" placeholder="Enter Payer Name" fluid />
                    <small v-if="submitted && !billCreateDto.payerName" class="text-red-500">Payer Name is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-envelope text-muted-color"></i> Payer Email <span class="text-red-500">*</span></label>
                    <InputText type="email" v-model.trim="billCreateDto.email" required :invalid="submitted && !billCreateDto.email" placeholder="Enter Payer Email" fluid />
                    <small v-if="submitted && !billCreateDto.email" class="text-red-500">Email is required.</small>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-phone text-muted-color"></i> Mobile Number <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="billCreateDto.phoneNumber" :invalid="submitted && !billCreateDto.phoneNumber" placeholder="Enter Mobile Number" fluid />
                    <small v-if="submitted && !billCreateDto.phoneNumber" class="text-red-500">Mobile Number is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-map-marker text-muted-color"></i> Payer Address <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="billCreateDto.address" required :invalid="submitted && !billCreateDto.address" placeholder="Enter Payer Address" fluid />
                    <small v-if="submitted && !billCreateDto.address" class="text-red-500">Address is required.</small>
                </div>
            </div>

            <Divider />

            <!-- Revenue Details Section -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-5">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-list text-muted-color"></i> Item Group <span class="text-red-500">*</span></label>
                    <Select v-model="billCreateDto.sourceName" :options="revenues" optionLabel="revenueName" optionValue="revenueName" required :invalid="submitted && !billCreateDto.sourceName" placeholder="Select Item Group" fluid @change="updateBilledAmount" />
                </div>
                <div class="col-span-5">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-wallet text-muted-color"></i> Bill Amount <span class="text-red-500">*</span></label>
                    <InputText v-model="billCreateDto.billedAmount" type="number" required :invalid="submitted && !billCreateDto.billedAmount" placeholder="Enter Bill Amount" fluid :disabled="!billCreateDto.sourceName" />
                </div>
                <div class="col-span-2 flex items-end">
                    <Button label="Add" icon="pi pi-plus" class="p-button-success w-full" @click="addToCart" :disabled="!billCreateDto.sourceName || !billCreateDto.billedAmount" />
                </div>
            </div>

            <!-- Cart -->
            <div v-if="cart.length">
                <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-shopping-cart text-muted-color"></i> Cart Items</label>
                <div class="border rounded-border overflow-hidden">
                    <table class="w-full">
                        <thead>
                            <tr class="bg-surface-100 dark:bg-surface-700">
                                <th class="text-left p-3 text-sm font-medium text-muted-color">Item Group</th>
                                <th class="text-left p-3 text-sm font-medium text-muted-color">Amount</th>
                                <th class="text-left p-3 text-sm font-medium text-muted-color" style="width: 5rem">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item, index) in cart" :key="index" class="border-t">
                                <td class="p-3">{{ item.sourceName }}</td>
                                <td class="p-3 font-semibold text-emerald-600">TSh {{ formatAmount(item.billedAmount) }}</td>
                                <td class="p-3">
                                    <Button icon="pi pi-times" text rounded severity="danger" @click="removeFromCart(index)" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <Divider />

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-file-edit text-muted-color"></i> Bill Description <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="billCreateDto.billDescription" required :invalid="submitted && !billCreateDto.billDescription" placeholder="Enter Bill Description" fluid />
                    <small v-if="submitted && !billCreateDto.billDescription" class="text-red-500">Description is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-credit-card text-muted-color"></i> Payment Type <span class="text-red-500">*</span></label>
                    <Select v-model="billCreateDto.type" :options="paymentType" optionLabel="name" optionValue="value" required :invalid="submitted && !billCreateDto.type" placeholder="Select Payment Type" fluid />
                    <small v-if="submitted && !billCreateDto.type" class="text-red-500">Payment Type is required.</small>
                </div>
            </div>

            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-hashtag text-muted-color"></i> Number of Days <span class="text-red-500">*</span></label>
                    <InputText v-model="billCreateDto.numberOfDays" type="number" required :invalid="submitted && !billCreateDto.numberOfDays" placeholder="Enter Number of Days" fluid @input="updateExpiryDate" />
                    <small v-if="submitted && !billCreateDto.numberOfDays" class="text-red-500">Number of Days is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="flex items-center gap-2 font-medium mb-2"><i class="pi pi-calendar text-muted-color"></i> Expiry Date</label>
                    <InputText v-model="billCreateDto.expiryDate" readonly placeholder="Auto-calculated" fluid />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" text @click="billCreateDialog = false; billCreateDto = {}; cart = []; submitted = false" />
            <Button label="Save Bill" class="p-button-success" @click="saveBill" />
        </template>
    </Dialog>

    <!-- Delete Bill Dialog -->
    <Dialog v-model:visible="deleteBillDialog" :style="{ width: '450px' }" header="Confirm Deletion" :modal="true">
        <div class="flex items-center gap-4">
            <div class="flex items-center justify-center rounded-full" style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #fca5a5, #ef4444)">
                <i class="pi pi-exclamation-triangle text-white text-xl"></i>
            </div>
            <div>
                <div class="font-medium text-surface-900 dark:text-surface-0">Are you sure you want to delete this bill?</div>
                <div class="text-muted-color text-sm mt-1">This action cannot be undone.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" text @click="deleteBillDialog = false" />
            <Button label="Delete" severity="danger" @click="deleteBill" />
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
