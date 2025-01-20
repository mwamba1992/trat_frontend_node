import api from '@/service/Api';

const BASE_URL = '/parties'; // Replace with your actual backend API endpoint

export const PartyService = {
    getParties() {
        return api.get(BASE_URL).then((response) => response.data);
    },

    getApplicants() {
        return api.get(`${BASE_URL}/type/Applicant`).then((response) => response.data);
    },

    getRespondents() {
        return api.get(`${BASE_URL}/type/Respondent`).then((response) => response.data);
    },
    createParty(party) {
        return api.post(BASE_URL, party).then((response) => response.data);
    },
    updateParty(id, party) {
        return api.patch(`${BASE_URL}/${id}`, party).then((response) => response.data);
    },
    deleteParty(id) {
        return api.delete(`${BASE_URL}/${id}`).then((response) => response.data);
    }
};
