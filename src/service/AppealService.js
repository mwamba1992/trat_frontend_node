import api from '@/service/Api';


const API_URL = '/appeals'; // Base URL for the appeal endpoint

export const AppealService = {
    /**
     * Fetch all appeals
     * @returns {Promise<Object[]>} List of appeals
     */
    async getAppeals() {
        try {
            const response = await api.get(API_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching appeals:', error);
            throw error; // Propagate the error to the caller
        }
    },

    async searchAppeals(search) {
        try {
            const region = search.region;
            const taxType = search.taxType;
            const year = search.year;
            const startDate = year + '-01-01';
            const endDate = year + '-12-31';

            if(search.type === "1"){
                const response = await api.get(`https://trais.mof.go.tz:8443/applicationregister/search/getApplicationRegisters?region=${region}&taxType=${taxType}&startDate=${startDate}&endDate=${endDate}`, {
                    timeout: 30000 // Timeout after 5 seconds (5000 ms)
                });
                return response.data;
            } else{
                const response = await api.get(`https://trais.mof.go.tz:8443/appeals/search/getAppealsForTrat?region=${region}&taxType=${taxType}&startDate=${startDate}&endDate=${endDate}`, {
                    timeout: 30000 // Timeout after 5 seconds (5000 ms)
                });

                return response.data;
            }

        } catch (error) {
            console.error('Error fetching appeals:', error);
            throw error; // Propagate the error to the caller
        }
    },

    /**
     * Fetch a single appeal by ID
     * @param {string} id Appeal ID
     * @returns {Promise<Object>} Appeal data
     */
    async getAppealById(id) {
        try {
            const response = await api.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching appeal with ID ${id}:`, error);
            throw error; // Propagate the error to the caller
        }
    },

    /**
     * Create a new appeal
     * @param {Object} appeal Appeal data
     * @returns {Promise<Object>} Created appeal
     */
    async createAppeal(appeal) {
        try {
            const response = await api.post(API_URL, appeal);
            return response.data;
        } catch (error) {
            console.error('Error creating appeal:', error);
            throw error; // Propagate the error to the caller
        }
    },

    /**
     * Update an existing appeal
     * @param {string} id Appeal ID
     * @param {Object} appeal Updated appeal data
     * @returns {Promise<Object>} Updated appeal
     */
    async updateAppeal(id, appeal) {
        try {
            const response = await api.put(`${API_URL}/${id}`, appeal);
            return response.data;
        } catch (error) {
            console.error(`Error updating appeal with ID ${id}:`, error);
            throw error; // Propagate the error to the caller
        }
    },

    /**
     * Delete an appeal by ID
     * @param {string} id Appeal ID
     * @returns {Promise<void>}
     */
    async deleteAppeal(id) {
        try {
            await api.delete(`${API_URL}/${id}`);
        } catch (error) {
            console.error(`Error deleting appeal with ID ${id}:`, error);
            throw error; // Propagate the error to the caller
        }
    },

    /**
     * Fetch a list of appeals with a specific filter
     * @param {Object} filter The filter criteria
     * @returns {Promise<Object[]>} List of filtered appeals
     */
    async getAppealsWithFilter(filter) {
        try {
            const response = await api.get(API_URL + '/filter', { params: filter });
            return response.data;
        } catch (error) {
            console.error('Error fetching filtered appeals:', error);
            throw error; // Propagate the error to the caller
        }
    },

    async getTopAppellants() {
        try {
            const response = await api.get(`${API_URL}/top-appellant`);
            return response.data;
        } catch (error) {
            console.error('Error fetching top appellants:', error);
            throw error; // Propagate the error to the caller
        }
    },

    async getCardStatistics() {
        try {
            const response = await api.get(`${API_URL}/card-details`);
            return response.data;
        } catch (error) {
            console.error('Error fetching card statistics:', error);
            throw error; // Propagate the error to the caller
        }
    },
    async getAppealsSummary(){
        try {
            const response = await api.get(`${API_URL}/yearly-cases`);
            return response.data;
        } catch (error) {
            console.error('Error fetching appeals summary:', error);
            throw error; // Propagate the error to the caller
        }
    }
};
