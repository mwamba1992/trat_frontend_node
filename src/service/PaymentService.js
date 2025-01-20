import { Config } from '@/utils/Config';
import api from '@/service/Api';

const USER_URL = Config.API_BASE_URL + '/payment'; // Replace with your actual API base URL

export const PaymentService = {
    async getPayments() {
        return await api
            .get(USER_URL)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error fetching payments:', error);
                throw error;
            });
    },

    async filterPayments(filter) {
        return await api
            .post(USER_URL + '/filter', filter)
            .then((response) => response.data)
            .catch((error) => {
                console.error('Error filtering payments:', error);
                throw error;
            });
    }
};
