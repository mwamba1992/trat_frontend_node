import api from '@/service/Api';

const API_URL = '/application-register'; // Base URL for the application endpoint

export const ApplicationService = {
    /**
     * Fetch all applications
     * @returns {Promise<Object[]>} List of applications
     */
    async getApplications() {
        try {
            const response = await api.get(API_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching applications:', error);
            throw error;
        }
    },

    async getAppealsFromTrab() {
        try {
            // Make sure to handle a longer timeout and pass the appropriate query params.
            const response = await api.get('https://trais.mof.go.tz:8443/appeals', {
                params: {
                    page: 0,
                    size: 50000,
                    sort: 'appealId,desc',
                    decidedDate: '!=null' // Assuming the backend supports this type of filtering
                },
                timeout: 100000 // Increase timeout to 30 seconds
            });
            return response.data;
        } catch (error) {
            // Different types of errors can be handled accordingly.
            if (error.code === 'ECONNABORTED') {
                // Timeout error
                console.error('Request timed out. Please try again later.');
            } else if (error.response) {
                // Server or HTTP errors (e.g., 5xx or 4xx)
                console.error('Error response from server:', error.response.status, error.response.data);
            } else if (error.request) {
                // No response from the server (likely a network error)
                console.error('No response from server:', error.request);
            } else {
                // Other errors (e.g., configuration or setup issues)
                console.error('Error setting up request:', error.message);
            }
            throw error; // Rethrow the error to handle it where this function is called.
        }
    },
    /**
     * Fetch a single application by ID
     * @param {string} id Application ID
     * @returns {Promise<Object>} Application data
     */
    async getApplicationById(id) {
        try {
            const response = await api.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching application with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a new application
     * @param {Object} application Application data
     * @returns {Promise<Object>} Created application
     */
    async createApplication(application) {
        try {
            const response = await api.post(API_URL, application);
            return response.data;
        } catch (error) {
            console.error('Error creating application:', error);
            throw error;
        }
    },

    /**
     * Update an existing application
     * @param {string} id Application ID
     * @param {Object} application Updated application data
     * @returns {Promise<Object>} Updated application
     */
    async updateApplication(id, application) {
        try {
            const response = await api.put(`${API_URL}/${id}`, application);
            return response.data;
        } catch (error) {
            console.error(`Error updating application with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete an application by ID
     * @param {string} id Application ID
     * @returns {Promise<void>}
     */
    async deleteApplication(id) {
        try {
            await api.delete(`${API_URL}/${id}`);
        } catch (error) {
            console.error(`Error deleting application with ID ${id}:`, error);
            throw error;
        }
    },
};
