<script setup>
import { BillService } from '@/service/BillService';
import { FeeService } from '@/service/FeesService';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

onMounted(() => {
    loading.value = true;
    BillService.getBills()
        .then((data) => (bills.value = data))
        .finally(() => (loading.value = false));
    FeeService.getFees()
        .then((data) => (revenues.value = data))
        .finally(() => (loading.value = false));
    userName.value = localStorage.getItem('userName');
});

const userName = ref();
const cart = ref([]);
const toast = useToast();
const dt = ref();
const qrData = ref('');
const bills = ref([]);
const revenues = ref([]);
const billDialog = ref(false);
const deleteBillDialog = ref(false);
const deleteBillsDialog = ref(false);
const bill = ref({});
const selectedBills = ref();
const showBillPreview = ref(false);
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);

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
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}

function saveBill() {
    submitted.value = true;

    billCreateDto.value.carts = cart.value;
    BillService.createBill(billCreateDto.value).then(() => {
        billCreateDialog.value = false;
        billCreateDto.value = {};
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Bill Created', life: 3000 });
        BillService.getBills().then((data) => (bills.value = data));
    });
}

function deleteBill() {
    bills.value = bills.value.filter((val) => val.id !== bill.value.id);
    deleteBillDialog.value = false;
    bill.value = {};
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Bill Deleted', life: 3000 });
}

function exportCSV() {
    dt.value.exportCSV();
}

function deleteSelectedBills() {
    bills.value = bills.value.filter((val) => !selectedBills.value.includes(val));
    deleteBillsDialog.value = false;
    selectedBills.value = null;
    toast.add({ severity: 'success', summary: 'Successful', detail: 'Bills Deleted', life: 3000 });
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
    bill.value = bl; // Populate the selected bill
    showBillPreview.value = true; // Open the dialog
}

function countTotal(items) {
    return items.reduce((total, item) => total + item.billItemAmount, 0);
}

