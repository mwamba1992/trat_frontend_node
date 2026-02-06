<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const permissionMapping = {
    'Manage Bill': ['Bill'],
    'Manage Settings': ['Common Setup', 'Judge', 'Parties', 'Fees', 'User Management'],
    'Manage Payment': ['Payment'],
    'Manage Notice': ['Notices'],
    'Manage Statement': ['Statements'],
    'Manage Application': ['Applications'],
    'Report Manager': ['Appeal Reports', 'Payment Reports']
};

const model = ref([
    {
        label: 'Home',
        items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard' }]
    },
    {
        label: 'Appeals',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
            {
                label: 'Notices',
                icon: 'pi pi-fw pi-book',
                to: '/pages/notices'
            },
            {
                label: 'Statements',
                icon: 'pi pi-fw pi-envelope',
                to: '/pages/statements'
            },
            {
                label: 'Applications',
                icon: 'pi pi-fw pi-briefcase',
                to: '/pages/applications'
            },
            {
                label: 'Hearings',
                icon: 'pi pi-fw pi-calendar-times',
                to: '/pages/summons'
            },
            {
                label: 'Notice Court of Appeal',
                icon: 'pi pi-fw pi-calendar-times',
                to: '/pages/high'
            }
        ]
    },
    {
        label: 'Payments',
        items: [
            {
                label: 'Bill',
                icon: 'pi pi-fw pi-bookmark',
                to: '/bill'
            },
            {
                label: 'Payment',
                icon: 'pi pi-fw pi-dollar',
                to: '/payment'
            }
        ]
    },
    {
        label: 'SETTINGS',
        items: [
            {
                label: 'Common Settings',
                icon: 'pi pi-fw pi-cog',
                items: [
                    {
                        label: 'Common Setup',
                        icon: 'pi pi-fw pi-cog',
                        to: '/common-setup'
                    },
                    {
                        label: 'Judge',
                        icon: 'pi pi-fw pi-id-card',
                        to: '/judges'
                    },
                    {
                        label: 'Parties',
                        icon: 'pi pi-fw pi-id-card',
                        to: '/parties'
                    },
                    {
                        label: 'Fees',
                        icon: 'pi pi-fw pi-cog',
                        to: '/fees'
                    }
                ]
            },
            {
                label: 'User Management',
                icon: 'pi pi-fw pi-user',
                items: [
                    {
                        label: 'Users',
                        icon: 'pi pi-fw pi-user',
                        to: '/user-management/users'
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-fw pi-users',
                        to: '/user-management/roles'
                    }
                ]
            }
        ]
    },
    {
        label: 'Reports',
        items: [
            {
                label: 'Reports',
                icon: 'pi pi-fw pi-chart-bar',
                items: [
                    {
                        label: 'Appeal Reports',
                        icon: 'pi pi-fw pi-chart-bar',
                        to: '/reports/appeal-reports'
                    },
                    {
                        label: 'Payment Reports',
                        icon: 'pi pi-fw pi-dollar',
                        to: '/reports/payment-reports'
                    },
                    {
                        label: 'Cause List Reports',
                        icon: 'pi pi-fw pi-dollar',
                        to: '/reports/summons-reports'
                    }
                ]
            }
        ]
    }
]);

// Function to filter the menu based on permissions
function filterMenu(model, permissions) {
    return model
        .map((item) => {
            // Check if the current item has a permission and if the user has that permission
            if (item.permission && !permissions.includes(item.permission)) {
                return null; // This item is not allowed
            }

            // Filter the 'items' of the current item based on permissions
            if (item.items) {
                item.items = item.items.filter((subItem) => {
                    // Find the required permission for this item using permissionMapping
                    let requiredPermission = Object.keys(permissionMapping).find((key) => permissionMapping[key].includes(subItem.label));

                    // Check if the user has the permission corresponding to the label
                    return !requiredPermission || permissions.includes(requiredPermission);
                });
            }

            return item; // Return the item (can be null if filtered out)
        })
        .filter((item) => item !== null); // Filter out any null items (those that were removed)
}
// Retrieve permissions string from localStorage;

// Apply the filter to the model
const filteredModel = filterMenu(model.value, localStorage.getItem('permissions'));
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in filteredModel" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
