<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { PartyService } from '@/service/PartyService';
import { SetupService } from '@/service/SetupService';
import { FilterMatchMode } from '@primevue/core/api';
import InputMask from 'primevue/inputmask';

const toast = useToast();
const dt = ref();

const parties = ref([]);
const party = ref({});
const commonSetupOptions = ref([]);
const submitted = ref(false);
const partyDialog = ref(false);
const deleteDialog = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const totalParties = computed(() => parties.value.length);

onMounted(async () => {
    fetchParties();
    try {
        const setups = await SetupService.getSetups('applicantType');
        commonSetupOptions.value = (setups || []).map((setup) => ({
            id: setup.id,
            name: setup.name
        }));
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch setup options', life: 3000 });
    }
});

function fetchParties() {
    PartyService.getParties().then((data) => {
        parties.value = (data || []).filter((p) => Object.keys(p).length > 0);
    });
}

function openNew() {
    party.value = { name: '', phone_number: '', email_address: '', nature_of_business: '', tin_number: '', income_tax_file_number: '', vat_number: '', type: null };
    submitted.value = false;
    partyDialog.value = true;
}

function editParty(selectedParty) {
    party.value = { ...selectedParty };
    party.value.type = selectedParty.type?.id || null;
    submitted.value = false;
    partyDialog.value = true;
}

function confirmDelete(partyToDelete) {
    party.value = { ...partyToDelete };
    deleteDialog.value = true;
}

function saveParty() {
    submitted.value = true;
    if (!party.value.name?.trim() || !party.value.phone_number?.trim()) return;

    const action = party.value.id
        ? PartyService.updateParty(party.value.id, party.value)
        : PartyService.createParty(party.value);

    action
        .then((data) => {
            if (data?.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: party.value.id ? 'Party updated successfully' : 'Party created successfully', life: 3000 });
                partyDialog.value = false;
                fetchParties();
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
        });
}

function deleteParty() {
    PartyService.deleteParty(party.value.id)
        .then(() => {
            toast.add({ severity: 'success', summary: 'Deleted', detail: 'Party deleted successfully', life: 3000 });
            deleteDialog.value = false;
            fetchParties();
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete party', life: 3000 });
        });
}

function exportCSV() {
    dt.value.exportCSV();
}

function getInitials(name) {
    if (!name) return '?';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Parties Management</h1>
            <p class="text-muted-color mt-1">Manage applicants, respondents and other party records</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Total Parties</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalParties }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                        <i class="pi pi-users text-purple-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Registered parties</span>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="card">
        <!-- Action Bar -->
        <div class="flex justify-between items-center mb-4">
            <Button label="New Party" icon="pi pi-plus" class="p-button-success" @click="openNew" />
            <div class="flex gap-2">
                <IconField>
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search parties..." />
                </IconField>
                <Button label="Export" icon="pi pi-upload" severity="secondary" text @click="exportCSV" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="parties"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} parties"
            stripedRows
        >
            <template #empty>
                <div class="flex flex-col items-center justify-center py-8">
                    <i class="pi pi-users text-4xl text-muted-color mb-3"></i>
                    <span class="text-muted-color">No parties found</span>
                </div>
            </template>

            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    <span class="text-muted-color font-medium">{{ slotProps.index + 1 }}</span>
                </template>
            </Column>

            <Column field="name" header="Name" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full font-bold text-xs text-white" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #10b981, #059669)">
                            {{ getInitials(slotProps.data.name) }}
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.name }}</span>
                    </div>
                </template>
            </Column>

            <Column field="phone_number" header="Phone" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-phone text-muted-color text-xs"></i>
                        <span>{{ slotProps.data.phone_number || '—' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="email_address" header="Email" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-envelope text-muted-color text-xs"></i>
                        <span>{{ slotProps.data.email_address || '—' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="tin_number" header="TIN" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <span class="text-muted-color">{{ slotProps.data.tin_number || '—' }}</span>
                </template>
            </Column>

            <Column field="vat_number" header="VAT" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    <span class="text-muted-color">{{ slotProps.data.vat_number || '—' }}</span>
                </template>
            </Column>

            <Column field="type.name" header="Type" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <Tag v-if="slotProps.data.type?.name" :value="slotProps.data.type.name" severity="success" rounded />
                    <span v-else class="text-muted-color">—</span>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" label="Edit" text rounded class="p-button-success" @click="editParty(slotProps.data)" />
                        <Button icon="pi pi-trash" label="Delete" text rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Create/Edit Party Dialog -->
    <Dialog v-model:visible="partyDialog" :style="{ width: '700px' }" :header="party.id ? 'Edit Party' : 'New Party'" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="flex items-center gap-3 pb-3" style="border-left: 4px solid #10b981; padding-left: 12px">
                <div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ party.id ? 'Update Party Details' : 'Register New Party' }}</div>
                    <div class="text-muted-color text-sm">{{ party.id ? 'Modify party information' : 'Fill in the details to register a new party' }}</div>
                </div>
            </div>

            <!-- Name + Phone -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-user mr-2 text-muted-color"></i>Name <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="party.name" placeholder="Enter party name" fluid autofocus :invalid="submitted && !party.name" />
                    <small v-if="submitted && !party.name" class="text-red-500">Name is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-phone mr-2 text-muted-color"></i>Phone Number <span class="text-red-500">*</span></label>
                    <InputMask mask="9999999999" v-model="party.phone_number" placeholder="0716208468" fluid :invalid="submitted && !party.phone_number" />
                    <small v-if="submitted && !party.phone_number" class="text-red-500">Phone number is required.</small>
                </div>
            </div>

            <!-- Email + Nature of Business -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-envelope mr-2 text-muted-color"></i>Email Address</label>
                    <InputText v-model.trim="party.email_address" placeholder="Enter email" fluid />
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-briefcase mr-2 text-muted-color"></i>Nature of Business</label>
                    <InputText v-model.trim="party.nature_of_business" placeholder="Enter nature of business" fluid />
                </div>
            </div>

            <!-- TIN + Income Tax File -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-hashtag mr-2 text-muted-color"></i>TIN Number</label>
                    <InputMask mask="999-999-999" v-model="party.tin_number" placeholder="122-122-122" fluid />
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-file mr-2 text-muted-color"></i>Income Tax File Number</label>
                    <InputText v-model.trim="party.income_tax_file_number" placeholder="Enter file number" fluid />
                </div>
            </div>

            <!-- VAT + Type -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-percentage mr-2 text-muted-color"></i>VAT Number</label>
                    <InputText v-model.trim="party.vat_number" placeholder="Enter VAT number" fluid />
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-tag mr-2 text-muted-color"></i>Type</label>
                    <Select v-model="party.type" :options="commonSetupOptions" optionValue="id" optionLabel="name" placeholder="Select Type" fluid />
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="partyDialog = false" />
            <Button :label="party.id ? 'Update' : 'Save'" icon="pi pi-check" class="p-button-success" @click="saveParty" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '420px' }" header="Confirm Deletion" :modal="true">
        <div class="flex flex-col items-center gap-4 py-4">
            <div class="flex items-center justify-center rounded-full" style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #fef2f2, #fecaca)">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <div class="text-center">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-1">Delete party "{{ party.name }}"?</div>
                <div class="text-muted-color text-sm">This action cannot be undone.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteParty" />
        </template>
    </Dialog>
</template>
