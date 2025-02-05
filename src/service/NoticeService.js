import axios from 'axios';
import api from '@/service/Api';

export const NoticeService = {


    async getNoticesHigh() {

    },
    // Make this function async to handle the asynchronous axios request
    async getNoticesData() {
        const apiUrl = '/notices';

        try {
            const response = await api.get(apiUrl);  // Wait for the response to come back
            // Map the data to the structure you want and return it
            return response.data.map((item) => ({
                id: item.id,
                noticeNo: item.noticeNo,
                createdAt: formatDate(item.createdAt),
                bill: item.bill,
                noticeType: item.noticeType,
                respondentFullName: item.respondentFullName,
                appellantFullName: item.appellantFullName,
                listAppeal: item.listAppeal,
                listApplication: item.listApplication,
                financialYear: item.financialYear,
                appellantPhone: item.appellantPhone,
                respondentPhone: item.respondentPhone,
                appealAgaints: item.appealAgaints
            }));
        } catch (error) {
            console.error('Error fetching data:', error);
            return []; // Return an empty array in case of an error
        }
    },

    async editNoticeData(notice) {
        const apiUrl = `/notices/${notice.id}`;

        try {
            const response = await api.patch(apiUrl, notice);

            if (response.status >= 200 && response.status < 300) {
                return response.data;
            } else {
                return { error: 'Failed to update notice. Unexpected response status.' };
            }
        } catch (error) {
            if (error.response) {
                return { error: `Failed to update notice. ${error.response.data.message || 'Please try again later.'}` };
            } else if (error.request) {
                return { error: 'No response from server. Please check your connection.' };
            } else {
                return { error: 'An error occurred while setting up the request.' };
            }
        }
    },

    async postNoticeData(notice) {
        const apiUrl = '/notices';

        try {
            // Wait for the response to come back from the API call
            const response = await api.post(apiUrl, notice);

            // Check if the response status is 2xx (success)
            if (response.status >= 200 && response.status < 300) {
                console.log('Notice posted successfully:', response.status);
                return response.data; // Return the response data
            } else {
                // Handle unexpected response status
                console.error('Unexpected response status:', response.status);
                return { error: 'Failed to create notice. Unexpected response status.' };
            }
        } catch (error) {
            // Handle errors during the request (network, timeout, etc.)
            console.error('Error posting notice data:', error);

            // Check if the error is from the response (e.g., 400, 500 status codes)
            if (error.response) {
                // The server responded with a status code outside the 2xx range
                console.error('Response error:', error.response.status, error.response.data);
                return { error: `Failed to create notice. ${error.response.data.message || 'Please try again later.'}` };
            } else if (error.request) {
                // The request was made, but no response was received
                console.error('No response received:', error.request);
                return { error: 'No response from server. Please check your connection.' };
            } else {
                // Something else happened during the setup of the request
                console.error('Request setup error:', error.message);
                return { error: 'An error occurred while setting up the request.' };
            }
        }
    }
    ,

    async getNotices() {
        console.log('Fetching notices data...');
        // Wait for the data to come back
        return await this.getNoticesData(); // Return the mapped notices
    }
};

function formatDate(dateString) {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
}
