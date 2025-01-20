import api from '@/service/Api';

const API_BASE_URL = '/fees'; // Replace with your actual API base URL

export const FeeService = {
    /**
     * Get all Fees
     * @returns {Promise} Resolves with a list of fees
     */
    getFees() {
        return api
            .get(`${API_BASE_URL}`)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error fetching fees:', error);
                throw error;
            });
    },

    /**
     * Create a new Fee
     * @param {Object} fee - The fee data to create
     * @returns {Promise} Resolves with the created fee
     */
    createFee(fee) {
        return api
            .post(`${API_BASE_URL}`, fee)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error creating fee:', error);
                throw error;
            });
    },

    /**
     * Update an existing Fee
     * @param {Object} fee - The updated fee data
     * @returns {Promise} Resolves with the updated fee
     */
    updateFee(fee) {
        return api
            .patch(`${API_BASE_URL}/${fee.id}`, fee)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error updating fee:', error);
                throw error;
            });
    },

    /**
     * Delete a Fee
     * @param {number} feeId - The ID of the fee to delete
     * @returns {Promise} Resolves when the fee is deleted
     */
    deleteFee(feeId) {
        return api
            .delete(`${API_BASE_URL}/${feeId}`)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error deleting fee:', error);
                throw error;
            });
    },
    async approveFee(id) {
        const response = await api.patch(`${API_BASE_URL}/approve/${id}`);
        return response.data;
    }
};
