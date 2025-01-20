import api from '@/service/Api';

const BASE_URL = '/judges'; // Replace with your actual backend API endpoint

export const JudgeService = {
    // Get all judges
    getJudges() {
        return api
            .get(BASE_URL)
            .then((response) => response.data)
            .catch((error) => {
                console.error('There was an error fetching judges!', error);
                throw error;
            });
    },

    // Get a single judge by ID
    getJudgeById(id) {
        return api
            .get(`${BASE_URL}/${id}`)
            .then((response) => response.data)
            .catch((error) => {
                console.error('There was an error fetching the judge by ID!', error);
                throw error;
            });
    },

    // Create a new judge
    postJudgeData(judge) {
        return api
            .post(BASE_URL, judge)
            .then((response) => response.data)
            .catch((error) => {
                console.error('There was an error creating the judge!', error);
                throw error;
            });
    },

    // Update an existing judge
    editJudgeData(judge) {
        return api
            .patch(`${BASE_URL}/${judge.id}`, judge)
            .then((response) => response.data)
            .catch((error) => {
                console.error('There was an error updating the judge!', error);
                throw error;
            });
    },

    // Delete a judge
    deleteJudge(id) {
        return api
            .delete(`${BASE_URL}/${id}`)
            .then((response) => response.data)
            .catch((error) => {
                console.error('There was an error deleting the judge!', error);
                throw error;
            });
    },

    // Bulk delete selected judges (optional if needed)
    deleteSelectedJudges(ids) {
        return api
            .delete(BASE_URL, { data: { ids } })
            .then((response) => response.data)
            .catch((error) => {
                console.error('There was an error deleting the selected judges!', error);
                throw error;
            });
    }
};
