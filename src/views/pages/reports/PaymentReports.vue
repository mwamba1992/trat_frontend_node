<script setup>
import { ref } from 'vue';
import { PaymentService } from '@/service/PaymentService';
import * as XLSX from 'xlsx';
import { useToast } from 'primevue/usetoast';

function openNew() {
    payment.value = {};
    submitted.value = false;
    paymentSearchDialog.value = true;
}

function exportCSV() {
    const formattedData = payments.value.map((payment) => {
        return {
            "Control Number": payment.controlNumber,
            "Payment Date": payment.paymentDate,
            "Gepg Receipt": payment.gepgReference,
            "Transacton Id": payment.transactionId,
            "Amount Paid": payment.paidAmount
        };
    });

    // Create a new workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");

    // Generate the Excel file and trigger download
    XLSX.writeFile(wb, "Payment _Report.xlsx");
}

const payment = ref();
const payments = ref([]);
const selectedPayments = ref([]);
const paymentSearchDialog = ref(false);
const submitted = ref(false);

const toast = useToast();

function searchPayments() {
    console.log('Filtering appeals:', payment.value);
    submitted.value = true;
    PaymentService.filterPayments(payment.value)
        .then((data) => {
            payments.value = data;

            if (payments.value.length === 0) {
                toast.add({ severity: 'info', summary: 'No Records', detail: 'No records found', life: 3000 });
            } else {
                paymentSearchDialog.value = false;
                toast.add({ severity: 'success', summary: 'Success', detail: 'Payments fetched successfully', life: 3000 });
                console.log('Filtered appeals:', payments.value);
            }

            paymentSearchDialog.value = false;
        })
        .catch((error) => {
            console.error('Error searching payments:', error);
        });
}

const applicationTypes = ref([
    { label: 'APPEAL', value: 'APPEAL' },
    { label: 'NOTICE', value: 'NOTICE' },
    { label: 'APPLICATION', value: 'APPLICATION' }
]);


function formatDate2(dateString) {
    const date = new Date(dateString);
    // Format: YYYY-MM-DD HH:mm:ss
    return date.toISOString().replace('T', ' ').substring(0, 19);
}
</script>

<template>
    <Toolbar class="mb-6">
        <template #start>
            <Button label="Filter Payment Reports" icon="pi pi-plus" class="mr-2" @click="openNew" />
        </template>

        <template #end>
            <Button label="Export Pdf" icon="pi pi-file-pdf" severity="secondary" @click="exportCSV" />
            <Button label="Export Excel" icon="pi pi-file-excel" severity="secondary" @click="exportCSV" />
        </template>
    </Toolbar>

    <DataTable
        ref="dt"
        v-model:selection="selectedPayments"
        :value="payments"
        dataKey="id"
        :paginator="true"
        :rows="10"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[5, 10, 25]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} appeals"
    >
        <Column field="paymentDate" header="Payment Date" sortable>
            <template #body="slotProps">
                <span>
                    {{ formatDate2(slotProps.data.paymentDate) }}
                </span>
            </template>
        </Column>
        <Column field="payerName" header="Payer Name" sortable></Column>
        <Column field="controlNumber" header="Bill Control Number" sortable></Column>
        <Column field="gepgReference" header="Gepg Receipt" sortable></Column>
        <Column field="transactionId" header="Bank Receipt" sortable></Column>
    </DataTable>

    <Dialog v-model:visible="paymentSearchDialog" :style="{ width: '700px' }" header="Filter Payments" :modal="true">
        <div class="flex flex-col gap-6">
            <div>
                <label for="dateOfFillingFrom" class="block font-bold mb-3">Payment Date</label>
                <div class="flex gap-4">
                    <div class="flex-1">
                        <label for="dateOfFillingFrom" class="block mb-2">From</label>
                        <DatePicker id="dateOfFillingFrom" v-model.trim="payment.dateOfFillingFrom" required="true" type="date" fluid dateFormat="yy-mm-dd" />
                    </div>
                    <div class="flex-1">
                        <label for="dateOfFillingTo" class="block mb-2">To</label>
                        <DatePicker id="dateOfFillingTo" v-model.trim="payment.dateOfFillingTo" required="true" type="date" fluid dateFormat="yy-mm-dd" />
                    </div>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-6">
            <div>
                <label for="type" class="block font-bold mb-3">Bill Type</label>
                <div class="flex gap-4">
                    <div class="flex-1">
                        <label for="type" class="block mb-2">Type</label>
                        <Select id="type" v-model="payment.type" :options="applicationTypes" optionValue="value" optionLabel="label" placeholder="Select Application Type" required class="w-full" />
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="paymentSearchDialog.value = false" />
            <Button label="Save" icon="pi pi-check" @click="searchPayments" />
        </template>
    </Dialog>
</template>
