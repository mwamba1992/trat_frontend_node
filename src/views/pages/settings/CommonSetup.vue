<script setup>
import { onMounted, ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from '@primevue/core/api';
import { SetupService } from '@/service/SetupService';

const toast = useToast();
const dt = ref();

const setups = ref([]);
const setupDialog = ref(false);
const deleteDialog = ref(false);
const setup = ref({});
const submitted = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const setupTypes = ref([
    { label: 'Tax Type', value: 'taxType', icon: 'pi pi-percentage' },
    { label: 'Appeal Status', value: 'appealStatus', icon: 'pi pi-flag' },
    { label: 'Application Status', value: 'applicationStatus', icon: 'pi pi-file' },
    { label: 'Currency', value: 'currency', icon: 'pi pi-dollar' },
    { label: 'Applicant Type', value: 'applicantType', icon: 'pi pi-user' },
    { label: 'Application Type', value: 'applicationType', icon: 'pi pi-folder' },
    { label: 'Regions', value: 'region', icon: 'pi pi-map' },
    { label: 'GFS Codes', value: 'gfs', icon: 'pi pi-hashtag' }
]);

const currentSetupType = ref('taxType');

const currentTypeLabel = computed(() => {
    const t = setupTypes.value.find((s) => s.value === currentSetupType.value);
    return t ? t.label : '';
});

const totalItems = computed(() => setups.value.length);

onMounted(() => {
    fetchSetups(currentSetupType.value);
});

async function fetchSetups(type) {
    try {
        const data = await SetupService.getSetups(type);
        setups.value = data || [];
    } catch (error) {
        console.error('Error fetching setups:', error);
        setups.value = [];
    }
}

function selectType(type) {
    currentSetupType.value = type;
    fetchSetups(type);
}

function openNew() {
    setup.value = { name: '', description: '' };
    submitted.value = false;
    setupDialog.value = true;
}

function editSetup(rowData) {
    setup.value = { ...rowData };
    submitted.value = false;
    setupDialog.value = true;
}

function confirmDelete(rowData) {
    setup.value = { ...rowData };
    deleteDialog.value = true;
}

function saveSetup() {
    submitted.value = true;
    if (!setup.value.name?.trim()) return;

    const action = setup.value.id ? 'editSetupData' : 'postSetupData';

    SetupService[action](currentSetupType.value, setup.value)
        .then((response) => {
            if (response.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: response.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: setup.value.id ? 'Setup updated successfully' : 'Setup created successfully', life: 3000 });
                setupDialog.value = false;
                fetchSetups(currentSetupType.value);
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
        });
}

function deleteSetup() {
    SetupService.deleteSetup(currentSetupType.value, setup.value.id)
        .then(() => {
            toast.add({ severity: 'success', summary: 'Deleted', detail: 'Setup deleted successfully', life: 3000 });
            deleteDialog.value = false;
            fetchSetups(currentSetupType.value);
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete setup', life: 3000 });
        });
}

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <!-- Page Header -->
    <div class="flex justify-between items-start mb-6">
        <div>
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Common Setup</h1>
            <p class="text-muted-color mt-1">Manage system configuration types and their values</p>
        </div>
    </div>

    <!-- Type Selector -->
    <div class="card mb-4">
        <div class="font-semibold text-sm text-muted-color mb-3">SELECT CONFIGURATION TYPE</div>
        <div class="flex flex-wrap gap-2">
            <Button
                v-for="type in setupTypes"
                :key="type.value"
                :label="type.label"
                :icon="type.icon"
                :outlined="currentSetupType !== type.value"
                :class="currentSetupType === type.value ? 'p-button-success' : ''"
                size="small"
                @click="selectType(type.value)"
            />
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Total Items</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalItems }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                        <i class="pi pi-list text-purple-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">{{ currentTypeLabel }} entries</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Configuration Types</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ setupTypes.length }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                        <i class="pi pi-cog text-emerald-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Available categories</span>
            </div>
        </div>
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Current Type</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ currentTypeLabel }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #eff6ff, #dbeafe)">
                        <i class="pi pi-tag text-blue-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Currently selected</span>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="card">
        <!-- Action Bar -->
        <div class="flex justify-between items-center mb-4">
            <Button label="New Item" icon="pi pi-plus" class="p-button-success" @click="openNew" />
            <div class="flex gap-2">
                <IconField>
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search items..." />
                </IconField>
                <Button label="Export" icon="pi pi-upload" severity="secondary" text @click="exportCSV" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="setups"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
            stripedRows
        >
            <template #empty>
                <div class="flex flex-col items-center justify-center py-8">
                    <i class="pi pi-inbox text-4xl text-muted-color mb-3"></i>
                    <span class="text-muted-color">No items found for {{ currentTypeLabel }}</span>
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
                        <div class="flex items-center justify-center rounded-border" style="width: 2rem; height: 2rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5)">
                            <i class="pi pi-tag text-emerald-600 text-xs"></i>
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.name }}</span>
                    </div>
                </template>
            </Column>

            <Column field="description" header="Description" sortable style="min-width: 20rem">
                <template #body="slotProps">
                    <span class="text-muted-color">{{ slotProps.data.description || '—' }}</span>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" label="Edit" text rounded class="p-button-success" @click="editSetup(slotProps.data)" />
                        <Button icon="pi pi-trash" label="Delete" text rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="setupDialog" :style="{ width: '500px' }" :header="setup.id ? 'Edit Setup Item' : 'New Setup Item'" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="flex items-center gap-3 pb-3" style="border-left: 4px solid #10b981; padding-left: 12px">
                <div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ currentTypeLabel }}</div>
                    <div class="text-muted-color text-sm">{{ setup.id ? 'Update item details' : 'Add a new configuration item' }}</div>
                </div>
            </div>

            <div>
                <label class="block font-medium mb-2"><i class="pi pi-tag mr-2 text-muted-color"></i>Name <span class="text-red-500">*</span></label>
                <InputText v-model.trim="setup.name" placeholder="Enter name" fluid autofocus :invalid="submitted && !setup.name" />
                <small v-if="submitted && !setup.name" class="text-red-500">Name is required.</small>
            </div>

            <div>
                <label class="block font-medium mb-2"><i class="pi pi-align-left mr-2 text-muted-color"></i>Description</label>
                <InputText v-model.trim="setup.description" placeholder="Enter description (optional)" fluid />
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="setupDialog = false" />
            <Button :label="setup.id ? 'Update' : 'Save'" icon="pi pi-check" class="p-button-success" @click="saveSetup" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '420px' }" header="Confirm Deletion" :modal="true">
        <div class="flex flex-col items-center gap-4 py-4">
            <div class="flex items-center justify-center rounded-full" style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #fef2f2, #fecaca)">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <div class="text-center">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-1">Delete "{{ setup.name }}"?</div>
                <div class="text-muted-color text-sm">This action cannot be undone.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSetup" />
        </template>
    </Dialog>
</template>
