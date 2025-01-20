import api from '@/service/Api';

const API_URL = '/bills';

export const BillService = {
    /**
     * Fetch all bills from the backend
     * @returns {Promise<axios.AxiosResponse<any>>} List of bills
     */
    getBills() {
        return api.get(API_URL).then((response) => response.data);
    },

    /**
     * Fetch a single bill by its ID
     * @param {number|string} id - Bill ID
     * @returns {Promise<Object>} Bill data
     */
    getBillById(id) {
        return api.get(`${API_URL}/${id}`).then((response) => response.data);
    },

    /**
     * Create a new bill
     * @param {Object} bill - Bill data to create
     * @returns {Promise<Object>} Created bill
     */
    createBill(bill) {
        return api.post(API_URL, bill).then((response) => response.data);
    },

    /**
     * Update an existing bill
     * @param {number|string} id - Bill ID
     * @param {Object} bill - Updated bill data
     * @returns {Promise<Object>} Updated bill
     */
    updateBill(id, bill) {
        return api.put(`${API_URL}/${id}`, bill).then((response) => response.data);
    },

    /**
     * Delete a bill
     * @param {number|string} id - Bill ID
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    deleteBill(id) {
        return api.delete(`${API_URL}/${id}`).then((response) => response.data);
    },

    /**
     * Delete multiple bills
     * @param {Array<number|string>} ids - List of bill IDs to delete
     * @returns {Promise<axios.AxiosResponse<any>>}
     */
    deleteBills(ids) {
        return api.post(`${API_URL}/delete-batch`, { ids }).then((response) => response.data);
    }
};
