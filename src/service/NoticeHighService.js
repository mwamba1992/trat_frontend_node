import api from '@/service/Api';

export const NoticeHighService = {
    async getNoticesHigh() {
        const apiUrl = '/notices-high';

        try {
            return await api.get(apiUrl).then((response) => response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    },

    async saveNoticeHigh(notice) {
        const apiUrl = '/notices-high';

        try {
            return await api.post(apiUrl, notice).then((response) => response.data);
        } catch (error) {
            console.error('Error saving data:', error);
            return { error: 'Failed to save notice. Please try again later.' };
        }
    }
};
