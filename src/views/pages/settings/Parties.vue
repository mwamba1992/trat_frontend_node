<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { PartyService } from '@/service/PartyService';
import { SetupService } from '@/service/SetupService';
import { FilterMatchMode } from '@primevue/core/api';
import InputMask from 'primevue/inputmask';

const commonSetupOptions = ref([]);
// Data references
const parties = ref([]);
const selectedParties = ref(null);
const partyDialog = ref(false);
const deletePartyDialog = ref(false);
ref(false);
const party = ref({});
const submitted = ref(false);
const toast = useToast();

// Filters for DataTable search
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Fetch CommonSetup options on mounted
onMounted(async () => {
    fetchParties();
    try {
        const setups = await SetupService.getSetups('applicantType');
        commonSetupOptions.value = setups.map((setup) => ({
            id: setup.id,
            name: setup.name // Assuming each `CommonSetup` has `id` and `name`
        }));
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch setup options', life: 3000 });
    }
});

function fetchParties() {
    PartyService.getParties().then((data) => {
        parties.value = data.filter((party) => Object.keys(party).length > 0);
    });
}

// Open a dialog to create a new party
function openNew() {
    party.value = {};
    submitted.value = false;
    partyDialog.value = true;
}

// Open a dialog to edit an existing party
function editParty(selectedParty) {
    party.value = { ...selectedParty };
    party.value.type = selectedParty.type.id;
    partyDialog.value = true;
}

// Save the current party
function saveParty() {
    submitted.value = true;
    if (party.value.name && party.value.phone_number) {
        if (party.value.id) {
            PartyService.updateParty(party.value.id, party.value).then(() => {
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Party Updated', life: 3000 });
                fetchParties();
            });
        } else {
            PartyService.createParty(party.value).then(() => {
                toast.add({ severity: 'success', summary: 'Successful', detail: 'Party Created', life: 3000 });
                fetchParties();
            });
        }
        partyDialog.value = false;
    }
}

const deleteJudgesDialog = ref(false);

// Delete a single party
function confirmDeleteParty(partyToDelete) {

    console.log("deleting......." + partyToDelete);
    party.value = partyToDelete;
    deletePartyDialog.value = true;
}

function deleteParty() {
    PartyService.deleteParty(party.value.id).then(() => {
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Party Deleted', life: 3000 });
        fetchParties();
    });
    deletePartyDialog.value = false;
}
</script>

<template>
    <div>
        <Toolbar class="mb-4">
            <template #start>
                <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
            </template>
        </Toolbar>

        <DataTable
            :value="parties"
            v-model:selection="selectedParties"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            filterDisplay="row"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} parties"
            :responsiveLayout="'scroll'"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">Manage Parties</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                    </IconField>
                </div>
            </template>
            <Column selectionMode="multiple" style="width: 3rem" />
            <Column field="name" header="Name" sortable />
            <Column field="phone_number" header="Phone Number" sortable />
            <Column field="email_address" header="Email Address" sortable />
            <Column field="tin_number" header="TIN Number" sortable />
            <Column field="vat_number" header="VAT Number" sortable />
            <Column field="type.name" header="Type" sortable />
            <!-- Action Column -->
            <Column header="Actions" :exportable="false" style="min-width: 10rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editParty(slotProps.data)" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteParty(slotProps.data)" />
                </template>
            </Column>
        </DataTable>

        <Dialog header="Party Details" :style="{ width: '700px' }" v-model:visible="partyDialog">
            <div class="field">
                <label for="name">Name</label>
                <InputText id="name" v-model="party.name" class="w-full" required autofocus />
            </div>
            <div class="field">
                <label for="phone_number">Phone Number</label>
                <InputMask mask="9999999999" placeholder="0716208468" id="phone_number" v-model="party.phone_number" class="w-full" required />
            </div>
            <div class="field">
                <label for="nature_of_business">Nature of Business</label>
                <InputText id="nature_of_business" v-model="party.nature_of_business" class="w-full" />
            </div>
            <div class="field">
                <label for="email_address">Email Address</label>
                <InputText id="email_address" v-model="party.email_address" class="w-full" />
            </div>
            <div class="field">
                <label for="tin_number">TIN Number</label>
                <InputMask mask="999-999-999" placeholder="122-122-122" id="tin_number" v-model="party.tin_number" class="w-full" />
            </div>
            <div class="field">
                <label for="income_tax_file_number">Income Tax File Number</label>
                <InputText id="income_tax_file_number" v-model="party.income_tax_file_number" class="w-full" />
            </div>
            <div class="grid grid-cols-12 gap-4">
                <!-- VAT Number -->
                <div class="col-span-6">
                    <label for="vat_number" class="block font-bold mb-3">VAT Number</label>
                    <InputText id="vat_number" v-model="party.vat_number" class="w-full" />
                </div>

                <!-- Type (CommonSetup Reference) -->
                <div class="col-span-6">
                    <label for="type" class="block font-bold mb-3">Type</label>
                    <Select id="type" v-model="party.type" :options="commonSetupOptions" optionValue="id" optionLabel="name" placeholder="Select Type" required class="w-full" />
                    <small v-if="submitted && !party.type" class="text-red-500">Type is required.</small>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" @click="partyDialog = false" />
                <Button label="Save" @click="saveParty" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deletePartyDialog" header="Confirm Deletion" :modal="true" :style="{ width: '400px' }">
            <p>Are you sure you want to delete the selected party {{ party.name }}</p>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="deleteJudgesDialog = false" />
                <Button label="Delete" icon="pi pi-check" severity="danger" @click="deleteParty" />
            </template>
        </Dialog>


    </div>
</template>

<style>
.field {
    margin-bottom: 1rem;
}
</style>
