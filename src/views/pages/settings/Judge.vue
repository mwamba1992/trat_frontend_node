<script setup>
import { JudgeService } from '@/service/JudgeService';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, computed } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';

const toast = useToast();
const dt = ref();

const judges = ref([]);
const judge = ref({});
const submitted = ref(false);
const judgeDialog = ref(false);
const deleteDialog = ref(false);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const totalJudges = computed(() => judges.value.length);

onMounted(() => {
    JudgeService.getJudges().then((data) => (judges.value = data || []));
});

function openNew() {
    judge.value = { name: '', email: '', phone: '' };
    submitted.value = false;
    judgeDialog.value = true;
}

function editJudge(jud) {
    judge.value = { ...jud };
    submitted.value = false;
    judgeDialog.value = true;
}

function confirmDelete(jud) {
    judge.value = { ...jud };
    deleteDialog.value = true;
}

function saveJudge() {
    submitted.value = true;
    if (!judge.value.name?.trim() || !judge.value.email?.trim() || !judge.value.phone?.trim()) return;

    const action = judge.value.id ? 'editJudgeData' : 'postJudgeData';

    JudgeService[action](judge.value)
        .then((data) => {
            if (data.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Success', detail: judge.value.id ? 'Judge updated successfully' : 'Judge created successfully', life: 3000 });
                judgeDialog.value = false;
                JudgeService.getJudges().then((data) => (judges.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred. Please try again later.', life: 3000 });
        });
}

function deleteJudge() {
    JudgeService.deleteJudge(judge.value.id)
        .then((data) => {
            if (data?.error) {
                toast.add({ severity: 'error', summary: 'Error', detail: data.error, life: 3000 });
            } else {
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'Judge deleted successfully', life: 3000 });
                deleteDialog.value = false;
                JudgeService.getJudges().then((data) => (judges.value = data || []));
            }
        })
        .catch(() => {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete judge', life: 3000 });
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
            <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 m-0">Judge Management</h1>
            <p class="text-muted-color mt-1">Manage tribunal judges and their contact information</p>
        </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-12 gap-4 mb-4">
        <div class="col-span-12 md:col-span-4">
            <div class="card mb-0">
                <div class="flex justify-between items-center">
                    <div>
                        <span class="block text-muted-color font-medium mb-1">Total Judges</span>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-2xl">{{ totalJudges }}</div>
                    </div>
                    <div class="flex items-center justify-center rounded-border" style="width: 2.5rem; height: 2.5rem; background: linear-gradient(135deg, #ede9fe, #ddd6fe)">
                        <i class="pi pi-id-card text-purple-500"></i>
                    </div>
                </div>
                <span class="text-muted-color text-sm mt-2 block">Registered judges</span>
            </div>
        </div>
    </div>

    <!-- Data Table -->
    <div class="card">
        <!-- Action Bar -->
        <div class="flex justify-between items-center mb-4">
            <Button label="New Judge" icon="pi pi-plus" class="p-button-success" @click="openNew" />
            <div class="flex gap-2">
                <IconField>
                    <InputIcon><i class="pi pi-search" /></InputIcon>
                    <InputText v-model="filters['global'].value" placeholder="Search judges..." />
                </IconField>
                <Button label="Export" icon="pi pi-upload" severity="secondary" text @click="exportCSV" />
            </div>
        </div>

        <DataTable
            ref="dt"
            :value="judges"
            dataKey="id"
            :paginator="true"
            :rows="10"
            :filters="filters"
            :rowsPerPageOptions="[5, 10, 25]"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} judges"
            stripedRows
        >
            <template #empty>
                <div class="flex flex-col items-center justify-center py-8">
                    <i class="pi pi-id-card text-4xl text-muted-color mb-3"></i>
                    <span class="text-muted-color">No judges found</span>
                </div>
            </template>

            <Column header="No" style="width: 4rem">
                <template #body="slotProps">
                    <span class="text-muted-color font-medium">{{ slotProps.index + 1 }}</span>
                </template>
            </Column>

            <Column field="name" header="Judge Name" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center rounded-full font-bold text-xs text-white" style="width: 2.2rem; height: 2.2rem; background: linear-gradient(135deg, #10b981, #059669)">
                            {{ getInitials(slotProps.data.name) }}
                        </div>
                        <span class="font-medium text-surface-900 dark:text-surface-0">{{ slotProps.data.name }}</span>
                    </div>
                </template>
            </Column>

            <Column field="email" header="Email" sortable style="min-width: 16rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-envelope text-muted-color text-xs"></i>
                        <span>{{ slotProps.data.email || '—' }}</span>
                    </div>
                </template>
            </Column>

            <Column field="phone" header="Phone" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-phone text-muted-color text-xs"></i>
                        <span>{{ slotProps.data.phone || '—' }}</span>
                    </div>
                </template>
            </Column>

            <Column header="Actions" style="min-width: 10rem">
                <template #body="slotProps">
                    <div class="flex gap-2">
                        <Button icon="pi pi-pencil" label="Edit" text rounded class="p-button-success" @click="editJudge(slotProps.data)" />
                        <Button icon="pi pi-trash" label="Delete" text rounded severity="danger" @click="confirmDelete(slotProps.data)" />
                    </div>
                </template>
            </Column>
        </DataTable>
    </div>

    <!-- Create/Edit Judge Dialog -->
    <Dialog v-model:visible="judgeDialog" :style="{ width: '550px' }" :header="judge.id ? 'Edit Judge' : 'New Judge'" :modal="true">
        <div class="flex flex-col gap-5">
            <!-- Sub-header -->
            <div class="flex items-center gap-3 pb-3" style="border-left: 4px solid #10b981; padding-left: 12px">
                <div>
                    <div class="font-semibold text-surface-900 dark:text-surface-0">{{ judge.id ? 'Update Judge Details' : 'Register New Judge' }}</div>
                    <div class="text-muted-color text-sm">{{ judge.id ? 'Modify judge information' : 'Fill in the details to register a new judge' }}</div>
                </div>
            </div>

            <!-- Name -->
            <div>
                <label class="block font-medium mb-2"><i class="pi pi-user mr-2 text-muted-color"></i>Full Name <span class="text-red-500">*</span></label>
                <InputText v-model.trim="judge.name" placeholder="Enter judge's full name" fluid autofocus :invalid="submitted && !judge.name" />
                <small v-if="submitted && !judge.name" class="text-red-500">Name is required.</small>
            </div>

            <!-- Email + Phone -->
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-envelope mr-2 text-muted-color"></i>Email <span class="text-red-500">*</span></label>
                    <InputText type="email" v-model.trim="judge.email" placeholder="Enter email" fluid :invalid="submitted && !judge.email" />
                    <small v-if="submitted && !judge.email" class="text-red-500">Email is required.</small>
                </div>
                <div class="col-span-6">
                    <label class="block font-medium mb-2"><i class="pi pi-phone mr-2 text-muted-color"></i>Phone <span class="text-red-500">*</span></label>
                    <InputText v-model.trim="judge.phone" placeholder="Enter phone number" fluid :invalid="submitted && !judge.phone" />
                    <small v-if="submitted && !judge.phone" class="text-red-500">Phone is required.</small>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="judgeDialog = false" />
            <Button :label="judge.id ? 'Update' : 'Save'" icon="pi pi-check" class="p-button-success" @click="saveJudge" />
        </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:visible="deleteDialog" :style="{ width: '420px' }" header="Confirm Deletion" :modal="true">
        <div class="flex flex-col items-center gap-4 py-4">
            <div class="flex items-center justify-center rounded-full" style="width: 4rem; height: 4rem; background: linear-gradient(135deg, #fef2f2, #fecaca)">
                <i class="pi pi-exclamation-triangle text-red-500 text-2xl"></i>
            </div>
            <div class="text-center">
                <div class="font-semibold text-lg text-surface-900 dark:text-surface-0 mb-1">Delete judge "{{ judge.name }}"?</div>
                <div class="text-muted-color text-sm">This action cannot be undone.</div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" text @click="deleteDialog = false" />
            <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteJudge" />
        </template>
    </Dialog>
</template>
