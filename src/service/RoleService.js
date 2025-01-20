import { Config } from '@/utils/Config';

import api from '@/service/Api';

const ROLE_URL = Config.API_BASE_URL + '/roles'; // Replace with your actual API base URL


export const RoleService = {
    /**
     * Get all Roles
     * @returns {Promise} Resolves with a list of roles
     */
    async getRoles() {
        return await api
            .get('/roles')
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error fetching roles:', error);
                throw error;
            });
    },

    /**
     * Create a new Role
     * @param {Object} role - The role data to create
     * @returns {Promise} Resolves with the created role
     */
    createRole(role) {
        return api
            .post('/roles', role)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error creating role:', error);
                throw error;
            });
    },

    /**
     * Update an existing Role
     * @param {Object} role - The updated role data
     * @returns {Promise} Resolves with the updated role
     */
    updateRole(role) {
        return api
            .patch(`${ROLE_URL}/${role.id}`, role)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error updating role:', error);
                throw error;
            });
    },

    /**
     * Delete a Role
     * @param {number} roleId - The ID of the role to delete
     * @returns {Promise} Resolves when the role is deleted
     */
    deleteRole(roleId) {
        return api
            .delete(`${ROLE_URL}/${roleId}`)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error deleting role:', error);
                throw error;
            });
    },

    async getPermissions() {
        return await api
            .get('/permissions')
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error fetching permissions:', error);
                throw error;
            });
    }
};