function printBill() {
    // Get the modal content
    const modal = document.getElementById('modalInvoice');
    if (!modal) {
        console.error('Modal content not found!');
        return;
    }

    // Clone the modal content
    const cloned = modal.cloneNode(true);

    // Find or create the #print section
    let section = document.getElementById('print');
    if (!section) {
        section = document.createElement('div');
        section.id = 'print';
        document.body.appendChild(section);
    }

    // Ensure no previous content exists
    section.innerHTML = '';

    // Append the cloned modal to the print section
    section.appendChild(cloned);

    // Add CSS to control layout during printing
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
                display: none !important; /* Hide elements with this class */
            }
        }
    `;
    document.head.appendChild(style);

    // Trigger the print dialog
    window.print();

    // Clean up the DOM after printing
    section.remove();
    style.remove();
}

function getTodayDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
}

function convertToWords(n) {
    if (n < 0) return false;

    // Arrays to hold words for single-digit, double-digit, and below-hundred numbers
    let single_digit = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    let double_digit = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    let below_hundred = ['Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (n === 0) return 'Zero';

    // Recursive function to translate the number into words
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

    // Get the result by translating the given number
    let result = translate(n);
    return result.trim() + '.';
}

const billCreateDto = ref({});
const billCreateDialog = ref(false);
function openNewCreateBill() {
    billCreateDto.value = {};
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
        // Clear the form after adding to cart
        billCreateDto.value.sourceName = null;
        billCreateDto.value.billedAmount = null;
        this.submitted = false;
    } else {
        this.submitted = true;
    }
}

function updateExpiryDate() {
    // Ensure that a valid number of days is provided
    if (billCreateDto.value.numberOfDays && !isNaN(billCreateDto.value.numberOfDays)) {
        const numberOfDays = billCreateDto.value.numberOfDays;
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + numberOfDays); // Add number of days to the current date

        // Format the date to YYYY-MM-DD format
        billCreateDto.value.expiryDate = currentDate.toISOString().split('T')[0]; // Set the expiry date
    }
}

function removeFromCart(index) {
    cart.value.splice(index, 1); // Removes the item at the specified index
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar>
                <template #start>
                    <Button label="New Bill" icon="pi pi-plus" @click="openNewCreateBill" />
                </template>
                <template #end>
                    <Button label="Export" icon="pi pi-upload" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable ref="dt" :value="bills" v-model:selection="selectedBills" dataKey="id" :paginator="true" :rows="10" :filters="filters" currentPageReportTemplate="Showing {first} to {last} of {totalRecords} bills" :loading="loading">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manage Bills</h4>
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </div>
                </template>

                <Column field="generatedDate" header="Generated Date" sortable></Column>
                <Column field="billDescription" header="Bill Description" sortable></Column>
                <Column field="billedAmount" header="Amount" sortable></Column>
                <Column field="payerName" header="Payer" sortable></Column>
                <Column field="expiryDate" header="Expiry  Date" sortable></Column>
                <Column field="billControlNumber" header="Control Number" sortable></Column>
                <Column field="billPayed" header="Bill Paid" sortable>
                    <template #body="slotProps">
                        <span
                            :class="{
                                'p-tag p-tag-success': slotProps.data.billPayed, // Green for true
                                'p-tag p-tag-danger': !slotProps.data.billPayed // Red for false
                            }"
                        >
                            {{ slotProps.data.billPayed ? 'PAID' : 'NOT PAID' }}
                        </span>
                    </template>
                </Column>
                <Column :exportable="false">
                    <template #body="slotProps">
                        <Button icon="pi pi-eye" @click="showBill(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="billDialog" header="Bill Details">
            <div>
                <label>Bill ID</label>
                <InputText v-model="bill.value.billId" />
                <label>Approved By</label>
                <InputText v-model="bill.value.approvedBy" />
                <label>Billed Amount</label>
                <InputNumber v-model="bill.value.billedAmount" mode="currency" currency="USD" />
                <label>Payer Name</label>
                <InputText v-model="bill.value.payerName" />
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveBill" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteBillDialog" header="Confirm">
            Are you sure you want to delete <b>{{ bill.value.billId }}</b
            >?
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="deleteBillDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteBill" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteBillsDialog" header="Confirm">
            Are you sure you want to delete the selected bills?
            <template #footer>
                <Button label="No" icon="pi pi-times" @click="deleteBillsDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteSelectedBills" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showBillPreview" id="modalInvoice" :modal="true" :style="{ width: '700px', padding: '0 30px' }">
            <!-- Added padding to the Dialog -->
            <div class="flex flex-col gap-6">
                <div id="modalInvoice">
                    <div>
                        <!-- Header Section -->
                        <div class="cert-heading text-center bb-dotted mb-4">
                            <div class="d-flex justify-content-between align-items-center">
                                <!-- Left Image -->
                                <img src="/coat_arms.png" alt="Logo Left" class="client-logo" />

                                <!-- Center Text -->
                                <div class="text-center mx-3 flex-grow-1">
                                    <h1 class="my-1"><strong>The United Republic of Tanzania</strong></h1>
                                    <h1><strong>Tax Revenue Appeals Tribunal (TRAT)</strong></h1>
                                    <h1 class="my-1"><strong>Government Bill</strong></h1>
                                </div>

                                <!-- Right Image -->
                                <img src="/TRAT.png" alt="Logo Right" class="client-logo2" />
                            </div>
                        </div>

                        <!-- Bill Information -->
                        <div class="mt-6">
                            <div class="grid sm:grid-cols-2 gap-4">
                                <div class="grid grid-cols-2 gap-y-2">
                                    <div><strong>Control Number:</strong></div>
                                    <div>:{{ bill.billControlNumber }}</div>
                                    <div><strong>Payment Reference:</strong></div>
                                    <div>:{{ bill.billReference }}</div>
                                    <div><strong>Service Provider Code:</strong></div>
                                    <div>:{{ 'SP535' }}</div>
                                    <div><strong>Payer Name:</strong></div>
                                    <div>:{{ bill.payerName }}</div>
                                    <div><strong>Payer Phone:</strong></div>
                                    <div>:{{ bill.payerPhone }}</div>
                                    <div><strong>Bill Description:</strong></div>
                                    <div>:{{ bill.billDescription }}</div>
                                </div>
                                <div class="flex items-center justify-end">
                                    <!-- QR Code -->
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?data={{qrData.value}}&size=130x130" alt="QR Code" />

                                </div>
                            </div>
                        </div>

                        <!-- Bill Items -->
                        <div class="mt-3">
                            <Divider />
                            <div v-for="(item, index) in bill.billItems" :key="index" class="grid align-items-center">
                                <div class="col-3"><strong>Item</strong> ({{ index + 1 }})</div>
                                <div class="col-5">{{ item.billItemDescription }}</div>
                                <div class="col-2 text-right">{{ item.billItemAmount | number }}</div>
                            </div>
                            <Divider />
                            <div class="grid align-items-center">
                                <div class="col-6"><strong>Total Billed Amount:</strong></div>
                                <div class="col-6 text-right">
                                    <strong>
                                        {{ countTotal(bill.billItems) | number }}
                                        ({{ 'TZS' }})
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <div class="mt-6">
                            <!-- Footer Details -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Details in a two-column layout -->
                                <div class="grid grid-cols-2 gap-y-2">
                                    <div><strong>Amount in Words:</strong></div>
                                    <div>: {{ convertToWords(bill.billedAmount) }}</div>

                                    <div><strong>Expires On:</strong></div>
                                    <div>: {{ formatDate(bill.expiryDate) }}</div>

                                    <div><strong>Date Issued:</strong></div>
                                    <div>: {{ formatDate(bill.generatedDate) }}</div>

                                    <div><strong>Collection Center:</strong></div>
                                    <div>: HEAD QUARTER</div>

                                    <div><strong>Printed By:</strong></div>
                                    <div>: {{ userName }}</div>

                                    <div><strong>Printed On:</strong></div>
                                    <div>: {{ getTodayDate() }}</div>

                                    <div><strong>Signature</strong></div>
                                    <div>: {{"...................."}}</div>
                                </div>

                                <!-- Placeholder or Additional Section -->
                                <div class="flex justify-center items-center">
                                    <!-- Add additional content here if needed -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Instructions -->
                    <div>
                        <div class="row">
                            <!-- Left Column: Jinsi ya Kulipa -->
                            <div class="col-half">
                                <h5><b>Jinsi ya Kulipa</b></h5>
                                <ol>
                                    <li>
                                        Kupitia Benki: Fika tawi lolote au wakala wa benki NMB, BOT. Namba ya kumbukumbu: <b>{{ bill?.billControlNumber }}</b>
                                        <ul>
                                            <li>Ingia kwenye menyu ya mtandao husika</li>
                                            <li>Chagua 4 (Lipa Bili)</li>
                                            <li>Chagua 5 (Malipo ya Serikali)</li>
                                            <li>
                                                Ingiza <b>{{ bill?.billControlNumber }}</b> kama namba ya kumbukumbu
                                            </li>
                                        </ul>
                                    </li>
                                    <li>Kupitia Mitandao ya Simu</li>
                                </ol>
                            </div>

                            <!-- Right Column: How to Pay -->
                            <div class="col-half">
                                <h5><b>How to Pay</b></h5>
                                <ol>
                                    <li>
                                        Via Bank: Visit any branch or bank agent of NMB, BOT. Reference Number: <b>{{ bill?.billControlNumber }}</b>
                                        <ul>
                                            <li>Enter to the respective USSD Menu of MNO</li>
                                            <li>Select 4 (Bill Payment)</li>
                                            <li>Select 5 (Government Payments)</li>
                                            <li>
                                                Enter <b>{{ bill?.billControlNumber }}</b> as reference number
                                            </li>
                                        </ul>
                                    </li>
                                    <li>Via Mobile Network Operators (MNOs)</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Print Button -->
                <div class="flex justify-content-end mt-4 no-print">
                    <Button label="Print" icon="pi pi-print" class="p-button-primary" @click="printBill" />
                </div>
            </div>
        </Dialog>

        <Dialog v-model:visible="billCreateDialog" :style="{ width: '700px' }" header="Create Bill" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Currency Section -->
                <!-- Payer Details Section -->
                <div>
                    <label for="payerName" class="block font-bold mb-3">Payer Name</label>
                    <InputText id="payerName" v-model.trim="billCreateDto.payerName" required :invalid="submitted && !billCreateDto.payerName" placeholder="Enter Payer Name" fluid />
                    <small v-if="submitted && !billCreateDto.payerName" class="text-red-500">Payer Name is required.</small>
                </div>

                <div>
                    <label for="email" class="block font-bold mb-3">Payer Email Address</label>
                    <InputText id="email" type="email" v-model.trim="billCreateDto.email" required :invalid="submitted && !billCreateDto.email" placeholder="Enter Payer Email Address" fluid />
                    <small v-if="submitted && !form.email" class="text-red-500">Email is required.</small>
                </div>

                <div>
                    <label for="phoneNumber" class="block font-bold mb-3">Mobile Number</label>
                    <InputText id="phoneNumber" v-model.trim="billCreateDto.phoneNumber" :invalid="submitted && !billCreateDto.phoneNumber" placeholder="Enter Mobile Number" fluid />
                    <small v-if="submitted && !billCreateDto.phoneNumber" class="text-red-500">Mobile Number is required.</small>
                </div>

                <div>
                    <label for="address" class="block font-bold mb-3">Payer Address</label>
                    <InputText id="address" v-model.trim="billCreateDto.address" required :invalid="submitted && !billCreateDto.address" placeholder="Enter Payer Address" fluid />
                    <small v-if="submitted && !billCreateDto.address" class="text-red-500">Address is required.</small>
                </div>

                <!-- Revenue Details Section -->
                <div class="flex gap-4 mb-3">
                    <!-- Item Group Dropdown -->
                    <div class="flex-1">
                        <label for="sourceName" class="block font-bold mb-3">Item Group</label>
                        <Dropdown
                            id="sourceName"
                            v-model="billCreateDto.sourceName"
                            :options="revenues"
                            optionLabel="revenueName"
                            optionValue="revenueName"
                            required
                            :invalid="submitted && !billCreateDto.sourceName"
                            placeholder="Select Item Group"
                            fluid
                            @change="updateBilledAmount"
                        />
                        <small v-if="submitted && !billCreateDto.sourceName" class="text-red-500">Item Group is required.</small>
                    </div>

                    <!-- Bill Amount Input (disabled and auto-filled based on source selection) -->
                    <div class="flex-1">
                        <label for="billedAmount" class="block font-bold mb-3">Bill Amount</label>
                        <InputText id="billedAmount" v-model="billCreateDto.billedAmount" type="number" required :invalid="submitted && !billCreateDto.billedAmount" placeholder="Enter Bill Amount" fluid :disabled="!billCreateDto.sourceName" />
                        <small v-if="submitted && !billCreateDto.billedAmount" class="text-red-500">Bill Amount is required.</small>
                    </div>

                    <!-- Add to Cart Button -->
                    <div class="flex items-end">
                        <Button label="Add to Cart" icon="pi pi-cart" @click="addToCart" class="p-button-primary mt-2" :disabled="!billCreateDto.sourceName || !billCreateDto.billedAmount" />
                    </div>
                </div>

                <div class="mt-4">
                    <label class="block font-bold mb-3">Cart</label>
                    <div v-if="cart.length">
                        <table class="table-auto w-full border-separate border-spacing-2">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="text-left p-2">Item Group</th>
                                    <th class="text-left p-2">Bill Amount</th>
                                    <th class="text-left p-2">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, index) in cart" :key="index" class="border-b">
                                    <td class="p-2">{{ item.sourceName }}</td>
                                    <td class="p-2">{{ item.billedAmount }}</td>
                                    <td class="p-2">
                                        <Button icon="pi pi-times" @click="removeFromCart(index)" class="p-button-text p-button-danger" aria-label="Remove item" label="Remove" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else>
                        <p>No items in the cart yet.</p>
                    </div>
                </div>

                <div>
                    <label for="billDescription" class="block font-bold mb-3">Bill Description</label>
                    <InputText id="billDescription" v-model.trim="billCreateDto.billDescription" required :invalid="submitted && !billCreateDto.billDescription" placeholder="Enter Bill Description" fluid />
                    <small v-if="submitted && !billCreateDto.billDescription" class="text-red-500">Description is required.</small>
                </div>

                <div>
                    <label for="type" class="block font-bold mb-3">Payment Type</label>
                    <Dropdown id="type" v-model="billCreateDto.type" :options="paymentType" optionLabel="name" optionValue="value" required :invalid="submitted && !billCreateDto.type" placeholder="Select Payment Type" fluid />
                    <small v-if="submitted && !billCreateDto.type" class="text-red-500">Payment Type is required.</small>
                </div>

                <div class="mt-4">
                    <!-- Number of Days Input -->
                    <div>
                        <label for="numberOfDays" class="block font-bold mb-3">Number of Days</label>
                        <InputText id="numberOfDays" v-model="billCreateDto.numberOfDays" type="number" required :invalid="submitted && !billCreateDto.numberOfDays" placeholder="Enter Number of Days" fluid @input="updateExpiryDate" />
                        <small v-if="submitted && !billCreateDto.numberOfDays" class="text-red-500">Number of Days is required.</small>
                    </div>

                    <!-- Expiry Date Input -->
                    <div>
                        <label for="expiryDate" class="block font-bold mb-3">Expiry Date</label>
                        <InputText id="expiryDate" v-model="billCreateDto.expiryDate" readonly required :invalid="submitted && !billCreateDto.expiryDate" placeholder="Select Expiry Date" fluid />
                        <small v-if="submitted && !billCreateDto.expiryDate" class="text-red-500">Expiry Date is required.</small>
                    </div>
                </div>
            </div>

            <!-- Dialog Footer -->
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save Bill" icon="pi pi-check" @click="saveBill" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.client-logo {
    width: 80px; /* Adjust as needed */
    height: auto; /* Maintain aspect ratio */
    display: block; /* Ensures no unexpected inline spacing */
}

.client-logo2 {
    width: 100px; /* Adjust as needed */
    height: auto; /* Maintain aspect ratio */
    display: block; /* Ensures no unexpected inline spacing */
}

.cert-heading .d-flex {
    display: flex; /* Flexbox ensures alignment */
    align-items: center; /* Vertically aligns all items */
}

.text-center {
    text-align: center; /* Center text horizontally */
}

.bb-dotted {
    border-bottom: 2px dotted #ccc; /* Optional dotted border */
}

.flex-grow-1 {
    flex-grow: 1; /* Ensures the text div takes up available space */
}

.cert-bottom {
    padding: 5px 20px !important;
}

.row {
    padding-top: 10px;
    display: flex;
    justify-content: space-between; /* Ensure that the columns are evenly spaced */
}

.col-half {
    width: 48%; /* Each column takes up 48% of the row width, leaving space in between */
}

h5 {
    font-size: 1.2rem;
    margin-bottom: 15px;
}

b {
    font-weight: bold;
}

@media print {
    #print {
        max-height: 100vh;
        max-width: 700px;
        overflow: hidden; /* Ensures content stays within bounds */
    }

    .modal-content {
        page-break-inside: avoid;
    }
}
</style>
