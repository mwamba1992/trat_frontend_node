<script setup>
import { PaymentService } from '@/service/PaymentService.js';
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import QrcodeVue from 'qrcode.vue';

onMounted(() => {

    userName.value = localStorage.getItem('userName');
    PaymentService.getPayments().then((data) => {
        payments.value = data;
    });
});


const  userName = ref();
const payments = ref([]);
const selectedPayments = ref(null);
const showPaymentPreview = ref(false);
const payment = ref({});

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

function showPayment(py) {
    console.log(py)
    payment.value = py;
    showPaymentPreview.value = true;
}


function countTotal(items) {
    return items.reduce((total, item) => total + item.billItemAmount, 0);
}

function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
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

function formatDate2(dateString) {
    const date = new Date(dateString);
    // Format: YYYY-MM-DD HH:mm:ss
    return date.toISOString().replace('T', ' ').substring(0, 19);
}

</script>

<template>
    <DataTable ref="dt" :value="payments" v-model:selection="selectedPayments" dataKey="id" :paginator="true" :rows="10" :filters="filters" currentPageReportTemplate="Showing {first} to {last} of {totalRecords} bills">
        <template #header>
            <div class="flex flex-wrap gap-2 items-center justify-between">
                <h4 class="m-0">Payments</h4>
                <InputText v-model="filters['global'].value" placeholder="Search..." />
            </div>
        </template>

        <Column field="paymentDate" header="Payment Date" sortable>
            <template #body="slotProps">
                <span>
                    {{ formatDate2(slotProps.data.paymentDate) }}
                </span>
            </template>
        </Column>
        <Column field="payerName" header="Payer Name" sortable></Column>
        <Column field="controlNumber" header="Bill Control Number" sortable></Column>
        <Column field="paidAmount" header="Amount Paid" sortable></Column>
        <Column field="gepgReference" header="Gepg Receipt" sortable></Column>
        <Column field="transactionId" header="Bank Receipt" sortable></Column>
        <Column :exportable="false">
            <template #body="slotProps">
                <Button icon="pi pi-eye" @click="showPayment(slotProps.data)" />
            </template>
        </Column>
    </DataTable>


    <Dialog v-model:visible="showPaymentPreview" id="modalInvoice" :modal="true" :style="{ width: '700px', padding: '0 30px' }">
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
                                <h1 class="my-1"><strong>Exchequer Receipt</strong></h1>
                            </div>

                            <!-- Right Image -->
                            <img src="/TRAT.png" alt="Logo Right" class="client-logo2" />
                        </div>
                    </div>


                    <div class="mt-6">
                        <div class="grid sm:grid-cols-2 gap-4">
                            <div class="grid grid-cols-2 gap-y-2">
                                <div><strong>Receipt Number:</strong></div>
                                <div>:{{ payment.gepgReference }}</div>
                                <div><strong>Received From:</strong></div>
                                <div>:{{ payment.payerName }}</div>
                                <div><strong>Amount:</strong></div>
                                <div>:{{ payment.paidAmount + " TZS"}}</div>
                                <div><strong>Amount In Words:</strong></div>
                                <div>:{{ convertToWords(payment.paidAmount)}}</div>
                                <div><strong>OutStanding Amount:</strong></div>
                                <div>:{{ "0.00 TZS" }}</div>

                                <div><strong>InRespect Of:</strong></div>
                            </div>
                        </div>
                    </div>

                    <!-- Bill Items -->
                    <div class="mt-3">
                        <Divider />
                        <div v-for="(item, index) in payment.bill.billItems" :key="index" class="grid align-items-center">
                            <div class="col-3"><strong>Item</strong> ({{ index + 1 }})</div>
                            <div class="col-5">{{ item.billItemDescription }}</div>
                            <div class="col-2 text-right">{{ item.billItemAmount | number }}</div>
                        </div>
                        <Divider />
                        <div class="grid align-items-center">
                            <div class="col-6"><strong>Total Billed Amount:</strong></div>
                            <div class="col-6 text-right">
                                <strong>
                                    {{ countTotal(payment.bill.billItems) | number }}
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
                                <div><strong>Bill Reference:</strong></div>
                                <div>: {{ payment.bill.billReference }}</div>


                                <div><strong>Control Number:</strong></div>
                                <div>: {{ payment.controlNumber }}</div>

                                <div><strong>Payment Date:</strong></div>
                                <div>: {{ formatDate(payment.paymentDate) }}</div>

                                <div><strong>Printed By:</strong></div>
                                <div>: {{ userName}}</div>

                                <div><strong>Printed On:</strong></div>
                                <div>: {{ getTodayDate() }}</div>

                                <div><strong>Signature</strong></div>
                                <div>: {{ '....................' }}</div>
                            </div>


                        </div>
                    </div>
                </div>
            </div>
        </div>
        <br>
        <br>
        <br>
        <br>
        <br>
        <br>
        <br>
        <br>
        <!-- Print Button -->
        <div class="flex justify-content-end mt-4 no-print">
            <Button label="Print" icon="pi pi-print" class="p-button-primary" @click="printBill" />
        </div>
    </Dialog>
</template>


<style scoped>
.client-logo {
    width: 80px; /* Adjust as needed */
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

.client-logo2 {
    width: 100px; /* Adjust as needed */
    height: auto; /* Maintain aspect ratio */
    display: block; /* Ensures no unexpected inline spacing */
}
</style>
